package handlers

import (
	"encoding/json"
	"net/http"
	"strings"

	"backend/models"
	"backend/services"
)

// ShopHandler handles operations related to shops and onboarding
type ShopHandler struct {
	shopService *services.ShopService
}

func NewShopHandler(shopService *services.ShopService) *ShopHandler {
	return &ShopHandler{shopService: shopService}
}

// CreateShop handles POST /api/shops
func (h *ShopHandler) CreateShop(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		jsonError(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var shop models.Shop
	if err := json.NewDecoder(r.Body).Decode(&shop); err != nil {
		jsonError(w, "Invalid JSON format", http.StatusBadRequest)
		return
	}

	if err := h.shopService.CreateShop(&shop); err != nil {
		if strings.Contains(err.Error(), "required") {
			jsonError(w, err.Error(), http.StatusBadRequest)
		} else {
			jsonError(w, "Internal server error", http.StatusInternalServerError)
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(shop)
}

// GetShopsByOwner handles GET /api/shops?owner_id=xxx
func (h *ShopHandler) GetShopsByOwner(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		jsonError(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	ownerID := r.URL.Query().Get("owner_id")
	shops, err := h.shopService.GetShopsByOwner(ownerID)
	if err != nil {
		if strings.Contains(err.Error(), "required") {
			jsonError(w, err.Error(), http.StatusBadRequest)
		} else {
			jsonError(w, "Internal server error", http.StatusInternalServerError)
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(shops)
}

// GetAllShops handles GET /api/admin/shops
func (h *ShopHandler) GetAllShops(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		jsonError(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	shops, err := h.shopService.GetAllShops()
	if err != nil {
		jsonError(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(shops)
}

// GetShopByID handles GET /api/shops/{id}
func (h *ShopHandler) GetShopByID(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		jsonError(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	id := strings.TrimPrefix(r.URL.Path, "/api/shops/")
	id = strings.TrimSpace(id)

	shop, err := h.shopService.GetShopByID(id)
	if err != nil {
		if err.Error() == "shop ID is required" {
			jsonError(w, err.Error(), http.StatusBadRequest)
		} else if strings.Contains(err.Error(), "no rows") {
			jsonError(w, "Shop not found", http.StatusNotFound)
		} else {
			jsonError(w, "Internal server error", http.StatusInternalServerError)
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(shop)
}

// UpdateShop handles PUT /api/shops/{id}
func (h *ShopHandler) UpdateShop(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPut {
		jsonError(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	id := strings.TrimPrefix(r.URL.Path, "/api/shops/")
	id = strings.TrimSpace(id)

	var shop models.Shop
	if err := json.NewDecoder(r.Body).Decode(&shop); err != nil {
		jsonError(w, "Invalid JSON format", http.StatusBadRequest)
		return
	}
	shop.ID = id

	if err := h.shopService.UpdateShop(&shop); err != nil {
		if err.Error() == "shop ID is required" {
			jsonError(w, err.Error(), http.StatusBadRequest)
		} else if strings.Contains(err.Error(), "no rows") {
			jsonError(w, "Shop not found", http.StatusNotFound)
		} else {
			jsonError(w, "Internal server error", http.StatusInternalServerError)
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(shop)
}

// GetShopMembers handles GET /api/shops/{id}/members
func (h *ShopHandler) GetShopMembers(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		jsonError(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	path := strings.TrimPrefix(r.URL.Path, "/api/shops/")
	shopID := strings.TrimSuffix(path, "/members")

	members, err := h.shopService.GetShopMembers(shopID)
	if err != nil {
		if err.Error() == "shop ID is required" {
			jsonError(w, err.Error(), http.StatusBadRequest)
		} else {
			jsonError(w, "Internal server error", http.StatusInternalServerError)
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(members)
}

// ApproveShop handles PUT /api/admin/shops/{id}/approve
func (h *ShopHandler) ApproveShop(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPut {
		jsonError(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	id := strings.TrimPrefix(r.URL.Path, "/api/admin/shops/")
	id = strings.TrimSuffix(id, "/approve")
	id = strings.TrimSpace(id)

	if err := h.shopService.ApproveShop(id); err != nil {
		if err.Error() == "shop ID is required" {
			jsonError(w, err.Error(), http.StatusBadRequest)
		} else if strings.Contains(err.Error(), "no rows") {
			jsonError(w, "Shop not found", http.StatusNotFound)
		} else {
			jsonError(w, "Internal server error", http.StatusInternalServerError)
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Shop approved successfully"})
}

// jsonError is a shared helper to write JSON error responses
func jsonError(w http.ResponseWriter, msg string, status int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(map[string]string{"error": msg})
}

// GetShopsByClient handles GET /api/clients/{client_id}/shops
// Returns all shops where the client is enrolled (exists in client_shop_accounts)
func (h *ShopHandler) GetShopsByClient(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		jsonError(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	parts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
	if len(parts) < 3 {
		jsonError(w, "Invalid path", http.StatusBadRequest)
		return
	}
	clientID := parts[2]
	if clientID == "" {
		jsonError(w, "client_id is required", http.StatusBadRequest)
		return
	}

	shops, err := h.shopService.GetShopsByClient(clientID)
	if err != nil {
		jsonError(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(shops)
}

// GetClientsByShop handles GET /api/shops/{shop_id}/clients
func (h *ShopHandler) GetClientsByShop(w http.ResponseWriter, r *http.Request) {
	shopID := extractShopID(r.URL.Path, "/clients")
	if shopID == "" {
		jsonError(w, "shop_id required", http.StatusBadRequest)
		return
	}

	clients, err := h.shopService.GetClientsByShop(shopID)
	if err != nil {
		jsonError(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(clients)
}
