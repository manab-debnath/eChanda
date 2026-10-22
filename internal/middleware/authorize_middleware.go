package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func RequireRoles(allowedRoles ...string) gin.HandlerFunc {
	return func(ctx *gin.Context) {
		roleValue, exists := ctx.Get(ContextRole)
		if !exists {
			ctx.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"message": "Authentication required",
			})
			return
		}

		userRole, ok := roleValue.(string)
		if !ok {
			ctx.AbortWithStatusJSON(http.StatusForbidden, gin.H{
				"message": "Invalid user role",
			})
			return
		}

		for _, role := range allowedRoles {
			if userRole == role {
				ctx.Next()
			}
		}

		ctx.AbortWithStatusJSON(http.StatusForbidden, gin.H{
			"message": "You do not have permission to perform this action",
		})
	}
}
