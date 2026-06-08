package models

import "time"

// User represents the system user model matching the database schema
// User representa el modelo de usuario del sistema coincidiendo con el esquema de la base de datos
type User struct {
	ID         string     `json:"id"`                    // Auth system ID (Firebase UID or custom UUID) / ID del sistema de autenticación (Firebase UID o UUID personalizado)
	FirstName  string     `json:"first_name"`            // First name of the user / Nombre del usuario
	LastName   string     `json:"last_name"`             // Last name of the user / Apellido del usuario
	Email      string     `json:"email"`                 // Email address / Dirección de correo electrónico
	Identify   *string    `json:"identify,omitempty"`    // Document type or generic document number / Tipo de documento o número genérico
	DocumentID *string    `json:"document_id,omitempty"` // Client identity card number / Número de cédula o documento del cliente
	Phone      *string    `json:"phone,omitempty"`       // Contact phone number / Teléfono de contacto
	Role       string     `json:"role"`                  // System-wide user role / Rol global de usuario en el sistema
	RoleID     *string    `json:"role_id,omitempty"`     // Global role ID if using custom roles / ID del rol global si se usan roles personalizados
	PhotoURL   *string    `json:"photo_url,omitempty"`   // Profile picture URL / URL de la foto de perfil
	Password     string     `json:"password,omitempty"`     // Raw password input / Contraseña en texto plano
	PasswordHash string     `json:"-"`                      // Password hash for DB storage / Hash de contraseña para la base de datos
	CreatedAt    *time.Time `json:"created_at,omitempty"`  // Account creation date / Fecha de creación de la cuenta
	UpdatedAt    *time.Time `json:"updated_at,omitempty"`  // Account last update date / Fecha de última actualización de la cuenta
}
