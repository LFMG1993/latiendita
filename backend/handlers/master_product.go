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

// MasterProductHandler handles master catalog and product request operations
type MasterProductHandler struct {
	DB *sql.DB
}

func NewMasterProductHandler(db *sql.DB) *MasterProductHandler {
	return &MasterProductHandler{DB: db}
}

// ---- MASTER CATALOG (Super Admin) ----

// GetAllMasterProducts handles GET /api/admin/master-products
// Supports optional ?q=search and ?category=filter
func (h *MasterProductHandler) GetAllMasterProducts(w http.ResponseWriter, r *http.Request) {
	q := strings.TrimSpace(r.URL.Query().Get("q"))
	category := strings.TrimSpace(r.URL.Query().Get("category"))

	query := `
		SELECT id, name, brand, barcode, description, image_url, business_type_id, category, created_at, updated_at
		FROM master_products
		WHERE ($1 = '' OR name ILIKE '%' || $1 || '%' OR brand ILIKE '%' || $1 || '%' OR barcode ILIKE '%' || $1 || '%')
		  AND ($2 = '' OR category ILIKE $2)
		ORDER BY category, name
	`
	rows, err := h.DB.Query(query, q, category)
	if err != nil {
		log.Printf("Error querying master_products: %v", err)
		jsonError(w, "Internal server error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	products := []models.MasterProduct{}
	for rows.Next() {
		var p models.MasterProduct
		var createdAt, updatedAt time.Time
		if err := rows.Scan(
			&p.ID, &p.Name, &p.Brand, &p.Barcode, &p.Description,
			&p.ImageURL, &p.BusinessTypeID, &p.Category,
			&createdAt, &updatedAt,
		); err != nil {
			log.Printf("Error scanning master_product: %v", err)
			continue
		}
		p.CreatedAt = &createdAt
		p.UpdatedAt = &updatedAt
		products = append(products, p)
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
	p.Name = strings.TrimSpace(p.Name)
	p.Category = strings.TrimSpace(p.Category)
	if p.Name == "" || p.Category == "" {
		jsonError(w, "Fields 'name' and 'category' are required", http.StatusBadRequest)
		return
	}

	query := `
		INSERT INTO master_products (name, brand, barcode, description, image_url, business_type_id, category)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id, created_at, updated_at
	`
	var createdAt, updatedAt time.Time
	err := h.DB.QueryRow(query,
		p.Name, p.Brand, p.Barcode, p.Description,
		p.ImageURL, p.BusinessTypeID, p.Category,
	).Scan(&p.ID, &createdAt, &updatedAt)
	if err != nil {
		log.Printf("Error creating master_product: %v", err)
		if strings.Contains(err.Error(), "unique") {
			jsonError(w, "A product with this barcode already exists", http.StatusConflict)
			return
		}
		jsonError(w, "Error creating product", http.StatusInternalServerError)
		return
	}
	p.CreatedAt = &createdAt
	p.UpdatedAt = &updatedAt

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

	query := `
		UPDATE master_products SET
			name = COALESCE(NULLIF($1,''), name),
			brand = $2,
			barcode = $3,
			description = $4,
			image_url = $5,
			business_type_id = $6,
			category = COALESCE(NULLIF($7,''), category),
			updated_at = NOW()
		WHERE id = $8
		RETURNING id, name, brand, barcode, description, image_url, business_type_id, category, created_at, updated_at
	`
	var updated models.MasterProduct
	var createdAt, updatedAt time.Time
	err := h.DB.QueryRow(query,
		p.Name, p.Brand, p.Barcode, p.Description,
		p.ImageURL, p.BusinessTypeID, p.Category, id,
	).Scan(
		&updated.ID, &updated.Name, &updated.Brand, &updated.Barcode,
		&updated.Description, &updated.ImageURL, &updated.BusinessTypeID, &updated.Category,
		&createdAt, &updatedAt,
	)
	if err == sql.ErrNoRows {
		jsonError(w, "Product not found", http.StatusNotFound)
		return
	} else if err != nil {
		log.Printf("Error updating master_product: %v", err)
		jsonError(w, "Error updating product", http.StatusInternalServerError)
		return
	}
	updated.CreatedAt = &createdAt
	updated.UpdatedAt = &updatedAt

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(updated)
}

// DeleteMasterProduct handles DELETE /api/admin/master-products/{id}
func (h *MasterProductHandler) DeleteMasterProduct(w http.ResponseWriter, r *http.Request) {
	parts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
	id := parts[len(parts)-1]

	_, err := h.DB.Exec("DELETE FROM master_products WHERE id = $1", id)
	if err != nil {
		log.Printf("Error deleting master_product: %v", err)
		jsonError(w, "Error deleting product", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Product deleted from catalog"})
}

// SearchMasterProducts handles GET /api/master-products/search?q=query
// Used by shop owners to search the global catalog
func (h *MasterProductHandler) SearchMasterProducts(w http.ResponseWriter, r *http.Request) {
	q := strings.TrimSpace(r.URL.Query().Get("q"))
	if q == "" {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode([]models.MasterProduct{})
		return
	}

	query := `
		SELECT id, name, brand, barcode, description, image_url, business_type_id, category, created_at, updated_at
		FROM master_products
		WHERE name ILIKE '%' || $1 || '%'
		   OR brand ILIKE '%' || $1 || '%'
		   OR barcode = $1
		ORDER BY name
		LIMIT 20
	`
	rows, err := h.DB.Query(query, q)
	if err != nil {
		log.Printf("Error searching master_products: %v", err)
		jsonError(w, "Internal server error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	products := []models.MasterProduct{}
	for rows.Next() {
		var p models.MasterProduct
		var createdAt, updatedAt time.Time
		if err := rows.Scan(
			&p.ID, &p.Name, &p.Brand, &p.Barcode, &p.Description,
			&p.ImageURL, &p.BusinessTypeID, &p.Category,
			&createdAt, &updatedAt,
		); err != nil {
			continue
		}
		p.CreatedAt = &createdAt
		p.UpdatedAt = &updatedAt
		products = append(products, p)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(products)
}

// ---- PRODUCT REQUESTS (Shop Owner → Super Admin) ----

// GetProductRequests handles GET /api/admin/product-requests
// Lists all pending/resolved product requests (Super Admin only)
func (h *MasterProductHandler) GetProductRequests(w http.ResponseWriter, r *http.Request) {
	status := r.URL.Query().Get("status") // optional filter

	query := `
		SELECT pr.id, pr.shop_id, s.name as shop_name, pr.requested_by_user_id,
		       pr.requested_name, pr.requested_brand, pr.requested_barcode,
		       pr.requested_category, pr.requested_description, pr.requested_image_url,
		       pr.status, pr.admin_notes, pr.created_at, pr.updated_at
		FROM master_product_requests pr
		JOIN shops s ON s.id = pr.shop_id
		WHERE ($1 = '' OR pr.status = $1)
		ORDER BY pr.created_at DESC
	`
	rows, err := h.DB.Query(query, status)
	if err != nil {
		log.Printf("Error querying product_requests: %v", err)
		jsonError(w, "Internal server error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	requests := []models.MasterProductRequest{}
	for rows.Next() {
		var req models.MasterProductRequest
		var createdAt, updatedAt time.Time
		if err := rows.Scan(
			&req.ID, &req.ShopID, &req.ShopName, &req.RequestedByUserID,
			&req.RequestedName, &req.RequestedBrand, &req.RequestedBarcode,
			&req.RequestedCategory, &req.RequestedDescription, &req.RequestedImageURL,
			&req.Status, &req.AdminNotes,
			&createdAt, &updatedAt,
		); err != nil {
			log.Printf("Error scanning product_request: %v", err)
			continue
		}
		req.CreatedAt = &createdAt
		req.UpdatedAt = &updatedAt
		requests = append(requests, req)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(requests)
}

// CreateProductRequest handles POST /api/shops/{shop_id}/product-requests
// Shop owner submits a new product request
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
	req.RequestedName = strings.TrimSpace(req.RequestedName)
	if req.RequestedName == "" {
		jsonError(w, "Field 'requested_name' is required", http.StatusBadRequest)
		return
	}

	query := `
		INSERT INTO master_product_requests
		    (shop_id, requested_by_user_id, requested_name, requested_brand,
		     requested_barcode, requested_category, requested_description, requested_image_url)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING id, status, created_at, updated_at
	`
	var createdAt, updatedAt time.Time
	err := h.DB.QueryRow(query,
		req.ShopID, req.RequestedByUserID, req.RequestedName, req.RequestedBrand,
		req.RequestedBarcode, req.RequestedCategory, req.RequestedDescription, req.RequestedImageURL,
	).Scan(&req.ID, &req.Status, &createdAt, &updatedAt)
	if err != nil {
		log.Printf("Error creating product_request: %v", err)
		jsonError(w, "Error creating request", http.StatusInternalServerError)
		return
	}
	req.CreatedAt = &createdAt
	req.UpdatedAt = &updatedAt

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(req)
}

// ApproveProductRequest handles PUT /api/admin/product-requests/{id}/approve
// Super Admin approves the request, creating the product in the master catalog
func (h *MasterProductHandler) ApproveProductRequest(w http.ResponseWriter, r *http.Request) {
	id := strings.TrimSuffix(
		strings.TrimPrefix(r.URL.Path, "/api/admin/product-requests/"),
		"/approve",
	)

	// Decode optional adjustments from the admin
	var adjustments struct {
		Name        string  `json:"name"`
		Brand       *string `json:"brand"`
		Barcode     *string `json:"barcode"`
		Category    string  `json:"category"`
		Description *string `json:"description"`
		ImageURL    *string `json:"image_url"`
		AdminNotes  *string `json:"admin_notes"`
	}
	json.NewDecoder(r.Body).Decode(&adjustments)

	tx, err := h.DB.Begin()
	if err != nil {
		jsonError(w, "Internal server error", http.StatusInternalServerError)
		return
	}
	defer tx.Rollback()

	// Fetch the original request
	var req models.MasterProductRequest
	err = tx.QueryRow(`
		SELECT requested_name, requested_brand, requested_barcode, requested_category,
		       requested_description, requested_image_url
		FROM master_product_requests WHERE id = $1
	`, id).Scan(
		&req.RequestedName, &req.RequestedBrand, &req.RequestedBarcode,
		&req.RequestedCategory, &req.RequestedDescription, &req.RequestedImageURL,
	)
	if err == sql.ErrNoRows {
		jsonError(w, "Request not found", http.StatusNotFound)
		return
	} else if err != nil {
		log.Printf("Error fetching product_request: %v", err)
		jsonError(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	// Use admin overrides if provided, otherwise use original values
	finalName := req.RequestedName
	if adjustments.Name != "" {
		finalName = adjustments.Name
	}
	finalCategory := ""
	if req.RequestedCategory != nil {
		finalCategory = *req.RequestedCategory
	}
	if adjustments.Category != "" {
		finalCategory = adjustments.Category
	}
	if finalCategory == "" {
		finalCategory = "General"
	}

	// Insert into master_products
	var masterProductID string
	err = tx.QueryRow(`
		INSERT INTO master_products (name, brand, barcode, description, image_url, category)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id
	`,
		finalName,
		coalesceStr(adjustments.Brand, req.RequestedBrand),
		coalesceStr(adjustments.Barcode, req.RequestedBarcode),
		coalesceStr(adjustments.Description, req.RequestedDescription),
		coalesceStr(adjustments.ImageURL, req.RequestedImageURL),
		finalCategory,
	).Scan(&masterProductID)
	if err != nil {
		log.Printf("Error inserting into master_products: %v", err)
		if strings.Contains(err.Error(), "unique") {
			jsonError(w, "A product with this barcode already exists in the catalog", http.StatusConflict)
			return
		}
		jsonError(w, "Error creating product in catalog", http.StatusInternalServerError)
		return
	}

	// Update request status to approved
	_, err = tx.Exec(`
		UPDATE master_product_requests
		SET status = 'approved', admin_notes = $1, updated_at = NOW()
		WHERE id = $2
	`, adjustments.AdminNotes, id)
	if err != nil {
		log.Printf("Error approving product_request: %v", err)
		jsonError(w, "Error approving request", http.StatusInternalServerError)
		return
	}

	if err := tx.Commit(); err != nil {
		jsonError(w, "Internal server error", http.StatusInternalServerError)
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
	id := strings.TrimSuffix(
		strings.TrimPrefix(r.URL.Path, "/api/admin/product-requests/"),
		"/reject",
	)

	var body struct {
		AdminNotes *string `json:"admin_notes"`
	}
	json.NewDecoder(r.Body).Decode(&body)

	_, err := h.DB.Exec(`
		UPDATE master_product_requests
		SET status = 'rejected', admin_notes = $1, updated_at = NOW()
		WHERE id = $2
	`, body.AdminNotes, id)
	if err != nil {
		log.Printf("Error rejecting product_request: %v", err)
		jsonError(w, "Error rejecting request", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Request rejected"})
}

// GetShopProductRequests handles GET /api/shops/{shop_id}/product-requests
// Returns requests submitted by a specific shop
func (h *MasterProductHandler) GetShopProductRequests(w http.ResponseWriter, r *http.Request) {
	shopID := extractShopID(r.URL.Path, "/product-requests")
	if shopID == "" {
		jsonError(w, "shop_id required", http.StatusBadRequest)
		return
	}

	rows, err := h.DB.Query(`
		SELECT id, shop_id, requested_by_user_id, requested_name, requested_brand,
		       requested_barcode, requested_category, requested_description, requested_image_url,
		       status, admin_notes, created_at, updated_at
		FROM master_product_requests
		WHERE shop_id = $1
		ORDER BY created_at DESC
	`, shopID)
	if err != nil {
		jsonError(w, "Internal server error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	requests := []models.MasterProductRequest{}
	for rows.Next() {
		var req models.MasterProductRequest
		var createdAt, updatedAt time.Time
		if err := rows.Scan(
			&req.ID, &req.ShopID, &req.RequestedByUserID,
			&req.RequestedName, &req.RequestedBrand, &req.RequestedBarcode,
			&req.RequestedCategory, &req.RequestedDescription, &req.RequestedImageURL,
			&req.Status, &req.AdminNotes,
			&createdAt, &updatedAt,
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

// coalesceStr returns the first non-nil string pointer, or nil
func coalesceStr(a, b *string) *string {
	if a != nil {
		return a
	}
	return b
}
