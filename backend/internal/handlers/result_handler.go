package handlers

import (
	"context"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
	"go.mongodb.org/mongo-driver/v2/bson"

	"pulsepoll/backend/internal/repositories"
)

type ResultHandler struct {
	pollRepo *repositories.PollRepository
	voteRepo *repositories.VoteRepository
	redis    *redis.Client
}

func NewResultHandler(
	pollRepo *repositories.PollRepository,
	voteRepo *repositories.VoteRepository,
	redisClient *redis.Client,
) *ResultHandler {
	return &ResultHandler{
		pollRepo: pollRepo,
		voteRepo: voteRepo,
		redis:    redisClient,
	}
}

type OptionResult struct {
	OptionID string `json:"optionId"`
	Text     string `json:"text"`
	Votes    int64  `json:"votes"`
}

func (h *ResultHandler) GetResults(c *gin.Context) {

	// 1. Validate poll ID
	pollID, err := bson.ObjectIDFromHex(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid poll ID",
		})
		return
	}

	// 2. Create context with timeout
	ctx, cancel := context.WithTimeout(
		c.Request.Context(),
		5*time.Second,
	)
	defer cancel()

	// 3. Fetch poll from MongoDB
	poll, err := h.pollRepo.FindByID(ctx, pollID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "Poll not found",
		})
		return
	}

	// 4. Create Redis key
	key := "poll:" + pollID.Hex() + ":results"

	// 5. Fetch all vote counts from Redis
	cached, err := h.redis.HGetAll(ctx, key).Result()
	if err != nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"success": false,
			"message": "Results temporarily unavailable",
		})
		return
	}

	results := make([]OptionResult, 0, len(poll.Options))
	var totalVotes int64

	// 6. Process each poll option
	for _, option := range poll.Options {

		count, exists := cached[option.ID]
		var votes int64

		if exists {
			// Read existing count from Redis
			votes, err = strconv.ParseInt(count, 10, 64)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{
					"success": false,
					"message": "Invalid cached vote count",
				})
				return
			}

		} else {
			// 7. Recover missing count from MongoDB
			votes, err = h.voteRepo.CountByPollAndOption(
				ctx,
				pollID,
				option.ID,
			)

			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{
					"success": false,
					"message": "Could not retrieve vote count",
				})
				return
			}

			// 8. Store recovered count in Redis
			err = h.redis.HSet(
				ctx,
				key,
				option.ID,
				votes,
			).Err()

			if err != nil {
				c.JSON(http.StatusServiceUnavailable, gin.H{
					"success": false,
					"message": "Could not update results cache",
				})
				return
			}
		}

		totalVotes += votes

		results = append(results, OptionResult{
			OptionID: option.ID,
			Text:     option.Text,
			Votes:    votes,
		})
	}

	// 9. Return poll results
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"pollId":     pollID.Hex(),
			"question":   poll.Question,
			"totalVotes": totalVotes,
			"results":    results,
		},
	})
}
