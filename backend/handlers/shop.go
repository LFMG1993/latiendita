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

// ShopHandler handles shop-related HTTP requests
// ShopHandler maneja las solicitudes HTTP relacionadas con las tiendas
type ShopHandler struct {
	DB *sql.DB
}

// NewShopHandler creates a new instance of ShopHandler
func NewShopHandler(db *sql.DB) *ShopHandler {
	return &ShopHandler{DB: db}
}

// defaultOwnerPermissions returns the full set of permissions for a shop owner
// defaultOwnerPermissions retorna el conjunto completo de permisos para un dueño de tienda
func defaultOwnerPermissions() map[string]bool {
	return map[string]bool{
		"shop_details_manage":  true,
		"pos_access":           true,
		"ingredients_view":     true,
		"products_view":        true,
		"purchases_view":       true,
		"team_view":            true,
		"promotions_view":      true,
		"suppliers_view":       true,
		"reports_view_sales":   true,
		"cash_session_access":  true,
		"expenses_view":        true,
	}
}

// CreateShop handles POST /api/shops
// Creates a new shop and registers the owner as a member with full permissions
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

	shop.Name = strings.TrimSpace(shop.Name)
	shop.OwnerID = strings.TrimSpace(shop.OwnerID)

	if shop.Name == "" || shop.OwnerID == "" {
		jsonError(w, "Fields 'name' and 'owner_id' are required", http.StatusBadRequest)
		return
	}

	if shop.Status == "" {
		shop.Status = "active" // Default for manual creation by admin
	}

	// Set defaults
	if shop.Timezone == "" {
		shop.Timezone = "America/Bogota"
	}
	if shop.ThemePrimaryColor == "" {
		shop.ThemePrimaryColor = "#0d6efd"
	}
	if shop.ThemeSecondaryColor == "" {
		shop.ThemeSecondaryColor = "#6c757d"
	}
	if shop.TerminologyShopLabel == "" {
		shop.TerminologyShopLabel = "Tienda"
	}
	if shop.TerminologyProductLabel == "" {
		shop.TerminologyProductLabel = "Producto"
	}

	// Default empty JSONB
	modulesJSON := json.RawMessage(`{}`)
	featuresJSON := json.RawMessage(`{}`)
	if shop.Modules != nil {
		modulesJSON = shop.Modules
	}
	if shop.Features != nil {
		featuresJSON = shop.Features
	}

	// Begin transaction
	tx, err := h.DB.Begin()
	if err != nil {
		log.Printf("Error starting transaction: %v", err)
		jsonError(w, "Internal server error", http.StatusInternalServerError)
		return
	}
	defer tx.Rollback()

	// Insert shop
	shopQuery := `
		INSERT INTO shops (
			name, address, photo_url, whatsapp, owner_id, timezone, business_type_id,
			theme_primary_color, theme_secondary_color, theme_logo_url,
			terminology_shop_label, terminology_product_label,
			modules, features, status
		) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
		RETURNING id, created_at, updated_at
	`

	var createdAt, updatedAt time.Time
	err = tx.QueryRow(
		shopQuery,
		shop.Name, shop.Address, shop.PhotoURL, shop.WhatsApp,
		shop.OwnerID, shop.Timezone, shop.BusinessTypeID,
		shop.ThemePrimaryColor, shop.ThemeSecondaryColor, shop.ThemeLogoURL,
		shop.TerminologyShopLabel, shop.TerminologyProductLabel,
		modulesJSON, featuresJSON, shop.Status,
	).Scan(&shop.ID, &createdAt, &updatedAt)
	if err != nil {
		log.Printf("Error inserting shop: %v", err)
		jsonError(w, "Error creating shop", http.StatusInternalServerError)
		return
	}
	shop.CreatedAt = &createdAt
	shop.UpdatedAt = &updatedAt

	// Add owner as shop member with full permissions
	permissionsJSON, _ := json.Marshal(defaultOwnerPermissions())
	memberQuery := `
		INSERT INTO shop_members (shop_id, user_id, role, permissions)
		VALUES ($1, $2, 'owner', $3)
	`
	if _, err := tx.Exec(memberQuery, shop.ID, shop.OwnerID, permissionsJSON); err != nil {
		log.Printf("Error inserting shop member: %v", err)
		jsonError(w, "Error creating shop membership", http.StatusInternalServerError)
		return
	}

	if err := tx.Commit(); err != nil {
		log.Printf("Error committing transaction: %v", err)
		jsonError(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(shop)
}

// GetShopsByOwner handles GET /api/shops?owner_id=xxx
// Returns all shops belonging to an owner
func (h *ShopHandler) GetShopsByOwner(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		jsonError(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	isPublic := r.URL.Query().Get("public") == "true"
	ownerID := r.URL.Query().Get("owner_id")

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

	if err != nil {
		log.Printf("Error querying shops: %v", err)
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

// GetAllShops handles GET /api/admin/shops
// Returns all shops in the system (for superAdmins)
func (h *ShopHandler) GetAllShops(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		jsonError(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	query := `
		SELECT id, name, address, photo_url, whatsapp, owner_id, timezone, business_type_id,
		       theme_primary_color, theme_secondary_color, theme_logo_url,
		       terminology_shop_label, terminology_product_label,
		       modules, features, status, created_at, updated_at
		FROM shops
		ORDER BY created_at ASC
	`
	rows, err := h.DB.Query(query)
	if err != nil {
		log.Printf("Error querying all shops: %v", err)
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

// GetShopByID handles GET /api/shops/{id}
func (h *ShopHandler) GetShopByID(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		jsonError(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Extract ID from path: /api/shops/{id}
	id := strings.TrimPrefix(r.URL.Path, "/api/shops/")
	id = strings.TrimSpace(id)
	if id == "" {
		jsonError(w, "Shop ID is required", http.StatusBadRequest)
		return
	}

	query := `
		SELECT id, name, address, photo_url, whatsapp, owner_id, timezone, business_type_id,
		       theme_primary_color, theme_secondary_color, theme_logo_url,
		       terminology_shop_label, terminology_product_label,
		       modules, features, status, created_at, updated_at
		FROM shops WHERE id = $1
	`
	var s models.Shop
	var createdAt, updatedAt time.Time
	var modulesJSON, featuresJSON []byte

	err := h.DB.QueryRow(query, id).Scan(
		&s.ID, &s.Name, &s.Address, &s.PhotoURL, &s.WhatsApp,
		&s.OwnerID, &s.Timezone, &s.BusinessTypeID,
		&s.ThemePrimaryColor, &s.ThemeSecondaryColor, &s.ThemeLogoURL,
		&s.TerminologyShopLabel, &s.TerminologyProductLabel,
		&modulesJSON, &featuresJSON, &s.Status,
		&createdAt, &updatedAt,
	)
	if err == sql.ErrNoRows {
		jsonError(w, "Shop not found", http.StatusNotFound)
		return
	} else if err != nil {
		log.Printf("Error querying shop: %v", err)
		jsonError(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	s.Modules = modulesJSON
	s.Features = featuresJSON
	s.CreatedAt = &createdAt
	s.UpdatedAt = &updatedAt

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(s)
}

// UpdateShop handles PUT /api/shops/{id}
// Updates shop branding, name, address, terminology, etc.
func (h *ShopHandler) UpdateShop(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPut {
		jsonError(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	id := strings.TrimPrefix(r.URL.Path, "/api/shops/")
	id = strings.TrimSpace(id)
	if id == "" {
		jsonError(w, "Shop ID is required", http.StatusBadRequest)
		return
	}

	var shop models.Shop
	if err := json.NewDecoder(r.Body).Decode(&shop); err != nil {
		jsonError(w, "Invalid JSON format", http.StatusBadRequest)
		return
	}

	query := `
		UPDATE shops SET
			name = COALESCE(NULLIF($1, ''), name),
			address = $2,
			photo_url = $3,
			whatsapp = $4,
			timezone = COALESCE(NULLIF($5, ''), timezone),
			theme_primary_color = COALESCE(NULLIF($6, ''), theme_primary_color),
			theme_secondary_color = COALESCE(NULLIF($7, ''), theme_secondary_color),
			theme_logo_url = $8,
			terminology_shop_label = COALESCE(NULLIF($9, ''), terminology_shop_label),
			terminology_product_label = COALESCE(NULLIF($10, ''), terminology_product_label),
			modules = COALESCE($11, modules),
			features = COALESCE($12, features),
			updated_at = NOW()
		WHERE id = $13
		RETURNING id, name, address, photo_url, whatsapp, owner_id, timezone, business_type_id,
		          theme_primary_color, theme_secondary_color, theme_logo_url,
		          terminology_shop_label, terminology_product_label,
		          modules, features, status, created_at, updated_at
	`

	var s models.Shop
	var createdAt, updatedAt time.Time
	var modulesJSON, featuresJSON []byte

	// Handle optional JSON objects
	var modulesArg, featuresArg interface{}
	if shop.Modules != nil {
		modulesArg = string(shop.Modules)
	}
	if shop.Features != nil {
		featuresArg = string(shop.Features)
	}

	err := h.DB.QueryRow(query,
		shop.Name, shop.Address, shop.PhotoURL, shop.WhatsApp, shop.Timezone,
		shop.ThemePrimaryColor, shop.ThemeSecondaryColor, shop.ThemeLogoURL,
		shop.TerminologyShopLabel, shop.TerminologyProductLabel,
		modulesArg, featuresArg, id,
	).Scan(
		&s.ID, &s.Name, &s.Address, &s.PhotoURL, &s.WhatsApp,
		&s.OwnerID, &s.Timezone, &s.BusinessTypeID,
		&s.ThemePrimaryColor, &s.ThemeSecondaryColor, &s.ThemeLogoURL,
		&s.TerminologyShopLabel, &s.TerminologyProductLabel,
		&modulesJSON, &featuresJSON, &s.Status,
		&createdAt, &updatedAt,
	)
	if err == sql.ErrNoRows {
		jsonError(w, "Shop not found", http.StatusNotFound)
		return
	} else if err != nil {
		log.Printf("Error updating shop: %v", err)
		jsonError(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	s.Modules = modulesJSON
	s.Features = featuresJSON
	s.CreatedAt = &createdAt
	s.UpdatedAt = &updatedAt

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(s)
}

// GetShopMembers handles GET /api/shops/{id}/members
func (h *ShopHandler) GetShopMembers(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		jsonError(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Path: /api/shops/{id}/members
	path := strings.TrimPrefix(r.URL.Path, "/api/shops/")
	shopID := strings.TrimSuffix(path, "/members")

	query := `
		SELECT sm.shop_id, sm.user_id, sm.role_id, sm.role, sm.permissions, sm.added_at,
		       u.first_name, u.last_name, u.email, u.phone, u.photo_url
		FROM shop_members sm
		JOIN users u ON u.id = sm.user_id
		WHERE sm.shop_id = $1
		ORDER BY sm.added_at ASC
	`
	rows, err := h.DB.Query(query, shopID)
	if err != nil {
		log.Printf("Error querying members: %v", err)
		jsonError(w, "Internal server error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	type MemberWithUser struct {
		models.ShopMember
		FirstName string `json:"first_name"`
		LastName  string `json:"last_name"`
		Email     string `json:"email"`
		Phone     *string `json:"phone,omitempty"`
		PhotoURL  *string `json:"photo_url,omitempty"`
	}

	members := []MemberWithUser{}
	for rows.Next() {
		var m MemberWithUser
		var addedAt time.Time
		var permJSON []byte
		if err := rows.Scan(
			&m.ShopID, &m.UserID, &m.RoleID, &m.Role, &permJSON, &addedAt,
			&m.FirstName, &m.LastName, &m.Email, &m.Phone, &m.PhotoURL,
		); err != nil {
			continue
		}
		m.Permissions = permJSON
		m.AddedAt = &addedAt
		members = append(members, m)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(members)
}

// ApproveShop handles PUT /api/admin/shops/{id}/approve
// Updates shop status from pending to active
func (h *ShopHandler) ApproveShop(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPut {
		jsonError(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	id := strings.TrimPrefix(r.URL.Path, "/api/admin/shops/")
	id = strings.TrimSuffix(id, "/approve")
	id = strings.TrimSpace(id)

	if id == "" {
		jsonError(w, "Shop ID is required", http.StatusBadRequest)
		return
	}

	query := `UPDATE shops SET status = 'active', updated_at = NOW() WHERE id = $1 RETURNING id`
	var updatedID string
	err := h.DB.QueryRow(query, id).Scan(&updatedID)

	if err == sql.ErrNoRows {
		jsonError(w, "Shop not found", http.StatusNotFound)
		return
	} else if err != nil {
		log.Printf("Error approving shop: %v", err)
		jsonError(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Shop approved successfully"})
}

// jsonError is a shared helper to write JSON error responses
// jsonError es un helper compartido para escribir respuestas de error en JSON
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
