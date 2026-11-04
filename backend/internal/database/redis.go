
package database

import (
	"context"
	"crypto/tls"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
)

func ConnectRedis(
	addr string,
	password string,
	dbNumber int,
) (*redis.Client, error) {

	client := redis.NewClient(&redis.Options{
		Addr:     addr,
		Password: password,
		DB:       dbNumber,
		TLSConfig: &tls.Config{
			MinVersion: tls.VersionTLS12,
		},
	})

	ctx, cancel := context.WithTimeout(
		context.Background(),
		5*time.Second,
	)
	defer cancel()

	err := client.Ping(ctx).Err()

	if err != nil {
		client.Close()
		return nil, fmt.Errorf("redis connection failed: %w", err)
	}

	fmt.Println("Redis connected successfully")

	return client, nil
}
