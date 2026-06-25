package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"strings"

	"backend/models"
	"backend/services"
)

// SaleHandler handles POS sales
type SaleHandler struct {
	saleService *services.SaleService
}

func NewSaleHandler(saleService *services.SaleService) *SaleHandler {
	return &SaleHandler{saleService: saleService}
}

// CreateSale handles POST /api/shops/{shop_id}/sales
// Creates a sale, its items, payments, and deducts stock
func (h *SaleHandler) CreateSale(w http.ResponseWriter, r *http.Request) {
	shopID := extractShopID(r.URL.Path, "/sales")
	if shopID == "" {
		jsonError(w, "shop_id required", http.StatusBadRequest)
		return
	}

	var sale models.Sale
	if err := json.NewDecoder(r.Body).Decode(&sale); err != nil {
		jsonError(w, "Invalid JSON", http.StatusBadRequest)
		return
	}
	sale.ShopID = shopID

	if err := h.saleService.CreateSale(&sale); err != nil {
		if strings.Contains(err.Error(), "required") {
			jsonError(w, err.Error(), http.StatusBadRequest)
		} else {
			jsonError(w, "Internal server error", http.StatusInternalServerError)
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(sale)
}

// GetSales handles GET /api/shops/{shop_id}/sales
func (h *SaleHandler) GetSales(w http.ResponseWriter, r *http.Request) {
	shopID := extractShopID(r.URL.Path, "/sales")
	if shopID == "" {
		jsonError(w, "shop_id required", http.StatusBadRequest)
		return
	}

	// Optional date filter: ?from=2024-01-01&to=2024-01-31
	from := r.URL.Query().Get("from")
	to := r.URL.Query().Get("to")

	sales, err := h.saleService.GetSalesByShop(shopID, from, to)
	if err != nil {
		jsonError(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(sales)
}

// GetSaleDetails handles GET /api/sales/{id}
// Returns a single sale with its items and payments
func (h *SaleHandler) GetSaleDetails(w http.ResponseWriter, r *http.Request) {
	id := strings.TrimPrefix(r.URL.Path, "/api/sales/")

	sale, err := h.saleService.GetSaleDetails(id)
	if err != nil {
		if strings.Contains(err.Error(), "required") {
			jsonError(w, err.Error(), http.StatusBadRequest)
		} else if strings.Contains(err.Error(), "no rows") {
			jsonError(w, "Sale not found", http.StatusNotFound)
		} else {
			jsonError(w, "Internal server error", http.StatusInternalServerError)
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(sale)
}

// GetClientSales handles GET /api/clients/{client_id}/sales
func (h *SaleHandler) GetClientSales(w http.ResponseWriter, r *http.Request) {
	parts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
	if len(parts) < 3 {
		jsonError(w, "Invalid path", http.StatusBadRequest)
		return
	}
	clientID := parts[2]

	sales, err := h.saleService.GetClientSales(clientID)
	if err != nil {
		log.Printf("Error querying client sales: %v", err)
		jsonError(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(sales)
}
