package repositories

import (
	"database/sql"
	"errors"
	"strings"

	"backend/models"
)

// UserRepository handles database operations for users
type UserRepository struct {
	DB *sql.DB
}

// NewUserRepository creates a new UserRepository
func NewUserRepository(db *sql.DB) *UserRepository {
	return &UserRepository{DB: db}
}

// Create inserts a new user into the database
func (r *UserRepository) Create(user *models.User) error {
	query := `
		INSERT INTO users (id, first_name, last_name, email, identify, document_id, phone, photo_url, password_hash)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		RETURNING created_at, updated_at
	`
	err := r.DB.QueryRow(
		query,
		user.ID, user.FirstName, user.LastName, user.Email, user.Identify,
		user.DocumentID, user.Phone, user.PhotoURL, user.PasswordHash,
	).Scan(&user.CreatedAt, &user.UpdatedAt)

	return err
}

// FindByEmailOrDocument finds a user by email or document ID
func (r *UserRepository) FindByEmailOrDocument(identifier string) (*models.User, error) {
	query := `
		SELECT id, first_name, last_name, email, identify, document_id, phone, photo_url, password_hash, created_at, updated_at
		FROM users
		WHERE email = $1 OR document_id = $1
	`
	var user models.User
	err := r.DB.QueryRow(query, identifier).Scan(
		&user.ID, &user.FirstName, &user.LastName, &user.Email, &user.Identify,
		&user.DocumentID, &user.Phone, &user.PhotoURL,
		&user.PasswordHash, &user.CreatedAt, &user.UpdatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, errors.New("user not found")
		}
		return nil, err
	}
	return &user, nil
}

// FindByID finds a user by their UUID
func (r *UserRepository) FindByID(id string) (*models.User, error) {
	query := `
		SELECT id, first_name, last_name, email, identify, document_id, phone, photo_url, created_at, updated_at
		FROM users
		WHERE id = $1
	`
	var user models.User
	err := r.DB.QueryRow(query, id).Scan(
		&user.ID, &user.FirstName, &user.LastName, &user.Email, &user.Identify,
		&user.DocumentID, &user.Phone, &user.PhotoURL,
		&user.CreatedAt, &user.UpdatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, errors.New("user not found")
		}
		return nil, err
	}
	return &user, nil
}

// FindOwners returns all users with the 'owner' role
func (r *UserRepository) FindOwners() ([]models.User, error) {
	query := `
		SELECT DISTINCT u.id, u.first_name, u.last_name, u.email, u.identify, u.document_id, u.phone, u.photo_url, u.created_at
		FROM users u
		JOIN shop_members sm ON u.id = sm.user_id
		WHERE sm.role = 'owner'
		ORDER BY u.created_at DESC
	`
	rows, err := r.DB.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var owners []models.User
	for rows.Next() {
		var u models.User
		if err := rows.Scan(
			&u.ID, &u.FirstName, &u.LastName, &u.Email,
			&u.Identify, &u.DocumentID, &u.Phone,
			&u.PhotoURL, &u.CreatedAt,
		); err != nil {
			continue
		}
		owners = append(owners, u)
	}
	return owners, nil
}

// CreateSaaSAccount creates a user, a pending shop, and links them as an owner
func (r *UserRepository) CreateSaaSAccount(user *models.User, shopName string) (string, error) {
	tx, err := r.DB.Begin()
	if err != nil {
		return "", err
	}
	defer tx.Rollback()

	// 1. Crear el usuario
	userQuery := `
		INSERT INTO users (id, first_name, last_name, email, identify, phone, password_hash)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
	`
	if _, err := tx.Exec(userQuery, user.ID, user.FirstName, user.LastName, user.Email, user.Identify, user.Phone, user.PasswordHash); err != nil {
		if strings.Contains(err.Error(), "unique constraint") || strings.Contains(err.Error(), "duplicate key") {
			return "", errors.New("email already registered")
		}
		return "", err
	}

	// 2. Crear la tienda en estado pending
	shopQuery := `
		INSERT INTO shops (name, owner_id, timezone, status)
		VALUES ($1, $2, 'America/Bogota', 'pending')
		RETURNING id
	`
	var shopID string
	if err := tx.QueryRow(shopQuery, shopName, user.ID).Scan(&shopID); err != nil {
		return "", err
	}

	// 3. Vincular como miembro
	memberQuery := `
		INSERT INTO shop_members (shop_id, user_id, role, permissions)
		VALUES ($1, $2, 'owner', '{}')
	`
	if _, err := tx.Exec(memberQuery, shopID, user.ID); err != nil {
		return "", err
	}

	if err := tx.Commit(); err != nil {
		return "", err
	}

	return shopID, nil
}
