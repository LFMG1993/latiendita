package repositories

import (
	"database/sql"
	"log"

	"backend/models"
)

type SaleRepository struct {
	DB *sql.DB
}

func NewSaleRepository(db *sql.DB) *SaleRepository {
	return &SaleRepository{DB: db}
}

func (r *SaleRepository) CreateSale(sale *models.Sale) error {
	tx, err := r.DB.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// Insert sale
	err = tx.QueryRow(`
		INSERT INTO sales (shop_id, session_id, total, employee_id, employee_name, client_id, client_name, pending_debt)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id, created_at
	`, sale.ShopID, sale.SessionID, sale.Total, sale.EmployeeID, sale.EmployeeName,
		sale.ClientID, sale.ClientName, sale.PendingDebt).Scan(&sale.ID, &sale.CreatedAt)
	if err != nil {
		return err
	}

	// Insert items and deduct stock
	for i, item := range sale.Items {
		var itemID string
		if err := tx.QueryRow(`
			INSERT INTO sale_items (sale_id, product_id, product_name, quantity, unit_price, is_promotion, promotion_id)
			VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id
		`, sale.ID, item.ProductID, item.ProductName, item.Quantity, item.UnitPrice, item.IsPromotion, item.PromotionID).Scan(&itemID); err != nil {
			return err
		}
		sale.Items[i].ID = itemID
		sale.Items[i].SaleID = sale.ID

		// Deduct stock from product (if not recipe-based)
		if item.ProductID != nil {
			_, err = tx.Exec(`UPDATE products SET stock = GREATEST(0, stock - $1), updated_at = NOW() WHERE id = $2`, item.Quantity, *item.ProductID)
			if err != nil {
				return err
			}
		}
	}

	// Insert payments
	for i, payment := range sale.Payments {
		var payID string
		if err := tx.QueryRow(`
			INSERT INTO sale_payments (sale_id, method_id, method_name, amount, type)
			VALUES ($1, $2, $3, $4, $5) RETURNING id
		`, sale.ID, payment.MethodID, payment.MethodName, payment.Amount, payment.Type).Scan(&payID); err != nil {
			return err
		}
		sale.Payments[i].ID = payID
		sale.Payments[i].SaleID = sale.ID
	}

	// If credit sale, update client debt in client_shop_accounts
	if sale.PendingDebt > 0 && sale.ClientID != nil {
		_, err = tx.Exec(`
			INSERT INTO client_shop_accounts (shop_id, client_id, debt)
			VALUES ($1, $2, $3)
			ON CONFLICT (shop_id, client_id) DO UPDATE SET debt = client_shop_accounts.debt + $3, updated_at = NOW()
		`, sale.ShopID, *sale.ClientID, sale.PendingDebt)
		if err != nil {
			return err
		}
	}

	return tx.Commit()
}

func (r *SaleRepository) FindSalesByShop(shopID string, from string, to string) ([]models.Sale, error) {
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

	rows, err := r.DB.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var sales []models.Sale
	for rows.Next() {
		var s models.Sale
		if err := rows.Scan(&s.ID, &s.ShopID, &s.SessionID, &s.Total, &s.EmployeeID, &s.EmployeeName, &s.ClientID, &s.ClientName, &s.PendingDebt, &s.CreatedAt); err != nil {
			log.Printf("Error scanning sale row: %v", err)
			continue
		}
		sales = append(sales, s)
	}
	return sales, nil
}

func (r *SaleRepository) FindSaleByID(id string) (*models.Sale, error) {
	var sale models.Sale
	err := r.DB.QueryRow(`
		SELECT id, shop_id, session_id, total, employee_id, employee_name, client_id, client_name, pending_debt, created_at
		FROM sales WHERE id = $1
	`, id).Scan(&sale.ID, &sale.ShopID, &sale.SessionID, &sale.Total, &sale.EmployeeID, &sale.EmployeeName, &sale.ClientID, &sale.ClientName, &sale.PendingDebt, &sale.CreatedAt)
	if err != nil {
		return nil, err
	}

	// Load items
	itemRows, err := r.DB.Query(`SELECT id, sale_id, product_id, product_name, quantity, unit_price, is_promotion, promotion_id FROM sale_items WHERE sale_id = $1`, id)
	if err == nil {
		defer itemRows.Close()
		for itemRows.Next() {
			var item models.SaleItem
			if err := itemRows.Scan(&item.ID, &item.SaleID, &item.ProductID, &item.ProductName, &item.Quantity, &item.UnitPrice, &item.IsPromotion, &item.PromotionID); err == nil {
				sale.Items = append(sale.Items, item)
			}
		}
	}

	// Load payments
	payRows, err := r.DB.Query(`SELECT id, sale_id, method_id, method_name, amount, type FROM sale_payments WHERE sale_id = $1`, id)
	if err == nil {
		defer payRows.Close()
		for payRows.Next() {
			var pay models.SalePayment
			if err := payRows.Scan(&pay.ID, &pay.SaleID, &pay.MethodID, &pay.MethodName, &pay.Amount, &pay.Type); err == nil {
				sale.Payments = append(sale.Payments, pay)
			}
		}
	}

	return &sale, nil
}
