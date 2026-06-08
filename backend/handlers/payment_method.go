package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"

	"backend/models"
)

// PaymentMethodHandler handles payment methods and promotions
type PaymentMethodHandler struct {
	DB *sql.DB
}

func NewPaymentMethodHandler(db *sql.DB) *PaymentMethodHandler {
	return &PaymentMethodHandler{DB: db}
}

// intArrayToLiteral converts []int to PostgreSQL array literal "{0,1,2}"
func intArrayToLiteral(arr []int) string {
	if len(arr) == 0 {
		return "{}"
	}
	parts := make([]string, len(arr))
	for i, v := range arr {
		parts[i] = fmt.Sprintf("%d", v)
	}
	return "{" + strings.Join(parts, ",") + "}"
}

// ---- PAYMENT METHODS ----

func (h *PaymentMethodHandler) CreatePaymentMethod(w http.ResponseWriter, r *http.Request) {
	shopID := extractShopID(r.URL.Path, "/payment-methods")
	if shopID == "" {
		jsonError(w, "shop_id required", http.StatusBadRequest)
		return
	}

	var pm models.PaymentMethod
	if err := json.NewDecoder(r.Body).Decode(&pm); err != nil {
		jsonError(w, "Invalid JSON", http.StatusBadRequest)
		return
	}
	pm.Name = strings.TrimSpace(pm.Name)
	if pm.Name == "" || pm.Type == "" {
		jsonError(w, "Fields 'name' and 'type' are required", http.StatusBadRequest)
		return
	}
	pm.ShopID = shopID
	pm.Enabled = true

	var createdAt time.Time
	err := h.DB.QueryRow(`
		INSERT INTO payment_methods (shop_id, name, type, enabled, account_details)
		VALUES ($1, $2, $3, $4, $5) RETURNING id, created_at
	`, pm.ShopID, pm.Name, pm.Type, pm.Enabled, pm.AccountDetails).Scan(&pm.ID, &createdAt)
	if err != nil {
		if strings.Contains(err.Error(), "duplicate") || strings.Contains(err.Error(), "unique") {
			jsonError(w, "Payment method name already exists for this shop", http.StatusConflict)
			return
		}
		log.Printf("Error creating payment method: %v", err)
		jsonError(w, "Error creating payment method", http.StatusInternalServerError)
		return
	}
	pm.CreatedAt = &createdAt
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(pm)
}

