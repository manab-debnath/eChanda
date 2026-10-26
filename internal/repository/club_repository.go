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

type MemberResponse struct {
	ID   string `json:"id"`
	Name string `json:"name"`
	Role string `json:"role"`
}

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

func GetAllMembers(pool *pgxpool.Pool, clubID string) ([]MemberResponse, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	query := `
		SELECT users.id, users.name, clubs_users.role
			FROM users
			JOIN clubs_users
			ON clubs_users.user_id = users.id
		WHERE clubs_users.club_id = $1;
	`

	var members []MemberResponse = []MemberResponse{}
	rows, err := pool.Query(ctx, query, clubID)

	if err != nil {
		log.Println(fmt.Errorf("error: %v", err.Error()))
		return nil, err
	}

	defer rows.Close()

	for rows.Next() {
		var member MemberResponse

		err := rows.Scan(
			&member.ID,
			&member.Name,
			&member.Role,
		)

		if err != nil {
			log.Println(fmt.Errorf("error: %v", err.Error()))
			return nil, err
		}

		members = append(members, member)
	}

	if err := rows.Err(); err != nil {
		log.Println(fmt.Errorf("error: %v", err.Error()))
		return nil, err
	}

	return members, nil
}

func ChangeMemberRole(pool *pgxpool.Pool, clubID string, userID string, targetRole models.Role) (*string, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	updateQuery := `
		UPDATE clubs_users
		SET role = $1
		WHERE club_id = $2 AND user_id = $3
		RETURNING id;
	`
	var membershipID string
	err := pool.QueryRow(ctx, updateQuery, targetRole, clubID, userID).Scan(&membershipID)

	if err != nil {
		log.Println(fmt.Errorf("error: %v", err.Error()))
		return nil, err
	}

	return &membershipID, err
}

func ChangeRoleAsCollector(pool *pgxpool.Pool, clubID string, userID string) (*string, error) {
	return ChangeMemberRole(pool, clubID, userID, models.Collector)
}

func GetAllClubsAsMember(pool *pgxpool.Pool, userID string) ([]models.Club, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	query := `
		SELECT clubs.id, clubs.title, clubs.description, clubs.status, clubs.start_date, clubs.end_date, clubs.created_by, clubs.created_at, clubs.updated_at
		FROM clubs
		JOIN clubs_users
		ON clubs.id = clubs_users.club_id
		WHERE clubs_users.user_id = $1
		ORDER BY clubs.created_at DESC;
	`

	var clubs []models.Club = []models.Club{}
	rows, err := pool.Query(ctx, query, userID)

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
