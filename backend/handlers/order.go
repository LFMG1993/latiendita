package handlers

import (
	"encoding/json"
	"net/http"
	"strings"

	"backend/models"
	"backend/services"
)

// OrderHandler handles client orders and debt payments
type OrderHandler struct {
	orderService *services.OrderService
}

func NewOrderHandler(orderService *services.OrderService) *OrderHandler {
	return &OrderHandler{orderService: orderService}
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

	if err := h.orderService.CreateOrder(&order); err != nil {
		if strings.Contains(err.Error(), "required") {
			jsonError(w, err.Error(), http.StatusBadRequest)
		} else {
			jsonError(w, "Internal server error", http.StatusInternalServerError)
		}
<<<<<<< HEAD
=======
		order.Items[i].ID = itemID
		order.Items[i].OrderID = order.ID
	}

	// Handle credit usage
	if order.UsedCredits > 0 {
		tx.Exec(`
			UPDATE client_shop_accounts SET credits = GREATEST(0, credits - $1), updated_at = NOW()
			WHERE shop_id = $2 AND client_id = $3
		`, order.UsedCredits, shopID, order.ClientID)
	}

	if err := tx.Commit(); err != nil {
		jsonError(w, "Internal server error", http.StatusInternalServerError)
>>>>>>> refs/remotes/origin/main
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

	orders, err := h.orderService.GetOrdersByShop(shopID, status)
	if err != nil {
		jsonError(w, "Internal server error", http.StatusInternalServerError)
		return
	}

<<<<<<< HEAD
=======
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

	// Fetch items
	for i := range orders {
		itemRows, err := h.DB.Query(`SELECT id, order_id, product_id, product_name, quantity, price_at_purchase FROM order_items WHERE order_id = $1`, orders[i].ID)
		if err == nil {
			var items []models.OrderItem
			for itemRows.Next() {
				var item models.OrderItem
				if err := itemRows.Scan(&item.ID, &item.OrderID, &item.ProductID, &item.ProductName, &item.Quantity, &item.PriceAtPurchase); err == nil {
					items = append(items, item)
				}
			}
			itemRows.Close()
			if items == nil {
				items = []models.OrderItem{}
			}
			orders[i].Items = items
		}
	}

>>>>>>> refs/remotes/origin/main
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(orders)
}

// GetClientOrders handles GET /api/clients/{client_id}/orders?shop_id=xxx
func (h *OrderHandler) GetClientOrders(w http.ResponseWriter, r *http.Request) {
	clientID := strings.TrimPrefix(r.URL.Path, "/api/clients/")
	clientID = strings.TrimSuffix(clientID, "/orders")
	shopID := r.URL.Query().Get("shop_id")

	orders, err := h.orderService.GetClientOrders(clientID, shopID)
	if err != nil {
		if strings.Contains(err.Error(), "required") {
			jsonError(w, err.Error(), http.StatusBadRequest)
		} else {
			jsonError(w, "Internal server error", http.StatusInternalServerError)
		}
		return
	}

<<<<<<< HEAD
=======
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

	// Fetch items
	for i := range orders {
		itemRows, err := h.DB.Query(`SELECT id, order_id, product_id, product_name, quantity, price_at_purchase FROM order_items WHERE order_id = $1`, orders[i].ID)
		if err == nil {
			var items []models.OrderItem
			for itemRows.Next() {
				var item models.OrderItem
				if err := itemRows.Scan(&item.ID, &item.OrderID, &item.ProductID, &item.ProductName, &item.Quantity, &item.PriceAtPurchase); err == nil {
					items = append(items, item)
				}
			}
			itemRows.Close()
			if items == nil {
				items = []models.OrderItem{}
			}
			orders[i].Items = items
		}
	}

>>>>>>> refs/remotes/origin/main
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

<<<<<<< HEAD
	if err := h.orderService.UpdateOrderStatus(id, body.Status); err != nil {
=======
	tx, err := h.DB.Begin()
	if err != nil {
		jsonError(w, "Internal server error", http.StatusInternalServerError)
		return
	}
	defer tx.Rollback()

	// Retrieve order details to check status transition and financial info
	var currentStatus string
	var paymentMethod string
	var pendingDebt float64
	var shopID string
	var clientID string

	err = tx.QueryRow(`
		SELECT status, payment_method, pending_debt, shop_id, client_id 
		FROM orders WHERE id = $1 FOR UPDATE
	`, id).Scan(&currentStatus, &paymentMethod, &pendingDebt, &shopID, &clientID)
	if err == sql.ErrNoRows {
		jsonError(w, "Order not found", http.StatusNotFound)
		return
	} else if err != nil {
		log.Printf("Error querying order details: %v", err)
		jsonError(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	// Update order status
	_, err = tx.Exec(`UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2`, body.Status, id)
	if err != nil {
		log.Printf("Error updating order status: %v", err)
>>>>>>> refs/remotes/origin/main
		jsonError(w, "Error updating order status", http.StatusInternalServerError)
		return
	}

<<<<<<< HEAD
=======
	// If transitioning to delivered and not already delivered, apply pending debt
	if body.Status == "delivered" && currentStatus != "delivered" {
		if paymentMethod == "credit" && pendingDebt > 0 {
			_, err = tx.Exec(`
				INSERT INTO client_shop_accounts (shop_id, client_id, debt)
				VALUES ($1, $2, $3)
				ON CONFLICT (shop_id, client_id) DO UPDATE SET debt = client_shop_accounts.debt + $3, updated_at = NOW()
			`, shopID, clientID, pendingDebt)
			if err != nil {
				log.Printf("Error updating client debt account: %v", err)
				jsonError(w, "Error updating client debt account", http.StatusInternalServerError)
				return
			}
		}
	}

	if err := tx.Commit(); err != nil {
		log.Printf("Error committing transaction: %v", err)
		jsonError(w, "Internal server error", http.StatusInternalServerError)
		return
	}

>>>>>>> refs/remotes/origin/main
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

	if err := h.orderService.CreateDebtPaymentRequest(&req); err != nil {
		if strings.Contains(err.Error(), "required") {
			jsonError(w, err.Error(), http.StatusBadRequest)
		} else {
			jsonError(w, "Internal server error", http.StatusInternalServerError)
		}
		return
	}

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

	requests, err := h.orderService.GetDebtPaymentRequestsByShop(shopID, status)
	if err != nil {
		jsonError(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(requests)
}

// GetClientDebtPayments handles GET /api/clients/{client_id}/debt-payments
func (h *OrderHandler) GetClientDebtPayments(w http.ResponseWriter, r *http.Request) {
	clientID := strings.TrimPrefix(r.URL.Path, "/api/clients/")
	clientID = strings.TrimSuffix(clientID, "/debt-payments")

	query := `
		SELECT id, client_id, client_name, client_phone, shop_id, amount, payment_method_id,
		       payment_method_name, voucher_number, status, notes, created_at, updated_at
		FROM debt_payment_requests WHERE client_id = $1
		ORDER BY created_at DESC
	`
	rows, err := h.DB.Query(query, clientID)
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

	if err := h.orderService.ApproveDebtPaymentRequest(id); err != nil {
		if strings.Contains(err.Error(), "required") {
			jsonError(w, err.Error(), http.StatusBadRequest)
		} else if strings.Contains(err.Error(), "no rows") {
			jsonError(w, "Request not found or not pending", http.StatusConflict)
		} else {
			jsonError(w, "Internal server error", http.StatusInternalServerError)
		}
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

	if err := h.orderService.RejectDebtPaymentRequest(id, body.Notes); err != nil {
		jsonError(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"id": id, "status": "rejected"})
}

// GetClientAccount handles GET /api/shops/{shop_id}/clients/{client_id}/account
func (h *OrderHandler) GetClientAccount(w http.ResponseWriter, r *http.Request) {
	parts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
	if len(parts) < 5 {
		jsonError(w, "Invalid path", http.StatusBadRequest)
		return
	}
	shopID := parts[2]
	clientID := parts[4]

	acc, err := h.orderService.GetClientAccount(shopID, clientID)
	if err != nil {
		if strings.Contains(err.Error(), "required") {
			jsonError(w, err.Error(), http.StatusBadRequest)
		} else {
			jsonError(w, "Internal server error", http.StatusInternalServerError)
		}
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
	acc.ShopID = shopID
	acc.ClientID = clientID

	if err := h.orderService.UpdateClientAccount(&acc); err != nil {
		if strings.Contains(err.Error(), "required") {
			jsonError(w, err.Error(), http.StatusBadRequest)
		} else {
			jsonError(w, "Internal server error", http.StatusInternalServerError)
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(acc)
}
