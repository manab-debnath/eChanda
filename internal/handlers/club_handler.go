package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/manab-debnath/eChanda/internal/middleware"
	"github.com/manab-debnath/eChanda/internal/models"
	"github.com/manab-debnath/eChanda/internal/repository"
)

type CreateClubInput struct {
	ID          string         `json:"id" db:"id"`
	Title       string         `json:"title" db:"title" binding:"required"`
	Description string         `json:"description" db:"description"`
	Status      *models.Status `json:"status" db:"status"`
	StartDate   string         `json:"start_date" db:"start_date"`
	EndDate     string         `json:"end_date" db:"end_date"`
}

func CreateClubHandler(pool *pgxpool.Pool) gin.HandlerFunc {
	return func(ctx *gin.Context) {
		var input CreateClubInput
		if err := ctx.ShouldBindJSON(&input); err != nil {
			ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		if input.Status == nil {
			status := models.Active
			input.Status = &status
		}

		if input.StartDate == "" {
			startDate := time.Now()
			input.StartDate = startDate.Format(time.DateOnly)
		}

		startDate, err := time.Parse(time.DateOnly, input.StartDate)
		if err != nil {
			ctx.AbortWithStatusJSON(http.StatusBadRequest, gin.H{
				"error": "invalid date format",
			})
		}

		if input.EndDate == "" {
			endDate := time.Now()
			input.EndDate = endDate.Format(time.DateOnly)
		}

		endDate, err := time.Parse(time.DateOnly, input.StartDate)
		if err != nil {
			ctx.AbortWithStatusJSON(http.StatusBadRequest, gin.H{
				"error": "invalid date format",
			})
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
		club, err := repository.CreateClub(pool, input.Title, input.Description, string(*input.Status), startDate, endDate, userIDValue.(string))
		if err != nil {
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
			return
		}

		// return 201 status and user
		ctx.JSON(http.StatusCreated, club)
	}
}
