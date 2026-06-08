package handlers

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"strings"
	"time"

	"backend/models"
)

// CashSessionHandler handles cash register sessions and expenses
type CashSessionHandler struct {
	DB *sql.DB
}

func NewCashSessionHandler(db *sql.DB) *CashSessionHandler {
	return &CashSessionHandler{DB: db}
}

// OpenCashSession handles POST /api/shops/{shop_id}/cash-sessions
func (h *CashSessionHandler) OpenCashSession(w http.ResponseWriter, r *http.Request) {
	shopID := extractShopID(r.URL.Path, "/cash-sessions")
	if shopID == "" {
		jsonError(w, "shop_id required", http.StatusBadRequest)
		return
	}

	var cs models.CashSession
	if err := json.NewDecoder(r.Body).Decode(&cs); err != nil {
		jsonError(w, "Invalid JSON", http.StatusBadRequest)
		return
	}
	cs.ShopID = shopID
	cs.Status = "open"

	if cs.EmployeeID == "" || cs.EmployeeName == "" {
		jsonError(w, "Fields 'employee_id' and 'employee_name' are required", http.StatusBadRequest)
		return
	}

	var startTime time.Time
	err := h.DB.QueryRow(`
		INSERT INTO cash_sessions (shop_id, employee_id, employee_name, opening_balance, status)
		VALUES ($1, $2, $3, $4, 'open') RETURNING id, start_time
	`, cs.ShopID, cs.EmployeeID, cs.EmployeeName, cs.OpeningBalance).
		Scan(&cs.ID, &startTime)
	if err != nil {
		log.Printf("Error opening cash session: %v", err)
		jsonError(w, "Error opening cash session", http.StatusInternalServerError)
		return
	}
	cs.StartTime = &startTime

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(cs)
}

