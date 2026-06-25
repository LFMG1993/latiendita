package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"strings"

	"backend/models"
	"backend/services"
)

// MasterProductHandler handles master catalog and product request operations
type MasterProductHandler struct {
	service *services.MasterProductService
}

func NewMasterProductHandler(service *services.MasterProductService) *MasterProductHandler {
	return &MasterProductHandler{service: service}
}

// ---- MASTER CATALOG (Super Admin) ----

// GetAllMasterProducts handles GET /api/admin/master-products
func (h *MasterProductHandler) GetAllMasterProducts(w http.ResponseWriter, r *http.Request) {
	q := strings.TrimSpace(r.URL.Query().Get("q"))
	category := strings.TrimSpace(r.URL.Query().Get("category"))

	products, err := h.service.GetAllMasterProducts(q, category)
	if err != nil {
		log.Printf("Error getting master products: %v", err)
		jsonError(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(products)
}

// CreateMasterProduct handles POST /api/admin/master-products
func (h *MasterProductHandler) CreateMasterProduct(w http.ResponseWriter, r *http.Request) {
	var p models.MasterProduct
	if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
		jsonError(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	err := h.service.CreateMasterProduct(&p)
	if err != nil {
		if strings.Contains(err.Error(), "unique") {
			jsonError(w, "A product with this barcode already exists", http.StatusConflict)
			return
		}
		jsonError(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(p)
}

// UpdateMasterProduct handles PUT /api/admin/master-products/{id}
func (h *MasterProductHandler) UpdateMasterProduct(w http.ResponseWriter, r *http.Request) {
	parts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
	id := parts[len(parts)-1]

	var p models.MasterProduct
	if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
		jsonError(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	err := h.service.UpdateMasterProduct(id, &p)
	if err != nil {
		jsonError(w, "Error updating product", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(p)
}

// DeleteMasterProduct handles DELETE /api/admin/master-products/{id}
func (h *MasterProductHandler) DeleteMasterProduct(w http.ResponseWriter, r *http.Request) {
	parts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
	id := parts[len(parts)-1]

	err := h.service.DeleteMasterProduct(id)
	if err != nil {
		jsonError(w, "Error deleting product", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Product deleted from catalog"})
}

// SearchMasterProducts handles GET /api/master-products/search?q=query
func (h *MasterProductHandler) SearchMasterProducts(w http.ResponseWriter, r *http.Request) {
	q := strings.TrimSpace(r.URL.Query().Get("q"))
	
	products, err := h.service.SearchMasterProducts(q)
	if err != nil {
		jsonError(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(products)
}

// ---- PRODUCT REQUESTS (Shop Owner -> Super Admin) ----

// GetProductRequests handles GET /api/admin/product-requests
func (h *MasterProductHandler) GetProductRequests(w http.ResponseWriter, r *http.Request) {
	status := r.URL.Query().Get("status")

	requests, err := h.service.GetProductRequests(status)
	if err != nil {
		jsonError(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(requests)
}

// CreateProductRequest handles POST /api/shops/{shop_id}/product-requests
func (h *MasterProductHandler) CreateProductRequest(w http.ResponseWriter, r *http.Request) {
	shopID := extractShopID(r.URL.Path, "/product-requests")
	if shopID == "" {
		jsonError(w, "shop_id required in path", http.StatusBadRequest)
		return
	}

	var req models.MasterProductRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		jsonError(w, "Invalid JSON", http.StatusBadRequest)
		return
	}
	req.ShopID = shopID

	err := h.service.CreateProductRequest(&req)
	if err != nil {
		jsonError(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(req)
}

// ApproveProductRequest handles PUT /api/admin/product-requests/{id}/approve
func (h *MasterProductHandler) ApproveProductRequest(w http.ResponseWriter, r *http.Request) {
	id := strings.TrimSuffix(strings.TrimPrefix(r.URL.Path, "/api/admin/product-requests/"), "/approve")

	var adjustments models.MasterProductRequest
	json.NewDecoder(r.Body).Decode(&adjustments)

	masterProductID, err := h.service.ApproveProductRequest(id, &adjustments)
	if err != nil {
		jsonError(w, "Error approving request", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"message":           "Request approved. Product added to master catalog.",
		"master_product_id": masterProductID,
	})
}

// RejectProductRequest handles PUT /api/admin/product-requests/{id}/reject
func (h *MasterProductHandler) RejectProductRequest(w http.ResponseWriter, r *http.Request) {
	id := strings.TrimSuffix(strings.TrimPrefix(r.URL.Path, "/api/admin/product-requests/"), "/reject")

	var body struct {
		AdminNotes *string `json:"admin_notes"`
	}
	json.NewDecoder(r.Body).Decode(&body)

	err := h.service.RejectProductRequest(id, body.AdminNotes)
	if err != nil {
		jsonError(w, "Error rejecting request", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Request rejected"})
}

// GetShopProductRequests handles GET /api/shops/{shop_id}/product-requests
func (h *MasterProductHandler) GetShopProductRequests(w http.ResponseWriter, r *http.Request) {
	shopID := extractShopID(r.URL.Path, "/product-requests")
	if shopID == "" {
		jsonError(w, "shop_id required", http.StatusBadRequest)
		return
	}

	requests, err := h.service.GetShopProductRequests(shopID)
	if err != nil {
		jsonError(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(requests)
}

// GetMasterProductShops handles GET /api/public/master-products/{id}/shops?client_id=...
func (h *MasterProductHandler) GetMasterProductShops(w http.ResponseWriter, r *http.Request) {
	parts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
	if len(parts) < 4 {
		jsonError(w, "Invalid path", http.StatusBadRequest)
		return
	}
	masterProductID := parts[3]
	clientID := r.URL.Query().Get("client_id")

	results, err := h.service.GetMasterProductShops(masterProductID, clientID)
	if err != nil {
		jsonError(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(results)
}

// EnrollClientToShop handles POST /api/public/shops/{shop_id}/enroll
func (h *MasterProductHandler) EnrollClientToShop(w http.ResponseWriter, r *http.Request) {
	parts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
	if len(parts) < 4 {
		jsonError(w, "Invalid path", http.StatusBadRequest)
		return
	}
	shopID := parts[3]

	var body struct {
		ClientID string `json:"client_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		jsonError(w, "Invalid JSON", http.StatusBadRequest)
		return
	}
	body.ClientID = strings.TrimSpace(body.ClientID)

	err := h.service.EnrollClientToShop(shopID, body.ClientID)
	if err != nil {
		if err.Error() == "sql: no rows in result set" {
			jsonError(w, "Client not found or invalid role", http.StatusNotFound)
			return
		}
		jsonError(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Client enrolled successfully to shop",
	})
}
