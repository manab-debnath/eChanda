package seed

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

const demoEventID = "085d9a21-2bcd-4b29-b115-ad6b32a5a4fe"

type demoCollection struct {
	ID          string
	DonorName   string
	PhoneNumber string
	Amount      string
	PaymentMode string
	CollectedAt time.Time
}

type demoExpense struct {
	ID          string
	ProductName string
	Quantity    string
	Amount      string
	CreatedAt   time.Time
}

func SeedDemoData(ctx context.Context, pool *pgxpool.Pool) error {
	tx, err := pool.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return fmt.Errorf("begin seed transaction: %w", err)
	}
	defer tx.Rollback(ctx)

	// Find a valid user belonging to this club.
	var userID string

	err = tx.QueryRow(ctx, `
		SELECT user_id
		FROM clubs_users
		WHERE club_id = $1
		LIMIT 1;
	`, demoEventID).Scan(&userID)

	if err != nil {
		return fmt.Errorf("find demo event user: %w", err)
	}

	now := time.Now()

	collections := []demoCollection{
		{"a1000001-0000-4000-8000-000000000001", "Rahul Sharma", "9876543210", "500", "cash", now.AddDate(0, 0, -10)},
		{"a1000001-0000-4000-8000-000000000002", "Amit Das", "9876543211", "1000", "online", now.AddDate(0, 0, -9)},
		{"a1000001-0000-4000-8000-000000000003", "Priya Roy", "9876543212", "250", "cash", now.AddDate(0, 0, -8)},
		{"a1000001-0000-4000-8000-000000000004", "Sourav Ghosh", "9876543213", "1500", "online", now.AddDate(0, 0, -7)},
		{"a1000001-0000-4000-8000-000000000005", "Ankit Singh", "9876543214", "750", "cash", now.AddDate(0, 0, -6)},
		{"a1000001-0000-4000-8000-000000000006", "Sneha Dey", "9876543215", "2000", "online", now.AddDate(0, 0, -5)},
		{"a1000001-0000-4000-8000-000000000007", "Rohan Paul", "9876543216", "500", "cash", now.AddDate(0, 0, -4)},
		{"a1000001-0000-4000-8000-000000000008", "Arjun Banerjee", "9876543217", "1200", "online", now.AddDate(0, 0, -3)},
		{"a1000001-0000-4000-8000-000000000009", "Neha Das", "9876543218", "300", "cash", now.AddDate(0, 0, -2)},
		{"a1000001-0000-4000-8000-000000000010", "Kunal Roy", "9876543219", "800", "online", now.AddDate(0, 0, -1)},
	}

	for _, c := range collections {
		_, err := tx.Exec(ctx, `
			INSERT INTO collections (
				id, club_id, collector_id, donor_name,
				phone_number, amount, payment_mode, collected_at
			)
			VALUES (
				$1, $2, $3, $4, $5, $6::numeric, $7, $8
			)
			ON CONFLICT (id) DO NOTHING;
		`,
			c.ID,
			demoEventID,
			userID,
			c.DonorName,
			c.PhoneNumber,
			c.Amount,
			c.PaymentMode,
			c.CollectedAt,
		)

		if err != nil {
			return fmt.Errorf("insert collection %s: %w", c.ID, err)
		}
	}

	expenses := []demoExpense{
		{"b2000001-0000-4000-8000-000000000001", "Decoration Materials", "10", "2500", now.AddDate(0, 0, -9)},
		{"b2000001-0000-4000-8000-000000000002", "Sound System", "1", "5000", now.AddDate(0, 0, -8)},
		{"b2000001-0000-4000-8000-000000000003", "Lighting", "5", "3000", now.AddDate(0, 0, -7)},
		{"b2000001-0000-4000-8000-000000000004", "Food and Catering", "100", "12000", now.AddDate(0, 0, -5)},
		{"b2000001-0000-4000-8000-000000000005", "Printing and Banners", "20", "1500", now.AddDate(0, 0, -3)},
		{"b2000001-0000-4000-8000-000000000006", "Transportation", "2", "2000", now.AddDate(0, 0, -1)},
	}

	for _, e := range expenses {
		_, err := tx.Exec(ctx, `
			INSERT INTO expenses (
				id, club_id, added_by, product_name,
				quantity, amount, created_at, updated_at
			)
			VALUES (
				$1, $2, $3, $4, $5, $6::numeric, $7, $7
			)
			ON CONFLICT (id) DO NOTHING;
		`,
			e.ID,
			demoEventID,
			userID,
			e.ProductName,
			e.Quantity,
			e.Amount,
			e.CreatedAt,
		)

		if err != nil {
			return fmt.Errorf("insert expense %s: %w", e.ID, err)
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("commit seed transaction: %w", err)
	}

	return nil
}
