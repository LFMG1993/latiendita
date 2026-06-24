package handlers

import (
	"encoding/json"
	"net/http"
	"strings"

	"backend/models"
	"backend/services"
)

// CashSessionHandler handles cash register sessions and expenses
type CashSessionHandler struct {
	cashSessionService *services.CashSessionService
}

func NewCashSessionHandler(cashSessionService *services.CashSessionService) *CashSessionHandler {
	return &CashSessionHandler{cashSessionService: cashSessionService}
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

	if err := h.cashSessionService.OpenCashSession(&cs); err != nil {
		if strings.Contains(err.Error(), "required") {
			jsonError(w, err.Error(), http.StatusBadRequest)
		} else {
			jsonError(w, "Internal server error", http.StatusInternalServerError)
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(cs)
}

// CloseCashSession handles PUT /api/cash-sessions/{id}/close
func (h *CashSessionHandler) CloseCashSession(w http.ResponseWriter, r *http.Request) {
	path := strings.TrimPrefix(r.URL.Path, "/api/cash-sessions/")
	id := strings.TrimSuffix(path, "/close")

	var cs models.CashSession
	if err := json.NewDecoder(r.Body).Decode(&cs); err != nil {
		jsonError(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	if err := h.cashSessionService.CloseCashSession(id, &cs); err != nil {
		if strings.Contains(err.Error(), "required") {
			jsonError(w, err.Error(), http.StatusBadRequest)
		} else if strings.Contains(err.Error(), "no rows") {
			jsonError(w, "Session not found or already closed", http.StatusNotFound)
		} else {
			jsonError(w, "Internal server error", http.StatusInternalServerError)
		}
		return
	}

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

	statusFilter := r.URL.Query().Get("status")

	sessions, err := h.cashSessionService.GetCashSessionsByShop(shopID, statusFilter)
	if err != nil {
		jsonError(w, "Internal server error", http.StatusInternalServerError)
		return
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

	cs, err := h.cashSessionService.GetOpenSessionByShop(shopID)
	if err != nil {
		if strings.Contains(err.Error(), "no rows") {
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(nil)
		} else {
			jsonError(w, "Internal server error", http.StatusInternalServerError)
		}
		return
	}

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

	if err := h.cashSessionService.CreateExpense(&e); err != nil {
		if strings.Contains(err.Error(), "required") {
			jsonError(w, err.Error(), http.StatusBadRequest)
		} else {
			jsonError(w, "Internal server error", http.StatusInternalServerError)
		}
		return
	}

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

	expenses, err := h.cashSessionService.GetExpensesByShop(shopID)
	if err != nil {
		jsonError(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(expenses)
}
