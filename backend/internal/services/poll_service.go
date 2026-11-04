package services

import (
	"context"
	"errors"
	"strings"
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"

	"pulsepoll/backend/internal/models"
	"pulsepoll/backend/internal/repositories"
)

var (
	ErrInvalidPoll  = errors.New("invalid poll details")
	ErrPollNotFound = errors.New("poll not found")
)

type PollService struct {
	pollRepo *repositories.PollRepository
}

func NewPollService(repo *repositories.PollRepository) *PollService {
	return &PollService{
		pollRepo: repo,
	}
}

func (s *PollService) CreatePoll(
	ctx context.Context,
	creatorID bson.ObjectID,
	question string,
	optionTexts []string,
	expiresAt *time.Time,
) (*models.Poll, error) {

	question = strings.TrimSpace(question)

	if len([]rune(question)) < 5 || len([]rune(question)) > 200 {
		return nil, ErrInvalidPoll
	}

	if len(optionTexts) < 2 || len(optionTexts) > 6 {
		return nil, ErrInvalidPoll
	}

	if expiresAt != nil && !expiresAt.After(time.Now()) {
		return nil, ErrInvalidPoll
	}

	options := make([]models.PollOption, 0, len(optionTexts))
	seen := make(map[string]bool)

	for _, text := range optionTexts {

		text = strings.TrimSpace(text)
		normalized := strings.ToLower(text)

		if len([]rune(text)) == 0 || len([]rune(text)) > 100 {
			return nil, ErrInvalidPoll
		}

		if seen[normalized] {
			return nil, ErrInvalidPoll
		}

		seen[normalized] = true

		options = append(options, models.PollOption{
			ID:   bson.NewObjectID().Hex(),
			Text: text,
		})
	}

	poll := &models.Poll{
		CreatorID: creatorID,
		Question:  question,
		Options:   options,
		Status:    "active",
		ExpiresAt: expiresAt,
		CreatedAt: time.Now().UTC(),
	}

	err := s.pollRepo.Create(ctx, poll)

	if err != nil {
		return nil, err
	}

	return poll, nil
}

func (s *PollService) GetPoll(
	ctx context.Context,
	id bson.ObjectID,
) (*models.Poll, error) {

	poll, err := s.pollRepo.FindByID(ctx, id)

	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return nil, ErrPollNotFound
		}

		return nil, err
	}

	return poll, nil
}

func (s *PollService) GetMyPolls(
	ctx context.Context,
	creatorID bson.ObjectID,
) ([]models.Poll, error) {

	return s.pollRepo.FindByCreator(ctx, creatorID)
}

func (s *PollService) ClosePoll(
	ctx context.Context,
	pollID bson.ObjectID,
	creatorID bson.ObjectID,
) error {

	err := s.pollRepo.Close(ctx, pollID, creatorID)

	if errors.Is(err, mongo.ErrNoDocuments) {
		return ErrPollNotFound
	}

	return err
}
