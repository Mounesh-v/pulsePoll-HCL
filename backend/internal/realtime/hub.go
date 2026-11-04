package realtime

import "github.com/gorilla/websocket"

type Client struct {
	PollID string
	Conn   *websocket.Conn
	Send   chan []byte
}

type BroadcastMessage struct {
	PollID string
	Data   []byte
}

/* sync.RWMutex was Protects the shared client map from concurrent modifications
The Hub maintains separate client groups for each poll
*/
type Hub struct {
	Clients    map[string]map[*Client]bool
	Register   chan *Client
	Unregister chan *Client
	Broadcast  chan BroadcastMessage
}

func NewHub() *Hub {
	return &Hub{
		Clients:    make(map[string]map[*Client]bool),
		Register:   make(chan *Client, 256),
		Unregister: make(chan *Client, 256),
		Broadcast:  make(chan BroadcastMessage, 256),
	}
}

func (h *Hub) Run() {
	for {
		select {

		case client := <-h.Register:

			if h.Clients[client.PollID] == nil {
				h.Clients[client.PollID] = make(map[*Client]bool)
			}

			h.Clients[client.PollID][client] = true

		case client := <-h.Unregister:

			if clients, ok := h.Clients[client.PollID]; ok {
				if _, exists := clients[client]; exists {
					delete(clients, client)
					close(client.Send)
				}

				if len(clients) == 0 {
					delete(h.Clients, client.PollID)
				}
			}

		case message := <-h.Broadcast:

			for client := range h.Clients[message.PollID] {

				select {
				case client.Send <- message.Data:

				default:
					// Remove slow clients instead of blocking
					delete(h.Clients[message.PollID], client)
					close(client.Send)
					_ = client.Conn.Close()
				}
			}
		}
	}
}
