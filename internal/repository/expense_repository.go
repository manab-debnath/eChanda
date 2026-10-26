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

type ExpenseResponse struct {
	ID          string         `json:"id" db:"id"`
	AddedBy     string         `json:"added_by" db:"added_by"`
	AddedByName string         `json:"added_by_name" db:"added_by_name"`
	ProductName string         `json:"product_name" db:"product_name"`
	Quantity    string         `json:"quantity" db:"quantity"`
	Amount      pgtype.Numeric `json:"amount" db:"amount"`
	CreatedAt   time.Time      `json:"created_at" db:"created_at"`
}

func AddExpense(pool *pgxpool.Pool, clubID string, added_by string, product_name string, quantity string, amount pgtype.Numeric) (*models.Expense, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	query := `
		INSERT INTO expenses (club_id, added_by, product_name, quantity, amount, created_at)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, club_id, added_by, product_name, quantity, amount, created_at, updated_at
	`

	var expense models.Expense
	err := pool.QueryRow(ctx, query, clubID, added_by, product_name, quantity, amount, time.Now()).Scan(
		&expense.ID,
		&expense.ClubID,
		&expense.AddedBy,
		&expense.ProductName,
		&expense.Quantity,
		&expense.Amount,
		&expense.CreatedAt,
		&expense.UpdatedAt,
	)

	if err != nil {
		log.Println(fmt.Errorf("error: %v", err.Error()))
		return nil, err
	}

	return &expense, nil
}

func UpdateExpenseByID(pool *pgxpool.Pool, expenseID string, added_by string, product_name string, quantity string, amount pgtype.Numeric) (*models.Expense, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	query := `
		UPDATE expenses SET
		added_by = $1,
		product_name = $2,
		quantity =$3,
		amount = $4
		WHERE id = $5
		RETURNING id, club_id, added_by, product_name, quantity, amount, created_at, updated_at
	`

	var expense models.Expense
	err := pool.QueryRow(ctx, query, added_by, product_name, quantity, amount, expenseID).Scan(
		&expense.ID,
		&expense.ClubID,
		&expense.AddedBy,
		&expense.ProductName,
		&expense.Quantity,
		&expense.Amount,
		&expense.CreatedAt,
		&expense.UpdatedAt,
	)

	if err != nil {
		log.Println(fmt.Errorf("error: %v", err.Error()))
		return nil, err
	}

	return &expense, nil
}

func GetAllExpenses(pool *pgxpool.Pool, clubID string) ([]ExpenseResponse, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	query := `
		SELECT e.id, e.added_by, COALESCE(u.name, 'Unknown'), e.product_name, e.quantity, e.amount, e.created_at
		FROM expenses e
		LEFT JOIN users u ON e.added_by = u.id
		WHERE e.club_id = $1
		ORDER BY e.created_at DESC;
	`

	var expenses []ExpenseResponse = []ExpenseResponse{}

	rows, err := pool.Query(ctx, query, clubID)

	if err != nil {
		log.Println(fmt.Errorf("error: %v", err.Error()))
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var expense ExpenseResponse

		err := rows.Scan(
			&expense.ID,
			&expense.AddedBy,
			&expense.AddedByName,
			&expense.ProductName,
			&expense.Quantity,
			&expense.Amount,
			&expense.CreatedAt,
		)

		if err != nil {
			log.Println(fmt.Errorf("error: %v", err.Error()))
			return nil, err
		}

		expenses = append(expenses, expense)
	}

	if err := rows.Err(); err != nil {
		log.Println(fmt.Errorf("error: %v", err.Error()))
		return nil, err
	}

	return expenses, nil
}

func GetTotalExpensesByClubID(pool *pgxpool.Pool, clubID string) (string, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var total string

	err := pool.QueryRow(ctx, `
        SELECT COALESCE(SUM(amount), 0)::text
        FROM expenses
        WHERE club_id = $1
    `, clubID).Scan(&total)

	if err != nil {
		return "", err
	}

	return total, nil
}
