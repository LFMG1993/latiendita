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

// SupplierHandler handles supplier and purchase CRUD
type SupplierHandler struct {
	DB *sql.DB
}

func NewSupplierHandler(db *sql.DB) *SupplierHandler {
	return &SupplierHandler{DB: db}
}

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
	s.Name = strings.TrimSpace(s.Name)
	if s.Name == "" {
		jsonError(w, "Field 'name' is required", http.StatusBadRequest)
		return
	}
	s.ShopID = shopID

	query := `
		INSERT INTO suppliers (shop_id, name, contact_person, phone, email)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, created_at
	`
	var createdAt time.Time
	err := h.DB.QueryRow(query, s.ShopID, s.Name, s.ContactPerson, s.Phone, s.Email).
		Scan(&s.ID, &createdAt)
	if err != nil {
		log.Printf("Error creating supplier: %v", err)
		jsonError(w, "Error creating supplier", http.StatusInternalServerError)
		return
	}
	s.CreatedAt = &createdAt

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

	rows, err := h.DB.Query(`
		SELECT id, shop_id, name, contact_person, phone, email, purchase_count, created_at
		FROM suppliers WHERE shop_id = $1 ORDER BY name
	`, shopID)
	if err != nil {
		jsonError(w, "Internal server error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	suppliers := []models.Supplier{}
	for rows.Next() {
		var s models.Supplier
		var createdAt time.Time
		if err := rows.Scan(&s.ID, &s.ShopID, &s.Name, &s.ContactPerson, &s.Phone, &s.Email, &s.PurchaseCount, &createdAt); err != nil {
			continue
		}
		s.CreatedAt = &createdAt
		suppliers = append(suppliers, s)
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

	query := `
		UPDATE suppliers SET
			name = COALESCE(NULLIF($1,''), name),
			contact_person = $2,
			phone = $3,
			email = $4
		WHERE id = $5
		RETURNING id, shop_id, name, contact_person, phone, email, purchase_count, created_at
	`
	var updated models.Supplier
	var createdAt time.Time
	err := h.DB.QueryRow(query, s.Name, s.ContactPerson, s.Phone, s.Email, id).
		Scan(&updated.ID, &updated.ShopID, &updated.Name, &updated.ContactPerson, &updated.Phone, &updated.Email, &updated.PurchaseCount, &createdAt)
	if err == sql.ErrNoRows {
		jsonError(w, "Supplier not found", http.StatusNotFound)
		return
	} else if err != nil {
		jsonError(w, "Error updating supplier", http.StatusInternalServerError)
		return
	}
	updated.CreatedAt = &createdAt
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(updated)
}

// DeleteSupplier handles DELETE /api/shops/{shop_id}/suppliers/{id}
func (h *SupplierHandler) DeleteSupplier(w http.ResponseWriter, r *http.Request) {
	parts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
	id := parts[len(parts)-1]
	h.DB.Exec("DELETE FROM suppliers WHERE id = $1", id)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Supplier deleted"})
}

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

	if p.SupplierName == "" || p.InternalInvoiceNumber == "" || len(p.Items) == 0 {
		jsonError(w, "Fields 'supplier_name', 'internal_invoice_number' and 'items' are required", http.StatusBadRequest)
		return
	}

	// Begin transaction
	tx, err := h.DB.Begin()
	if err != nil {
		jsonError(w, "Internal server error", http.StatusInternalServerError)
		return
	}
	defer tx.Rollback()

	// Insert purchase header
	var createdAt time.Time
	err = tx.QueryRow(`
		INSERT INTO purchases (shop_id, supplier_id, supplier_name, invoice_number, internal_invoice_number, total, purchased_by_employee_id)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id, created_at
	`, p.ShopID, p.SupplierID, p.SupplierName, p.InvoiceNumber, p.InternalInvoiceNumber, p.Total, p.PurchasedByEmployeeID).
		Scan(&p.ID, &createdAt)
	if err != nil {
		if strings.Contains(err.Error(), "unique constraint") || strings.Contains(err.Error(), "duplicate key") {
			jsonError(w, "Invoice number already registered for this shop", http.StatusConflict)
			return
		}
		log.Printf("Error inserting purchase: %v", err)
		jsonError(w, "Error creating purchase", http.StatusInternalServerError)
		return
	}
	p.CreatedAt = &createdAt

	// Insert items and update stock
	for i, item := range p.Items {
		var itemID string
		err = tx.QueryRow(`
			INSERT INTO purchase_items (purchase_id, item_type, ingredient_id, product_id, name, purchase_unit, quantity, unit_cost, consumption_units_per_purchase_unit, supplier_id, supplier_name)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
			RETURNING id
		`, p.ID, item.ItemType, item.IngredientID, item.ProductID, item.Name, item.PurchaseUnit,
			item.Quantity, item.UnitCost, item.ConsumptionUnitsPerPurchaseUnit, item.SupplierID, item.SupplierName).
			Scan(&itemID)
		if err != nil {
			log.Printf("Error inserting purchase item: %v", err)
			jsonError(w, "Error creating purchase items", http.StatusInternalServerError)
			return
		}
		p.Items[i].ID = itemID
		p.Items[i].PurchaseID = p.ID

		// Update stock based on item type
		stockIncrease := item.Quantity * item.ConsumptionUnitsPerPurchaseUnit
		if item.ItemType == "ingredient" && item.IngredientID != nil {
			tx.Exec(`UPDATE ingredients SET stock = stock + $1, updated_at = NOW() WHERE id = $2`, stockIncrease, *item.IngredientID)
		} else if item.ItemType == "product" && item.ProductID != nil {
			tx.Exec(`UPDATE products SET stock = stock + $1, updated_at = NOW() WHERE id = $2`, item.Quantity, *item.ProductID)
		}
	}

	// Increment supplier purchase count if supplier_id is set
	if p.SupplierID != nil {
		tx.Exec(`UPDATE suppliers SET purchase_count = purchase_count + 1 WHERE id = $1`, *p.SupplierID)
	}

	if err := tx.Commit(); err != nil {
		jsonError(w, "Internal server error", http.StatusInternalServerError)
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

	rows, err := h.DB.Query(`
		SELECT id, shop_id, supplier_id, supplier_name, invoice_number, internal_invoice_number, total, purchased_by_employee_id, created_at
		FROM purchases WHERE shop_id = $1 ORDER BY created_at DESC
	`, shopID)
	if err != nil {
		jsonError(w, "Internal server error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	purchases := []models.Purchase{}
	for rows.Next() {
		var p models.Purchase
		var createdAt time.Time
		if err := rows.Scan(&p.ID, &p.ShopID, &p.SupplierID, &p.SupplierName, &p.InvoiceNumber, &p.InternalInvoiceNumber, &p.Total, &p.PurchasedByEmployeeID, &createdAt); err != nil {
			continue
		}
		p.CreatedAt = &createdAt
		purchases = append(purchases, p)
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(purchases)
}
