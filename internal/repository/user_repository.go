package repository

import (
	"context"
	"errors"
	"fmt"
	"log"
	"time"

	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/manab-debnath/eChanda/internal/auth"
	"github.com/manab-debnath/eChanda/internal/models"
)

func CreateUser(pool *pgxpool.Pool, name string, phone_number string, password string) (*models.User, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// hash password before saving in database
	hashedPassword, err := auth.HashPassword(password)
	if err != nil {
		return nil, err
	}

	var query string = `
		INSERT INTO users (name, phone_number, password_hash)
		VALUES ($1, $2, $3)
		RETURNING id, name, phone_number, created_at, updated_at;
	`

	var user models.User
	err = pool.QueryRow(ctx, query, name, phone_number, hashedPassword).Scan(
		&user.ID,
		&user.Name,
		&user.PhoneNumber,
		&user.CreatedAt,
		&user.UpdatedAt,
	)
	if err != nil {

		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) {
			switch pgErr.Code {
			case "23505":
				return nil, errors.New("phone number already exists")
			default:
				return nil, err
			}
		}

		return nil, err
	}

	return &user, nil
}

func FindUser(pool *pgxpool.Pool, phone_number string, password string) (*models.User, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	query := `
		SELECT
			id,
			name,
			phone_number,
			password_hash,
			created_at,
			updated_at
	 	FROM users
		WHERE phone_number = $1;
	`

	var user models.User
	err := pool.QueryRow(ctx, query, phone_number).Scan(
		&user.ID,
		&user.Name,
		&user.PhoneNumber,
		&user.Password,
		&user.CreatedAt,
		&user.UpdatedAt,
	)

	if err != nil {
		log.Println(fmt.Errorf("error: %v", err.Error()))
		return nil, errors.New("user does not exists")
	}

	// check if password is correct or not
	err = auth.CheckPassword(user.Password, password)
	if err != nil {
		log.Println(fmt.Errorf("error: %v", err.Error()))
		return nil, errors.New("invalid phone number or password")
	}

	return &user, nil
}

func ChangeUserDetails(pool *pgxpool.Pool, userID string, name string) (*models.User, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	query := `
		UPDATE users
		SET name = $1
		WHERE id = $2
		RETURNING id, name, phone_number, updated_at;
	`

	var user models.User
	err := pool.QueryRow(ctx, query, name, userID).Scan(
		&user.ID,
		&user.Name,
		&user.PhoneNumber,
		&user.UpdatedAt,
	)

	if err != nil {
		log.Println(fmt.Errorf("%v:", err.Error()))
		return nil, err
	}

	return &user, nil
}

func ChangeUserPassword(pool *pgxpool.Pool, userID string, password string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// hash password before saving in database
	hashedPassword, err := auth.HashPassword(password)
	if err != nil {
		log.Println(fmt.Errorf("%v:", err.Error()))
		return err
	}

	query := `
		UPDATE users
		SET password_hash = $1
		WHERE id = $2
		RETURNING id;
	`

	var id string
	err = pool.QueryRow(ctx, query, hashedPassword, userID).Scan(&id)

	if err != nil {
		log.Println(fmt.Errorf("%v:", err.Error()))
		return err
	}

	return nil
}

func GetUserPasswordHash(pool *pgxpool.Pool, userID string) (string, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var hashedPassword string

	query := `
        SELECT password_hash
        FROM users
        WHERE id = $1;
    `

	err := pool.QueryRow(ctx, query, userID).Scan(&hashedPassword)
	if err != nil {
		return "", err
	}

	return hashedPassword, nil
}
