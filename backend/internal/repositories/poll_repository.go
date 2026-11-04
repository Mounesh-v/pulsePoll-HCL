package repositories

import (
	"context"

	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"

	"pulsepoll/backend/internal/models"
)

type PollRepository struct {
	collection *mongo.Collection
}

func NewPollRepository(db *mongo.Database) *PollRepository {
	return &PollRepository{
		collection: db.Collection("polls"),
	}
}

// Create poll
func (r *PollRepository) Create(
	ctx context.Context,
	poll *models.Poll,
) error {

	result, err := r.collection.InsertOne(ctx, poll)

	if err != nil {
		return err
	}

	if id, ok := result.InsertedID.(bson.ObjectID); ok {
		poll.ID = id
	}

	return nil
}

// Find poll by ID
func (r *PollRepository) FindByID(
	ctx context.Context,
	id bson.ObjectID,
) (*models.Poll, error) {

	var poll models.Poll

	err := r.collection.FindOne(
		ctx,
		bson.M{"_id": id},
	).Decode(&poll)

	if err != nil {
		return nil, err
	}

	return &poll, nil
}

// Get polls created by a user
func (r *PollRepository) FindByCreator(
	ctx context.Context,
	creatorID bson.ObjectID,
) ([]models.Poll, error) {

	cursor, err := r.collection.Find(
		ctx,
		bson.M{"creatorId": creatorID},
		options.Find().SetSort(
			bson.D{{Key: "createdAt", Value: -1}},
		),
	)

	if err != nil {
		return nil, err
	}

	defer cursor.Close(ctx)

	var polls []models.Poll

	if err := cursor.All(ctx, &polls); err != nil {
		return nil, err
	}

	return polls, nil
}

// Close poll
func (r *PollRepository) Close(
	ctx context.Context,
	id bson.ObjectID,
	creatorID bson.ObjectID,
) error {

	result, err := r.collection.UpdateOne(
		ctx,
		bson.M{
			"_id":       id,
			"creatorId": creatorID,
			"status":    "active",
		},
		bson.M{
			"$set": bson.M{
				"status": "closed",
			},
		},
	)

	if err != nil {
		return err
	}

	if result.MatchedCount == 0 {
		return mongo.ErrNoDocuments
	}

	return nil
}
