package database

import (
	"context"
	"fmt"
	"time"

	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
	"go.mongodb.org/mongo-driver/v2/mongo/readpref"
)

func ConnectMongo(uri string, databaseName string) (*mongo.Database, *mongo.Client, error) {

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	client, err := mongo.Connect(options.Client().ApplyURI(uri))

	if err != nil {
		return nil, nil, fmt.Errorf("mongo connection failed: %w", err)
	}

	err = client.Ping(ctx, readpref.Primary())

	if err != nil {
		client.Disconnect(context.Background())
		return nil, nil, fmt.Errorf("mongo ping failed: %w", err)
	}

	db := client.Database(databaseName)

	fmt.Println("MongoDB connected successfully")

	return db, client, nil
}
