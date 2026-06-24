package handlers

import (
	"encoding/json"
	"net/http"
	"strings"

	"backend/models"
	"backend/services"
)

// SupplierHandler handles supplier and purchase CRUD
type SupplierHandler struct {
	supplierService *services.SupplierService
}

func NewSupplierHandler(supplierService *services.SupplierService) *SupplierHandler {
	return &SupplierHandler{supplierService: supplierService}
}

// ---- SUPPLIERS ----

// CreateSupplier handles POST /api/shops/{shop_id}/suppliers
func (h *SupplierHandler) CreateSupplier(w http.ResponseWriter, r *http.Request) {
	shopID := extractShopID(r.URL.Path, "/suppliers")
	if shopID == "" {
		jsonError(w, "shop_id required in path", http.StatusBadRequest)
		return
	}

	var s models.Supplier
	if err := json.NewDecoder(r.Body).Decode(&s); err != nil {
		jsonError(w, "Invalid JSON", http.StatusBadRequest)
		return
	}
	s.ShopID = shopID

	if err := h.supplierService.CreateSupplier(&s); err != nil {
		if strings.Contains(err.Error(), "required") {
			jsonError(w, err.Error(), http.StatusBadRequest)
		} else {
			jsonError(w, "Internal server error", http.StatusInternalServerError)
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(s)
}

// GetSuppliers handles GET /api/shops/{shop_id}/suppliers
func (h *SupplierHandler) GetSuppliers(w http.ResponseWriter, r *http.Request) {
	shopID := extractShopID(r.URL.Path, "/suppliers")
	if shopID == "" {
		jsonError(w, "shop_id required in path", http.StatusBadRequest)
		return
	}

	suppliers, err := h.supplierService.GetSuppliersByShop(shopID)
	if err != nil {
		jsonError(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(suppliers)
}

// UpdateSupplier handles PUT /api/shops/{shop_id}/suppliers/{id}
func (h *SupplierHandler) UpdateSupplier(w http.ResponseWriter, r *http.Request) {
	parts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
	id := parts[len(parts)-1]

	var s models.Supplier
	if err := json.NewDecoder(r.Body).Decode(&s); err != nil {
		jsonError(w, "Invalid JSON", http.StatusBadRequest)
		return
	}
	s.ID = id

	if err := h.supplierService.UpdateSupplier(&s); err != nil {
		if strings.Contains(err.Error(), "required") {
			jsonError(w, err.Error(), http.StatusBadRequest)
		} else if strings.Contains(err.Error(), "no rows") {
			jsonError(w, "Supplier not found", http.StatusNotFound)
		} else {
			jsonError(w, "Internal server error", http.StatusInternalServerError)
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(s)
}

// DeleteSupplier handles DELETE /api/shops/{shop_id}/suppliers/{id}
func (h *SupplierHandler) DeleteSupplier(w http.ResponseWriter, r *http.Request) {
	parts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
	id := parts[len(parts)-1]

	if err := h.supplierService.DeleteSupplier(id); err != nil {
		jsonError(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Supplier deleted"})
}

// ---- PURCHASES ----

// CreatePurchase handles POST /api/shops/{shop_id}/purchases
// It creates the purchase, its items, and updates ingredient/product stock
func (h *SupplierHandler) CreatePurchase(w http.ResponseWriter, r *http.Request) {
	shopID := extractShopID(r.URL.Path, "/purchases")
	if shopID == "" {
		jsonError(w, "shop_id required in path", http.StatusBadRequest)
		return
	}

	var p models.Purchase
	if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
		jsonError(w, "Invalid JSON", http.StatusBadRequest)
		return
	}
	p.ShopID = shopID

	if err := h.supplierService.CreatePurchase(&p); err != nil {
		if strings.Contains(err.Error(), "required") {
			jsonError(w, err.Error(), http.StatusBadRequest)
		} else if strings.Contains(err.Error(), "unique constraint") || strings.Contains(err.Error(), "duplicate key") {
			jsonError(w, "Invoice number already registered for this shop", http.StatusConflict)
		} else {
			jsonError(w, "Internal server error", http.StatusInternalServerError)
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(p)
}

// GetPurchases handles GET /api/shops/{shop_id}/purchases
func (h *SupplierHandler) GetPurchases(w http.ResponseWriter, r *http.Request) {
	shopID := extractShopID(r.URL.Path, "/purchases")
	if shopID == "" {
		jsonError(w, "shop_id required in path", http.StatusBadRequest)
		return
	}

	purchases, err := h.supplierService.GetPurchasesByShop(shopID)
	if err != nil {
		jsonError(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(purchases)
}