// CloseCashSession handles PUT /api/cash-sessions/{id}/close
func (h *CashSessionHandler) CloseCashSession(w http.ResponseWriter, r *http.Request) {
	// Path: /api/cash-sessions/{id}/close
	path := strings.TrimPrefix(r.URL.Path, "/api/cash-sessions/")
	id := strings.TrimSuffix(path, "/close")

	var cs models.CashSession
	if err := json.NewDecoder(r.Body).Decode(&cs); err != nil {
		jsonError(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	now := time.Now()
	_, err := h.DB.Exec(`
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
	`, now, cs.ClosingBalance, cs.CashSales, cs.TransferSales, cs.TotalSales,
		cs.TotalExpenses, cs.UnregisteredSales, cs.ExpectedCashInBox, cs.Difference, cs.Notes, id)
	if err != nil {
		log.Printf("Error closing cash session: %v", err)
		jsonError(w, "Error closing cash session", http.StatusInternalServerError)
		return
	}

	cs.ID = id
	cs.Status = "closed"
	cs.EndTime = &now
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(cs)
}

// GetCashSessions handles GET /api/shops/{shop_id}/cash-sessions
func (h *CashSessionHandler) GetCashSessions(w http.ResponseWriter, r *http.Request) {
	shopID := extractShopID(r.URL.Path, "/cash-sessions")
	if shopID == "" {
		jsonError(w, "shop_id required", http.StatusBadRequest)
		return
	}

	statusFilter := r.URL.Query().Get("status") // optional: open or closed

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

	rows, err := h.DB.Query(query, args...)
	if err != nil {
		jsonError(w, "Internal server error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	sessions := []models.CashSession{}
	for rows.Next() {
		var cs models.CashSession
		var startTime time.Time
		if err := rows.Scan(
			&cs.ID, &cs.ShopID, &cs.EmployeeID, &cs.EmployeeName,
			&startTime, &cs.EndTime, &cs.Status,
			&cs.OpeningBalance, &cs.ClosingBalance,
			&cs.CashSales, &cs.TransferSales, &cs.TotalSales,
			&cs.TotalExpenses, &cs.UnregisteredSales, &cs.ExpectedCashInBox, &cs.Difference, &cs.Notes,
		); err != nil {
			continue
		}
		cs.StartTime = &startTime
		sessions = append(sessions, cs)
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(sessions)
}

// GetOpenSession handles GET /api/shops/{shop_id}/cash-sessions/open
func (h *CashSessionHandler) GetOpenSession(w http.ResponseWriter, r *http.Request) {
	shopID := extractShopID(r.URL.Path, "/cash-sessions/open")
	if shopID == "" {
		jsonError(w, "shop_id required", http.StatusBadRequest)
		return
	}

	var cs models.CashSession
	var startTime time.Time
	err := h.DB.QueryRow(`
		SELECT id, shop_id, employee_id, employee_name, start_time, status, opening_balance
		FROM cash_sessions WHERE shop_id = $1 AND status = 'open' LIMIT 1
	`, shopID).Scan(&cs.ID, &cs.ShopID, &cs.EmployeeID, &cs.EmployeeName, &startTime, &cs.Status, &cs.OpeningBalance)
	if err == sql.ErrNoRows {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(nil)
		return
	} else if err != nil {
		jsonError(w, "Internal server error", http.StatusInternalServerError)
		return
	}
	cs.StartTime = &startTime
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(cs)
}

// ---- EXPENSES ----

// CreateExpense handles POST /api/shops/{shop_id}/expenses
func (h *CashSessionHandler) CreateExpense(w http.ResponseWriter, r *http.Request) {
	shopID := extractShopID(r.URL.Path, "/expenses")
	if shopID == "" {
		jsonError(w, "shop_id required", http.StatusBadRequest)
		return
	}

	var e models.Expense
	if err := json.NewDecoder(r.Body).Decode(&e); err != nil {
		jsonError(w, "Invalid JSON", http.StatusBadRequest)
		return
	}
	e.ShopID = shopID

	if e.Description == "" || e.Amount <= 0 || e.Category == "" || e.RecordedByEmployeeID == "" {
		jsonError(w, "Fields 'description', 'amount', 'category', 'recorded_by_employee_id' are required", http.StatusBadRequest)
		return
	}

	var createdAt time.Time
	err := h.DB.QueryRow(`
		INSERT INTO expenses (shop_id, description, amount, category, recorded_by_employee_id, session_id, owner_id)
		VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, created_at
	`, e.ShopID, e.Description, e.Amount, e.Category, e.RecordedByEmployeeID, e.SessionID, e.OwnerID).
		Scan(&e.ID, &createdAt)
	if err != nil {
		log.Printf("Error creating expense: %v", err)
		jsonError(w, "Error creating expense", http.StatusInternalServerError)
		return
	}
	e.CreatedAt = &createdAt

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(e)
}

// GetExpenses handles GET /api/shops/{shop_id}/expenses
func (h *CashSessionHandler) GetExpenses(w http.ResponseWriter, r *http.Request) {
	shopID := extractShopID(r.URL.Path, "/expenses")
	if shopID == "" {
		jsonError(w, "shop_id required", http.StatusBadRequest)
		return
	}

	rows, err := h.DB.Query(`
		SELECT id, shop_id, description, amount, category, recorded_by_employee_id, session_id, owner_id, created_at
		FROM expenses WHERE shop_id = $1 ORDER BY created_at DESC
	`, shopID)
	if err != nil {
		jsonError(w, "Internal server error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	expenses := []models.Expense{}
	for rows.Next() {
		var e models.Expense
		var createdAt time.Time
		if err := rows.Scan(&e.ID, &e.ShopID, &e.Description, &e.Amount, &e.Category, &e.RecordedByEmployeeID, &e.SessionID, &e.OwnerID, &createdAt); err != nil {
			continue
		}
		e.CreatedAt = &createdAt
		expenses = append(expenses, e)
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(expenses)
}
