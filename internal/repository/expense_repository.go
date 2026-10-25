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

func AddExpense(pool *pgxpool.Pool, clubID string, added_by string, product_name string, quantity string, amount pgtype.Numeric) (*models.Expense, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	query := `
		INSERT INTO expenses (club_id, added_by, product_name, quantity, amount)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, club_id, added_by, product_name, quantity, amount, expense_date
	`

	var expense models.Expense
	err := pool.QueryRow(ctx, query, clubID, added_by, product_name, quantity, amount).Scan(
		&expense.ID,
		&expense.ClubID,
		&expense.AddedBy,
		&expense.ProductName,
		&expense.Quantity,
		&expense.Amount,
		&expense.ExpenseDate,
	)

	if err != nil {
		log.Println(fmt.Errorf("error: %v", err.Error()))
		return nil, err
	}

	return &expense, nil
}
