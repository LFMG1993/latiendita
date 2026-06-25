package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"strings"

	"backend/core/middlewares"
	"backend/models"
	"backend/services"
)

// UserHandler handles user-related HTTP requests
type UserHandler struct {
	userService *services.UserService
}

// NewUserHandler creates a new instance of UserHandler
func NewUserHandler(userService *services.UserService) *UserHandler {
	return &UserHandler{userService: userService}
}

// RegisterUser handles POST /api/users to register a new user
func (h *UserHandler) RegisterUser(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		jsonError(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var user models.User
	if err := json.NewDecoder(r.Body).Decode(&user); err != nil {
		jsonError(w, "Invalid JSON format", http.StatusBadRequest)
		return
	}

	if err := h.userService.RegisterUser(&user); err != nil {
		if strings.Contains(err.Error(), "already registered") {
			jsonError(w, err.Error(), http.StatusConflict)
		} else if strings.Contains(err.Error(), "missing required") || strings.Contains(err.Error(), "invalid") || strings.Contains(err.Error(), "least 6 characters") {
			jsonError(w, err.Error(), http.StatusBadRequest)
		} else {
			jsonError(w, "Internal server error", http.StatusInternalServerError)
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(user)
}

// GetOwners handles GET /api/admin/owners to return all registered owners
func (h *UserHandler) GetOwners(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		jsonError(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	owners, err := h.userService.GetOwners()
	if err != nil {
		jsonError(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(owners)
}

// GetMe handles GET /api/me to return the authenticated user's details
func (h *UserHandler) GetMe(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		jsonError(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	userID, ok := r.Context().Value(middlewares.UserIDKey).(string)
	if !ok || userID == "" {
		jsonError(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	user, err := h.userService.GetByID(userID)
	if err != nil {
		jsonError(w, "User not found", http.StatusNotFound)
		return
	}

	user.PasswordHash = ""
	user.Password = ""

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(user)
}

func (h *UserHandler) RegisterSaaS(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		jsonError(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		FirstName string `json:"first_name"`
		LastName  string `json:"last_name"`
		Email     string `json:"email"`
		Password  string `json:"password"`
		Identify  string `json:"identify"`
		Phone     string `json:"phone"`
		ShopName  string `json:"shop_name"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		jsonError(w, "Invalid JSON format", http.StatusBadRequest)
		return
	}

	userID, err := h.userService.RegisterSaaS(req.FirstName, req.LastName, req.Email, req.Password, req.Identify, req.Phone, req.ShopName)
	if err != nil {
		if strings.Contains(err.Error(), "already registered") {
			jsonError(w, err.Error(), http.StatusConflict)
		} else if strings.Contains(err.Error(), "missing required") {
			jsonError(w, err.Error(), http.StatusBadRequest)
		} else {
			log.Printf("Error in RegisterSaaS: %v", err)
			jsonError(w, "Internal server error", http.StatusInternalServerError)
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{"message": "Account created successfully. Pending approval.", "user_id": userID})
}
