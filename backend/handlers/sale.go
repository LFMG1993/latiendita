package handlers

import (
	"encoding/json"
<<<<<<< HEAD
=======
	"fmt"
	"log"
>>>>>>> refs/remotes/origin/main
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
	clientID := r.URL.Query().Get("client_id")

<<<<<<< HEAD
	sales, err := h.saleService.GetSalesByShop(shopID, from, to)
=======
	query := `
		SELECT id, shop_id, session_id, total, employee_id, employee_name, client_id, client_name, pending_debt, created_at
		FROM sales WHERE shop_id = $1
	`
	args := []interface{}{shopID}
	
	if clientID != "" {
		args = append(args, clientID)
		query += " AND client_id = $" + fmt.Sprint(len(args))
	}

	if from != "" && to != "" {
		args = append(args, from+" 00:00:00", to+" 23:59:59")
		query += " AND created_at >= $" + fmt.Sprint(len(args)-1) + " AND created_at <= $" + fmt.Sprint(len(args))
	}
	query += " ORDER BY created_at DESC LIMIT 500"

	rows, err := h.DB.Query(query, args...)
>>>>>>> refs/remotes/origin/main
	if err != nil {
		jsonError(w, "Internal server error", http.StatusInternalServerError)
		return
	}

<<<<<<< HEAD
=======
	sales := []models.Sale{}
	var saleIDs []string
	for rows.Next() {
		var s models.Sale
		var createdAt time.Time
		if err := rows.Scan(&s.ID, &s.ShopID, &s.SessionID, &s.Total, &s.EmployeeID, &s.EmployeeName, &s.ClientID, &s.ClientName, &s.PendingDebt, &createdAt); err != nil {
			continue
		}
		s.CreatedAt = &createdAt
		sales = append(sales, s)
		saleIDs = append(saleIDs, s.ID)
	}

	if len(saleIDs) > 0 {
		// Load items
		argsIDs := make([]interface{}, len(saleIDs))
		for i, id := range saleIDs {
			argsIDs[i] = id
		}
		placeholders := make([]string, len(saleIDs))
		for i := range saleIDs {
			// e.g. $1, $2
			placeholders[i] = "$" + string(rune('1'+i))
		}
		// A simpler way for PostgreSQL IN clause is using ANY($1) with an array, but we can do a loop since it's standard sql.
		// Let's just do a simple query for each, or use a map
	}

	// Fetch items and payments for the sales
	// Doing it in simple loops since N won't be huge, or use IN clause.
	// Since PostgreSQL driver supports pq.Array, but we are using standard sql...
	// A simpler approach: Just loop and fetch.
	for i := range sales {
		saleID := sales[i].ID
		// Load items
		itemRows, _ := h.DB.Query(`SELECT id, sale_id, product_id, product_name, quantity, unit_price, is_promotion, promotion_id FROM sale_items WHERE sale_id = $1`, saleID)
		if itemRows != nil {
			for itemRows.Next() {
				var item models.SaleItem
				itemRows.Scan(&item.ID, &item.SaleID, &item.ProductID, &item.ProductName, &item.Quantity, &item.UnitPrice, &item.IsPromotion, &item.PromotionID)
				sales[i].Items = append(sales[i].Items, item)
			}
			itemRows.Close()
		}

		// Load payments
		payRows, _ := h.DB.Query(`SELECT id, sale_id, method_id, method_name, amount, type FROM sale_payments WHERE sale_id = $1`, saleID)
		if payRows != nil {
			for payRows.Next() {
				var pay models.SalePayment
				payRows.Scan(&pay.ID, &pay.SaleID, &pay.MethodID, &pay.MethodName, &pay.Amount, &pay.Type)
				sales[i].Payments = append(sales[i].Payments, pay)
			}
			payRows.Close()
		}
	}

>>>>>>> refs/remotes/origin/main
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

	query := `
		SELECT id, shop_id, session_id, total, employee_id, employee_name, client_id, client_name, pending_debt, created_at
		FROM sales WHERE client_id = $1 ORDER BY created_at DESC LIMIT 500
	`
	rows, err := h.DB.Query(query, clientID)
	if err != nil {
		log.Printf("Error querying client sales: %v", err)
		jsonError(w, "Internal server error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	sales := []models.Sale{}
	var saleIDs []string
	for rows.Next() {
		var s models.Sale
		var createdAt time.Time
		if err := rows.Scan(&s.ID, &s.ShopID, &s.SessionID, &s.Total, &s.EmployeeID, &s.EmployeeName, &s.ClientID, &s.ClientName, &s.PendingDebt, &createdAt); err != nil {
			continue
		}
		s.CreatedAt = &createdAt
		sales = append(sales, s)
		saleIDs = append(saleIDs, s.ID)
	}

	// Fetch items and payments for the sales
	for i := range sales {
		saleID := sales[i].ID
		itemRows, _ := h.DB.Query(`SELECT id, sale_id, product_id, product_name, quantity, unit_price, is_promotion, promotion_id FROM sale_items WHERE sale_id = $1`, saleID)
		if itemRows != nil {
			for itemRows.Next() {
				var item models.SaleItem
				itemRows.Scan(&item.ID, &item.SaleID, &item.ProductID, &item.ProductName, &item.Quantity, &item.UnitPrice, &item.IsPromotion, &item.PromotionID)
				sales[i].Items = append(sales[i].Items, item)
			}
			itemRows.Close()
		}

		payRows, _ := h.DB.Query(`SELECT id, sale_id, method_id, method_name, amount, type FROM sale_payments WHERE sale_id = $1`, saleID)
		if payRows != nil {
			for payRows.Next() {
				var pay models.SalePayment
				payRows.Scan(&pay.ID, &pay.SaleID, &pay.MethodID, &pay.MethodName, &pay.Amount, &pay.Type)
				sales[i].Payments = append(sales[i].Payments, pay)
			}
			payRows.Close()
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(sales)
}
