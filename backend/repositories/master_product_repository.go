package repositories

import (
	"database/sql"
	"time"
	"backend/models"
)

type MasterProductRepository struct {
	DB *sql.DB
}

func NewMasterProductRepository(db *sql.DB) *MasterProductRepository {
	return &MasterProductRepository{DB: db}
}

func (r *MasterProductRepository) FindAll(q string, category string) ([]models.MasterProduct, error) {
	query := `
		SELECT id, name, brand, barcode, description, image_url, business_type_id, category, created_at, updated_at
		FROM master_products
		WHERE ($1 = '' OR name ILIKE '%' || $1 || '%' OR brand ILIKE '%' || $1 || '%' OR barcode ILIKE '%' || $1 || '%')
		  AND ($2 = '' OR category ILIKE $2)
		ORDER BY category, name
	`
	rows, err := r.DB.Query(query, q, category)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	products := []models.MasterProduct{}
	for rows.Next() {
		var p models.MasterProduct
		var createdAt, updatedAt time.Time
		if err := rows.Scan(
			&p.ID, &p.Name, &p.Brand, &p.Barcode, &p.Description,
			&p.ImageURL, &p.BusinessTypeID, &p.Category,
			&createdAt, &updatedAt,
		); err != nil {
			continue
		}
		p.CreatedAt = &createdAt
		p.UpdatedAt = &updatedAt
		products = append(products, p)
	}
	return products, nil
}

func (r *MasterProductRepository) Create(p *models.MasterProduct) error {
	query := `
		INSERT INTO master_products (name, brand, barcode, description, image_url, business_type_id, category)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id, created_at, updated_at
	`
	var createdAt, updatedAt time.Time
	err := r.DB.QueryRow(query,
		p.Name, p.Brand, p.Barcode, p.Description,
		p.ImageURL, p.BusinessTypeID, p.Category,
	).Scan(&p.ID, &createdAt, &updatedAt)
	if err == nil {
		p.CreatedAt = &createdAt
		p.UpdatedAt = &updatedAt
	}
	return err
}

func (r *MasterProductRepository) Update(id string, p *models.MasterProduct) error {
	query := `
		UPDATE master_products SET
			name = COALESCE(NULLIF($1,''), name),
			brand = $2,
			barcode = $3,
			description = $4,
			image_url = $5,
			business_type_id = $6,
			category = COALESCE(NULLIF($7,''), category),
			updated_at = NOW()
		WHERE id = $8
		RETURNING id, name, brand, barcode, description, image_url, business_type_id, category, created_at, updated_at
	`
	var createdAt, updatedAt time.Time
	err := r.DB.QueryRow(query,
		p.Name, p.Brand, p.Barcode, p.Description,
		p.ImageURL, p.BusinessTypeID, p.Category, id,
	).Scan(
		&p.ID, &p.Name, &p.Brand, &p.Barcode,
		&p.Description, &p.ImageURL, &p.BusinessTypeID, &p.Category,
		&createdAt, &updatedAt,
	)
	if err == nil {
		p.CreatedAt = &createdAt
		p.UpdatedAt = &updatedAt
	}
	return err
}

func (r *MasterProductRepository) Delete(id string) error {
	_, err := r.DB.Exec("DELETE FROM master_products WHERE id = $1", id)
	return err
}

func (r *MasterProductRepository) Search(q string) ([]models.MasterProduct, error) {
	if q == "" {
		return []models.MasterProduct{}, nil
	}
	query := `
		SELECT id, name, brand, barcode, description, image_url, business_type_id, category, created_at, updated_at
		FROM master_products
		WHERE name ILIKE '%' || $1 || '%'
		   OR brand ILIKE '%' || $1 || '%'
		   OR barcode = $1
		ORDER BY name
		LIMIT 20
	`
	rows, err := r.DB.Query(query, q)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	products := []models.MasterProduct{}
	for rows.Next() {
		var p models.MasterProduct
		var createdAt, updatedAt time.Time
		if err := rows.Scan(
			&p.ID, &p.Name, &p.Brand, &p.Barcode, &p.Description,
			&p.ImageURL, &p.BusinessTypeID, &p.Category,
			&createdAt, &updatedAt,
		); err != nil {
			continue
		}
		p.CreatedAt = &createdAt
		p.UpdatedAt = &updatedAt
		products = append(products, p)
	}
	return products, nil
}

