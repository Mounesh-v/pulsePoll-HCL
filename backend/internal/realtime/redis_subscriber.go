package realtime

import (
	"context"
	"strings"
	"time"

	"github.com/redis/go-redis/v9"
)

func StartRedisSubscriber(
	ctx context.Context,
	redisClient *redis.Client,
	hub *Hub,
) {
	go func() {

		for {
			if ctx.Err() != nil {
				return
			}

			pubsub := redisClient.PSubscribe(
				ctx,
				"poll:*:updates",
			)

			_, err := pubsub.Receive(ctx)

			if err != nil {
				_ = pubsub.Close()

				select {
				case <-ctx.Done():
					return
				case <-time.After(2 * time.Second):
					continue
				}
			}

			messages := pubsub.Channel()

			connected := true

			for connected {
				select {

				case <-ctx.Done():
					connected = false

				case message, ok := <-messages:

					if !ok {
						connected = false
						break
					}

					// Extract poll ID from channel
					channel := message.Channel

					pollID := strings.TrimSuffix(
						strings.TrimPrefix(channel, "poll:"),
						":updates",
					)

					if pollID == "" {
						continue
					}

					// Forward event to WebSocket Hub
					select {
					case hub.Broadcast <- BroadcastMessage{
						PollID: pollID,
						Data:   []byte(message.Payload),
					}:
					case <-ctx.Done():
						connected = false
					}
				}
			}

			_ = pubsub.Close()

			if ctx.Err() != nil {
				return
			}

			// Reconnect after subscriber disconnects
			select {
			case <-ctx.Done():
				return
			case <-time.After(2 * time.Second):
			}
		}
	}()
}
