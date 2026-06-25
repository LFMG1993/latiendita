package services

import (
	"encoding/json"
	"errors"
	"strings"

	"backend/models"
	"backend/repositories"
)

type ShopService struct {
	repo *repositories.ShopRepository
}

func NewShopService(repo *repositories.ShopRepository) *ShopService {
	return &ShopService{repo: repo}
}

func defaultOwnerPermissions() map[string]bool {
	return map[string]bool{
		"shop_details_manage": true,
		"pos_access":          true,
		"ingredients_view":    true,
		"products_view":       true,
		"purchases_view":      true,
		"team_view":           true,
		"promotions_view":     true,
		"suppliers_view":      true,
		"reports_view_sales":  true,
		"cash_session_access": true,
		"expenses_view":       true,
	}
}

func (s *ShopService) CreateShop(shop *models.Shop) error {
	shop.Name = strings.TrimSpace(shop.Name)
	shop.OwnerID = strings.TrimSpace(shop.OwnerID)

	if shop.Name == "" || shop.OwnerID == "" {
		return errors.New("name and owner_id are required")
	}

	if shop.Status == "" {
		shop.Status = "active" // Default for manual creation by admin
	}

	// Set defaults
	if shop.Timezone == "" {
		shop.Timezone = "America/Bogota"
	}
	if shop.ThemePrimaryColor == "" {
		shop.ThemePrimaryColor = "#0d6efd"
	}
	if shop.ThemeSecondaryColor == "" {
		shop.ThemeSecondaryColor = "#6c757d"
	}
	if shop.TerminologyShopLabel == "" {
		shop.TerminologyShopLabel = "Tienda"
	}
	if shop.TerminologyProductLabel == "" {
		shop.TerminologyProductLabel = "Producto"
	}

	if shop.Modules == nil {
		shop.Modules = json.RawMessage(`{}`)
	}
	if shop.Features == nil {
		shop.Features = json.RawMessage(`{}`)
	}

	permissionsJSON, _ := json.Marshal(defaultOwnerPermissions())

	return s.repo.CreateShopWithOwner(shop, permissionsJSON)
}

func (s *ShopService) GetShopsByOwner(ownerID string) ([]models.Shop, error) {
	if ownerID == "" {
		return nil, errors.New("owner_id is required")
	}
	return s.repo.FindByOwner(ownerID)
}

func (s *ShopService) GetAllShops() ([]models.Shop, error) {
	return s.repo.FindAll()
}

func (s *ShopService) GetShopByID(id string) (*models.Shop, error) {
	if id == "" {
		return nil, errors.New("shop ID is required")
	}
	return s.repo.FindByID(id)
}

func (s *ShopService) UpdateShop(shop *models.Shop) error {
	if shop.ID == "" {
		return errors.New("shop ID is required")
	}
	return s.repo.Update(shop)
}

func (s *ShopService) GetShopMembers(shopID string) ([]repositories.MemberWithUser, error) {
	if shopID == "" {
		return nil, errors.New("shop ID is required")
	}
	return s.repo.GetMembers(shopID)
}

func (s *ShopService) ApproveShop(shopID string) error {
	if shopID == "" {
		return errors.New("shop ID is required")
	}
	return s.repo.Approve(shopID)
}

func (s *ShopService) GetShopsByClient(clientID string) ([]models.Shop, error) {
	if clientID == "" {
		return nil, errors.New("client_id is required")
	}
	return s.repo.FindShopsByClient(clientID)
}

func (s *ShopService) GetClientsByShop(shopID string) ([]map[string]interface{}, error) {
	if shopID == "" {
		return nil, errors.New("shop_id is required")
	}
	return s.repo.FindClientsByShop(shopID)
}
