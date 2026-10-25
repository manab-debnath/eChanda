package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/manab-debnath/eChanda/internal/middleware"
	"github.com/manab-debnath/eChanda/internal/repository"
)

type CreateExpenseInput struct {
	ProductName string         `json:"product_name"`
	Quantity    string         `json:"quantity"`
	Amount      pgtype.Numeric `json:"amount"`
}

func AddExpenseHandler(pool *pgxpool.Pool) gin.HandlerFunc {
	return func(ctx *gin.Context) {
		clubID := ctx.Param("clubID")
		if _, err := uuid.Parse(clubID); err != nil {
			ctx.JSON(http.StatusBadRequest, gin.H{
				"message": "Invalid club ID",
			})
			return
		}

		var input CreateExpenseInput
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

		expense, err := repository.AddExpense(pool, clubID, userID, input.ProductName, input.Quantity, input.Amount)
		if err != nil {
			ctx.JSON(http.StatusInternalServerError, gin.H{"message": "internal server error"})
			return
		}

		ctx.JSON(http.StatusCreated, expense)
	}
}