func (r *MasterProductRepository) GetRequests(status string) ([]models.MasterProductRequest, error) {
	query := `
		SELECT pr.id, pr.shop_id, s.name as shop_name, pr.requested_by_user_id,
		       pr.requested_name, pr.requested_brand, pr.requested_barcode,
		       pr.requested_category, pr.requested_description, pr.requested_image_url,
		       pr.status, pr.admin_notes, pr.created_at, pr.updated_at
		FROM master_product_requests pr
		JOIN shops s ON s.id = pr.shop_id
		WHERE ($1 = '' OR pr.status = $1)
		ORDER BY pr.created_at DESC
	`
	rows, err := r.DB.Query(query, status)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	requests := []models.MasterProductRequest{}
	for rows.Next() {
		var req models.MasterProductRequest
		var createdAt, updatedAt time.Time
		if err := rows.Scan(
			&req.ID, &req.ShopID, &req.ShopName, &req.RequestedByUserID,
			&req.RequestedName, &req.RequestedBrand, &req.RequestedBarcode,
			&req.RequestedCategory, &req.RequestedDescription, &req.RequestedImageURL,
			&req.Status, &req.AdminNotes,
			&createdAt, &updatedAt,
		); err != nil {
			continue
		}
		req.CreatedAt = &createdAt
		req.UpdatedAt = &updatedAt
		requests = append(requests, req)
	}
	return requests, nil
}

func (r *MasterProductRepository) CreateRequest(req *models.MasterProductRequest) error {
	query := `
		INSERT INTO master_product_requests
		    (shop_id, requested_by_user_id, requested_name, requested_brand,
		     requested_barcode, requested_category, requested_description, requested_image_url)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING id, status, created_at, updated_at
	`
	var createdAt, updatedAt time.Time
	err := r.DB.QueryRow(query,
		req.ShopID, req.RequestedByUserID, req.RequestedName, req.RequestedBrand,
		req.RequestedBarcode, req.RequestedCategory, req.RequestedDescription, req.RequestedImageURL,
	).Scan(&req.ID, &req.Status, &createdAt, &updatedAt)
	if err == nil {
		req.CreatedAt = &createdAt
		req.UpdatedAt = &updatedAt
	}
	return err
}

func (r *MasterProductRepository) ApproveRequest(id string, adjustments *models.MasterProductRequest) (string, error) {
	tx, err := r.DB.Begin()
	if err != nil {
		return "", err
	}
	defer tx.Rollback()

	var req models.MasterProductRequest
	err = tx.QueryRow(`
		SELECT requested_name, requested_brand, requested_barcode, requested_category,
		       requested_description, requested_image_url
		FROM master_product_requests WHERE id = $1
	`, id).Scan(
		&req.RequestedName, &req.RequestedBrand, &req.RequestedBarcode,
		&req.RequestedCategory, &req.RequestedDescription, &req.RequestedImageURL,
	)
	if err != nil {
		return "", err
	}

	finalName := req.RequestedName
	if adjustments.RequestedName != "" {
		finalName = adjustments.RequestedName
	}
	
	// Helper to prioritize adjustments
	coalesceStr := func(a, b *string) *string {
		if a != nil {
			return a
		}
		return b
	}

	finalCategory := ""
	if req.RequestedCategory != nil {
		finalCategory = *req.RequestedCategory
	}
	if adjustments.RequestedCategory != nil && *adjustments.RequestedCategory != "" {
		finalCategory = *adjustments.RequestedCategory
	}
	if finalCategory == "" {
		finalCategory = "General"
	}

	var masterProductID string
	err = tx.QueryRow(`
		INSERT INTO master_products (name, brand, barcode, description, image_url, category)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id
	`,
		finalName,
		coalesceStr(adjustments.RequestedBrand, req.RequestedBrand),
		coalesceStr(adjustments.RequestedBarcode, req.RequestedBarcode),
		coalesceStr(adjustments.RequestedDescription, req.RequestedDescription),
		coalesceStr(adjustments.RequestedImageURL, req.RequestedImageURL),
		finalCategory,
	).Scan(&masterProductID)
	if err != nil {
		return "", err
	}

	_, err = tx.Exec(`
		UPDATE master_product_requests
		SET status = 'approved', admin_notes = $1, updated_at = NOW()
		WHERE id = $2
	`, adjustments.AdminNotes, id)
	if err != nil {
		return "", err
	}

	return masterProductID, tx.Commit()
}

