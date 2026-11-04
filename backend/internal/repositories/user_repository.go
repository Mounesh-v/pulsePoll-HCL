package repositories

import (
	"context"
	"strings"
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"

	"pulsepoll/backend/internal/models"
)

type UserRepository struct {
	collection *mongo.Collection
}

func NewUserRepository(
	db *mongo.Database,
) (*UserRepository, error) {

	collection := db.Collection("users")

	ctx, cancel := context.WithTimeout(
		context.Background(),
		10*time.Second,
	)
	defer cancel()

	_, err := collection.Indexes().CreateOne(
		ctx,
		mongo.IndexModel{
			Keys: bson.D{
				{Key: "email", Value: 1},
			},
			Options: options.Index().SetUnique(true),
		},
	)

	if err != nil {
		return nil, err
	}

	return &UserRepository{
		collection: collection,
	}, nil
}

func (r *UserRepository) Create(
	ctx context.Context,
	user *models.User,
) error {

	user.Email = strings.ToLower(strings.TrimSpace(user.Email))

	result, err := r.collection.InsertOne(ctx, user)
	if err != nil {
		return err
	}

	if id, ok := result.InsertedID.(bson.ObjectID); ok {
		user.ID = id
	}

	return nil
}

func (r *UserRepository) FindByEmail(
	ctx context.Context,
	email string,
) (*models.User, error) {

	var user models.User

	email = strings.ToLower(strings.TrimSpace(email))

	err := r.collection.FindOne(
		ctx,
		bson.M{"email": email},
	).Decode(&user)

	if err != nil {
		return nil, err
	}

	return &user, nil
}
