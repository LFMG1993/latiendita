package services

import (
	"errors"

	"backend/models"
	"backend/repositories"
)

type CashSessionService struct {
	repo *repositories.CashSessionRepository
}

func NewCashSessionService(repo *repositories.CashSessionRepository) *CashSessionService {
	return &CashSessionService{repo: repo}
}

// ---- CASH SESSIONS ----

func (s *CashSessionService) OpenCashSession(cs *models.CashSession) error {
	if cs.ShopID == "" {
		return errors.New("shop_id is required")
	}
	if cs.EmployeeID == "" || cs.EmployeeName == "" {
		return errors.New("employee_id and employee_name are required")
	}

	cs.Status = "open"
	return s.repo.CreateCashSession(cs)
}

func (s *CashSessionService) CloseCashSession(id string, cs *models.CashSession) error {
	if id == "" {
		return errors.New("session id is required")
	}
	return s.repo.UpdateCashSessionStatus(id, cs)
}

func (s *CashSessionService) GetCashSessionsByShop(shopID string, statusFilter string) ([]models.CashSession, error) {
	if shopID == "" {
		return nil, errors.New("shop_id is required")
	}
	return s.repo.FindByShop(shopID, statusFilter)
}

func (s *CashSessionService) GetOpenSessionByShop(shopID string) (*models.CashSession, error) {
	if shopID == "" {
		return nil, errors.New("shop_id is required")
	}
	return s.repo.FindOpenSessionByShop(shopID)
}

// ---- EXPENSES ----

func (s *CashSessionService) CreateExpense(e *models.Expense) error {
	if e.ShopID == "" {
		return errors.New("shop_id is required")
	}
	if e.Description == "" || e.Amount <= 0 || e.Category == "" || e.RecordedByEmployeeID == "" {
		return errors.New("description, valid amount, category, and recorded_by_employee_id are required")
	}
	return s.repo.CreateExpense(e)
}

func (s *CashSessionService) GetExpensesByShop(shopID string) ([]models.Expense, error) {
	if shopID == "" {
		return nil, errors.New("shop_id is required")
	}
	return s.repo.FindExpensesByShop(shopID)
}
