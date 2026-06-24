package repositories

import (
	"database/sql"
	"backend/models"
)

type SessionRepository struct {
	DB *sql.DB
}

func NewSessionRepository(db *sql.DB) *SessionRepository {
	return &SessionRepository{DB: db}
}

func (r *SessionRepository) CreateSession(s *models.Session) error {
	query := `
		INSERT INTO sessions (id, user_id, token_hash, fingerprint, ip_address, user_agent, is_active, expires_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
	`
	_, err := r.DB.Exec(query, s.ID, s.UserID, s.TokenHash, s.Fingerprint, s.IPAddress, s.UserAgent, s.IsActive, s.ExpiresAt)
	return err
}

func (r *SessionRepository) InvalidateSession(tokenHash string) error {
	query := `UPDATE sessions SET is_active = false WHERE token_hash = $1`
	_, err := r.DB.Exec(query, tokenHash)
	return err
}

func (r *SessionRepository) IsSessionActive(tokenHash string) (bool, error) {
	var isActive bool
	query := `SELECT is_active FROM sessions WHERE token_hash = $1 AND expires_at > CURRENT_TIMESTAMP`
	err := r.DB.QueryRow(query, tokenHash).Scan(&isActive)
	if err != nil {
		if err == sql.ErrNoRows {
			return false, nil
		}
		return false, err
	}
	return isActive, nil
}

func (r *SessionRepository) LogAttempt(attempt *models.LoginAttempt) error {
	query := `
		INSERT INTO login_attempts (id, email, ip_address, fingerprint, success)
		VALUES ($1, $2, $3, $4, $5)
	`
	_, err := r.DB.Exec(query, attempt.ID, attempt.Email, attempt.IPAddress, attempt.Fingerprint, attempt.Success)
	return err
}
