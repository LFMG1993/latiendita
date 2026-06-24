package repositories

import (
	"database/sql"
	"log"

	"backend/models"
)

type OrderRepository struct {
	DB *sql.DB
}

func NewOrderRepository(db *sql.DB) *OrderRepository {
	return &OrderRepository{DB: db}
}

// ---- ORDERS ----

func (r *OrderRepository) CreateOrder(order *models.Order) error {
	tx, err := r.DB.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	err = tx.QueryRow(`
		INSERT INTO orders (shop_id, client_id, client_name, client_phone, total_amount, total_items, status, payment_method, used_credits, pending_debt, note)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id, created_at, updated_at
	`, order.ShopID, order.ClientID, order.ClientName, order.ClientPhone,
		order.TotalAmount, order.TotalItems, order.Status, order.PaymentMethod,
		order.UsedCredits, order.PendingDebt, order.Note).Scan(&order.ID, &order.CreatedAt, &order.UpdatedAt)
	if err != nil {
		return err
	}

	for i, item := range order.Items {
		var itemID string
		if err := tx.QueryRow(`
			INSERT INTO order_items (order_id, product_id, product_name, quantity, price_at_purchase)
			VALUES ($1, $2, $3, $4, $5) RETURNING id
		`, order.ID, item.ProductID, item.ProductName, item.Quantity, item.PriceAtPurchase).Scan(&itemID); err != nil {
			return err
		}
		order.Items[i].ID = itemID
		order.Items[i].OrderID = order.ID
	}

	// Handle credit usage and debt
	if order.UsedCredits > 0 {
		_, err = tx.Exec(`
			UPDATE client_shop_accounts SET credits = GREATEST(0, credits - $1), updated_at = NOW()
			WHERE shop_id = $2 AND client_id = $3
		`, order.UsedCredits, order.ShopID, order.ClientID)
		if err != nil {
			return err
		}
	}
	if order.PendingDebt > 0 {
		_, err = tx.Exec(`
			INSERT INTO client_shop_accounts (shop_id, client_id, debt)
			VALUES ($1, $2, $3)
			ON CONFLICT (shop_id, client_id) DO UPDATE SET debt = client_shop_accounts.debt + $3, updated_at = NOW()
		`, order.ShopID, order.ClientID, order.PendingDebt)
		if err != nil {
			return err
		}
	}

	return tx.Commit()
}

func (r *OrderRepository) FindOrdersByShop(shopID string, status string) ([]models.Order, error) {
	query := `
		SELECT id, shop_id, client_id, client_name, client_phone, total_amount, total_items,
		       status, payment_method, used_credits, pending_debt, note, created_at, updated_at
		FROM orders WHERE shop_id = $1
	`
	args := []interface{}{shopID}
	if status != "" {
		query += " AND status = $2"
		args = append(args, status)
	}
	query += " ORDER BY created_at DESC"

	rows, err := r.DB.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var orders []models.Order
	for rows.Next() {
		var o models.Order
		if err := rows.Scan(
			&o.ID, &o.ShopID, &o.ClientID, &o.ClientName, &o.ClientPhone,
			&o.TotalAmount, &o.TotalItems, &o.Status, &o.PaymentMethod,
			&o.UsedCredits, &o.PendingDebt, &o.Note, &o.CreatedAt, &o.UpdatedAt,
		); err != nil {
			log.Printf("Error scanning order row: %v", err)
			continue
		}
		orders = append(orders, o)
	}
	return orders, nil
}

func (r *OrderRepository) FindOrdersByClient(clientID string, shopID string) ([]models.Order, error) {
	query := `
		SELECT id, shop_id, client_id, client_name, client_phone, total_amount, total_items,
		       status, payment_method, used_credits, pending_debt, note, created_at, updated_at
		FROM orders WHERE client_id = $1
	`
	args := []interface{}{clientID}
	if shopID != "" {
		query += " AND shop_id = $2"
		args = append(args, shopID)
	}
	query += " ORDER BY created_at DESC LIMIT 100"

	rows, err := r.DB.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var orders []models.Order
	for rows.Next() {
		var o models.Order
		if err := rows.Scan(
			&o.ID, &o.ShopID, &o.ClientID, &o.ClientName, &o.ClientPhone,
			&o.TotalAmount, &o.TotalItems, &o.Status, &o.PaymentMethod,
			&o.UsedCredits, &o.PendingDebt, &o.Note, &o.CreatedAt, &o.UpdatedAt,
		); err != nil {
			log.Printf("Error scanning order row: %v", err)
			continue
		}
		orders = append(orders, o)
	}
	return orders, nil
}

func (r *OrderRepository) UpdateOrderStatus(id string, status string) error {
	_, err := r.DB.Exec(`UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2`, status, id)
	return err
}

