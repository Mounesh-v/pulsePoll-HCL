package routes

import (
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/v2/mongo"

	"github.com/redis/go-redis/v9"
	"pulsepoll/backend/internal/handlers"
	"pulsepoll/backend/internal/realtime"
	"pulsepoll/backend/internal/repositories"
	"pulsepoll/backend/internal/services"
)

func RegisterAuthRoutes(
	router *gin.Engine,
	db *mongo.Database,
	jwtSecret string,
) error {

	userRepo, err := repositories.NewUserRepository(db)
	if err != nil {
		return err
	}

	authService := services.NewAuthService(userRepo, jwtSecret)
	authHandler := handlers.NewAuthHandler(authService)

	auth := router.Group("/api/auth")
	{
		auth.POST("/register", authHandler.Register)
		auth.POST("/login", authHandler.Login)
	}

	return nil
}

func RegisterPollRoutes(
	router *gin.Engine,
	db *mongo.Database,
	redisClient *redis.Client,
	authMiddleware gin.HandlerFunc,
	hub *realtime.Hub,
	frontendOrigin string,
) error {

	pollRepo := repositories.NewPollRepository(db)

	pollService := services.NewPollService(pollRepo)
	pollHandler := handlers.NewPollHandler(pollService)

	voteRepo, err := repositories.NewVoteRepository(db)
	if err != nil {
		return err
	}

	voteService := services.NewVoteService(
		pollRepo,
		voteRepo,
		redisClient,
	)

	voteHandler := handlers.NewVoteHandler(voteService)

	resultHandler := handlers.NewResultHandler(
		pollRepo,
		voteRepo,
		redisClient,
	)

	wsHandler := handlers.NewWebSocketHandler(
		hub,
		pollRepo,
		frontendOrigin,
	)

	// Public routes
	router.GET("/api/polls/:id", pollHandler.GetPoll)
	router.GET("/api/polls/:id/results", resultHandler.GetResults)
	router.POST("/api/polls/:id/vote", voteHandler.SubmitVote)

	// WebSocket route
	router.GET("/ws/polls/:id", wsHandler.Handle)

	// Protected routes
	polls := router.Group("/api/polls")
	polls.Use(authMiddleware)

	{
		polls.POST("", pollHandler.CreatePoll)
		polls.GET("", pollHandler.GetMyPolls)
		polls.PATCH("/:id/close", pollHandler.ClosePoll)
	}

	return nil
}
