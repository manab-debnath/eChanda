package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/manab-debnath/eChanda/internal/auth"
	"github.com/manab-debnath/eChanda/internal/middleware"
	"github.com/manab-debnath/eChanda/internal/repository"
)

type CreateUserInput struct {
	Name        string `json:"name" binding:"required"`
	PhoneNumber string `json:"phone_number" binding:"required"`
	Password    string `json:"password" binding:"required"`
}

type LoginUserInput struct {
	PhoneNumber string `json:"phone_number" binding:"required"`
	Password    string `json:"password" binding:"required"`
}

type ChangeUserInput struct {
	Name string `json:"name"`
}

type ChangeUserPasswordInput struct {
	CurrentPassword string `json:"current_password" binding:"required"`
	NewPassword     string `json:"new_password" binding:"required"`
}

func CreateUserHandler(pool *pgxpool.Pool) gin.HandlerFunc {
	return func(ctx *gin.Context) {
		var input CreateUserInput
		if err := ctx.ShouldBindJSON(&input); err != nil {
			ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		if len(input.Password) < 6 {
			ctx.JSON(http.StatusBadRequest, gin.H{"message": "Password must be six characters long"})
			return
		}

		// send values to database for creation
		user, err := repository.CreateUser(pool, input.Name, input.PhoneNumber, input.Password)
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

func LoginUserHandler(pool *pgxpool.Pool) gin.HandlerFunc {
	return func(ctx *gin.Context) {
		var input LoginUserInput
		if err := ctx.ShouldBindJSON(&input); err != nil {
			ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		user, err := repository.FindUser(pool, input.PhoneNumber, input.Password)
		if err != nil {
			ctx.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}

		// TODO: Create JWT and set it as cookie
		token, err := auth.GenerateJWT(user)
		if err != nil {
			ctx.JSON(http.StatusInternalServerError, gin.H{
				"error": "Failed to generate authentication token",
			})
			return
		}

		// set token in cookie
		ctx.SetCookie("access_token", token, 60*60*24, "/", "", true, true)

		ctx.JSON(http.StatusOK, gin.H{
			"message": "Login Successful",
			"token":   token,
			"user":    user,
		})
	}
}

func LogoutUserHandler() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		ctx.SetCookie("access_token", "", -1, "/", "", true, true)

		ctx.JSON(http.StatusOK, gin.H{
			"message": "Logged out successfully",
		})
	}
}

func ChangeUserDetailsHandler(pool *pgxpool.Pool) gin.HandlerFunc {
	return func(ctx *gin.Context) {
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

		var input ChangeUserInput
		if err := ctx.ShouldBindJSON(&input); err != nil {
			ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		user, err := repository.ChangeUserDetails(pool, userID, input.Name)
		if err != nil {
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
			return
		}

		// TODO: Create JWT and set it as cookie
		token, err := auth.GenerateJWT(user)
		if err != nil {
			ctx.JSON(http.StatusInternalServerError, gin.H{
				"error": "Failed to generate authentication token",
			})
			return
		}

		// set token in cookie
		ctx.SetCookie("access_token", token, 60*60*24, "/", "", true, true)

		ctx.JSON(http.StatusOK, gin.H{
			"message": "User details updated successfully",
			"token":   token,
			"user":    user,
		})
	}
}

func ChangeUserPasswordHanler(pool *pgxpool.Pool) gin.HandlerFunc {
	return func(ctx *gin.Context) {
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

		var input ChangeUserPasswordInput
		if err := ctx.ShouldBindJSON(&input); err != nil {
			ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		if len(input.NewPassword) < 6 {
			ctx.JSON(http.StatusBadRequest, gin.H{"message": "Password must be six characters long"})
			return
		}

		if input.CurrentPassword == input.NewPassword {
			ctx.JSON(http.StatusBadRequest, gin.H{"message": "New password cannot be the same as old password"})
			return
		}

		hashedPassword, err := repository.GetUserPasswordHash(pool, userID)
		if err != nil {
			ctx.JSON(http.StatusInternalServerError, gin.H{"message": "Unable to retrieve user password"})
			return
		}

		err = auth.CheckPassword(hashedPassword, input.CurrentPassword)
		if err != nil {
			ctx.JSON(http.StatusUnauthorized, gin.H{"message": "invalid current password"})
			return
		}

		err = repository.ChangeUserPassword(pool, userID, input.NewPassword)
		if err != nil {
			ctx.JSON(http.StatusInternalServerError, gin.H{"message": "Unable to update password"})
			return
		}

		// Clear authentication cookie.
		ctx.SetCookie(
			"access_token",
			"",
			-1,
			"/",
			"",
			true, // Secure: true in production with HTTPS
			true, // HttpOnly
		)
		ctx.JSON(http.StatusOK, gin.H{
			"message": "Password changed successfully. Please log in again",
		})
	}
}
