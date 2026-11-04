package repositories

import (
	"context"
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"

	"pulsepoll/backend/internal/models"
)

type VoteRepository struct {
	collection *mongo.Collection
}

func NewVoteRepository(
	db *mongo.Database,
) (*VoteRepository, error) {

	collection := db.Collection("votes")

	ctx, cancel := context.WithTimeout(
		context.Background(),
		10*time.Second,
	)
	// for prevent the memory leak and resource cleanup
	defer cancel()

	_, err := collection.Indexes().CreateOne(
		ctx,
		mongo.IndexModel{
			/* creates a compound index.
			unique constraint guarantees that the same voter token cannot submit two votes for the same poll,
			even if two requests arrive simultaneously
			*/
			Keys: bson.D{
				{Key: "pollId", Value: 1},
				{Key: "voterToken", Value: 1},
			},
			Options: options.Index().SetUnique(true),
		},
	)

	if err != nil {
		return nil, err
	}

	return &VoteRepository{
		collection: collection,
	}, nil
}

func (r *VoteRepository) Create(
	ctx context.Context,
	vote *models.Vote,
) error {

	_, err := r.collection.InsertOne(ctx, vote)

	return err
}

func (r *VoteRepository) CountByPoll(
	ctx context.Context,
	pollID bson.ObjectID,
) (int64, error) {

	return r.collection.CountDocuments(
		ctx,
		bson.M{"pollId": pollID},
	)
}

func (r *VoteRepository) CountByPollAndOption(
	ctx context.Context,
	pollID bson.ObjectID,
	optionID string,
) (int64, error) {

	return r.collection.CountDocuments(
		ctx,
		bson.M{
			"pollId":   pollID,
			"optionId": optionID,
		},
	)
}
