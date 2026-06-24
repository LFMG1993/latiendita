package handlers

import (
	"encoding/json"
	"net/http"
	"strings"

	"backend/models"
	"backend/services"
)

// ShopHandler handles shop-related HTTP requests
type ShopHandler struct {
	shopService *services.ShopService
}

// NewShopHandler creates a new instance of ShopHandler
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

	isPublic := r.URL.Query().Get("public") == "true"
	ownerID := r.URL.Query().Get("owner_id")
<<<<<<< HEAD
	shops, err := h.shopService.GetShopsByOwner(ownerID)
=======

	if ownerID == "" && !isPublic {
		jsonError(w, "owner_id query parameter is required", http.StatusBadRequest)
		return
	}

	var query string
	var rows *sql.Rows
	var err error

	if isPublic {
		query = `
			SELECT id, name, address, photo_url, whatsapp, owner_id, timezone, business_type_id,
			       theme_primary_color, theme_secondary_color, theme_logo_url,
			       terminology_shop_label, terminology_product_label,
			       modules, features, status, created_at, updated_at
			FROM shops
			WHERE status = 'active'
			ORDER BY name ASC
		`
		rows, err = h.DB.Query(query)
	} else {
		query = `
			SELECT id, name, address, photo_url, whatsapp, owner_id, timezone, business_type_id,
			       theme_primary_color, theme_secondary_color, theme_logo_url,
			       terminology_shop_label, terminology_product_label,
			       modules, features, status, created_at, updated_at
			FROM shops
			WHERE owner_id = $1
			ORDER BY created_at ASC
		`
		rows, err = h.DB.Query(query, ownerID)
	}

>>>>>>> refs/remotes/origin/main
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

	query := `
		SELECT s.id, s.name, s.address, s.photo_url, s.whatsapp, s.owner_id, s.timezone, s.business_type_id,
		       s.theme_primary_color, s.theme_secondary_color, s.theme_logo_url,
		       s.terminology_shop_label, s.terminology_product_label,
		       s.modules, s.features, s.status, s.created_at, s.updated_at
		FROM shops s
		JOIN client_shop_accounts csa ON csa.shop_id = s.id
		WHERE csa.client_id = $1 AND s.status = 'active'
		ORDER BY s.name ASC
	`
	rows, err := h.DB.Query(query, clientID)
	if err != nil {
		log.Printf("Error querying client enrolled shops: %v", err)
		jsonError(w, "Internal server error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	shops := []models.Shop{}
	for rows.Next() {
		var s models.Shop
		var createdAt, updatedAt time.Time
		var modulesJSON, featuresJSON []byte
		if err := rows.Scan(
			&s.ID, &s.Name, &s.Address, &s.PhotoURL, &s.WhatsApp,
			&s.OwnerID, &s.Timezone, &s.BusinessTypeID,
			&s.ThemePrimaryColor, &s.ThemeSecondaryColor, &s.ThemeLogoURL,
			&s.TerminologyShopLabel, &s.TerminologyProductLabel,
			&modulesJSON, &featuresJSON, &s.Status,
			&createdAt, &updatedAt,
		); err != nil {
			log.Printf("Error scanning shop row: %v", err)
			continue
		}
		s.Modules = modulesJSON
		s.Features = featuresJSON
		s.CreatedAt = &createdAt
		s.UpdatedAt = &updatedAt
		shops = append(shops, s)
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

	query := `
		SELECT u.id, u.first_name, u.last_name, u.email, u.phone, u.document_id, u.photo_url, u.created_at,
		       csa.credits, csa.debt, csa.is_credit_enabled, csa.credit_limit
		FROM users u
		JOIN client_shop_accounts csa ON u.id = csa.client_id
		WHERE csa.shop_id = $1
		ORDER BY u.first_name, u.last_name
	`

	rows, err := h.DB.Query(query, shopID)
	if err != nil {
		log.Printf("Error fetching clients for shop: %v", err)
		jsonError(w, "Internal server error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	clients := []map[string]interface{}{}
	for rows.Next() {
		var id, firstName, lastName, email, phone string
		var photoURL, documentID sql.NullString
		var createdAt time.Time
		var credits, debt float64
		var isCreditEnabled bool
		var creditLimit sql.NullFloat64

		if err := rows.Scan(&id, &firstName, &lastName, &email, &phone, &documentID, &photoURL, &createdAt, &credits, &debt, &isCreditEnabled, &creditLimit); err != nil {
			log.Printf("Error scanning client row: %v", err)
			continue
		}

		client := map[string]interface{}{
			"id":                id,
			"uid":               id,
			"first_name":        firstName,
			"firstName":         firstName,
			"last_name":         lastName,
			"lastName":          lastName,
			"email":             email,
			"phone":             phone,
			"document_id":       documentID.String,
			"documentId":        documentID.String,
			"photo_url":         photoURL.String,
			"photoURL":          photoURL.String,
			"created_at":        createdAt,
			"createdAt":         createdAt, // Send timestamp directly
			"credits":           credits,
			"debt":              debt,
			"isCreditEnabled":   isCreditEnabled,
			"is_credit_enabled": isCreditEnabled,
			"creditLimit":       creditLimit.Float64,
			"credit_limit":      creditLimit.Float64,
			"role":              "client",
		}
		clients = append(clients, client)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(clients)
}
