package models

import "time"

type Session struct {
	ID          string    `json:"id"`
	UserID      string    `json:"user_id"`
	TokenHash   string    `json:"-"`
	Fingerprint string    `json:"fingerprint"`
	IPAddress   string    `json:"ip_address"`
	UserAgent   string    `json:"user_agent"`
	IsActive    bool      `json:"is_active"`
	ExpiresAt   time.Time `json:"expires_at"`
	CreatedAt   time.Time `json:"created_at"`
}

type LoginAttempt struct {
	ID          string    `json:"id"`
	Email       string    `json:"email"`
	IPAddress   string    `json:"ip_address"`
	Fingerprint string    `json:"fingerprint"`
	Success     bool      `json:"success"`
	AttemptedAt time.Time `json:"attempted_at"`
}
