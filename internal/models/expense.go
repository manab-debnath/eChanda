package models

import (
	"time"

	"github.com/jackc/pgx/v5/pgtype"
)

type Expense struct {
	ID          string         `json:"id" db:"id"`
	ClubID      string         `json:"club_id" db:"club_id"`
	AddedBy     string         `json:"added_by" db:"added_by"`
	ProductName string         `json:"product_name" db:"product_name"`
	Quantity    string         `json:"quantity" db:"quantity"`
	Amount      pgtype.Numeric `json:"amount" db:"amount"`
	CreatedAt   time.Time      `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at" db:"updated_at"`
}
