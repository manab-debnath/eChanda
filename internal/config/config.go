package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	DatabaseURL string
	PORT        string
}

func Load() (*Config, error) {
	if err := godotenv.Load(); err != nil {
		log.Fatal("Warning: .env file not found, using enviroment variables")
	}

	config := &Config{
		DatabaseURL: os.Getenv("DATABASE_URL"),
		PORT:        os.Getenv("PORT"),
	}

	return config, nil
}
