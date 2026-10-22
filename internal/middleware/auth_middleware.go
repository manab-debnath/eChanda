package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/manab-debnath/eChanda/internal/auth"
)

const (
	ContextUserID = "userID"
	ContextRole   = "role"
)

func AuthMiddleware() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		tokenString, err := ctx.Cookie("access_token")

		if err != nil || tokenString == "" {
			header := ctx.GetHeader("Authorization")
			tokenString, _ = strings.CutPrefix(header, "Bearer ")
		}

		if tokenString == "" {
			ctx.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"message": "Authentication required",
			})
			return
		}

		claims, err := auth.VerifyJWT(tokenString)
		if err != nil {
			ctx.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"message": "Invalid or expired token",
			})
			return
		}

		ctx.Set(ContextUserID, claims.Subject)
		ctx.Set(ContextRole, claims.Role)

		ctx.Next()
	}
}
