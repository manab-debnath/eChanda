package models

import (
	"time"

	"github.com/jackc/pgx/v5/pgtype"
)

type PaymentMode string

const (
	Cash   Status = "cash"
	Online Status = "online"
)

type Collection struct {
	ID          string         `json:"id" db:"id"`
	ClubID      string         `json:"club_id" db:"club_id"`
	CollectorID string         `json:"collector_id" db:"collector_id"`
	DonorName   string         `json:"donor_name" db:"donor_name"`
	PhoneNumber *string        `json:"phone_number" db:"phone_number"`
	Amount      pgtype.Numeric `json:"amount" db:"amount"`
	PaymentMode PaymentMode    `json:"payment_mode" db:"payment_mode"`
	CollectedAt time.Time      `json:"collected_at" db:"collected_at"`
}
