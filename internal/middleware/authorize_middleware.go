package middleware

import (
	"errors"
	"fmt"
	"log"
	"net/http"
	"slices"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

func RequireRoles(pool *pgxpool.Pool, allowedRoles ...string) gin.HandlerFunc {
	return func(ctx *gin.Context) {
		userIDValue, exists := ctx.Get(ContextUserID)
		if !exists {
			ctx.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"message": "Authentication required",
			})
			return
		}

		userID, ok := userIDValue.(string)
		if !ok {
			ctx.AbortWithStatusJSON(http.StatusForbidden, gin.H{
				"message": "Invalid user identity",
			})
			return
		}

		// Get club ID from the URL
		clubID := ctx.Param("clubID")
		if _, err := uuid.Parse(clubID); err != nil {
			ctx.JSON(http.StatusBadRequest, gin.H{
				"message": "Invalid expense ID",
			})
			log.Println(fmt.Errorf("error: %v", err))
			return
		}

		// Look up if club exists or not
		var clubIDExists string
		err := pool.QueryRow(
			ctx.Request.Context(),
			`
				SELECT id
				FROM clubs
				WHERE id = $1;
			`,
			clubID,
		).Scan(&clubIDExists)

		if errors.Is(err, pgx.ErrNoRows) {
			ctx.AbortWithStatusJSON(http.StatusNotFound, gin.H{
				"message": "Club does not exists",
			})
			log.Println(fmt.Errorf("Club does not exists: %v", err))
			return
		}

		if err != nil {
			ctx.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
				"message": "Failed to verify club permissions",
			})
			log.Printf("Failed to verify club existence: %v", err)
			return
		}

		// Look up the user's role within this club
		var userRole string
		err = pool.QueryRow(
			ctx.Request.Context(),
			`
				SELECT role
				FROM clubs_users
				WHERE user_id = $1 AND club_id = $2;
			`,
			userID,
			clubID,
		).Scan(&userRole)

		if errors.Is(err, pgx.ErrNoRows) {
			ctx.AbortWithStatusJSON(http.StatusForbidden, gin.H{
				"message": "You are not a member of this club",
			})
			log.Println(fmt.Errorf("error: %v", err))
			return
		}

		if err != nil {
			ctx.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
				"message": "Failed to verify club permissions",
			})
			log.Println(fmt.Errorf("error: %v", err))
			return
		}

		hasPermission := slices.Contains(allowedRoles, userRole)

		if !hasPermission {
			ctx.AbortWithStatusJSON(http.StatusForbidden, gin.H{
				"message": "You do not have permission to perform this action",
			})
			log.Println(fmt.Errorf("error: %v", err))
			return
		}

		ctx.Next()
	}
}
