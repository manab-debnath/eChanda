package handlers

import (
	"errors"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/manab-debnath/eChanda/internal/middleware"
	"github.com/manab-debnath/eChanda/internal/models"
	"github.com/manab-debnath/eChanda/internal/repository"
)

type CreateClubInput struct {
	ID          string  `json:"id" db:"id"`
	Title       string  `json:"title" db:"title" binding:"required"`
	Description string  `json:"description" db:"description"`
	Status      string  `json:"status" db:"status"`
	StartDate   *string `json:"start_date" db:"start_date"`
	EndDate     *string `json:"end_date" db:"end_date"`
}

func CreateClubHandler(pool *pgxpool.Pool) gin.HandlerFunc {
	return func(ctx *gin.Context) {
		var input CreateClubInput
		if err := ctx.ShouldBindJSON(&input); err != nil {
			ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		if input.Status == "" {
			input.Status = string(models.Active)
		}

		if input.StartDate == nil {
			startDate := time.Now().Format(time.DateOnly)
			input.StartDate = &startDate
		}

		// Validate the start date format
		if _, err := time.Parse(time.DateOnly, *input.StartDate); err != nil {
			ctx.JSON(http.StatusBadRequest, gin.H{
				"error": "start_date must use YYYY-MM-DD format",
			})
			return
		}

		// Validate the end date only if provided
		if input.EndDate != nil {
			if _, err := time.Parse(time.DateOnly, *input.EndDate); err != nil {
				ctx.JSON(http.StatusBadRequest, gin.H{
					"error": "end_date must use YYYY-MM-DD format",
				})
				return
			}
		}

		// Get user ID
		userIDValue, exist := ctx.Get(middleware.ContextUserID)
		if !exist {
			ctx.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"message": "Authentication required",
			})
			return
		}

		// send values to database for creation
		club, err := repository.CreateClub(pool, input.Title, input.Description, input.Status, *input.StartDate, input.EndDate, userIDValue.(string))
		if err != nil {
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
			return
		}

		// return 201 status and user
		ctx.JSON(http.StatusCreated, club)
	}
}

func JoinClubHandler(pool *pgxpool.Pool) gin.HandlerFunc {
	return func(ctx *gin.Context) {
		clubID := ctx.Param("clubID")
		if clubID == "" {
			ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid club id"})
			return
		}
		userIDValue, exists := ctx.Get(middleware.ContextUserID)
		if !exists {
			ctx.JSON(http.StatusUnauthorized, gin.H{"message": "Authentication required"})
			return
		}

		userID, ok := userIDValue.(string)
		if !ok {
			ctx.JSON(http.StatusInternalServerError, gin.H{"message": "internal server error"})
			return
		}

		clubName, err := repository.JoinClub(pool, clubID, userID)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				ctx.JSON(http.StatusNotFound, gin.H{"message": "club does not exists"})
			}
			ctx.JSON(http.StatusInternalServerError, gin.H{"err": err.Error()})
			return
		}

		ctx.JSON(http.StatusOK, gin.H{
			"message":   "Successfully joined club",
			"club_name": clubName,
		})
	}
}
