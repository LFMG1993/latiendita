package repositories

import (
	"database/sql"
	"time"

	"backend/models"
)

type CashSessionRepository struct {
	DB *sql.DB
}

func NewCashSessionRepository(db *sql.DB) *CashSessionRepository {
	return &CashSessionRepository{DB: db}
}

// ---- CASH SESSIONS ----

func (r *CashSessionRepository) CreateCashSession(cs *models.CashSession) error {
	query := `
		INSERT INTO cash_sessions (shop_id, employee_id, employee_name, opening_balance, status)
		VALUES ($1, $2, $3, $4, 'open') RETURNING id, start_time
	`
	return r.DB.QueryRow(query, cs.ShopID, cs.EmployeeID, cs.EmployeeName, cs.OpeningBalance).
		Scan(&cs.ID, &cs.StartTime)
}

func (r *CashSessionRepository) UpdateCashSessionStatus(id string, cs *models.CashSession) error {
	query := `
		UPDATE cash_sessions SET
			status = 'closed',
			end_time = $1,
			closing_balance = $2,
			cash_sales = $3,
			transfer_sales = $4,
			total_sales = $5,
			total_expenses = $6,
			unregistered_sales = $7,
			expected_cash_in_box = $8,
			difference = $9,
			notes = $10
		WHERE id = $11 AND status = 'open'
	`
	now := time.Now()
	res, err := r.DB.Exec(query,
		now, cs.ClosingBalance, cs.CashSales, cs.TransferSales, cs.TotalSales,
		cs.TotalExpenses, cs.UnregisteredSales, cs.ExpectedCashInBox, cs.Difference, cs.Notes, id,
	)
	if err != nil {
		return err
	}
	
	rowsAffected, err := res.RowsAffected()
	if err != nil {
		return err
	}
	if rowsAffected == 0 {
		return sql.ErrNoRows
	}

	cs.ID = id
	cs.Status = "closed"
	cs.EndTime = &now
	return nil
}

func (r *CashSessionRepository) FindByShop(shopID string, statusFilter string) ([]models.CashSession, error) {
	query := `SELECT id, shop_id, employee_id, employee_name, start_time, end_time, status,
		opening_balance, closing_balance, cash_sales, transfer_sales, total_sales,
		total_expenses, unregistered_sales, expected_cash_in_box, difference, notes
		FROM cash_sessions WHERE shop_id = $1`
	
	args := []interface{}{shopID}
	if statusFilter != "" {
		query += " AND status = $2"
		args = append(args, statusFilter)
	}
	query += " ORDER BY start_time DESC"

	rows, err := r.DB.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var sessions []models.CashSession
	for rows.Next() {
		var cs models.CashSession
		if err := rows.Scan(
			&cs.ID, &cs.ShopID, &cs.EmployeeID, &cs.EmployeeName,
			&cs.StartTime, &cs.EndTime, &cs.Status,
			&cs.OpeningBalance, &cs.ClosingBalance,
			&cs.CashSales, &cs.TransferSales, &cs.TotalSales,
			&cs.TotalExpenses, &cs.UnregisteredSales, &cs.ExpectedCashInBox, &cs.Difference, &cs.Notes,
		); err != nil {
			continue
		}
		sessions = append(sessions, cs)
	}
	return sessions, nil
}

func (r *CashSessionRepository) FindOpenSessionByShop(shopID string) (*models.CashSession, error) {
	query := `
		SELECT id, shop_id, employee_id, employee_name, start_time, status, opening_balance
		FROM cash_sessions WHERE shop_id = $1 AND status = 'open' LIMIT 1
	`
	var cs models.CashSession
	err := r.DB.QueryRow(query, shopID).Scan(
		&cs.ID, &cs.ShopID, &cs.EmployeeID, &cs.EmployeeName, &cs.StartTime, &cs.Status, &cs.OpeningBalance,
	)
	if err != nil {
		return nil, err
	}
	return &cs, nil
}

// ---- EXPENSES ----

func (r *CashSessionRepository) CreateExpense(e *models.Expense) error {
	query := `
		INSERT INTO expenses (shop_id, description, amount, category, recorded_by_employee_id, session_id, owner_id)
		VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, created_at
	`
	return r.DB.QueryRow(query, e.ShopID, e.Description, e.Amount, e.Category, e.RecordedByEmployeeID, e.SessionID, e.OwnerID).
		Scan(&e.ID, &e.CreatedAt)
}

func (r *CashSessionRepository) FindExpensesByShop(shopID string) ([]models.Expense, error) {
	query := `
		SELECT id, shop_id, description, amount, category, recorded_by_employee_id, session_id, owner_id, created_at
		FROM expenses WHERE shop_id = $1 ORDER BY created_at DESC
	`
	rows, err := r.DB.Query(query, shopID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var expenses []models.Expense
	for rows.Next() {
		var e models.Expense
		if err := rows.Scan(&e.ID, &e.ShopID, &e.Description, &e.Amount, &e.Category, &e.RecordedByEmployeeID, &e.SessionID, &e.OwnerID, &e.CreatedAt); err != nil {
			continue
		}
		expenses = append(expenses, e)
	}
	return expenses, nil
}
