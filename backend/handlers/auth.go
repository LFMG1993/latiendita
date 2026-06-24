package handlers

import (
	"backend/services"
	"encoding/json"
	"net/http"
)

type AuthHandler struct {
	authService *services.AuthService
}

func NewAuthHandler(authService *services.AuthService) *AuthHandler {
	return &AuthHandler{authService: authService}
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var input struct {
		Email       string `json:"email"`
		Password    string `json:"password"`
		Fingerprint string `json:"fingerprint"`
	}

	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	ipAddress := r.Header.Get("X-Forwarded-For")
	if ipAddress == "" {
		ipAddress = r.RemoteAddr
	}
	userAgent := r.UserAgent()

	token, user, err := h.authService.Login(input.Email, input.Password, ipAddress, userAgent, input.Fingerprint)
	if err != nil {
		http.Error(w, err.Error(), http.StatusUnauthorized)
		return
	}

	w.Header().Set("Content-Type", "application/json")

	http.SetCookie(w, &http.Cookie{
		Name:     "session_token",
		Value:    token,
		MaxAge:   86400, // 24 hours
		HttpOnly: true,
		Secure:   false, // Change to true in production with HTTPS
		SameSite: http.SameSiteLaxMode,
		Path:     "/",
	})

	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "Login successful",
		"user":    user,
	})
}

func (h *AuthHandler) Logout(w http.ResponseWriter, r *http.Request) {
	cookie, err := r.Cookie("session_token")
	if err == nil && cookie.Value != "" {
		h.authService.Logout(cookie.Value)
	}

	http.SetCookie(w, &http.Cookie{
		Name:     "session_token",
		Value:    "",
		MaxAge:   -1,
		HttpOnly: true,
		Secure:   false,
		SameSite: http.SameSiteLaxMode,
		Path:     "/",
	})

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Logged out successfully"})
}
