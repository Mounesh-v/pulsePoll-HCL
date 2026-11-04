package handlers

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/v2/bson"

	"pulsepoll/backend/internal/services"
)

type VoteHandler struct {
	voteService *services.VoteService
}

func NewVoteHandler(service *services.VoteService) *VoteHandler {
	return &VoteHandler{
		voteService: service,
	}
}

type SubmitVoteRequest struct {
	OptionID string `json:"optionId" binding:"required"`
}

func generateVoterToken() (string, error) {
	bytes := make([]byte, 32)

	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}

	return hex.EncodeToString(bytes), nil
}

// POST /api/polls/:id/vote
func (h *VoteHandler) SubmitVote(c *gin.Context) {

	pollID, err := bson.ObjectIDFromHex(c.Param("id"))

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid poll ID",
		})
		return
	}

	var req SubmitVoteRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Option ID is required",
		})
		return
	}

	// Get existing voter token
	voterToken, err := c.Cookie("pulsepoll_voter")

	if err != nil || voterToken == "" {
		voterToken, err = generateVoterToken()

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not create voter session",
			})
			return
		}
	}

	// Store token in browser cookie
	c.SetSameSite(http.SameSiteLaxMode)
	c.SetCookie(
		"pulsepoll_voter",
		voterToken,
		60*60*24*365,
		"/api/polls",
		"",
		false, // Change to true in production with HTTPS
		true,  // HttpOnly
	)

	ctx, cancel := context.WithTimeout(
		c.Request.Context(),
		5*time.Second,
	)
	defer cancel()

	result, err := h.voteService.SubmitVote(
		ctx,
		pollID,
		req.OptionID,
		voterToken,
	)

	if err != nil {

		switch {
		case errors.Is(err, services.ErrPollNotFound):
			c.JSON(http.StatusNotFound, gin.H{
				"success": false,
				"message": "Poll not found",
			})

		case errors.Is(err, services.ErrAlreadyVoted):
			c.JSON(http.StatusConflict, gin.H{
				"success": false,
				"message": "You have already voted",
			})

		case errors.Is(err, services.ErrInvalidOption):
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Invalid poll option",
			})

		case errors.Is(err, services.ErrPollClosed):
			c.JSON(http.StatusForbidden, gin.H{
				"success": false,
				"message": "This poll is closed or expired",
			})

		default:
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not submit vote",
			})
		}

		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"message": "Vote submitted successfully",
		"data":    result,
	})
}
