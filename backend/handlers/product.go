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

// ProductHandler handles product and ingredient CRUD
type ProductHandler struct {
	DB *sql.DB
}

func NewProductHandler(db *sql.DB) *ProductHandler {
	return &ProductHandler{DB: db}
}

// ---- PRODUCTS ----

// CreateProduct handles POST /api/shops/{shop_id}/products
func (h *ProductHandler) CreateProduct(w http.ResponseWriter, r *http.Request) {
	shopID := extractShopID(r.URL.Path, "/products")
	if shopID == "" {
		jsonError(w, "shop_id required in path", http.StatusBadRequest)
		return
	}

	var p models.Product
	if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
		jsonError(w, "Invalid JSON", http.StatusBadRequest)
		return
	}
	p.Name = strings.TrimSpace(p.Name)
	p.Category = strings.TrimSpace(p.Category)
	if p.Name == "" || p.Category == "" || p.Price <= 0 {
		jsonError(w, "Fields 'name', 'category' and 'price' are required", http.StatusBadRequest)
		return
	}
	p.ShopID = shopID
	p.IsAvailable = true

	query := `
		INSERT INTO products (shop_id, master_product_id, name, price, category, cost, stock, image_url, description, is_available)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
		RETURNING id, created_at, updated_at
	`
	var createdAt, updatedAt time.Time
	err := h.DB.QueryRow(query,
		p.ShopID, p.MasterProductID, p.Name, p.Price, p.Category,
		p.Cost, p.Stock, p.ImageURL, p.Description, p.IsAvailable,
	).Scan(&p.ID, &createdAt, &updatedAt)
	if err != nil {
		log.Printf("Error creating product: %v", err)
		jsonError(w, "Error creating product", http.StatusInternalServerError)
		return
	}
	p.CreatedAt = &createdAt
	p.UpdatedAt = &updatedAt

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(p)
}

