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

// OrderHandler handles client orders and debt payments
type OrderHandler struct {
	DB *sql.DB
}

func NewOrderHandler(db *sql.DB) *OrderHandler {
	return &OrderHandler{DB: db}
}

// CreateOrder handles POST /api/shops/{shop_id}/orders
func (h *OrderHandler) CreateOrder(w http.ResponseWriter, r *http.Request) {
	shopID := extractShopID(r.URL.Path, "/orders")
	if shopID == "" {
		jsonError(w, "shop_id required", http.StatusBadRequest)
		return
	}

	var order models.Order
	if err := json.NewDecoder(r.Body).Decode(&order); err != nil {
		jsonError(w, "Invalid JSON", http.StatusBadRequest)
		return
	}
	order.ShopID = shopID

	if order.ClientID == "" || order.ClientName == "" || len(order.Items) == 0 || order.PaymentMethod == "" {
		jsonError(w, "Fields 'client_id', 'client_name', 'items' and 'payment_method' are required", http.StatusBadRequest)
		return
	}
	if order.Status == "" {
		order.Status = "pending"
	}

	tx, err := h.DB.Begin()
	if err != nil {
		jsonError(w, "Internal server error", http.StatusInternalServerError)
		return
	}
	defer tx.Rollback()

	var createdAt, updatedAt time.Time
	err = tx.QueryRow(`
		INSERT INTO orders (shop_id, client_id, client_name, client_phone, total_amount, total_items, status, payment_method, used_credits, pending_debt, note)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id, created_at, updated_at
	`, order.ShopID, order.ClientID, order.ClientName, order.ClientPhone,
		order.TotalAmount, order.TotalItems, order.Status, order.PaymentMethod,
		order.UsedCredits, order.PendingDebt, order.Note).Scan(&order.ID, &createdAt, &updatedAt)
	if err != nil {
		log.Printf("Error creating order: %v", err)
		jsonError(w, "Error creating order", http.StatusInternalServerError)
		return
	}
	order.CreatedAt = &createdAt
	order.UpdatedAt = &updatedAt

	for i, item := range order.Items {
		var itemID string
		if err := tx.QueryRow(`
			INSERT INTO order_items (order_id, product_id, product_name, quantity, price_at_purchase)
			VALUES ($1, $2, $3, $4, $5) RETURNING id
		`, order.ID, item.ProductID, item.ProductName, item.Quantity, item.PriceAtPurchase).Scan(&itemID); err != nil {
			log.Printf("Error inserting order item: %v", err)
			jsonError(w, "Error creating order items", http.StatusInternalServerError)
			return
		}
		order.Items[i].ID = itemID
		order.Items[i].OrderID = order.ID
	}

	// Handle credit usage and debt
	if order.UsedCredits > 0 {
		tx.Exec(`
			UPDATE client_shop_accounts SET credits = GREATEST(0, credits - $1), updated_at = NOW()
			WHERE shop_id = $2 AND client_id = $3
		`, order.UsedCredits, shopID, order.ClientID)
	}
	if order.PendingDebt > 0 {
		tx.Exec(`
			INSERT INTO client_shop_accounts (shop_id, client_id, debt)
			VALUES ($1, $2, $3)
			ON CONFLICT (shop_id, client_id) DO UPDATE SET debt = client_shop_accounts.debt + $3, updated_at = NOW()
		`, shopID, order.ClientID, order.PendingDebt)
	}

	if err := tx.Commit(); err != nil {
		jsonError(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(order)
}

// GetOrders handles GET /api/shops/{shop_id}/orders
func (h *OrderHandler) GetOrders(w http.ResponseWriter, r *http.Request) {
	shopID := extractShopID(r.URL.Path, "/orders")
	if shopID == "" {
		jsonError(w, "shop_id required", http.StatusBadRequest)
		return
	}

	status := r.URL.Query().Get("status")
	query := `
		SELECT id, shop_id, client_id, client_name, client_phone, total_amount, total_items,
		       status, payment_method, used_credits, pending_debt, note, created_at, updated_at
		FROM orders WHERE shop_id = $1
	`
	args := []interface{}{shopID}
	if status != "" {
		query += " AND status = $2"
		args = append(args, status)
	}
	query += " ORDER BY created_at DESC"

	rows, err := h.DB.Query(query, args...)
	if err != nil {
		jsonError(w, "Internal server error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	orders := []models.Order{}
	for rows.Next() {
		var o models.Order
		var createdAt, updatedAt time.Time
		if err := rows.Scan(
			&o.ID, &o.ShopID, &o.ClientID, &o.ClientName, &o.ClientPhone,
			&o.TotalAmount, &o.TotalItems, &o.Status, &o.PaymentMethod,
			&o.UsedCredits, &o.PendingDebt, &o.Note, &createdAt, &updatedAt,
		); err != nil {
			continue
		}
		o.CreatedAt = &createdAt
		o.UpdatedAt = &updatedAt
		orders = append(orders, o)
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(orders)
}

// GetClientOrders handles GET /api/clients/{client_id}/orders?shop_id=xxx
func (h *OrderHandler) GetClientOrders(w http.ResponseWriter, r *http.Request) {
	clientID := strings.TrimPrefix(r.URL.Path, "/api/clients/")
	clientID = strings.TrimSuffix(clientID, "/orders")
	shopID := r.URL.Query().Get("shop_id")

	query := `
		SELECT id, shop_id, client_id, client_name, client_phone, total_amount, total_items,
		       status, payment_method, used_credits, pending_debt, note, created_at, updated_at
		FROM orders WHERE client_id = $1
	`
	args := []interface{}{clientID}
	if shopID != "" {
		query += " AND shop_id = $2"
		args = append(args, shopID)
	}
	query += " ORDER BY created_at DESC LIMIT 100"

	rows, err := h.DB.Query(query, args...)
	if err != nil {
		jsonError(w, "Internal server error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	orders := []models.Order{}
	for rows.Next() {
		var o models.Order
		var createdAt, updatedAt time.Time
		if err := rows.Scan(
			&o.ID, &o.ShopID, &o.ClientID, &o.ClientName, &o.ClientPhone,
			&o.TotalAmount, &o.TotalItems, &o.Status, &o.PaymentMethod,
			&o.UsedCredits, &o.PendingDebt, &o.Note, &createdAt, &updatedAt,
		); err != nil {
			continue
		}
		o.CreatedAt = &createdAt
		o.UpdatedAt = &updatedAt
		orders = append(orders, o)
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(orders)
}

// UpdateOrderStatus handles PUT /api/orders/{id}/status
func (h *OrderHandler) UpdateOrderStatus(w http.ResponseWriter, r *http.Request) {
	path := strings.TrimPrefix(r.URL.Path, "/api/orders/")
	id := strings.TrimSuffix(path, "/status")

	var body struct {
		Status string `json:"status"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		jsonError(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	_, err := h.DB.Exec(`UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2`, body.Status, id)
	if err != nil {
		jsonError(w, "Error updating order status", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"id": id, "status": body.Status})
}

// ---- DEBT PAYMENT REQUESTS ----

// CreateDebtPaymentRequest handles POST /api/shops/{shop_id}/debt-payments
func (h *OrderHandler) CreateDebtPaymentRequest(w http.ResponseWriter, r *http.Request) {
	shopID := extractShopID(r.URL.Path, "/debt-payments")
	if shopID == "" {
		jsonError(w, "shop_id required", http.StatusBadRequest)
		return
	}

	var req models.DebtPaymentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		jsonError(w, "Invalid JSON", http.StatusBadRequest)
		return
	}
	req.ShopID = shopID
	if req.ClientID == "" || req.Amount <= 0 || req.VoucherNumber == "" || req.PaymentMethodName == "" {
		jsonError(w, "Fields 'client_id', 'amount', 'voucher_number', 'payment_method_name' are required", http.StatusBadRequest)
		return
	}
	req.Status = "pending"

	var createdAt, updatedAt time.Time
	err := h.DB.QueryRow(`
		INSERT INTO debt_payment_requests (client_id, client_name, client_phone, shop_id, amount, payment_method_id, payment_method_name, voucher_number, status, notes)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', $9) RETURNING id, created_at, updated_at
	`, req.ClientID, req.ClientName, req.ClientPhone, req.ShopID, req.Amount,
		req.PaymentMethodID, req.PaymentMethodName, req.VoucherNumber, req.Notes).
		Scan(&req.ID, &createdAt, &updatedAt)
	if err != nil {
		log.Printf("Error creating debt payment request: %v", err)
		jsonError(w, "Error creating request", http.StatusInternalServerError)
		return
	}
	req.CreatedAt = &createdAt
	req.UpdatedAt = &updatedAt

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(req)
}

// GetDebtPaymentRequests handles GET /api/shops/{shop_id}/debt-payments
func (h *OrderHandler) GetDebtPaymentRequests(w http.ResponseWriter, r *http.Request) {
	shopID := extractShopID(r.URL.Path, "/debt-payments")
	if shopID == "" {
		jsonError(w, "shop_id required", http.StatusBadRequest)
		return
	}

	status := r.URL.Query().Get("status")
	query := `
		SELECT id, client_id, client_name, client_phone, shop_id, amount, payment_method_id,
		       payment_method_name, voucher_number, status, notes, created_at, updated_at
		FROM debt_payment_requests WHERE shop_id = $1
	`
	args := []interface{}{shopID}
	if status != "" {
		query += " AND status = $2"
		args = append(args, status)
	}
	query += " ORDER BY created_at DESC"

	rows, err := h.DB.Query(query, args...)
	if err != nil {
		jsonError(w, "Internal server error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	requests := []models.DebtPaymentRequest{}
	for rows.Next() {
		var req models.DebtPaymentRequest
		var createdAt, updatedAt time.Time
		if err := rows.Scan(
			&req.ID, &req.ClientID, &req.ClientName, &req.ClientPhone, &req.ShopID,
			&req.Amount, &req.PaymentMethodID, &req.PaymentMethodName, &req.VoucherNumber,
			&req.Status, &req.Notes, &createdAt, &updatedAt,
		); err != nil {
			continue
		}
		req.CreatedAt = &createdAt
		req.UpdatedAt = &updatedAt
		requests = append(requests, req)
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(requests)
}

// ApproveDebtPayment handles PUT /api/debt-payments/{id}/approve
// Approves the payment and reduces the client's debt in client_shop_accounts
func (h *OrderHandler) ApproveDebtPayment(w http.ResponseWriter, r *http.Request) {
	path := strings.TrimPrefix(r.URL.Path, "/api/debt-payments/")
	id := strings.TrimSuffix(path, "/approve")

	tx, err := h.DB.Begin()
	if err != nil {
		jsonError(w, "Internal server error", http.StatusInternalServerError)
		return
	}
	defer tx.Rollback()

	// Fetch request details
	var req models.DebtPaymentRequest
	if err := tx.QueryRow(`
		SELECT id, client_id, shop_id, amount, status FROM debt_payment_requests WHERE id = $1
	`, id).Scan(&req.ID, &req.ClientID, &req.ShopID, &req.Amount, &req.Status); err != nil {
		jsonError(w, "Request not found", http.StatusNotFound)
		return
	}
	if req.Status != "pending" {
		jsonError(w, "Request is not pending", http.StatusConflict)
		return
	}

	// Mark as approved
	tx.Exec(`UPDATE debt_payment_requests SET status = 'approved', updated_at = NOW() WHERE id = $1`, id)

	// Reduce client's debt
	tx.Exec(`
		UPDATE client_shop_accounts SET debt = GREATEST(0, debt - $1), updated_at = NOW()
		WHERE shop_id = $2 AND client_id = $3
	`, req.Amount, req.ShopID, req.ClientID)

	if err := tx.Commit(); err != nil {
		jsonError(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"id": id, "status": "approved"})
}

// RejectDebtPayment handles PUT /api/debt-payments/{id}/reject
func (h *OrderHandler) RejectDebtPayment(w http.ResponseWriter, r *http.Request) {
	path := strings.TrimPrefix(r.URL.Path, "/api/debt-payments/")
	id := strings.TrimSuffix(path, "/reject")

	var body struct {
		Notes string `json:"notes"`
	}
	json.NewDecoder(r.Body).Decode(&body)

	h.DB.Exec(`UPDATE debt_payment_requests SET status = 'rejected', notes = $1, updated_at = NOW() WHERE id = $2`, body.Notes, id)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"id": id, "status": "rejected"})
}

// GetClientAccount handles GET /api/shops/{shop_id}/clients/{client_id}/account
func (h *OrderHandler) GetClientAccount(w http.ResponseWriter, r *http.Request) {
	// Path: /api/shops/{shop_id}/clients/{client_id}/account
	parts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
	if len(parts) < 5 {
		jsonError(w, "Invalid path", http.StatusBadRequest)
		return
	}
	shopID := parts[2]
	clientID := parts[4]

	var acc models.ClientShopAccount
	err := h.DB.QueryRow(`
		SELECT shop_id, client_id, credits, debt, is_credit_enabled, credit_limit
		FROM client_shop_accounts WHERE shop_id = $1 AND client_id = $2
	`, shopID, clientID).Scan(&acc.ShopID, &acc.ClientID, &acc.Credits, &acc.Debt, &acc.IsCreditEnabled, &acc.CreditLimit)
	if err == sql.ErrNoRows {
		// Return defaults for new clients
		acc = models.ClientShopAccount{ShopID: shopID, ClientID: clientID}
	} else if err != nil {
		jsonError(w, "Internal server error", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(acc)
}

// UpdateClientAccount handles PUT /api/shops/{shop_id}/clients/{client_id}/account
func (h *OrderHandler) UpdateClientAccount(w http.ResponseWriter, r *http.Request) {
	parts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
	if len(parts) < 5 {
		jsonError(w, "Invalid path", http.StatusBadRequest)
		return
	}
	shopID := parts[2]
	clientID := parts[4]

	var acc models.ClientShopAccount
	if err := json.NewDecoder(r.Body).Decode(&acc); err != nil {
		jsonError(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	_, err := h.DB.Exec(`
		INSERT INTO client_shop_accounts (shop_id, client_id, credits, debt, is_credit_enabled, credit_limit)
		VALUES ($1, $2, $3, $4, $5, $6)
		ON CONFLICT (shop_id, client_id) DO UPDATE SET
			credits = $3, debt = $4, is_credit_enabled = $5, credit_limit = $6, updated_at = NOW()
	`, shopID, clientID, acc.Credits, acc.Debt, acc.IsCreditEnabled, acc.CreditLimit)
	if err != nil {
		log.Printf("Error updating client account: %v", err)
		jsonError(w, "Error updating client account", http.StatusInternalServerError)
		return
	}

	acc.ShopID = shopID
	acc.ClientID = clientID
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(acc)
}
