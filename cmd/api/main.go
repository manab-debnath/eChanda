package main

import (
	"log"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"github.com/manab-debnath/eChanda/internal/config"
	"github.com/manab-debnath/eChanda/internal/database"
	"github.com/manab-debnath/eChanda/internal/handlers"
	"github.com/manab-debnath/eChanda/internal/middleware"
	"github.com/manab-debnath/eChanda/internal/models"
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
	users := v1.Group("/auth")
	users.POST("/register", handlers.CreateUserHandler(pool))
	users.POST("/login", handlers.LoginUserHandler(pool))
	users.POST("/logout", middleware.AuthMiddleware(), handlers.LogoutUserHandler())

	// club routes
	clubs := v1.Group("/clubs", middleware.AuthMiddleware())
	clubs.POST("/", handlers.CreateClubHandler(pool))
	clubs.GET("/", handlers.GetAllClubHandler(pool))
	clubs.GET("/:clubID", handlers.GetClubByIDHandler(pool))
	clubs.POST("/:clubID/join", handlers.JoinClubHandler(pool))
	clubs.GET("/:clubID/members", handlers.GetAllMembersHandler(pool))
	clubs.PATCH("/:clubID/members/:userID", middleware.RequireRoles(pool, string(models.Admin)), handlers.ChangeRoleAsCollectorHandler(pool))

	// collection routes
	collection := clubs.Group("/:clubID/collections", middleware.AuthMiddleware(), middleware.RequireRoles(pool, string(models.Admin), string(models.Collector)))
	collection.POST("/", handlers.AddCollectionHandler(pool))
	collection.GET("/", handlers.GetAllCollectionsHandler(pool))
	collection.PATCH("/:collectionID", handlers.UpdateCollectionByIDHandler(pool))
	collection.GET("/total", handlers.GetTotalCollectionByClubIDHandler(pool))

	// expense routes
	expense := clubs.Group("/:clubID/expenses", middleware.AuthMiddleware(), middleware.RequireRoles(pool, string(models.Admin), string(models.Collector)))
	expense.POST("/", handlers.AddExpenseHandler(pool))
	expense.PATCH("/:expenseID", handlers.UpdateExpenseByIDHandler(pool))
	expense.GET("/total", handlers.GetTotalExpensesByClubIDHandler(pool))

	router.Run(":" + cfg.PORT)
}
