package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/manab-debnath/eChanda/internal/models"
	"github.com/manab-debnath/eChanda/internal/repository"
)

type CreateUserInput struct {
	Name        string      `json:"name" binding:"required"`
	PhoneNumber string      `json:"phone_number" binding:"required"`
	Password    string      `json:"password" binding:"required"`
	Role        models.Role `json:"role"`
}

func CreateUserHandler(pool *pgxpool.Pool) gin.HandlerFunc {
	return func(ctx *gin.Context) {
		var input CreateUserInput
		if err := ctx.ShouldBindJSON(&input); err != nil {
			ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// send values to database for creation
		user, err := repository.CreateUser(pool, input.Name, input.PhoneNumber, input.Password, input.Role)
		if err != nil {
			if err.Error() == "phone number already exists" {
				ctx.JSON(http.StatusConflict, gin.H{
					"error": err.Error(),
				})
				return
			}
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
			return
		}

		// return 201 status and user
		ctx.JSON(http.StatusCreated, user)
	}
}
