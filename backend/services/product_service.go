package services

import (
	"errors"
	"strings"

	"backend/models"
	"backend/repositories"
)

type ProductService struct {
	repo *repositories.ProductRepository
}

func NewProductService(repo *repositories.ProductRepository) *ProductService {
	return &ProductService{repo: repo}
}

// PRODUCTOS
func (s *ProductService) CreateProduct(p *models.Product) error {
	p.Name = strings.TrimSpace(p.Name)
	p.Category = strings.TrimSpace(p.Category)

	if p.ShopID == "" {
		return errors.New("shop_id is required")
	}
	if p.Name == "" || p.Category == "" || p.Price <= 0 {
		return errors.New("name, category, and a positive price are required")
	}

	p.IsAvailable = true
	return s.repo.CreateProduct(p)
}

func (s *ProductService) GetProductsByShop(shopID string) ([]models.Product, error) {
	if shopID == "" {
		return nil, errors.New("shop_id is required")
	}
	return s.repo.GetProductsByShop(shopID)
}

func (s *ProductService) UpdateProduct(p *models.Product) error {
	if p.ID == "" {
		return errors.New("product ID is required")
	}
	return s.repo.UpdateProduct(p)
}

func (s *ProductService) DeleteProduct(id string) error {
	if id == "" {
		return errors.New("product ID is required")
	}
	return s.repo.DeleteProduct(id)
}

// INGREDIENTES
func (s *ProductService) CreateIngredient(ing *models.Ingredient) error {
	if ing.ShopID == "" {
		return errors.New("shop_id is required")
	}
	if ing.Name == "" || ing.Category == "" || ing.PurchaseUnit == "" || ing.ConsumptionUnit == "" {
		return errors.New("name, category, purchase_unit, and consumption_unit are required")
	}
	return s.repo.CreateIngredient(ing)
}

func (s *ProductService) GetIngredientsByShop(shopID string) ([]models.Ingredient, error) {
	if shopID == "" {
		return nil, errors.New("shop_id is required")
	}
	return s.repo.GetIngredientsByShop(shopID)
}

func (s *ProductService) UpdateIngredient(ing *models.Ingredient) error {
	if ing.ID == "" {
		return errors.New("ingredient ID is required")
	}
	return s.repo.UpdateIngredient(ing)
}

func (s *ProductService) DeleteIngredient(id string) error {
	if id == "" {
		return errors.New("ingredient ID is required")
	}
	return s.repo.DeleteIngredient(id)
}
