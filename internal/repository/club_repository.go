package repository

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/manab-debnath/eChanda/internal/models"
)

func CreateClub(pool *pgxpool.Pool, title string, description string, status string, startDate time.Time, endDate time.Time, created_by string) (*models.Club, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	tx, err := pool.Begin(ctx)
	if err != nil {
		log.Println(fmt.Errorf("error: %v", err.Error()))
		return nil, err
	}

	defer tx.Rollback(ctx)

	query := `
		INSERT INTO clubs (title, description, status, start_date, end_date, created_by)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, title, description, status, start_date, end_date, created_by, created_at, updated_at;
	`

	var club models.Club
	err = tx.QueryRow(ctx, query, title, description, status, startDate, endDate, created_by).Scan(
		&club.ID,
		&club.Title,
		&club.Description,
		&club.Status,
		&club.StartDate,
		&club.EndDate,
		&club.CreatedBy,
		&club.CreatedAt,
		&club.UpdatedAt,
	)
	if err != nil {
		log.Println(fmt.Errorf("error: %v", err.Error()))
		return nil, err
	}

	membershipQuery := `
		INSERT INTO clubs_users (club_id, user_id, role)
		VALUES($1, $2, $3);
	`
	_, err = tx.Exec(ctx, membershipQuery, club.ID, created_by, models.Admin)
	if err != nil {
		log.Println(fmt.Errorf("error: %v", err.Error()))
		return nil, err
	}

	if err := tx.Commit(ctx); err != nil {
		log.Println(fmt.Errorf("error: %v", err.Error()))
		return nil, err
	}

	return &club, nil
}
