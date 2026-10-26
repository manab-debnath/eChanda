package repository

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/manab-debnath/eChanda/internal/models"
)

type CollectionResponse struct {
	ID            string         `json:"id" db:"id"`
	CollectorID   string         `json:"collector_id" db:"collector_id"`
	CollectorName string         `json:"collector_name" db:"collector_name"`
	DonorName     string         `json:"donor_name" db:"donor_name"`
	PhoneNumber   *string        `json:"phone_number" db:"phone_number"`
	Amount        pgtype.Numeric `json:"amount" db:"amount"`
	PaymentMode   string         `json:"payment_mode" db:"payment_mode"`
	CollectedAt   time.Time      `json:"collected_at" db:"collected_at"`
}

func AddCollection(pool *pgxpool.Pool, clubID string, collectorID string, donor_name string, phone_number *string, amount pgtype.Numeric, payment_mode string) (*models.Collection, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	query := `
		INSERT INTO collections (club_id, collector_id, donor_name, phone_number, amount, payment_mode)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, club_id, collector_id, donor_name, phone_number, amount, payment_mode, collected_at
	`

	var collection models.Collection
	err := pool.QueryRow(ctx, query, clubID, collectorID, donor_name, phone_number, amount, payment_mode).Scan(
		&collection.ID,
		&collection.ClubID,
		&collection.CollectorID,
		&collection.DonorName,
		&collection.PhoneNumber,
		&collection.Amount,
		&collection.PaymentMode,
		&collection.CollectedAt,
	)

	if err != nil {
		log.Println(fmt.Errorf("error: %v", err.Error()))
		return nil, err
	}

	return &collection, nil
}

func UpdateCollectionByID(pool *pgxpool.Pool, collectionID string, collectorID string, donor_name string, phone_number *string, amount pgtype.Numeric, payment_mode string) (*models.Collection, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	query := `
		UPDATE collections
		SET
		collector_id = $1,
		donor_name = $2,
		phone_number = $3,
		amount = $4,
		payment_mode = $5
		WHERE id = $6
		RETURNING id, club_id, collector_id, donor_name, phone_number, amount, payment_mode, collected_at
	`

	var collection models.Collection
	err := pool.QueryRow(ctx, query, collectorID, donor_name, phone_number, amount, payment_mode, collectionID).Scan(
		&collection.ID,
		&collection.ClubID,
		&collection.CollectorID,
		&collection.DonorName,
		&collection.PhoneNumber,
		&collection.Amount,
		&collection.PaymentMode,
		&collection.CollectedAt,
	)

	if err != nil {
		log.Println(fmt.Errorf("error: %v", err.Error()))
		return nil, err
	}

	return &collection, nil
}

func GetAllCollections(pool *pgxpool.Pool, clubID string) ([]CollectionResponse, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	query := `
		SELECT c.id, c.collector_id, COALESCE(u.name, 'Unknown'), c.donor_name, c.phone_number, c.amount, c.payment_mode, c.collected_at
		FROM collections c
		LEFT JOIN users u ON c.collector_id = u.id
		WHERE c.club_id = $1
		ORDER BY c.collected_at DESC;
	`

	var collections []CollectionResponse = []CollectionResponse{}

	rows, err := pool.Query(ctx, query, clubID)

	if err != nil {
		log.Println(fmt.Errorf("error: %v", err.Error()))
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var collection CollectionResponse

		err := rows.Scan(
			&collection.ID,
			&collection.CollectorID,
			&collection.CollectorName,
			&collection.DonorName,
			&collection.PhoneNumber,
			&collection.Amount,
			&collection.PaymentMode,
			&collection.CollectedAt,
		)

		if err != nil {
			log.Println(fmt.Errorf("error: %v", err.Error()))
			return nil, err
		}

		collections = append(collections, collection)
	}

	if err := rows.Err(); err != nil {
		log.Println(fmt.Errorf("error: %v", err.Error()))
		return nil, err
	}

	return collections, nil
}

func GetTotalCollectionByClubID(pool *pgxpool.Pool, clubID string) (string, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var total string

	err := pool.QueryRow(ctx, `
        SELECT COALESCE(SUM(amount), 0)::text
        FROM collections
        WHERE club_id = $1
    `, clubID).Scan(&total)

	if err != nil {
		return "", err
	}

	return total, nil
}