// GetProducts handles GET /api/shops/{shop_id}/products
func (h *ProductHandler) GetProducts(w http.ResponseWriter, r *http.Request) {
	shopID := extractShopID(r.URL.Path, "/products")
	if shopID == "" {
		jsonError(w, "shop_id required in path", http.StatusBadRequest)
		return
	}

	query := `
		SELECT id, shop_id, master_product_id, name, price, category, cost, stock,
		       image_url, description, is_available, created_at, updated_at
		FROM products WHERE shop_id = $1
		ORDER BY category, name
	`
	rows, err := h.DB.Query(query, shopID)
	if err != nil {
		log.Printf("Error querying products: %v", err)
		jsonError(w, "Internal server error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	products := []models.Product{}
	for rows.Next() {
		var p models.Product
		var createdAt, updatedAt time.Time
		if err := rows.Scan(
			&p.ID, &p.ShopID, &p.MasterProductID, &p.Name, &p.Price, &p.Category,
			&p.Cost, &p.Stock, &p.ImageURL, &p.Description, &p.IsAvailable,
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

// UpdateProduct handles PUT /api/shops/{shop_id}/products/{id}
func (h *ProductHandler) UpdateProduct(w http.ResponseWriter, r *http.Request) {
	parts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
	// Expected: api/shops/{shop_id}/products/{id}
	if len(parts) < 5 {
		jsonError(w, "Invalid path", http.StatusBadRequest)
		return
	}
	productID := parts[len(parts)-1]

	var p models.Product
	if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
		jsonError(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	query := `
		UPDATE products SET
			name = COALESCE(NULLIF($1,''), name),
			price = CASE WHEN $2 > 0 THEN $2 ELSE price END,
			category = COALESCE(NULLIF($3,''), category),
			cost = $4,
			stock = $5,
			image_url = $6,
			description = $7,
			is_available = $8,
			updated_at = NOW()
		WHERE id = $9
		RETURNING id, shop_id, master_product_id, name, price, category, cost, stock,
		          image_url, description, is_available, created_at, updated_at
	`
	var updated models.Product
	var createdAt, updatedAt time.Time
	err := h.DB.QueryRow(query,
		p.Name, p.Price, p.Category, p.Cost, p.Stock,
		p.ImageURL, p.Description, p.IsAvailable, productID,
	).Scan(
		&updated.ID, &updated.ShopID, &updated.MasterProductID,
		&updated.Name, &updated.Price, &updated.Category,
		&updated.Cost, &updated.Stock, &updated.ImageURL, &updated.Description, &updated.IsAvailable,
		&createdAt, &updatedAt,
	)
	if err == sql.ErrNoRows {
		jsonError(w, "Product not found", http.StatusNotFound)
		return
	} else if err != nil {
		log.Printf("Error updating product: %v", err)
		jsonError(w, "Error updating product", http.StatusInternalServerError)
		return
	}
	updated.CreatedAt = &createdAt
	updated.UpdatedAt = &updatedAt

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(updated)
}

// DeleteProduct handles DELETE /api/shops/{shop_id}/products/{id}
func (h *ProductHandler) DeleteProduct(w http.ResponseWriter, r *http.Request) {
	parts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
	productID := parts[len(parts)-1]

	_, err := h.DB.Exec("DELETE FROM products WHERE id = $1", productID)
	if err != nil {
		log.Printf("Error deleting product: %v", err)
		jsonError(w, "Error deleting product", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Product deleted"})
}

// ---- INGREDIENTS ----

// CreateIngredient handles POST /api/shops/{shop_id}/ingredients
func (h *ProductHandler) CreateIngredient(w http.ResponseWriter, r *http.Request) {
	shopID := extractShopID(r.URL.Path, "/ingredients")
	if shopID == "" {
		jsonError(w, "shop_id required in path", http.StatusBadRequest)
		return
	}

	var ing models.Ingredient
	if err := json.NewDecoder(r.Body).Decode(&ing); err != nil {
		jsonError(w, "Invalid JSON", http.StatusBadRequest)
		return
	}
	ing.ShopID = shopID

	if ing.Name == "" || ing.Category == "" || ing.PurchaseUnit == "" || ing.ConsumptionUnit == "" {
		jsonError(w, "Fields 'name', 'category', 'purchase_unit', 'consumption_unit' are required", http.StatusBadRequest)
		return
	}

	query := `
		INSERT INTO ingredients (shop_id, name, category, purchase_unit, consumption_unit, consumption_units_per_purchase_unit, stock)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id, created_at, updated_at
	`
	var createdAt, updatedAt time.Time
	err := h.DB.QueryRow(query,
		ing.ShopID, ing.Name, ing.Category, ing.PurchaseUnit,
		ing.ConsumptionUnit, ing.ConsumptionUnitsPerPurchaseUnit, ing.Stock,
	).Scan(&ing.ID, &createdAt, &updatedAt)
	if err != nil {
		log.Printf("Error creating ingredient: %v", err)
		jsonError(w, "Error creating ingredient", http.StatusInternalServerError)
		return
	}
	ing.CreatedAt = &createdAt
	ing.UpdatedAt = &updatedAt

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(ing)
}

// GetIngredients handles GET /api/shops/{shop_id}/ingredients
func (h *ProductHandler) GetIngredients(w http.ResponseWriter, r *http.Request) {
	shopID := extractShopID(r.URL.Path, "/ingredients")
	if shopID == "" {
		jsonError(w, "shop_id required in path", http.StatusBadRequest)
		return
	}

	rows, err := h.DB.Query(`
		SELECT id, shop_id, name, category, purchase_unit, consumption_unit,
		       consumption_units_per_purchase_unit, stock, created_at, updated_at
		FROM ingredients WHERE shop_id = $1
		ORDER BY category, name
	`, shopID)
	if err != nil {
		jsonError(w, "Internal server error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	ings := []models.Ingredient{}
	for rows.Next() {
		var ing models.Ingredient
		var createdAt, updatedAt time.Time
		if err := rows.Scan(
			&ing.ID, &ing.ShopID, &ing.Name, &ing.Category,
			&ing.PurchaseUnit, &ing.ConsumptionUnit,
			&ing.ConsumptionUnitsPerPurchaseUnit, &ing.Stock,
			&createdAt, &updatedAt,
		); err != nil {
			continue
		}
		ing.CreatedAt = &createdAt
		ing.UpdatedAt = &updatedAt
		ings = append(ings, ing)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(ings)
}

// UpdateIngredient handles PUT /api/shops/{shop_id}/ingredients/{id}
func (h *ProductHandler) UpdateIngredient(w http.ResponseWriter, r *http.Request) {
	parts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
	ingredientID := parts[len(parts)-1]

	var ing models.Ingredient
	if err := json.NewDecoder(r.Body).Decode(&ing); err != nil {
		jsonError(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	query := `
		UPDATE ingredients SET
			name = COALESCE(NULLIF($1,''), name),
			category = COALESCE(NULLIF($2,''), category),
			purchase_unit = COALESCE(NULLIF($3,''), purchase_unit),
			consumption_unit = COALESCE(NULLIF($4,''), consumption_unit),
			consumption_units_per_purchase_unit = CASE WHEN $5 > 0 THEN $5 ELSE consumption_units_per_purchase_unit END,
			stock = $6,
			updated_at = NOW()
		WHERE id = $7
		RETURNING id, shop_id, name, category, purchase_unit, consumption_unit,
		          consumption_units_per_purchase_unit, stock, created_at, updated_at
	`
	var updated models.Ingredient
	var createdAt, updatedAt time.Time
	err := h.DB.QueryRow(query,
		ing.Name, ing.Category, ing.PurchaseUnit, ing.ConsumptionUnit,
		ing.ConsumptionUnitsPerPurchaseUnit, ing.Stock, ingredientID,
	).Scan(
		&updated.ID, &updated.ShopID, &updated.Name, &updated.Category,
		&updated.PurchaseUnit, &updated.ConsumptionUnit,
		&updated.ConsumptionUnitsPerPurchaseUnit, &updated.Stock,
		&createdAt, &updatedAt,
	)
	if err == sql.ErrNoRows {
		jsonError(w, "Ingredient not found", http.StatusNotFound)
		return
	} else if err != nil {
		log.Printf("Error updating ingredient: %v", err)
		jsonError(w, "Error updating ingredient", http.StatusInternalServerError)
		return
	}
	updated.CreatedAt = &createdAt
	updated.UpdatedAt = &updatedAt

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(updated)
}

// DeleteIngredient handles DELETE /api/shops/{shop_id}/ingredients/{id}
func (h *ProductHandler) DeleteIngredient(w http.ResponseWriter, r *http.Request) {
	parts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
	id := parts[len(parts)-1]
	h.DB.Exec("DELETE FROM ingredients WHERE id = $1", id)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Ingredient deleted"})
}

// extractShopID extracts the shop_id from paths like /api/shops/{shop_id}/products
func extractShopID(path, suffix string) string {
	// Trim the suffix endpoint from the path
	trimmed := strings.TrimSuffix(path, suffix)
	// Also trim any trailing /
	trimmed = strings.TrimSuffix(trimmed, "/")
	// Get last segment
	parts := strings.Split(trimmed, "/")
	if len(parts) == 0 {
		return ""
	}
	return parts[len(parts)-1]
}
