package repositories

import (
	"database/sql"
	"fmt"
	"log"
	"strings"

	"backend/models"
)

type PaymentMethodRepository struct {
	DB *sql.DB
}

func NewPaymentMethodRepository(db *sql.DB) *PaymentMethodRepository {
	return &PaymentMethodRepository{DB: db}
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

func (r *PaymentMethodRepository) CreatePaymentMethod(pm *models.PaymentMethod) error {
	return r.DB.QueryRow(`
		INSERT INTO payment_methods (shop_id, name, type, enabled, account_details)
		VALUES ($1, $2, $3, $4, $5) RETURNING id, created_at
	`, pm.ShopID, pm.Name, pm.Type, pm.Enabled, pm.AccountDetails).Scan(&pm.ID, &pm.CreatedAt)
}

func (r *PaymentMethodRepository) FindPaymentMethodsByShop(shopID string) ([]models.PaymentMethod, error) {
	rows, err := r.DB.Query(`
		SELECT id, shop_id, name, type, enabled, account_details, created_at
		FROM payment_methods WHERE shop_id = $1 ORDER BY name
	`, shopID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var methods []models.PaymentMethod
	for rows.Next() {
		var pm models.PaymentMethod
		if err := rows.Scan(&pm.ID, &pm.ShopID, &pm.Name, &pm.Type, &pm.Enabled, &pm.AccountDetails, &pm.CreatedAt); err != nil {
			log.Printf("Error scanning payment method row: %v", err)
			continue
		}
		methods = append(methods, pm)
	}
	return methods, nil
}

func (r *PaymentMethodRepository) UpdatePaymentMethod(pm *models.PaymentMethod) error {
	return r.DB.QueryRow(`
		UPDATE payment_methods SET
			name = COALESCE(NULLIF($1,''), name),
			type = COALESCE(NULLIF($2,''), type),
			enabled = $3, account_details = $4
		WHERE id = $5
		RETURNING id, shop_id, name, type, enabled, account_details, created_at
	`, pm.Name, pm.Type, pm.Enabled, pm.AccountDetails, pm.ID).
		Scan(&pm.ID, &pm.ShopID, &pm.Name, &pm.Type, &pm.Enabled, &pm.AccountDetails, &pm.CreatedAt)
}

func (r *PaymentMethodRepository) DeletePaymentMethod(id string) error {
	_, err := r.DB.Exec("DELETE FROM payment_methods WHERE id = $1", id)
	return err
}

// ---- PROMOTIONS ----

func (r *PaymentMethodRepository) CreatePromotion(promo *models.Promotion) error {
	tx, err := r.DB.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	err = tx.QueryRow(`
		INSERT INTO promotions (shop_id, name, description, type, price, active_days, is_enabled, cost, profit)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id, created_at
	`, promo.ShopID, promo.Name, promo.Description, promo.Type, promo.Price,
		intArrayToLiteral(promo.ActiveDays), promo.IsEnabled, promo.Cost, promo.Profit).
		Scan(&promo.ID, &promo.CreatedAt)
	if err != nil {
		return err
	}

	for i, item := range promo.Items {
		var itemID string
		if err := tx.QueryRow(`
			INSERT INTO promotion_items (promotion_id, product_id, product_name, quantity)
			VALUES ($1, $2, $3, $4) RETURNING id
		`, promo.ID, item.ProductID, item.ProductName, item.Quantity).Scan(&itemID); err != nil {
			return err
		}
		promo.Items[i].ID = itemID
		promo.Items[i].PromotionID = promo.ID
	}

	return tx.Commit()
}

func (r *PaymentMethodRepository) FindPromotionsByShop(shopID string) ([]models.Promotion, error) {
	rows, err := r.DB.Query(`
		SELECT p.id, p.shop_id, p.name, p.description, p.type, p.price, p.active_days, p.is_enabled, p.cost, p.profit, p.created_at
		FROM promotions p WHERE p.shop_id = $1 ORDER BY p.name
	`, shopID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var promos []models.Promotion
	for rows.Next() {
		var p models.Promotion
		var activeDaysRaw []byte
		if err := rows.Scan(&p.ID, &p.ShopID, &p.Name, &p.Description, &p.Type, &p.Price, &activeDaysRaw, &p.IsEnabled, &p.Cost, &p.Profit, &p.CreatedAt); err != nil {
			log.Printf("Error scanning promotion row: %v", err)
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
		promos = append(promos, p)
	}
	return promos, nil
}

func (r *PaymentMethodRepository) UpdatePromotion(promo *models.Promotion) error {
	_, err := r.DB.Exec(`
		UPDATE promotions SET
			name = COALESCE(NULLIF($1,''), name),
			description = $2,
			price = CASE WHEN $3 > 0 THEN $3 ELSE price END,
			active_days = $4,
			is_enabled = $5,
			cost = $6,
			profit = $7
		WHERE id = $8
	`, promo.Name, promo.Description, promo.Price, intArrayToLiteral(promo.ActiveDays), promo.IsEnabled, promo.Cost, promo.Profit, promo.ID)
	return err
}

func (r *PaymentMethodRepository) DeletePromotion(id string) error {
	_, err := r.DB.Exec("DELETE FROM promotions WHERE id = $1", id)
	return err
}
