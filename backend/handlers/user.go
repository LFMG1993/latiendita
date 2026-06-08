package handlers

import (
	"crypto/rand"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"

	"backend/models"

	"golang.org/x/crypto/bcrypt"
)

// UserHandler handles user-related HTTP requests
// UserHandler maneja las solicitudes HTTP relacionadas con los usuarios
type UserHandler struct {
	DB *sql.DB
}

// NewUserHandler creates a new instance of UserHandler
// NewUserHandler crea una nueva instancia de UserHandler
func NewUserHandler(db *sql.DB) *UserHandler {
	return &UserHandler{DB: db}
}

// generateUUID generates a standard RFC4122 UUIDv4 using crypto/rand
// generateUUID genera un UUIDv4 estándar RFC4122 usando crypto/rand
func generateUUID() string {
	b := make([]byte, 16)
	_, err := rand.Read(b)
	if err != nil {
		log.Printf("Error generating UUID: %v", err)
		return ""
	}
	// Set the version (4) and variant (RFC4122)
	b[6] = (b[6] & 0x0f) | 0x40
	b[8] = (b[8] & 0x3f) | 0x80
	return fmt.Sprintf("%x-%x-%x-%x-%x", b[0:4], b[4:6], b[6:8], b[8:10], b[10:])
}

// RegisterUser handles POST /api/users to register a new user in the database
// RegisterUser maneja POST /api/users para registrar un nuevo usuario en la base de datos
func (h *UserHandler) RegisterUser(w http.ResponseWriter, r *http.Request) {
	// Only allow POST method / Solo permitir el método POST
	if r.Method != http.MethodPost {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusMethodNotAllowed)
		json.NewEncoder(w).Encode(map[string]string{"error": "Method not allowed / Método no permitido"})
		return
	}

	var user models.User
	err := json.NewDecoder(r.Body).Decode(&user)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid JSON format / Formato de JSON inválido"})
		return
	}

	// Clean inputs / Limpiar entradas
	user.Email = strings.TrimSpace(strings.ToLower(user.Email))
	user.FirstName = strings.TrimSpace(user.FirstName)
	user.LastName = strings.TrimSpace(user.LastName)
	user.Password = strings.TrimSpace(user.Password)

	// Validation / Validación
	if user.Email == "" || user.FirstName == "" || user.LastName == "" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Missing required fields (email, first_name, last_name) / Faltan campos requeridos"})
		return
	}

	if user.Password == "" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Password is required / La contraseña es requerida"})
		return
	}

	if len(user.Password) < 6 {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Password must be at least 6 characters / La contraseña debe tener al menos 6 caracteres"})
		return
	}

	// Hash the password / Cifrar la contraseña
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
	if err != nil {
		log.Printf("Error hashing password: %v", err)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Internal server error / Error interno del servidor"})
		return
	}
	user.PasswordHash = string(hashedPassword)

	// If ID is not provided, generate a new UUID / Si el ID no es proporcionado, generar un nuevo UUID
	if strings.TrimSpace(user.ID) == "" {
		user.ID = generateUUID()
	}

	// Set default role / Establecer rol por defecto
	if strings.TrimSpace(user.Role) == "" {
		user.Role = "client"
	}

	// Validate role constraint / Validar restricción de rol
	validRoles := map[string]bool{
		"owner":      true,
		"employee":   true,
		"superAdmin": true,
		"client":     true,
	}
	if !validRoles[user.Role] {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid role. Must be 'owner', 'employee', 'superAdmin' or 'client' / Rol inválido"})
		return
	}

	// SQL Insertion query / Consulta SQL de inserción
	query := `
		INSERT INTO users (id, first_name, last_name, email, identify, document_id, phone, role, role_id, photo_url, password_hash)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
		RETURNING created_at, updated_at
	`

	var createdAt, updatedAt time.Time
	err = h.DB.QueryRow(
		query,
		user.ID,
		user.FirstName,
		user.LastName,
		user.Email,
		user.Identify,
		user.DocumentID,
		user.Phone,
		user.Role,
		user.RoleID,
		user.PhotoURL,
		user.PasswordHash,
	).Scan(&createdAt, &updatedAt)

	if err != nil {
		log.Printf("Error inserting user into database: %v", err)
		w.Header().Set("Content-Type", "application/json")

		// Handle unique constraint violations (e.g. duplicate email) / Manejar violaciones de clave única (ej: correo duplicado)
		if strings.Contains(err.Error(), "unique constraint") || strings.Contains(err.Error(), "duplicate key") {
			w.WriteHeader(http.StatusConflict)
			json.NewEncoder(w).Encode(map[string]string{"error": "Email already registered / Correo electrónico ya registrado"})
			return
		}

		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Internal server error / Error interno del servidor"})
		return
	}

	user.CreatedAt = &createdAt
	user.UpdatedAt = &updatedAt

	// Return successful response / Retornar respuesta exitosa
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(user)
}

// LoginUser handles POST /api/login to authenticate users
// LoginUser maneja POST /api/login para autenticar usuarios
func (h *UserHandler) LoginUser(w http.ResponseWriter, r *http.Request) {
	// Only allow POST method / Solo permitir el método POST
	if r.Method != http.MethodPost {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusMethodNotAllowed)
		json.NewEncoder(w).Encode(map[string]string{"error": "Method not allowed / Método no permitido"})
		return
	}

	type LoginRequest struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}

	var req LoginRequest
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid JSON format / Formato de JSON inválido"})
		return
	}

	req.Email = strings.TrimSpace(strings.ToLower(req.Email))
	req.Password = strings.TrimSpace(req.Password)

	if req.Email == "" || req.Password == "" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Email and password are required / El correo y contraseña son requeridos"})
		return
	}

	// Lookup user in PostgreSQL / Buscar usuario en PostgreSQL
	// Supports lookup by email OR document_id (for clients)
	query := `
		SELECT id, first_name, last_name, email, identify, document_id, phone, role, role_id, photo_url, password_hash, created_at, updated_at
		FROM users
		WHERE email = $1 OR document_id = $1
	`

	var user models.User
	var createdAt, updatedAt time.Time

	err = h.DB.QueryRow(query, req.Email).Scan(
		&user.ID,
		&user.FirstName,
		&user.LastName,
		&user.Email,
		&user.Identify,
		&user.DocumentID,
		&user.Phone,
		&user.Role,
		&user.RoleID,
		&user.PhotoURL,
		&user.PasswordHash,
		&createdAt,
		&updatedAt,
	)

	if err == sql.ErrNoRows {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid email or password / Correo o contraseña incorrectos"})
		return
	} else if err != nil {
		log.Printf("Database query error in login: %v", err)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Internal server error / Error interno del servidor"})
		return
	}

	// Compare password hash / Comparar el hash de la contraseña
	err = bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password))
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid email or password / Correo o contraseña incorrectos"})
		return
	}

	user.CreatedAt = &createdAt
	user.UpdatedAt = &updatedAt

	// Return authenticated user / Retornar el usuario autenticado
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(user)
}
