package services

import (
	"context"
	"encoding/json"
	"errors"
	"time"

	"github.com/redis/go-redis/v9"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"

	"pulsepoll/backend/internal/models"
	"pulsepoll/backend/internal/repositories"
)

// Error Fallback Message
var (
	ErrAlreadyVoted  = errors.New("you have already voted")
	ErrInvalidOption = errors.New("invalid poll option")
	ErrPollClosed    = errors.New("poll is closed or expired")
)

// VoteStatus describes whether a voter has already voted in a poll.
type VoteStatus struct {
	HasVoted bool   `json:"hasVoted"`
	OptionID string `json:"optionId,omitempty"`
}

type VoteService struct {
	pollRepo *repositories.PollRepository
	voteRepo *repositories.VoteRepository
	redis    *redis.Client
}

type VoteResult struct {
	PollID   string `json:"pollId"`
	OptionID string `json:"optionId"`
	Count    int64  `json:"count"`
}

func NewVoteService(
	pollRepo *repositories.PollRepository,
	voteRepo *repositories.VoteRepository,
	redisClient *redis.Client,
) *VoteService {

	return &VoteService{
		pollRepo: pollRepo,
		voteRepo: voteRepo,
		redis:    redisClient,
	}
}

// CheckVoteStatus reports whether voterToken has already voted in pollID.
// It never returns an error for a voter who has not voted — only for unexpected
// storage failures.
func (s *VoteService) CheckVoteStatus(
	ctx context.Context,
	pollID bson.ObjectID,
	voterToken string,
) (*VoteStatus, error) {

	if voterToken == "" {
		return &VoteStatus{HasVoted: false}, nil
	}

	vote, err := s.voteRepo.FindByPollAndVoter(ctx, pollID, voterToken)

	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return &VoteStatus{HasVoted: false}, nil
		}
		return nil, err
	}

	return &VoteStatus{
		HasVoted: true,
		OptionID: vote.OptionID,
	}, nil
}

func (s *VoteService) SubmitVote(
	ctx context.Context,
	pollID bson.ObjectID,
	optionID string,
	voterToken string,
) (*VoteResult, error) {

	// 1. Find poll
	poll, err := s.pollRepo.FindByID(ctx, pollID)

	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return nil, ErrPollNotFound
		}
		return nil, err
	}

	// 2. Check poll status
	if poll.Status != "active" {
		return nil, ErrPollClosed
	}

	if poll.ExpiresAt != nil && !poll.ExpiresAt.After(time.Now()) {
		return nil, ErrPollClosed
	}

	// 3. Validate selected option
	validOption := false

	for _, option := range poll.Options {
		if option.ID == optionID {
			validOption = true
			break
		}
	}

	if !validOption {
		return nil, ErrInvalidOption
	}

	// 4. Save vote permanently in MongoDB
	vote := &models.Vote{
		PollID:     pollID,
		OptionID:   optionID,
		VoterToken: voterToken,
		CreatedAt:  time.Now().UTC(),
	}

	err = s.voteRepo.Create(ctx, vote)

	if err != nil {
		if mongo.IsDuplicateKeyError(err) {
			return nil, ErrAlreadyVoted
		}
		return nil, err
	}

	// 5. Increment Redis counter
	counterKey := "poll:" + pollID.Hex() + ":results"
	channel := "poll:" + pollID.Hex() + ":updates"

	count, redisErr := s.redis.HIncrBy(
		ctx,
		counterKey,
		optionID,
		1,
	).Result()

	// MongoDB has already accepted the vote.
	// A Redis failure must not turn an accepted vote into a failed vote.
	if redisErr != nil {
		return &VoteResult{
			PollID:   pollID.Hex(),
			OptionID: optionID,
			Count:    -1,
		}, nil
	}

	// 6. Publish event to Redis Pub/Sub
	event := map[string]interface{}{
		"pollId":   pollID.Hex(),
		"optionId": optionID,
		"count":    count,
	}

	payload, err := json.Marshal(event)

	if err == nil {
		// A publish failure does not undo the accepted vote.
		_ = s.redis.Publish(
			ctx,
			channel,
			payload,
		).Err()
	}

	return &VoteResult{
		PollID:   pollID.Hex(),
		OptionID: optionID,
		Count:    count,
	}, nil
}
