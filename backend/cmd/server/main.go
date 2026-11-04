package main

import (
	"context"
	"log"
	"os"

	"github.com/gin-gonic/gin"

	"pulsepoll/backend/config"
	"pulsepoll/backend/internal/database"
	"pulsepoll/backend/internal/middleware"
	"pulsepoll/backend/internal/realtime"
	"pulsepoll/backend/internal/routes"
	"time"

	"github.com/gin-contrib/cors"
)

func main() {
	// Load application configuration
	cfg := config.LoadConfig()

	if cfg.JWTSecret == "" {
		log.Fatal("JWT_SECRET is required")
	}

	// Connect MongoDB
	mongoDB, mongoClient, err := database.ConnectMongo(
		cfg.MongoURI,
		cfg.MongoDatabase,
	)
	if err != nil {
		log.Fatal("MongoDB connection failed: ", err)
	}
	defer mongoClient.Disconnect(context.Background())

	// Connect Redis
	redisClient, err := database.ConnectRedis(
		cfg.RedisAddr,
		cfg.RedisPassword,
		cfg.RedisDB,
	)
	if err != nil {
		log.Fatal("Redis connection failed: ", err)
	}
	defer redisClient.Close()

	// Initialize application context
	appCtx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// Initialize real-time Hub
	hub := realtime.NewHub()
	go hub.Run()

	// Start Redis Pub/Sub subscriber
	realtime.StartRedisSubscriber(appCtx, redisClient, hub)

	// Initialize Gin router
	router := gin.Default()

	router.Use(cors.New(cors.Config{
		AllowOrigins: []string{
			cfg.FrontendOrigin,
		},
		AllowMethods: []string{
			"GET",
			"POST",
			"PATCH",
			"OPTIONS",
		},
		AllowHeaders: []string{
			"Origin",
			"Content-Type",
			"Authorization",
		},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// Register authentication routes
	if err := routes.RegisterAuthRoutes(
		router,
		mongoDB,
		cfg.JWTSecret,
	); err != nil {
		log.Fatal("Failed to register auth routes: ", err)
	}

	// Initialize authentication middleware
	authMW := middleware.AuthMiddleware(cfg.JWTSecret)

	// Register poll, voting, results and WebSocket routes
	if err := routes.RegisterPollRoutes(
		router,
		mongoDB,
		redisClient,
		authMW,
		hub,
		cfg.FrontendOrigin,
	); err != nil {
		log.Fatal("Failed to register poll routes: ", err)
	}

	// Health check
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"success": true,
			"message": "PulsePoll API is running",
			"database": gin.H{
				"mongodb": mongoDB.Name(),
				"redis":   "connected",
			},
		})
	})

	// Print registered routes
	for _, route := range router.Routes() {
		log.Printf("Registered: %s %s", route.Method, route.Path)
	}

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = cfg.Port
	}
	if port == "" {
		port = "8080"
	}

	log.Println("PulsePoll server starting on port", port)

	if err := router.Run("0.0.0.0:" + port); err != nil {
		log.Fatal("Server stopped: ", err)
	}
}
