package handlers

import (
	"errors"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/manab-debnath/eChanda/internal/middleware"
	"github.com/manab-debnath/eChanda/internal/models"
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

		club, err := repository.GetClubByID(pool, clubID)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				ctx.JSON(http.StatusNotFound, gin.H{"message": "Membership not found"})
				return
			}

			ctx.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
			return
		}

		if club.Status == models.Completed {
			ctx.JSON(http.StatusBadRequest, gin.H{
				"message": "Event has completed, cannot add anymore expense",
			})
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

func UpdateExpenseByIDHandler(pool *pgxpool.Pool) gin.HandlerFunc {
	return func(ctx *gin.Context) {
		expenseID := ctx.Param("expenseID")
		if _, err := uuid.Parse(expenseID); err != nil {
			ctx.JSON(http.StatusBadRequest, gin.H{
				"message": "Invalid expense ID",
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

		clubID := ctx.Param("clubID")

		club, err := repository.GetClubByID(pool, clubID)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				ctx.JSON(http.StatusNotFound, gin.H{"message": "Membership not found"})
				return
			}

			ctx.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
			return
		}

		if club.Status == models.Completed {
			ctx.JSON(http.StatusBadRequest, gin.H{
				"message": "Event has completed, cannot update anymore",
			})
			return
		}

		expense, err := repository.UpdateExpenseByID(pool, expenseID, userID, input.ProductName, input.Quantity, input.Amount)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				ctx.JSON(http.StatusNotFound, gin.H{"message": "expense does not exists"})
				return
			}
			ctx.JSON(http.StatusInternalServerError, gin.H{"message": "internal server error"})
			return
		}

		ctx.JSON(http.StatusCreated, expense)
	}
}

func GetAllExpenseHandler(pool *pgxpool.Pool) gin.HandlerFunc {
	return func(ctx *gin.Context) {
		clubID := ctx.Param("clubID")

		expenses, err := repository.GetAllExpenses(pool, clubID)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				ctx.JSON(http.StatusNotFound, gin.H{"message": "club does not exists"})
				return
			}
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
			return
		}

		ctx.JSON(http.StatusOK, expenses)
	}
}

func GetTotalExpensesByClubIDHandler(pool *pgxpool.Pool) gin.HandlerFunc {
	return func(ctx *gin.Context) {
		clubID := ctx.Param("clubID")
		if _, err := uuid.Parse(clubID); err != nil {
			ctx.JSON(http.StatusBadRequest, gin.H{
				"message": "Invalid expense ID",
			})
			return
		}

		totalExpense, err := repository.GetTotalExpensesByClubID(pool, clubID)
		if err != nil {
			log.Printf("Failed to calculate total for club %s: %v", clubID, err)

			ctx.JSON(http.StatusInternalServerError, gin.H{
				"message": "Internal server error",
			})
			return
		}

		ctx.JSON(http.StatusOK, gin.H{
			"club_id":        clubID,
			"total_expenses": totalExpense,
		})
	}
}
