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

	if err := h.orderService.UpdateOrderStatus(id, body.Status); err != nil {
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
