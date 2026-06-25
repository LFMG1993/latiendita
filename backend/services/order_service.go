package services

import (
	"errors"

	"backend/models"
	"backend/repositories"
)

type OrderService struct {
	repo *repositories.OrderRepository
}

func NewOrderService(repo *repositories.OrderRepository) *OrderService {
	return &OrderService{repo: repo}
}

// ---- ORDERS ----

func (s *OrderService) CreateOrder(order *models.Order) error {
	if order.ShopID == "" {
		return errors.New("shop_id is required")
	}
	if order.ClientID == "" || order.ClientName == "" || len(order.Items) == 0 || order.PaymentMethod == "" {
		return errors.New("client_id, client_name, items and payment_method are required")
	}
	if order.Status == "" {
		order.Status = "pending"
	}
	return s.repo.CreateOrder(order)
}

func (s *OrderService) GetOrdersByShop(shopID string, status string) ([]models.Order, error) {
	if shopID == "" {
		return nil, errors.New("shop_id is required")
	}
	return s.repo.FindOrdersByShop(shopID, status)
}

func (s *OrderService) GetClientOrders(clientID string, shopID string) ([]models.Order, error) {
	if clientID == "" {
		return nil, errors.New("client_id is required")
	}
	return s.repo.FindOrdersByClient(clientID, shopID)
}

func (s *OrderService) UpdateOrderStatus(id string, status string) error {
	if id == "" {
		return errors.New("order id is required")
	}
	return s.repo.UpdateOrderStatus(id, status)
}

// ---- DEBT PAYMENT REQUESTS ----

func (s *OrderService) CreateDebtPaymentRequest(req *models.DebtPaymentRequest) error {
	if req.ShopID == "" {
		return errors.New("shop_id is required")
	}
	if req.ClientID == "" || req.Amount <= 0 || req.VoucherNumber == "" || req.PaymentMethodName == "" {
		return errors.New("client_id, amount, voucher_number, payment_method_name are required")
	}
	req.Status = "pending"
	return s.repo.CreateDebtPaymentRequest(req)
}

func (s *OrderService) GetDebtPaymentRequestsByShop(shopID string, status string) ([]models.DebtPaymentRequest, error) {
	if shopID == "" {
		return nil, errors.New("shop_id is required")
	}
	return s.repo.FindDebtPaymentRequestsByShop(shopID, status)
}

func (s *OrderService) GetClientDebtPayments(clientID string) ([]models.DebtPaymentRequest, error) {
	if clientID == "" {
		return nil, errors.New("client_id is required")
	}
	return s.repo.FindDebtPaymentRequestsByClient(clientID)
}

func (s *OrderService) ApproveDebtPaymentRequest(id string) error {
	if id == "" {
		return errors.New("payment request id is required")
	}
	return s.repo.ApproveDebtPaymentRequest(id)
}

func (s *OrderService) RejectDebtPaymentRequest(id string, notes string) error {
	if id == "" {
		return errors.New("payment request id is required")
	}
	return s.repo.RejectDebtPaymentRequest(id, notes)
}

// ---- CLIENT ACCOUNTS ----

func (s *OrderService) GetClientAccount(shopID string, clientID string) (*models.ClientShopAccount, error) {
	if shopID == "" || clientID == "" {
		return nil, errors.New("shop_id and client_id are required")
	}
	return s.repo.FindClientAccount(shopID, clientID)
}

func (s *OrderService) UpdateClientAccount(acc *models.ClientShopAccount) error {
	if acc.ShopID == "" || acc.ClientID == "" {
		return errors.New("shop_id and client_id are required")
	}
	return s.repo.UpdateClientAccount(acc)
}
