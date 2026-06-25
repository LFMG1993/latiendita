package services

import (
	"errors"

	"backend/models"
	"backend/repositories"
)

type SaleService struct {
	repo *repositories.SaleRepository
}

func NewSaleService(repo *repositories.SaleRepository) *SaleService {
	return &SaleService{repo: repo}
}

func (s *SaleService) CreateSale(sale *models.Sale) error {
	if sale.ShopID == "" {
		return errors.New("shop_id is required")
	}
	if sale.EmployeeID == "" || sale.EmployeeName == "" || len(sale.Items) == 0 || len(sale.Payments) == 0 {
		return errors.New("employee_id, employee_name, items and payments are required")
	}
	return s.repo.CreateSale(sale)
}

func (s *SaleService) GetSalesByShop(shopID string, from string, to string) ([]models.Sale, error) {
	if shopID == "" {
		return nil, errors.New("shop_id is required")
	}
	return s.repo.FindSalesByShop(shopID, from, to)
}

func (s *SaleService) GetSaleDetails(id string) (*models.Sale, error) {
	if id == "" {
		return nil, errors.New("sale id is required")
	}
	return s.repo.FindSaleByID(id)
}

func (s *SaleService) GetClientSales(clientID string) ([]models.Sale, error) {
	if clientID == "" {
		return nil, errors.New("client_id is required")
	}
	return s.repo.FindSalesByClient(clientID)
}
