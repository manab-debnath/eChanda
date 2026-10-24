package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/manab-debnath/eChanda/internal/middleware"
	"github.com/manab-debnath/eChanda/internal/models"
	"github.com/manab-debnath/eChanda/internal/repository"
)

type CreateCollectionInput struct {
	DonorName   string             `json:"donor_name" binding:"required"`
	PhoneNumber *string            `json:"phone_number"`
	Amount      pgtype.Numeric     `json:"amount" binding:"required"`
	PaymentMode models.PaymentMode `json:"payment_mode" binding:"required"`
}

func AddCollectionHandler(pool *pgxpool.Pool) gin.HandlerFunc {
	return func(ctx *gin.Context) {
		clubID := ctx.Param("clubID")
		if _, err := uuid.Parse(clubID); err != nil {
			ctx.JSON(http.StatusBadRequest, gin.H{
				"message": "Invalid club ID",
			})
			return
		}

		var input CreateCollectionInput
		if err := ctx.ShouldBindJSON(&input); err != nil {
			ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		userIDValue, exists := ctx.Get(middleware.ContextUserID)
		if !exists {
			ctx.JSON(http.StatusUnauthorized, gin.H{
				"message": "Authenticatoin required",
			})
			return
		}

		userID, ok := userIDValue.(string)
		if !ok {
			ctx.JSON(http.StatusInternalServerError, gin.H{"message": "internal server error"})
			return
		}

		collection, err := repository.AddCollection(pool, clubID, userID, input.DonorName, input.PhoneNumber, input.Amount, string(input.PaymentMode))
		if err != nil {
			ctx.JSON(http.StatusInternalServerError, gin.H{"message": "internal server error"})
			return
		}

		ctx.JSON(http.StatusCreated, collection)
	}
}