func (r *MasterProductRepository) RejectRequest(id string, adminNotes *string) error {
	_, err := r.DB.Exec(`
		UPDATE master_product_requests
		SET status = 'rejected', admin_notes = $1, updated_at = NOW()
		WHERE id = $2
	`, adminNotes, id)
	return err
}

func (r *MasterProductRepository) GetRequestsByShop(shopID string) ([]models.MasterProductRequest, error) {
	rows, err := r.DB.Query(`
		SELECT id, shop_id, requested_by_user_id, requested_name, requested_brand,
		       requested_barcode, requested_category, requested_description, requested_image_url,
		       status, admin_notes, created_at, updated_at
		FROM master_product_requests
		WHERE shop_id = $1
		ORDER BY created_at DESC
	`, shopID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	requests := []models.MasterProductRequest{}
	for rows.Next() {
		var req models.MasterProductRequest
		var createdAt, updatedAt time.Time
		if err := rows.Scan(
			&req.ID, &req.ShopID, &req.RequestedByUserID,
			&req.RequestedName, &req.RequestedBrand, &req.RequestedBarcode,
			&req.RequestedCategory, &req.RequestedDescription, &req.RequestedImageURL,
			&req.Status, &req.AdminNotes,
			&createdAt, &updatedAt,
		); err != nil {
			continue
		}
		req.CreatedAt = &createdAt
		req.UpdatedAt = &updatedAt
		requests = append(requests, req)
	}
	return requests, nil
}

type ShopProductStatus struct {
	ShopID     string  `json:"shop_id"`
	ShopName   string  `json:"shop_name"`
	Price      float64 `json:"price"`
	Stock      float64 `json:"stock"`
	IsOpen     bool    `json:"is_open"`
	IsEnrolled bool    `json:"is_enrolled"`
}

func (r *MasterProductRepository) GetMasterProductShops(masterProductID string, clientID string) ([]ShopProductStatus, error) {
	query := `
		SELECT 
			s.id AS shop_id,
			s.name AS shop_name,
			p.price AS price,
			p.stock AS stock,
			EXISTS(
				SELECT 1 FROM cash_sessions cs 
				WHERE cs.shop_id = s.id AND cs.status = 'open'
			) AS is_open,
			EXISTS(
				SELECT 1 FROM client_shop_accounts csa 
				WHERE csa.shop_id = s.id AND csa.client_id = $1
			) AS is_enrolled
		FROM products p
		JOIN shops s ON s.id = p.shop_id
		WHERE p.master_product_id = $2
		ORDER BY s.name
	`
	rows, err := r.DB.Query(query, clientID, masterProductID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	results := []ShopProductStatus{}
	for rows.Next() {
		var s ShopProductStatus
		if err := rows.Scan(&s.ShopID, &s.ShopName, &s.Price, &s.Stock, &s.IsOpen, &s.IsEnrolled); err != nil {
			continue
		}
		results = append(results, s)
	}
	return results, nil
}

func (r *MasterProductRepository) EnrollClientToShop(shopID string, clientID string) error {
	// First verify if the client exists in users table with role 'client'
	var exists bool
	err := r.DB.QueryRow("SELECT EXISTS(SELECT 1 FROM users WHERE id = $1 AND role = 'client')", clientID).Scan(&exists)
	if err != nil || !exists {
		return sql.ErrNoRows
	}

	query := `
		INSERT INTO client_shop_accounts (shop_id, client_id, credits, debt, is_credit_enabled, credit_limit)
		VALUES ($1, $2, 0.00, 0.00, false, 0.00)
		ON CONFLICT (shop_id, client_id) DO NOTHING
	`
	_, err = r.DB.Exec(query, shopID, clientID)
	return err
}
