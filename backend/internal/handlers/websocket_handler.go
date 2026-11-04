package handlers

import (
	"context"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"go.mongodb.org/mongo-driver/v2/bson"

	"pulsepoll/backend/internal/realtime"
	"pulsepoll/backend/internal/repositories"
)

const (
	writeWait  = 10 * time.Second
	pongWait   = 60 * time.Second
	pingPeriod = 54 * time.Second
)

type WebSocketHandler struct {
	hub           *realtime.Hub
	pollRepo      *repositories.PollRepository
	allowedOrigin string
}

func NewWebSocketHandler(
	hub *realtime.Hub,
	pollRepo *repositories.PollRepository,
	allowedOrigin string,
) *WebSocketHandler {
	return &WebSocketHandler{
		hub:           hub,
		pollRepo:      pollRepo,
		allowedOrigin: allowedOrigin,
	}
}

func (h *WebSocketHandler) Handle(c *gin.Context) {

	// Validate poll ID
	pollID, err := bson.ObjectIDFromHex(c.Param("id"))

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid poll ID",
		})
		return
	}

	// Verify poll exists before upgrading connection
	ctx, cancel := context.WithTimeout(
		c.Request.Context(),
		5*time.Second,
	)
	defer cancel()

	_, err = h.pollRepo.FindByID(ctx, pollID)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "Poll not found",
		})
		return
	}

	upgrader := websocket.Upgrader{
		ReadBufferSize:  1024,
		WriteBufferSize: 1024,

		CheckOrigin: func(r *http.Request) bool {
			origin := r.Header.Get("Origin")

			// Allow non-browser clients without an Origin header
			if origin == "" {
				return true
			}

			// Browser clients must match configured frontend origin
			return origin == h.allowedOrigin
		},
	}

	conn, err := upgrader.Upgrade(
		c.Writer,
		c.Request,
		nil,
	)

	if err != nil {
		return
	}

	client := &realtime.Client{
		PollID: pollID.Hex(),
		Conn:   conn,
		Send:   make(chan []byte, 256),
	}

	// Register client with Hub
	h.hub.Register <- client

	// One goroutine writes to this connection
	go h.writePump(client)

	// Current handler reads from connection
	h.readPump(client)
}

func (h *WebSocketHandler) readPump(
	client *realtime.Client,
) {

	defer func() {
		h.hub.Unregister <- client
		_ = client.Conn.Close()
	}()

	client.Conn.SetReadLimit(512)

	client.Conn.SetReadDeadline(
		time.Now().Add(pongWait),
	)

	client.Conn.SetPongHandler(func(string) error {
		return client.Conn.SetReadDeadline(
			time.Now().Add(pongWait),
		)
	})

	for {
		_, _, err := client.Conn.ReadMessage()

		if err != nil {
			break
		}
	}
}

func (h *WebSocketHandler) writePump(
	client *realtime.Client,
) {

	ticker := time.NewTicker(pingPeriod)

	defer func() {
		ticker.Stop()
		_ = client.Conn.Close()
	}()

	for {
		select {

		case message, ok := <-client.Send:

			_ = client.Conn.SetWriteDeadline(
				time.Now().Add(writeWait),
			)

			if !ok {
				_ = client.Conn.WriteMessage(
					websocket.CloseMessage,
					[]byte{},
				)
				return
			}

			err := client.Conn.WriteMessage(
				websocket.TextMessage,
				message,
			)

			if err != nil {
				return
			}

		case <-ticker.C:

			_ = client.Conn.SetWriteDeadline(
				time.Now().Add(writeWait),
			)

			if err := client.Conn.WriteMessage(
				websocket.PingMessage,
				nil,
			); err != nil {
				return
			}
		}
	}
}
