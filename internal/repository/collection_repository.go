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
