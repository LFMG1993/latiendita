package services

import (
	"errors"
	"strings"

	"backend/models"
	"backend/repositories"
)

type PaymentMethodService struct {
	repo *repositories.PaymentMethodRepository
}

func NewPaymentMethodService(repo *repositories.PaymentMethodRepository) *PaymentMethodService {
	return &PaymentMethodService{repo: repo}
}

// ---- PAYMENT METHODS ----

func (s *PaymentMethodService) CreatePaymentMethod(pm *models.PaymentMethod) error {
	pm.Name = strings.TrimSpace(pm.Name)
	if pm.ShopID == "" {
		return errors.New("shop_id is required")
	}
	if pm.Name == "" || pm.Type == "" {
		return errors.New("name and type are required")
	}
	pm.Enabled = true
	return s.repo.CreatePaymentMethod(pm)
}

func (s *PaymentMethodService) GetPaymentMethodsByShop(shopID string) ([]models.PaymentMethod, error) {
	if shopID == "" {
		return nil, errors.New("shop_id is required")
	}
	return s.repo.FindPaymentMethodsByShop(shopID)
}

func (s *PaymentMethodService) UpdatePaymentMethod(pm *models.PaymentMethod) error {
	if pm.ID == "" {
		return errors.New("payment method id is required")
	}
	return s.repo.UpdatePaymentMethod(pm)
}

func (s *PaymentMethodService) DeletePaymentMethod(id string) error {
	if id == "" {
		return errors.New("payment method id is required")
	}
	return s.repo.DeletePaymentMethod(id)
}

// ---- PROMOTIONS ----

func (s *PaymentMethodService) CreatePromotion(promo *models.Promotion) error {
	if promo.ShopID == "" {
		return errors.New("shop_id is required")
	}
	if promo.Name == "" || promo.Price <= 0 {
		return errors.New("name and valid price are required")
	}
	if promo.Type == "" {
		promo.Type = "bundle"
	}
	promo.IsEnabled = true
	return s.repo.CreatePromotion(promo)
}

func (s *PaymentMethodService) GetPromotionsByShop(shopID string) ([]models.Promotion, error) {
	if shopID == "" {
		return nil, errors.New("shop_id is required")
	}
	return s.repo.FindPromotionsByShop(shopID)
}

func (s *PaymentMethodService) UpdatePromotion(promo *models.Promotion) error {
	if promo.ID == "" {
		return errors.New("promotion id is required")
	}
	return s.repo.UpdatePromotion(promo)
}

func (s *PaymentMethodService) DeletePromotion(id string) error {
	if id == "" {
		return errors.New("promotion id is required")
	}
	return s.repo.DeletePromotion(id)
}
