package repositories

import (
	"database/sql"
	"log"

	"backend/models"
)

type ProductRepository struct {
	DB *sql.DB
}

func NewProductRepository(db *sql.DB) *ProductRepository {
	return &ProductRepository{DB: db}
}

// PRODUCTOS
func (r *ProductRepository) CreateProduct(p *models.Product) error {
	query := `
		INSERT INTO products (shop_id, master_product_id, name, price, category, cost, stock, image_url, description, is_available)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
		RETURNING id, created_at, updated_at
	`
	return r.DB.QueryRow(query,
		p.ShopID, p.MasterProductID, p.Name, p.Price, p.Category,
		p.Cost, p.Stock, p.ImageURL, p.Description, p.IsAvailable,
	).Scan(&p.ID, &p.CreatedAt, &p.UpdatedAt)
}

func (r *ProductRepository) GetProductsByShop(shopID string) ([]models.Product, error) {
	query := `
		SELECT id, shop_id, master_product_id, name, price, category, cost, stock,
		       image_url, description, is_available, created_at, updated_at
		FROM products WHERE shop_id = $1
		ORDER BY category, name
	`
	rows, err := r.DB.Query(query, shopID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var products []models.Product
	for rows.Next() {
		var p models.Product
		if err := rows.Scan(
			&p.ID, &p.ShopID, &p.MasterProductID, &p.Name, &p.Price, &p.Category,
			&p.Cost, &p.Stock, &p.ImageURL, &p.Description, &p.IsAvailable,
			&p.CreatedAt, &p.UpdatedAt,
		); err != nil {
			log.Printf("Error scanning product row: %v", err)
			continue
		}
		products = append(products, p)
	}
	return products, nil
}

func (r *ProductRepository) UpdateProduct(p *models.Product) error {
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
	return r.DB.QueryRow(query,
		p.Name, p.Price, p.Category, p.Cost, p.Stock,
		p.ImageURL, p.Description, p.IsAvailable, p.ID,
	).Scan(
		&p.ID, &p.ShopID, &p.MasterProductID,
		&p.Name, &p.Price, &p.Category,
		&p.Cost, &p.Stock, &p.ImageURL, &p.Description, &p.IsAvailable,
		&p.CreatedAt, &p.UpdatedAt,
	)
}

func (r *ProductRepository) DeleteProduct(id string) error {
	_, err := r.DB.Exec("DELETE FROM products WHERE id = $1", id)
	return err
}

// INGREDIENTES
func (r *ProductRepository) CreateIngredient(ing *models.Ingredient) error {
	query := `
		INSERT INTO ingredients (shop_id, name, category, purchase_unit, consumption_unit, consumption_units_per_purchase_unit, stock)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id, created_at, updated_at
	`
	return r.DB.QueryRow(query,
		ing.ShopID, ing.Name, ing.Category, ing.PurchaseUnit,
		ing.ConsumptionUnit, ing.ConsumptionUnitsPerPurchaseUnit, ing.Stock,
	).Scan(&ing.ID, &ing.CreatedAt, &ing.UpdatedAt)
}

func (r *ProductRepository) GetIngredientsByShop(shopID string) ([]models.Ingredient, error) {
	query := `
		SELECT id, shop_id, name, category, purchase_unit, consumption_unit,
		       consumption_units_per_purchase_unit, stock, created_at, updated_at
		FROM ingredients WHERE shop_id = $1
		ORDER BY category, name
	`
	rows, err := r.DB.Query(query, shopID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var ings []models.Ingredient
	for rows.Next() {
		var ing models.Ingredient
		if err := rows.Scan(
			&ing.ID, &ing.ShopID, &ing.Name, &ing.Category,
			&ing.PurchaseUnit, &ing.ConsumptionUnit,
			&ing.ConsumptionUnitsPerPurchaseUnit, &ing.Stock,
			&ing.CreatedAt, &ing.UpdatedAt,
		); err != nil {
			log.Printf("Error scanning ingredient row: %v", err)
			continue
		}
		ings = append(ings, ing)
	}
	return ings, nil
}

func (r *ProductRepository) UpdateIngredient(ing *models.Ingredient) error {
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
	return r.DB.QueryRow(query,
		ing.Name, ing.Category, ing.PurchaseUnit, ing.ConsumptionUnit,
		ing.ConsumptionUnitsPerPurchaseUnit, ing.Stock, ing.ID,
	).Scan(
		&ing.ID, &ing.ShopID, &ing.Name, &ing.Category,
		&ing.PurchaseUnit, &ing.ConsumptionUnit,
		&ing.ConsumptionUnitsPerPurchaseUnit, &ing.Stock,
		&ing.CreatedAt, &ing.UpdatedAt,
	)
}

func (r *ProductRepository) DeleteIngredient(id string) error {
	_, err := r.DB.Exec("DELETE FROM ingredients WHERE id = $1", id)
	return err
}
