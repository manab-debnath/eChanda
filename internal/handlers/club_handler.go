package handlers

import (
	"errors"
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/manab-debnath/eChanda/internal/middleware"
	"github.com/manab-debnath/eChanda/internal/models"
	"github.com/manab-debnath/eChanda/internal/repository"
)

type CreateClubInput struct {
	ID          string  `json:"id" db:"id"`
	Title       string  `json:"title" db:"title" binding:"required"`
	Description string  `json:"description" db:"description"`
	Status      string  `json:"status" db:"status"`
	StartDate   *string `json:"start_date" db:"start_date"`
	EndDate     *string `json:"end_date" db:"end_date"`
}

func CreateClubHandler(pool *pgxpool.Pool) gin.HandlerFunc {
	return func(ctx *gin.Context) {
		var input CreateClubInput
		if err := ctx.ShouldBindJSON(&input); err != nil {
			ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		if input.Status == "" {
			input.Status = string(models.Active)
		}

		if input.StartDate == nil {
			startDate := time.Now().Format(time.DateOnly)
			input.StartDate = &startDate
		}

		// Validate the start date format
		if _, err := time.Parse(time.DateOnly, *input.StartDate); err != nil {
			ctx.JSON(http.StatusBadRequest, gin.H{
				"error": "start_date must use YYYY-MM-DD format",
			})
			return
		}

		// Validate the end date only if provided
		if input.EndDate != nil {
			if _, err := time.Parse(time.DateOnly, *input.EndDate); err != nil {
				ctx.JSON(http.StatusBadRequest, gin.H{
					"error": "end_date must use YYYY-MM-DD format",
				})
				return
			}
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
		club, err := repository.CreateClub(pool, input.Title, input.Description, input.Status, *input.StartDate, input.EndDate, userIDValue.(string))
		if err != nil {
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
			return
		}

		// return 201 status and user
		ctx.JSON(http.StatusCreated, club)
	}
}

func GetAllClubHandler(pool *pgxpool.Pool) gin.HandlerFunc {
	return func(ctx *gin.Context) {
		clubs, err := repository.GetAllClubs(pool)

		if err != nil {
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
			return
		}

		ctx.JSON(http.StatusOK, clubs)
	}
}

func GetClubByIDHandler(pool *pgxpool.Pool) gin.HandlerFunc {
	return func(ctx *gin.Context) {
		clubID := ctx.Param("clubID")

		club, err := repository.GetClubByID(pool, clubID)

		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				ctx.JSON(http.StatusInternalServerError, gin.H{"error": "club does not exists"})
				return
			}
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
			return
		}

		ctx.JSON(http.StatusOK, club)
	}
}

func JoinClubHandler(pool *pgxpool.Pool) gin.HandlerFunc {
	return func(ctx *gin.Context) {
		clubID := ctx.Param("clubID")

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

		clubName, err := repository.JoinClub(pool, clubID, userID)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				ctx.JSON(http.StatusNotFound, gin.H{"message": "club does not exists"})
			}
			var pgErr *pgconn.PgError
			if errors.As(err, &pgErr) {
				if pgErr.Code == "23505" {
					// Unique constraint violation
					if pgErr.ConstraintName == "unique_club_user" {
						ctx.JSON(http.StatusConflict, gin.H{"message": "user is already a member"})
						return
					}
				}
			}
			ctx.JSON(http.StatusInternalServerError, gin.H{"err": err.Error()})
			return
		}

		ctx.JSON(http.StatusOK, gin.H{
			"message":   "Successfully joined club",
			"club_name": clubName,
		})
	}
}

func GetAllMembersHandler(pool *pgxpool.Pool) gin.HandlerFunc {
	return func(ctx *gin.Context) {
		clubID := ctx.Param("clubID")
		members, err := repository.GetAllMembers(pool, clubID)

		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				ctx.JSON(http.StatusInternalServerError, gin.H{"error": "club does not exists"})
				return
			}
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
			return
		}

		ctx.JSON(http.StatusOK, members)
	}
}

type UpdateMemberRoleInput struct {
	Role string `json:"role"`
}

// Assign or update member role (e.g. collector or viewer)
func ChangeRoleAsCollectorHandler(pool *pgxpool.Pool) gin.HandlerFunc {
	return func(ctx *gin.Context) {
		clubID := ctx.Param("clubID")
		userID := ctx.Param("userID")

		if _, err := uuid.Parse(userID); err != nil {
			ctx.JSON(http.StatusBadRequest, gin.H{
				"message": "Invalid user ID",
			})
			return
		}

		var input UpdateMemberRoleInput
		_ = ctx.ShouldBindJSON(&input)

		targetRole := models.Collector
		if input.Role != "" {
			switch models.Role(input.Role) {
			case models.Collector:
				targetRole = models.Collector
			case models.Viewer:
				targetRole = models.Viewer
			default:
				ctx.JSON(http.StatusBadRequest, gin.H{
					"message": "Invalid role. Role must be 'collector' or 'viewer'",
				})
				return
			}
		}

		membershipID, err := repository.ChangeMemberRole(pool, clubID, userID, targetRole)
		if err != nil {
			log.Printf("ChangeMemberRole failed: %v", err)
			if errors.Is(err, pgx.ErrNoRows) {
				ctx.JSON(http.StatusNotFound, gin.H{"message": "Membership not found"})
				return
			}
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
			return
		}

		ctx.JSON(http.StatusOK, gin.H{
			"message":       "Role successfully updated",
			"membership_id": *membershipID,
			"role":          targetRole,
		})
	}
}

func GetAllClubsAsMember(pool *pgxpool.Pool) gin.HandlerFunc {
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

		clubs, err := repository.GetAllClubsAsMember(pool, userID)
		if err != nil {
			ctx.JSON(http.StatusInternalServerError, gin.H{"message": "internal server error"})
			return
		}

		ctx.JSON(http.StatusOK, clubs)
	}
}

func MakeClubEventCompletedHandler(pool *pgxpool.Pool) gin.HandlerFunc {
	return func(ctx *gin.Context) {
		clubID := ctx.Param("clubID")

		club, err := repository.MakeClubEventCompleted(pool, clubID)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				ctx.JSON(http.StatusNotFound, gin.H{
					"message": "club does not exist",
				})
				return
			}

			if err.Error() == "it is already completed" {
				ctx.JSON(http.StatusBadRequest, gin.H{
					"message": "it is already completed",
				})
				return
			}

			ctx.JSON(http.StatusInternalServerError, gin.H{
				"message": "internal server error",
			})
			return
		}

		ctx.JSON(http.StatusOK, club)
	}
}

func DeleteClubHandler(pool *pgxpool.Pool) gin.HandlerFunc {
	return func(ctx *gin.Context) {
		clubID := ctx.Param("clubID")

		err := repository.DeleteClub(pool, clubID)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				ctx.JSON(http.StatusNotFound, gin.H{
					"message": "club does not exist",
				})
				return
			}

			ctx.JSON(http.StatusInternalServerError, gin.H{
				"message": "internal server error",
			})
			return
		}

		ctx.JSON(http.StatusOK, gin.H{
			"message": "Club deleted successfully",
		})
	}
}