// ---- DEBT PAYMENT REQUESTS ----

func (r *OrderRepository) CreateDebtPaymentRequest(req *models.DebtPaymentRequest) error {
	err := r.DB.QueryRow(`
		INSERT INTO debt_payment_requests (client_id, client_name, client_phone, shop_id, amount, payment_method_id, payment_method_name, voucher_number, status, notes)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', $9) RETURNING id, created_at, updated_at
	`, req.ClientID, req.ClientName, req.ClientPhone, req.ShopID, req.Amount,
		req.PaymentMethodID, req.PaymentMethodName, req.VoucherNumber, req.Notes).
		Scan(&req.ID, &req.CreatedAt, &req.UpdatedAt)
	return err
}

func (r *OrderRepository) FindDebtPaymentRequestsByShop(shopID string, status string) ([]models.DebtPaymentRequest, error) {
	query := `
		SELECT id, client_id, client_name, client_phone, shop_id, amount, payment_method_id,
		       payment_method_name, voucher_number, status, notes, created_at, updated_at
		FROM debt_payment_requests WHERE shop_id = $1
	`
	args := []interface{}{shopID}
	if status != "" {
		query += " AND status = $2"
		args = append(args, status)
	}
	query += " ORDER BY created_at DESC"

	rows, err := r.DB.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var requests []models.DebtPaymentRequest
	for rows.Next() {
		var req models.DebtPaymentRequest
		if err := rows.Scan(
			&req.ID, &req.ClientID, &req.ClientName, &req.ClientPhone, &req.ShopID,
			&req.Amount, &req.PaymentMethodID, &req.PaymentMethodName, &req.VoucherNumber,
			&req.Status, &req.Notes, &req.CreatedAt, &req.UpdatedAt,
		); err != nil {
			log.Printf("Error scanning debt payment request row: %v", err)
			continue
		}
		requests = append(requests, req)
	}
	return requests, nil
}

func (r *OrderRepository) ApproveDebtPaymentRequest(id string) error {
	tx, err := r.DB.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	var req models.DebtPaymentRequest
	if err := tx.QueryRow(`
		SELECT id, client_id, shop_id, amount, status FROM debt_payment_requests WHERE id = $1
	`, id).Scan(&req.ID, &req.ClientID, &req.ShopID, &req.Amount, &req.Status); err != nil {
		return err
	}
	if req.Status != "pending" {
		return sql.ErrNoRows // Using ErrNoRows to indicate invalid state
	}

	// Mark as approved
	_, err = tx.Exec(`UPDATE debt_payment_requests SET status = 'approved', updated_at = NOW() WHERE id = $1`, id)
	if err != nil {
		return err
	}

	// Reduce client's debt
	_, err = tx.Exec(`
		UPDATE client_shop_accounts SET debt = GREATEST(0, debt - $1), updated_at = NOW()
		WHERE shop_id = $2 AND client_id = $3
	`, req.Amount, req.ShopID, req.ClientID)
	if err != nil {
		return err
	}

	return tx.Commit()
}

func (r *OrderRepository) RejectDebtPaymentRequest(id string, notes string) error {
	_, err := r.DB.Exec(`UPDATE debt_payment_requests SET status = 'rejected', notes = $1, updated_at = NOW() WHERE id = $2`, notes, id)
	return err
}

// ---- CLIENT ACCOUNTS ----

func (r *OrderRepository) FindClientAccount(shopID string, clientID string) (*models.ClientShopAccount, error) {
	var acc models.ClientShopAccount
	err := r.DB.QueryRow(`
		SELECT shop_id, client_id, credits, debt, is_credit_enabled, credit_limit
		FROM client_shop_accounts WHERE shop_id = $1 AND client_id = $2
	`, shopID, clientID).Scan(&acc.ShopID, &acc.ClientID, &acc.Credits, &acc.Debt, &acc.IsCreditEnabled, &acc.CreditLimit)
	
	if err == sql.ErrNoRows {
		return &models.ClientShopAccount{ShopID: shopID, ClientID: clientID}, nil
	} else if err != nil {
		return nil, err
	}
	return &acc, nil
}

func (r *OrderRepository) UpdateClientAccount(acc *models.ClientShopAccount) error {
	_, err := r.DB.Exec(`
		INSERT INTO client_shop_accounts (shop_id, client_id, credits, debt, is_credit_enabled, credit_limit)
		VALUES ($1, $2, $3, $4, $5, $6)
		ON CONFLICT (shop_id, client_id) DO UPDATE SET
			credits = $3, debt = $4, is_credit_enabled = $5, credit_limit = $6, updated_at = NOW()
	`, acc.ShopID, acc.ClientID, acc.Credits, acc.Debt, acc.IsCreditEnabled, acc.CreditLimit)
	return err
}
