package models

import "time"

// User represents the system user model matching the database schema
// User representa el modelo de usuario del sistema coincidiendo con el esquema de la base de datos
type User struct {
	ID           string     `json:"id"`                    // System User ID (UUID)
	FirstName    string     `json:"first_name"`            // First name of the user
	LastName     string     `json:"last_name"`             // Last name of the user
	Email        string     `json:"email"`                 // Email address
	Identify     *string    `json:"identify,omitempty"`    // Document type or generic document number
	DocumentID   *string    `json:"document_id,omitempty"` // Client identity card number
	Phone        *string    `json:"phone,omitempty"`       // Contact phone number
	PhotoURL     *string    `json:"photo_url,omitempty"`   // Profile picture URL
	Password     string     `json:"password,omitempty"`    // Raw password input
	PasswordHash string     `json:"-"`                     // Password hash for DB storage
	CreatedAt    *time.Time `json:"created_at,omitempty"`  // Account creation date
	UpdatedAt    *time.Time `json:"updated_at,omitempty"`  // Account last update date
}
