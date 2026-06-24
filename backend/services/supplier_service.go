package services

import (
	"errors"
	"strings"

	"backend/models"
	"backend/repositories"
)

type SupplierService struct {
	repo *repositories.SupplierRepository
}

func NewSupplierService(repo *repositories.SupplierRepository) *SupplierService {
	return &SupplierService{repo: repo}
}

// ---- SUPPLIERS ----

func (s *SupplierService) CreateSupplier(supplier *models.Supplier) error {
	supplier.Name = strings.TrimSpace(supplier.Name)
	if supplier.ShopID == "" {
		return errors.New("shop_id is required")
	}
	if supplier.Name == "" {
		return errors.New("name is required")
	}
	return s.repo.CreateSupplier(supplier)
}

func (s *SupplierService) GetSuppliersByShop(shopID string) ([]models.Supplier, error) {
	if shopID == "" {
		return nil, errors.New("shop_id is required")
	}
	return s.repo.FindSuppliersByShop(shopID)
}

func (s *SupplierService) UpdateSupplier(supplier *models.Supplier) error {
	if supplier.ID == "" {
		return errors.New("supplier id is required")
	}
	return s.repo.UpdateSupplier(supplier)
}

func (s *SupplierService) DeleteSupplier(id string) error {
	if id == "" {
		return errors.New("supplier id is required")
	}
	return s.repo.DeleteSupplier(id)
}

// ---- PURCHASES ----

func (s *SupplierService) CreatePurchase(purchase *models.Purchase) error {
	if purchase.ShopID == "" {
		return errors.New("shop_id is required")
	}
	if purchase.SupplierName == "" || purchase.InternalInvoiceNumber == "" || len(purchase.Items) == 0 {
		return errors.New("supplier_name, internal_invoice_number, and items are required")
	}
	return s.repo.CreatePurchase(purchase)
}

func (s *SupplierService) GetPurchasesByShop(shopID string) ([]models.Purchase, error) {
	if shopID == "" {
		return nil, errors.New("shop_id is required")
	}
	return s.repo.FindPurchasesByShop(shopID)
}
