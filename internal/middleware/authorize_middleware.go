package middleware

import (
	"errors"
	"net/http"
	"slices"

	"github.com/gin-gonic/gin"
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
		if clubID == "" {
			ctx.AbortWithStatusJSON(http.StatusBadRequest, gin.H{
				"message": "Club ID is required",
			})
			return
		}

		// Look up the user's role within this club
		var userRole string
		err := pool.QueryRow(
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
			return
		}

		if err != nil {
			ctx.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
				"message": "Failed to verify club permissions",
			})
			return
		}

		hasPermission := slices.Contains(allowedRoles, userRole)

		if !hasPermission {
			ctx.AbortWithStatusJSON(http.StatusForbidden, gin.H{
				"message": "You do not have permission to perform this action",
			})
			return
		}

		ctx.Next()
	}
}
