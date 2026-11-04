package handlers

import (
	"context"
	"errors"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/v2/bson"

	"pulsepoll/backend/internal/services"
)

type PollHandler struct {
	pollService *services.PollService
}

func NewPollHandler(service *services.PollService) *PollHandler {
	return &PollHandler{
		pollService: service,
	}
}

type CreatePollRequest struct {
	Question  string     `json:"question" binding:"required"`
	Options   []string   `json:"options" binding:"required,min=2,max=6,dive,required"`
	ExpiresAt *time.Time `json:"expiresAt"`
}

func getAuthenticatedUserID(c *gin.Context) (bson.ObjectID, error) {
	userID := c.GetString("userID")

	return bson.ObjectIDFromHex(userID)
}

// POST /api/polls
func (h *PollHandler) CreatePoll(c *gin.Context) {

	var req CreatePollRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid poll request",
		})
		return
	}

	creatorID, err := getAuthenticatedUserID(c)

	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"message": "Invalid authentication",
		})
		return
	}

	ctx, cancel := context.WithTimeout(
		c.Request.Context(),
		5*time.Second,
	)
	defer cancel()

	poll, err := h.pollService.CreatePoll(
		ctx,
		creatorID,
		req.Question,
		req.Options,
		req.ExpiresAt,
	)

	if err != nil {
		if errors.Is(err, services.ErrInvalidPoll) {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": err.Error(),
			})
			return
		}

		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Could not create poll",
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"message": "Poll created successfully",
		"data":    poll,
	})
}

// GET /api/polls/:id
func (h *PollHandler) GetPoll(c *gin.Context) {

	id, err := bson.ObjectIDFromHex(c.Param("id"))

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid poll ID",
		})
		return
	}

	ctx, cancel := context.WithTimeout(
		c.Request.Context(),
		5*time.Second,
	)
	defer cancel()

	poll, err := h.pollService.GetPoll(ctx, id)

	if err != nil {
		if errors.Is(err, services.ErrPollNotFound) {
			c.JSON(http.StatusNotFound, gin.H{
				"success": false,
				"message": "Poll not found",
			})
			return
		}

		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Could not retrieve poll",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    poll,
	})
}

// GET /api/polls
func (h *PollHandler) GetMyPolls(c *gin.Context) {

	creatorID, err := getAuthenticatedUserID(c)

	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"message": "Invalid authentication",
		})
		return
	}

	ctx, cancel := context.WithTimeout(
		c.Request.Context(),
		5*time.Second,
	)
	defer cancel()

	polls, err := h.pollService.GetMyPolls(ctx, creatorID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Could not retrieve polls",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"count":   len(polls),
		"data":    polls,
	})
}

// PATCH /api/polls/:id/close
func (h *PollHandler) ClosePoll(c *gin.Context) {

	pollID, err := bson.ObjectIDFromHex(c.Param("id"))

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid poll ID",
		})
		return
	}

	creatorID, err := getAuthenticatedUserID(c)

	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"message": "Invalid authentication",
		})
		return
	}

	ctx, cancel := context.WithTimeout(
		c.Request.Context(),
		5*time.Second,
	)
	defer cancel()

	err = h.pollService.ClosePoll(ctx, pollID, creatorID)

	if err != nil {
		if errors.Is(err, services.ErrPollNotFound) {
			c.JSON(http.StatusNotFound, gin.H{
				"success": false,
				"message": "Poll not found or you are not its owner",
			})
			return
		}

		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Could not close poll",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Poll closed successfully",
	})
}
