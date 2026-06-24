package services

import (
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"strings"
	"time"

	"backend/core/config"
	"backend/models"
	"backend/repositories"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

type AuthService struct {
	userRepo    *repositories.UserRepository
	sessionRepo *repositories.SessionRepository
	config      config.Config
}

func NewAuthService(u *repositories.UserRepository, s *repositories.SessionRepository, cfg config.Config) *AuthService {
	return &AuthService{userRepo: u, sessionRepo: s, config: cfg}
}

func hashToken(token string) string {
	hash := sha256.Sum256([]byte(token))
	return hex.EncodeToString(hash[:])
}

func (s *AuthService) Login(email, password, ipAddress, userAgent, fingerprint string) (string, *models.User, error) {
	email = strings.TrimSpace(strings.ToLower(email))

	attempt := &models.LoginAttempt{
		ID:          GenerateUUID(),
		Email:       email,
		IPAddress:   ipAddress,
		Fingerprint: fingerprint,
		Success:     false,
	}

	user, err := s.userRepo.FindByEmailOrDocument(email)
	if err != nil {
		s.sessionRepo.LogAttempt(attempt)
		return "", nil, errors.New("invalid credentials")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password)); err != nil {
		s.sessionRepo.LogAttempt(attempt)
		return "", nil, errors.New("invalid credentials")
	}

	attempt.Success = true
	s.sessionRepo.LogAttempt(attempt)

	// Create JWT
	expirationTime := time.Now().Add(24 * time.Hour)
	claims := jwt.MapClaims{
		"user_id": user.ID,
		"exp":     expirationTime.Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(s.config.JWTSecret))
	if err != nil {
		return "", nil, err
	}

	// Create Session in DB
	session := &models.Session{
		ID:          GenerateUUID(),
		UserID:      user.ID,
		TokenHash:   hashToken(tokenString),
		Fingerprint: fingerprint,
		IPAddress:   ipAddress,
		UserAgent:   userAgent,
		IsActive:    true,
		ExpiresAt:   expirationTime,
	}
	if err := s.sessionRepo.CreateSession(session); err != nil {
		return "", nil, err
	}

	user.PasswordHash = ""
	user.Password = ""
	return tokenString, user, nil
}

func (s *AuthService) Logout(token string) error {
	return s.sessionRepo.InvalidateSession(hashToken(token))
}

func (s *AuthService) ValidateToken(tokenString string) (*jwt.Token, error) {
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return []byte(s.config.JWTSecret), nil
	})

	if err != nil || !token.Valid {
		return nil, errors.New("invalid token")
	}

	isActive, err := s.sessionRepo.IsSessionActive(hashToken(tokenString))
	if err != nil || !isActive {
		return nil, errors.New("session expired or revoked")
	}

	return token, nil
}
