package repositories

import (
	"database/sql"
	"log"

	"backend/models"
)

type SupplierRepository struct {
	DB *sql.DB
}

func NewSupplierRepository(db *sql.DB) *SupplierRepository {
	return &SupplierRepository{DB: db}
}

// ---- SUPPLIERS ----

func (r *SupplierRepository) CreateSupplier(s *models.Supplier) error {
	query := `
		INSERT INTO suppliers (shop_id, name, contact_person, phone, email)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, created_at
	`
	return r.DB.QueryRow(query, s.ShopID, s.Name, s.ContactPerson, s.Phone, s.Email).
		Scan(&s.ID, &s.CreatedAt)
}

func (r *SupplierRepository) FindSuppliersByShop(shopID string) ([]models.Supplier, error) {
	rows, err := r.DB.Query(`
		SELECT id, shop_id, name, contact_person, phone, email, purchase_count, created_at
		FROM suppliers WHERE shop_id = $1 ORDER BY name
	`, shopID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var suppliers []models.Supplier
	for rows.Next() {
		var s models.Supplier
		if err := rows.Scan(&s.ID, &s.ShopID, &s.Name, &s.ContactPerson, &s.Phone, &s.Email, &s.PurchaseCount, &s.CreatedAt); err != nil {
			log.Printf("Error scanning supplier row: %v", err)
			continue
		}
		suppliers = append(suppliers, s)
	}
	return suppliers, nil
}

func (r *SupplierRepository) UpdateSupplier(s *models.Supplier) error {
	query := `
		UPDATE suppliers SET
			name = COALESCE(NULLIF($1,''), name),
			contact_person = $2,
			phone = $3,
			email = $4
		WHERE id = $5
		RETURNING id, shop_id, name, contact_person, phone, email, purchase_count, created_at
	`
	return r.DB.QueryRow(query, s.Name, s.ContactPerson, s.Phone, s.Email, s.ID).
		Scan(&s.ID, &s.ShopID, &s.Name, &s.ContactPerson, &s.Phone, &s.Email, &s.PurchaseCount, &s.CreatedAt)
}

func (r *SupplierRepository) DeleteSupplier(id string) error {
	_, err := r.DB.Exec("DELETE FROM suppliers WHERE id = $1", id)
	return err
}

// ---- PURCHASES ----

func (r *SupplierRepository) CreatePurchase(p *models.Purchase) error {
	tx, err := r.DB.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	err = tx.QueryRow(`
		INSERT INTO purchases (shop_id, supplier_id, supplier_name, invoice_number, internal_invoice_number, total, purchased_by_employee_id)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id, created_at
	`, p.ShopID, p.SupplierID, p.SupplierName, p.InvoiceNumber, p.InternalInvoiceNumber, p.Total, p.PurchasedByEmployeeID).
		Scan(&p.ID, &p.CreatedAt)
	if err != nil {
		return err
	}

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
			return err
		}
		p.Items[i].ID = itemID
		p.Items[i].PurchaseID = p.ID

		// Update stock based on item type
		stockIncrease := item.Quantity * item.ConsumptionUnitsPerPurchaseUnit
		if item.ItemType == "ingredient" && item.IngredientID != nil {
			_, err = tx.Exec(`UPDATE ingredients SET stock = stock + $1, updated_at = NOW() WHERE id = $2`, stockIncrease, *item.IngredientID)
		} else if item.ItemType == "product" && item.ProductID != nil {
			_, err = tx.Exec(`UPDATE products SET stock = stock + $1, updated_at = NOW() WHERE id = $2`, item.Quantity, *item.ProductID)
		}
		if err != nil {
			return err
		}
	}

	// Increment supplier purchase count if supplier_id is set
	if p.SupplierID != nil {
		_, err = tx.Exec(`UPDATE suppliers SET purchase_count = purchase_count + 1 WHERE id = $1`, *p.SupplierID)
		if err != nil {
			return err
		}
	}

	return tx.Commit()
}

func (r *SupplierRepository) FindPurchasesByShop(shopID string) ([]models.Purchase, error) {
	rows, err := r.DB.Query(`
		SELECT id, shop_id, supplier_id, supplier_name, invoice_number, internal_invoice_number, total, purchased_by_employee_id, created_at
		FROM purchases WHERE shop_id = $1 ORDER BY created_at DESC
	`, shopID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var purchases []models.Purchase
	for rows.Next() {
		var p models.Purchase
		if err := rows.Scan(&p.ID, &p.ShopID, &p.SupplierID, &p.SupplierName, &p.InvoiceNumber, &p.InternalInvoiceNumber, &p.Total, &p.PurchasedByEmployeeID, &p.CreatedAt); err != nil {
			log.Printf("Error scanning purchase row: %v", err)
			continue
		}
		purchases = append(purchases, p)
	}
	return purchases, nil
}
