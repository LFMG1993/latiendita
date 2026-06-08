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

// SaleHandler handles POS sales
type SaleHandler struct {
	DB *sql.DB
}

func NewSaleHandler(db *sql.DB) *SaleHandler {
	return &SaleHandler{DB: db}
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

	if sale.EmployeeID == "" || sale.EmployeeName == "" || len(sale.Items) == 0 || len(sale.Payments) == 0 {
		jsonError(w, "Fields 'employee_id', 'employee_name', 'items' and 'payments' are required", http.StatusBadRequest)
		return
	}

	tx, err := h.DB.Begin()
	if err != nil {
		jsonError(w, "Internal server error", http.StatusInternalServerError)
		return
	}
	defer tx.Rollback()

	// Insert sale
	var createdAt time.Time
	err = tx.QueryRow(`
		INSERT INTO sales (shop_id, session_id, total, employee_id, employee_name, client_id, client_name, pending_debt)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id, created_at
	`, sale.ShopID, sale.SessionID, sale.Total, sale.EmployeeID, sale.EmployeeName,
		sale.ClientID, sale.ClientName, sale.PendingDebt).Scan(&sale.ID, &createdAt)
	if err != nil {
		log.Printf("Error creating sale: %v", err)
		jsonError(w, "Error creating sale", http.StatusInternalServerError)
		return
	}
	sale.CreatedAt = &createdAt

	// Insert items and deduct stock
	for i, item := range sale.Items {
		var itemID string
		if err := tx.QueryRow(`
			INSERT INTO sale_items (sale_id, product_id, product_name, quantity, unit_price, is_promotion, promotion_id)
			VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id
		`, sale.ID, item.ProductID, item.ProductName, item.Quantity, item.UnitPrice, item.IsPromotion, item.PromotionID).Scan(&itemID); err != nil {
			log.Printf("Error inserting sale item: %v", err)
			jsonError(w, "Error creating sale items", http.StatusInternalServerError)
			return
		}
		sale.Items[i].ID = itemID
		sale.Items[i].SaleID = sale.ID

		// Deduct stock from product (if not recipe-based)
		if item.ProductID != nil {
			tx.Exec(`UPDATE products SET stock = GREATEST(0, stock - $1), updated_at = NOW() WHERE id = $2`, item.Quantity, *item.ProductID)
		}
	}

	// Insert payments
	for i, payment := range sale.Payments {
		var payID string
		if err := tx.QueryRow(`
			INSERT INTO sale_payments (sale_id, method_id, method_name, amount, type)
			VALUES ($1, $2, $3, $4, $5) RETURNING id
		`, sale.ID, payment.MethodID, payment.MethodName, payment.Amount, payment.Type).Scan(&payID); err != nil {
			log.Printf("Error inserting sale payment: %v", err)
			jsonError(w, "Error creating sale payments", http.StatusInternalServerError)
			return
		}
		sale.Payments[i].ID = payID
		sale.Payments[i].SaleID = sale.ID
	}

	// If credit sale, update client debt in client_shop_accounts
	if sale.PendingDebt > 0 && sale.ClientID != nil {
		tx.Exec(`
			INSERT INTO client_shop_accounts (shop_id, client_id, debt)
			VALUES ($1, $2, $3)
			ON CONFLICT (shop_id, client_id) DO UPDATE SET debt = client_shop_accounts.debt + $3, updated_at = NOW()
		`, shopID, *sale.ClientID, sale.PendingDebt)
	}

	if err := tx.Commit(); err != nil {
		jsonError(w, "Internal server error", http.StatusInternalServerError)
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

	query := `
		SELECT id, shop_id, session_id, total, employee_id, employee_name, client_id, client_name, pending_debt, created_at
		FROM sales WHERE shop_id = $1
	`
	args := []interface{}{shopID}
	if from != "" && to != "" {
		query += " AND created_at >= $2 AND created_at <= $3"
		args = append(args, from, to)
	}
	query += " ORDER BY created_at DESC LIMIT 500"

	rows, err := h.DB.Query(query, args...)
	if err != nil {
		log.Printf("Error querying sales: %v", err)
		jsonError(w, "Internal server error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	sales := []models.Sale{}
	for rows.Next() {
		var s models.Sale
		var createdAt time.Time
		if err := rows.Scan(&s.ID, &s.ShopID, &s.SessionID, &s.Total, &s.EmployeeID, &s.EmployeeName, &s.ClientID, &s.ClientName, &s.PendingDebt, &createdAt); err != nil {
			continue
		}
		s.CreatedAt = &createdAt
		sales = append(sales, s)
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(sales)
}

// GetSaleDetails handles GET /api/sales/{id}
// Returns a single sale with its items and payments
func (h *SaleHandler) GetSaleDetails(w http.ResponseWriter, r *http.Request) {
	id := strings.TrimPrefix(r.URL.Path, "/api/sales/")

	var sale models.Sale
	var createdAt time.Time
	err := h.DB.QueryRow(`
		SELECT id, shop_id, session_id, total, employee_id, employee_name, client_id, client_name, pending_debt, created_at
		FROM sales WHERE id = $1
	`, id).Scan(&sale.ID, &sale.ShopID, &sale.SessionID, &sale.Total, &sale.EmployeeID, &sale.EmployeeName, &sale.ClientID, &sale.ClientName, &sale.PendingDebt, &createdAt)
	if err == sql.ErrNoRows {
		jsonError(w, "Sale not found", http.StatusNotFound)
		return
	} else if err != nil {
		jsonError(w, "Internal server error", http.StatusInternalServerError)
		return
	}
	sale.CreatedAt = &createdAt

	// Load items
	itemRows, _ := h.DB.Query(`SELECT id, sale_id, product_id, product_name, quantity, unit_price, is_promotion, promotion_id FROM sale_items WHERE sale_id = $1`, id)
	if itemRows != nil {
		defer itemRows.Close()
		for itemRows.Next() {
			var item models.SaleItem
			itemRows.Scan(&item.ID, &item.SaleID, &item.ProductID, &item.ProductName, &item.Quantity, &item.UnitPrice, &item.IsPromotion, &item.PromotionID)
			sale.Items = append(sale.Items, item)
		}
	}

	// Load payments
	payRows, _ := h.DB.Query(`SELECT id, sale_id, method_id, method_name, amount, type FROM sale_payments WHERE sale_id = $1`, id)
	if payRows != nil {
		defer payRows.Close()
		for payRows.Next() {
			var pay models.SalePayment
			payRows.Scan(&pay.ID, &pay.SaleID, &pay.MethodID, &pay.MethodName, &pay.Amount, &pay.Type)
			sale.Payments = append(sale.Payments, pay)
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(sale)
}
