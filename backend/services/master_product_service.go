package services

import (
	"errors"

	"backend/models"
	"backend/repositories"
)

type MasterProductService struct {
	repo *repositories.MasterProductRepository
}

func NewMasterProductService(repo *repositories.MasterProductRepository) *MasterProductService {
	return &MasterProductService{repo: repo}
}

func (s *MasterProductService) GetAllMasterProducts(q string, category string) ([]models.MasterProduct, error) {
	return s.repo.FindAll(q, category)
}

func (s *MasterProductService) CreateMasterProduct(p *models.MasterProduct) error {
	if p.Name == "" || p.Category == "" {
		return errors.New("name and category are required")
	}
	return s.repo.Create(p)
}

func (s *MasterProductService) UpdateMasterProduct(id string, p *models.MasterProduct) error {
	if id == "" {
		return errors.New("product id is required")
	}
	return s.repo.Update(id, p)
}

func (s *MasterProductService) DeleteMasterProduct(id string) error {
	if id == "" {
		return errors.New("product id is required")
	}
	return s.repo.Delete(id)
}

func (s *MasterProductService) SearchMasterProducts(q string) ([]models.MasterProduct, error) {
	return s.repo.Search(q)
}

func (s *MasterProductService) GetProductRequests(status string) ([]models.MasterProductRequest, error) {
	return s.repo.GetRequests(status)
}

func (s *MasterProductService) CreateProductRequest(req *models.MasterProductRequest) error {
	if req.ShopID == "" {
		return errors.New("shop_id is required")
	}
	if req.RequestedName == "" {
		return errors.New("requested_name is required")
	}
	return s.repo.CreateRequest(req)
}

func (s *MasterProductService) ApproveProductRequest(id string, adjustments *models.MasterProductRequest) (string, error) {
	if id == "" {
		return "", errors.New("request id is required")
	}
	return s.repo.ApproveRequest(id, adjustments)
}

func (s *MasterProductService) RejectProductRequest(id string, adminNotes *string) error {
	if id == "" {
		return errors.New("request id is required")
	}
	return s.repo.RejectRequest(id, adminNotes)
}

func (s *MasterProductService) GetShopProductRequests(shopID string) ([]models.MasterProductRequest, error) {
	if shopID == "" {
		return nil, errors.New("shop_id is required")
	}
	return s.repo.GetRequestsByShop(shopID)
}

func (s *MasterProductService) GetMasterProductShops(masterProductID string, clientID string) ([]repositories.ShopProductStatus, error) {
	if masterProductID == "" || clientID == "" {
		return nil, errors.New("master_product_id and client_id are required")
	}
	return s.repo.GetMasterProductShops(masterProductID, clientID)
}

func (s *MasterProductService) EnrollClientToShop(shopID string, clientID string) error {
	if shopID == "" || clientID == "" {
		return errors.New("shop_id and client_id are required")
	}
	return s.repo.EnrollClientToShop(shopID, clientID)
}
