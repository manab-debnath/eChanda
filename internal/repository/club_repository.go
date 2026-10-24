package repository

import (
	"context"
	"errors"
	"fmt"
	"log"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/manab-debnath/eChanda/internal/models"
)

func CreateClub(pool *pgxpool.Pool, title string, description string, status string, startDate string, endDate *string, userID string) (*models.Club, error) {
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
	err = tx.QueryRow(ctx, query, title, description, status, startDate, endDate, userID).Scan(
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
	_, err = tx.Exec(ctx, membershipQuery, club.ID, userID, models.Admin)
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

func GetAllClubs(pool *pgxpool.Pool) ([]models.Club, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	query := `
		SELECT id, title, description, status, start_date, end_date, created_by, created_at, updated_at
		FROM clubs
		ORDER BY created_at DESC;
	`

	var clubs []models.Club = []models.Club{}
	rows, err := pool.Query(ctx, query)

	if err != nil {
		log.Println(fmt.Errorf("error: %v", err.Error()))
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var club models.Club

		err := rows.Scan(
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

		clubs = append(clubs, club)
	}

	if err := rows.Err(); err != nil {
		log.Println(fmt.Errorf("error: %v", err.Error()))
		return nil, err
	}

	return clubs, nil
}

func GetClubByID(pool *pgxpool.Pool, clubID string) (*models.Club, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	query := `
		SELECT id, title, description, status, start_date, end_date, created_by, created_at, updated_at
		FROM clubs
		WHERE id = $1;
	`

	var club models.Club
	err := pool.QueryRow(ctx, query, clubID).Scan(
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

	return &club, nil
}

func JoinClub(pool *pgxpool.Pool, clubID string, userID string) (string, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	tx, err := pool.Begin(ctx)
	if err != nil {
		log.Println(fmt.Errorf("error: %v", err.Error()))
		return "", err
	}

	defer tx.Rollback(ctx)

	findClubQuery := `
		SELECT title FROM clubs
		WHERE id = $1;
	`

	var clubName string
	err = tx.QueryRow(ctx, findClubQuery, clubID).Scan(&clubName)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			log.Println(fmt.Errorf("error: %v", errors.New("club does not exists")))
			return "", err
		}
		log.Println(fmt.Errorf("error: %v", err.Error()))
		return "", err
	}

	joinClubQuery := `
		INSERT INTO clubs_users (club_id, user_id, role)
		VALUES($1, $2, $3)
	`

	_, err = tx.Exec(ctx, joinClubQuery, clubID, userID, models.Viewer)
	if err != nil {
		log.Println(fmt.Errorf("error: %v", err.Error()))
		return "", err
	}

	if err := tx.Commit(ctx); err != nil {
		log.Println(fmt.Errorf("error: %v", err.Error()))
		return "", err
	}

	return clubName, nil
}