func (h *PaymentMethodHandler) GetPaymentMethods(w http.ResponseWriter, r *http.Request) {
	shopID := extractShopID(r.URL.Path, "/payment-methods")
	if shopID == "" {
		jsonError(w, "shop_id required", http.StatusBadRequest)
		return
	}

	rows, err := h.DB.Query(`
		SELECT id, shop_id, name, type, enabled, account_details, created_at
		FROM payment_methods WHERE shop_id = $1 ORDER BY name
	`, shopID)
	if err != nil {
		jsonError(w, "Internal server error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	methods := []models.PaymentMethod{}
	for rows.Next() {
		var pm models.PaymentMethod
		var createdAt time.Time
		if err := rows.Scan(&pm.ID, &pm.ShopID, &pm.Name, &pm.Type, &pm.Enabled, &pm.AccountDetails, &createdAt); err != nil {
			continue
		}
		pm.CreatedAt = &createdAt
		methods = append(methods, pm)
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(methods)
}

func (h *PaymentMethodHandler) UpdatePaymentMethod(w http.ResponseWriter, r *http.Request) {
	parts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
	id := parts[len(parts)-1]

	var pm models.PaymentMethod
	if err := json.NewDecoder(r.Body).Decode(&pm); err != nil {
		jsonError(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	var updated models.PaymentMethod
	var createdAt time.Time
	err := h.DB.QueryRow(`
		UPDATE payment_methods SET
			name = COALESCE(NULLIF($1,''), name),
			type = COALESCE(NULLIF($2,''), type),
			enabled = $3, account_details = $4
		WHERE id = $5
		RETURNING id, shop_id, name, type, enabled, account_details, created_at
	`, pm.Name, pm.Type, pm.Enabled, pm.AccountDetails, id).
		Scan(&updated.ID, &updated.ShopID, &updated.Name, &updated.Type, &updated.Enabled, &updated.AccountDetails, &createdAt)
	if err == sql.ErrNoRows {
		jsonError(w, "Payment method not found", http.StatusNotFound)
		return
	} else if err != nil {
		jsonError(w, "Error updating payment method", http.StatusInternalServerError)
		return
	}
	updated.CreatedAt = &createdAt
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(updated)
}

func (h *PaymentMethodHandler) DeletePaymentMethod(w http.ResponseWriter, r *http.Request) {
	parts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
	id := parts[len(parts)-1]
	h.DB.Exec("DELETE FROM payment_methods WHERE id = $1", id)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Payment method deleted"})
}

// ---- PROMOTIONS ----

func (h *PaymentMethodHandler) CreatePromotion(w http.ResponseWriter, r *http.Request) {
	shopID := extractShopID(r.URL.Path, "/promotions")
	if shopID == "" {
		jsonError(w, "shop_id required", http.StatusBadRequest)
		return
	}

	var promo models.Promotion
	if err := json.NewDecoder(r.Body).Decode(&promo); err != nil {
		jsonError(w, "Invalid JSON", http.StatusBadRequest)
		return
	}
	promo.ShopID = shopID
	if promo.Name == "" || promo.Price <= 0 {
		jsonError(w, "Fields 'name' and 'price' are required", http.StatusBadRequest)
		return
	}
	if promo.Type == "" {
		promo.Type = "bundle"
	}
	promo.IsEnabled = true

	tx, err := h.DB.Begin()
	if err != nil {
		jsonError(w, "Internal server error", http.StatusInternalServerError)
		return
	}
	defer tx.Rollback()

	var createdAt time.Time
	err = tx.QueryRow(`
		INSERT INTO promotions (shop_id, name, description, type, price, active_days, is_enabled, cost, profit)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id, created_at
	`, promo.ShopID, promo.Name, promo.Description, promo.Type, promo.Price,
		intArrayToLiteral(promo.ActiveDays), promo.IsEnabled, promo.Cost, promo.Profit).
		Scan(&promo.ID, &createdAt)
	if err != nil {
		log.Printf("Error creating promotion: %v", err)
		jsonError(w, "Error creating promotion", http.StatusInternalServerError)
		return
	}
	promo.CreatedAt = &createdAt

	for i, item := range promo.Items {
		var itemID string
		if err := tx.QueryRow(`
			INSERT INTO promotion_items (promotion_id, product_id, product_name, quantity)
			VALUES ($1, $2, $3, $4) RETURNING id
		`, promo.ID, item.ProductID, item.ProductName, item.Quantity).Scan(&itemID); err != nil {
			log.Printf("Error inserting promotion item: %v", err)
			jsonError(w, "Error creating promotion items", http.StatusInternalServerError)
			return
		}
		promo.Items[i].ID = itemID
		promo.Items[i].PromotionID = promo.ID
	}

	if err := tx.Commit(); err != nil {
		jsonError(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(promo)
}

func (h *PaymentMethodHandler) GetPromotions(w http.ResponseWriter, r *http.Request) {
	shopID := extractShopID(r.URL.Path, "/promotions")
	if shopID == "" {
		jsonError(w, "shop_id required", http.StatusBadRequest)
		return
	}

	rows, err := h.DB.Query(`
		SELECT p.id, p.shop_id, p.name, p.description, p.type, p.price, p.active_days, p.is_enabled, p.cost, p.profit, p.created_at
		FROM promotions p WHERE p.shop_id = $1 ORDER BY p.name
	`, shopID)
	if err != nil {
		jsonError(w, "Internal server error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	promos := []models.Promotion{}
	for rows.Next() {
		var p models.Promotion
		var createdAt time.Time
		var activeDaysRaw []byte
		if err := rows.Scan(&p.ID, &p.ShopID, &p.Name, &p.Description, &p.Type, &p.Price, &activeDaysRaw, &p.IsEnabled, &p.Cost, &p.Profit, &createdAt); err != nil {
			continue
		}
		// Parse active_days from "{0,1,2}" format
		raw := strings.Trim(string(activeDaysRaw), "{}")
		if raw != "" {
			for _, part := range strings.Split(raw, ",") {
				var day int
				fmt.Sscanf(strings.TrimSpace(part), "%d", &day)
				p.ActiveDays = append(p.ActiveDays, day)
			}
		}
		p.CreatedAt = &createdAt
		promos = append(promos, p)
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(promos)
}

func (h *PaymentMethodHandler) UpdatePromotion(w http.ResponseWriter, r *http.Request) {
	parts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
	id := parts[len(parts)-1]

	var promo models.Promotion
	if err := json.NewDecoder(r.Body).Decode(&promo); err != nil {
		jsonError(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	_, err := h.DB.Exec(`
		UPDATE promotions SET
			name = COALESCE(NULLIF($1,''), name),
			description = $2,
			price = CASE WHEN $3 > 0 THEN $3 ELSE price END,
			active_days = $4,
			is_enabled = $5,
			cost = $6,
			profit = $7
		WHERE id = $8
	`, promo.Name, promo.Description, promo.Price, intArrayToLiteral(promo.ActiveDays), promo.IsEnabled, promo.Cost, promo.Profit, id)
	if err != nil {
		jsonError(w, "Error updating promotion", http.StatusInternalServerError)
		return
	}
	promo.ID = id
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(promo)
}

func (h *PaymentMethodHandler) DeletePromotion(w http.ResponseWriter, r *http.Request) {
	parts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
	id := parts[len(parts)-1]
	h.DB.Exec("DELETE FROM promotions WHERE id = $1", id)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Promotion deleted"})
}
