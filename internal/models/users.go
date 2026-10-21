package models

import "time"

type Role string

const (
	Admin     Role = "admin"
	Collector Role = "collector"
	Viewer    Role = "viewer"
)

type User struct {
	ID          string    `json:"id" db:"id"`
	Name        string    `json:"name" db:"name"`
	PhoneNumber string    `json:"phone_number" db:"phone_number"`
	Password    string    `json:"-" db:"password_hash"`
	Role        Role      `json:"role" db:"role"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time `json:"updated_at" db:"updated_at"`
}
