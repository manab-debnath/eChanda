package main

import (
	"log"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"github.com/manab-debnath/eChanda/internal/config"
	"github.com/manab-debnath/eChanda/internal/database"
	"github.com/manab-debnath/eChanda/internal/handlers"
	"github.com/manab-debnath/eChanda/internal/middleware"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Fatal("Error loading .env file")
	}

	// set config
	cfg, err := config.Load()
	if err != nil {
		log.Fatal("❌️ Failed to load configuration", err)
	}

	// setup databse
	pool, err := database.Connect(cfg.DatabaseURL)
	if err != nil {
		log.Fatal("❌️ Failed to connect to database", err)
	}
	defer pool.Close()

	// setup router
	router := gin.Default()
	gin.SetMode(gin.ReleaseMode)
	router.SetTrustedProxies(nil)

	router.GET("/", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"message": "pong",
		})
	})

	v1 := router.Group("/api/v1")

	// user routes
	users := v1.Group("/users")
	users.POST("/register", handlers.CreateUserHandler(pool))
	users.POST("/login", handlers.LoginUserHandler(pool))
	users.POST("/logout", middleware.AuthMiddleware(), handlers.LogoutUserHandler())

	router.Run(":" + cfg.PORT)
}
