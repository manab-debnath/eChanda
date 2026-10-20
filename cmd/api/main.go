package main

import (
	"log"

	"github.com/gin-gonic/gin"
	"github.com/manab-debnath/eChanda/internal/config"
	"github.com/manab-debnath/eChanda/internal/database"
)

func main() {
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

	router.Run(":" + cfg.PORT)
}
