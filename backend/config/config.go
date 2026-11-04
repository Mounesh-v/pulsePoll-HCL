package config

import (
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

type Config struct {
	Port           string
	MongoURI       string
	MongoDatabase  string
	RedisAddr      string
	RedisPassword  string
	RedisDB        int
	JWTSecret      string
	FrontendOrigin string
}

func LoadConfig() *Config {
	_ = godotenv.Load()

	redisDB, err := strconv.Atoi(getEnv("REDIS_DB", "0"))
	if err != nil {
		redisDB = 0
	}

	return &Config{
		Port:          getEnv("PORT", "8080"),
		MongoURI:      getEnv("MONGODB_URI", "mongodb://localhost:27017"),
		MongoDatabase: getEnv("MONGODB_DATABASE", "pulsepoll"),
		RedisAddr:     getEnv("REDIS_ADDR", "localhost:6379"),
		RedisPassword: getEnv("REDIS_PASSWORD", ""),
		RedisDB:       redisDB,
		JWTSecret:     getEnv("JWT_SECRET", "nzY3O3Y0vlnxWYGIRxxBUQhrhc0PShz0"),
		FrontendOrigin: getEnv(
			"FRONTEND_ORIGIN",
			"https://pulse-poll-hcl.vercel.app",
		),
	}
}

func getEnv(key, fallback string) string {
	value := os.Getenv(key)

	if value == "" {
		return fallback
	}

	return value
}
