package repository

import (
	"context"
	"errors"
	"time"

	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/manab-debnath/eChanda/internal/auth"
	"github.com/manab-debnath/eChanda/internal/models"
)

func CreateUser(pool *pgxpool.Pool, name string, phone_number string, password string, role models.Role) (*models.User, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// hash password before saving in database
	hashedPassword, err := auth.HashPassword(password)
	if err != nil {
		return nil, err
	}

	var query string = `
		INSERT INTO users (name, phone_number, password_hash, role)
		VALUES ($1, $2, $3, $4)
		RETURNING id, name, phone_number, role, created_at, updated_at
	`

	var user models.User
	err = pool.QueryRow(ctx, query, name, phone_number, hashedPassword, role).Scan(
		&user.ID,
		&user.Name,
		&user.PhoneNumber,
		&user.Role,
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
		SELECT * FROM users
		WHERE phone_number=$1;
	`

	var user models.User
	err := pool.QueryRow(ctx, query, phone_number).Scan(
		&user.ID,
		&user.Name,
		&user.PhoneNumber,
		&user.Password,
		&user.Role,
		&user.CreatedAt,
		&user.UpdatedAt,
	)

	if err != nil {
		return nil, errors.New("user does not exists")
	}

	// check if password is correct or not
	err = auth.CheckPassword(user.Password, password)
	if err != nil {
		return nil, errors.New("invalid phone number or password")
	}

	return &user, nil
}
