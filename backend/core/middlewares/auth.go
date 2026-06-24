package middlewares

import (
	"context"
	"net/http"

	"backend/services"
	"github.com/golang-jwt/jwt/v5"
)

type contextKey string
const UserIDKey contextKey = "user_id"

func AuthMiddleware(authService *services.AuthService) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			cookie, err := r.Cookie("session_token")
			if err != nil || cookie.Value == "" {
				http.Error(w, "Unauthorized: Missing session cookie", http.StatusUnauthorized)
				return
			}

			tokenString := cookie.Value
			token, err := authService.ValidateToken(tokenString)
			if err != nil {
				http.Error(w, "Unauthorized: "+err.Error(), http.StatusUnauthorized)
				return
			}

			if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
				ctx := context.WithValue(r.Context(), UserIDKey, claims["user_id"])
				next.ServeHTTP(w, r.WithContext(ctx))
			} else {
				http.Error(w, "Unauthorized: Invalid claims", http.StatusUnauthorized)
				return
			}
		})
	}
}
