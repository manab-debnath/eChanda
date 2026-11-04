package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"github.com/manab-debnath/eChanda/internal/config"
	"github.com/manab-debnath/eChanda/internal/database"
	"github.com/manab-debnath/eChanda/internal/handlers"
	"github.com/manab-debnath/eChanda/internal/middleware"
	"github.com/manab-debnath/eChanda/internal/models"
)

func main() {
	envFile := ".env"
	if os.Getenv("ENV") == "production" {
		envFile = ".env.production"
	}

	if _, err := os.Stat(envFile); err == nil {
		if err := godotenv.Load(envFile); err != nil {
			log.Printf("Warning: Error loading %s: %v\n", envFile, err)
		} else {
			log.Printf("Loaded environment from %s\n", envFile)
		}
	} else {
		log.Printf("No %s file found on disk, relying on system environment variables\n", envFile)
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
	gin.SetMode(gin.ReleaseMode)
	router := gin.Default()
	router.SetTrustedProxies(nil)

	// CORS middleware
	router.Use(func(c *gin.Context) {
		origin := c.Request.Header.Get("Origin")
		if origin != "" {
			c.Header("Access-Control-Allow-Origin", origin)
		} else {
			c.Header("Access-Control-Allow-Origin", "*")
		}
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Origin, Content-Type, Accept, Authorization, X-Requested-With")
		c.Header("Access-Control-Allow-Credentials", "true")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})

	v1 := router.Group("/api/v1")

	// health check
	v1.GET("/health", func(ctx *gin.Context) {
		ctx.JSON(http.StatusOK, gin.H{"health": "OK"})
	})

	// user routes
	users := v1.Group("/auth")
	users.POST("/register", handlers.CreateUserHandler(pool))
	users.POST("/login", handlers.LoginUserHandler(pool))
	users.POST("/logout", middleware.AuthMiddleware(), handlers.LogoutUserHandler())
	users.PATCH("/profile", middleware.AuthMiddleware(), handlers.ChangeUserDetailsHandler(pool))
	users.PATCH("/profile/password", middleware.AuthMiddleware(), handlers.ChangeUserPasswordHanler(pool))

	// club routes
	clubs := v1.Group("/clubs", middleware.AuthMiddleware())
	clubs.POST("/", handlers.CreateClubHandler(pool))
	clubs.GET("/", handlers.GetAllClubHandler(pool))
	clubs.GET("/my-clubs", handlers.GetAllClubsAsMember(pool))
	clubs.GET("/joined", handlers.GetAllClubsAsMember(pool))
	clubs.GET("/:clubID", handlers.GetClubByIDHandler(pool))
	clubs.POST("/:clubID/join", handlers.JoinClubHandler(pool))
	clubs.GET("/:clubID/members", handlers.GetAllMembersHandler(pool))
	clubs.PATCH("/:clubID/members/:userID", middleware.RequireRoles(pool, string(models.Admin)), handlers.ChangeRoleAsCollectorHandler(pool))
	clubs.PATCH("/:clubID/completed", middleware.RequireRoles(pool, string(models.Admin)), handlers.MakeClubEventCompletedHandler(pool))
	clubs.DELETE("/:clubID", middleware.RequireRoles(pool, string(models.Admin)), handlers.DeleteClubHandler(pool))
	clubs.GET("/:clubID/balanceSheet", handlers.PrintBalanceSheetHandler(pool))

	// collection routes
	collection := clubs.Group("/:clubID/collections", middleware.RequireRoles(pool, string(models.Admin), string(models.Collector)))
	collection.POST("/", handlers.AddCollectionHandler(pool))
	collection.GET("/", handlers.GetAllCollectionsHandler(pool))
	collection.PATCH("/:collectionID", handlers.UpdateCollectionByIDHandler(pool))
	collection.GET("/total", handlers.GetTotalCollectionByClubIDHandler(pool))

	// expense routes
	expense := clubs.Group("/:clubID/expenses", middleware.RequireRoles(pool, string(models.Admin), string(models.Collector)))
	expense.POST("/", handlers.AddExpenseHandler(pool))
	expense.GET("/", handlers.GetAllExpenseHandler(pool))
	expense.PATCH("/:expenseID", handlers.UpdateExpenseByIDHandler(pool))
	expense.GET("/total", handlers.GetTotalExpensesByClubIDHandler(pool))

	distDir := "./client/dist"

	router.StaticFile("/", filepath.Join(distDir, "index.html"))
	router.Static("/static", distDir)

	router.NoRoute(func(c *gin.Context) {
		path := c.Request.URL.Path

		if strings.HasPrefix(path, "/api/") {
			c.JSON(http.StatusNotFound, gin.H{
				"message": "API route not found",
			})
			return
		}

		// Serve a real file from the frontend build directory.
		if path != "/" {
			filePath := filepath.Join(distDir, filepath.Clean(path))

			// filepath.Join can clean paths; verify the resolved file
			// is actually inside the dist directory.
			rel, err := filepath.Rel(distDir, filePath)
			if err == nil && !strings.HasPrefix(rel, "..") && !filepath.IsAbs(rel) {
				info, err := os.Stat(filePath)
				if err == nil && !info.IsDir() {
					c.File(filePath)
					return
				}
			}
		}

		// Serve React for frontend routes.
		c.File(filepath.Join(distDir, "index.html"))
	})

	port := cfg.PORT
	if port == "" {
		port = "8080"
	}

	address := fmt.Sprintf("0.0.0.0:%s", port)
	router.Run(address)
}
