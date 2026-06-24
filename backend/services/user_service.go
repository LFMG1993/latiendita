package services

import (
	"crypto/rand"
	"errors"
	"fmt"
	"log"
	"strings"

	"backend/models"
	"backend/repositories"

	"golang.org/x/crypto/bcrypt"
)

type UserService struct {
	repo *repositories.UserRepository
}

func NewUserService(repo *repositories.UserRepository) *UserService {
	return &UserService{repo: repo}
}

// GenerateUUID generates a standard RFC4122 UUIDv4
func GenerateUUID() string {
	b := make([]byte, 16)
	_, err := rand.Read(b)
	if err != nil {
		log.Printf("Error generating UUID: %v", err)
		return ""
	}
	b[6] = (b[6] & 0x0f) | 0x40
	b[8] = (b[8] & 0x3f) | 0x80
	return fmt.Sprintf("%x-%x-%x-%x-%x", b[0:4], b[4:6], b[6:8], b[8:10], b[10:])
}

func (s *UserService) RegisterUser(user *models.User) error {
	// Clean inputs
	user.Email = strings.TrimSpace(strings.ToLower(user.Email))
	user.FirstName = strings.TrimSpace(user.FirstName)
	user.LastName = strings.TrimSpace(user.LastName)
	user.Password = strings.TrimSpace(user.Password)

	if user.Email == "" || user.FirstName == "" || user.LastName == "" {
		return errors.New("missing required fields")
	}

	if user.Password == "" || len(user.Password) < 6 {
		return errors.New("password must be at least 6 characters")
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
	if err != nil {
		return errors.New("error processing password")
	}
	user.PasswordHash = string(hashedPassword)

	if strings.TrimSpace(user.ID) == "" {
		user.ID = GenerateUUID()
	}

	err = s.repo.Create(user)
	if err != nil {
		if strings.Contains(err.Error(), "unique constraint") || strings.Contains(err.Error(), "duplicate key") {
			return errors.New("email already registered")
		}
		return err
	}

	// Don't leak sensitive data
	user.PasswordHash = ""
	user.Password = ""
	return nil
}

func (s *UserService) Authenticate(emailOrDocument, password string) (*models.User, error) {
	emailOrDocument = strings.TrimSpace(strings.ToLower(emailOrDocument))
	password = strings.TrimSpace(password)

	if emailOrDocument == "" || password == "" {
		return nil, errors.New("credentials required")
	}

	user, err := s.repo.FindByEmailOrDocument(emailOrDocument)
	if err != nil {
		return nil, errors.New("invalid credentials")
	}

	err = bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password))
	if err != nil {
		return nil, errors.New("invalid credentials")
	}

	user.PasswordHash = ""
	user.Password = ""
	return user, nil
}

func (s *UserService) GetOwners() ([]models.User, error) {
	return s.repo.FindOwners()
}

func (s *UserService) GetByID(id string) (*models.User, error) {
	return s.repo.FindByID(id)
}

func (s *UserService) RegisterSaaS(firstName, lastName, email, password, identify, phone, shopName string) (string, error) {
	email = strings.TrimSpace(strings.ToLower(email))
	if email == "" || password == "" || shopName == "" {
		return "", errors.New("missing required fields")
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return "", err
	}

	user := &models.User{
		ID:           GenerateUUID(),
		FirstName:    firstName,
		LastName:     lastName,
		Email:        email,
		Identify:     &identify,
		Phone:        &phone,
		PasswordHash: string(hashedPassword),
	}

	_, err = s.repo.CreateSaaSAccount(user, shopName)
	if err != nil {
		return "", err
	}

	return user.ID, nil
}
