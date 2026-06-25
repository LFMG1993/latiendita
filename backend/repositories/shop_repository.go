package repositories

import (
	"database/sql"
	"log"

	"backend/models"
)

type ShopRepository struct {
	DB *sql.DB
}

func NewShopRepository(db *sql.DB) *ShopRepository {
	return &ShopRepository{DB: db}
}

func (r *ShopRepository) CreateShopWithOwner(shop *models.Shop, permissionsJSON []byte) error {
	tx, err := r.DB.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	shopQuery := `
		INSERT INTO shops (
			name, address, photo_url, whatsapp, owner_id, timezone, business_type_id,
			theme_primary_color, theme_secondary_color, theme_logo_url,
			terminology_shop_label, terminology_product_label,
			modules, features, status
		) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
		RETURNING id, created_at, updated_at
	`

	err = tx.QueryRow(
		shopQuery,
		shop.Name, shop.Address, shop.PhotoURL, shop.WhatsApp,
		shop.OwnerID, shop.Timezone, shop.BusinessTypeID,
		shop.ThemePrimaryColor, shop.ThemeSecondaryColor, shop.ThemeLogoURL,
		shop.TerminologyShopLabel, shop.TerminologyProductLabel,
		shop.Modules, shop.Features, shop.Status,
	).Scan(&shop.ID, &shop.CreatedAt, &shop.UpdatedAt)
	if err != nil {
		return err
	}

	memberQuery := `
		INSERT INTO shop_members (shop_id, user_id, role, permissions)
		VALUES ($1, $2, 'owner', $3)
	`
	if _, err := tx.Exec(memberQuery, shop.ID, shop.OwnerID, permissionsJSON); err != nil {
		return err
	}

	return tx.Commit()
}

func (r *ShopRepository) FindByOwner(ownerID string) ([]models.Shop, error) {
	query := `
		SELECT id, name, address, photo_url, whatsapp, owner_id, timezone, business_type_id,
		       theme_primary_color, theme_secondary_color, theme_logo_url,
		       terminology_shop_label, terminology_product_label,
		       modules, features, status, created_at, updated_at
		FROM shops
		WHERE owner_id = $1
		ORDER BY created_at ASC
	`
	rows, err := r.DB.Query(query, ownerID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	return r.scanShops(rows)
}

func (r *ShopRepository) FindAll() ([]models.Shop, error) {
	query := `
		SELECT id, name, address, photo_url, whatsapp, owner_id, timezone, business_type_id,
		       theme_primary_color, theme_secondary_color, theme_logo_url,
		       terminology_shop_label, terminology_product_label,
		       modules, features, status, created_at, updated_at
		FROM shops
		ORDER BY created_at ASC
	`
	rows, err := r.DB.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	return r.scanShops(rows)
}

func (r *ShopRepository) FindByID(id string) (*models.Shop, error) {
	query := `
		SELECT id, name, address, photo_url, whatsapp, owner_id, timezone, business_type_id,
		       theme_primary_color, theme_secondary_color, theme_logo_url,
		       terminology_shop_label, terminology_product_label,
		       modules, features, status, created_at, updated_at
		FROM shops WHERE id = $1
	`
	var s models.Shop
	var modulesJSON, featuresJSON []byte

	err := r.DB.QueryRow(query, id).Scan(
		&s.ID, &s.Name, &s.Address, &s.PhotoURL, &s.WhatsApp,
		&s.OwnerID, &s.Timezone, &s.BusinessTypeID,
		&s.ThemePrimaryColor, &s.ThemeSecondaryColor, &s.ThemeLogoURL,
		&s.TerminologyShopLabel, &s.TerminologyProductLabel,
		&modulesJSON, &featuresJSON, &s.Status,
		&s.CreatedAt, &s.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}

	s.Modules = modulesJSON
	s.Features = featuresJSON
	return &s, nil
}

func (r *ShopRepository) Update(shop *models.Shop) error {
	query := `
		UPDATE shops SET
			name = COALESCE(NULLIF($1, ''), name),
			address = $2,
			photo_url = $3,
			whatsapp = $4,
			timezone = COALESCE(NULLIF($5, ''), timezone),
			theme_primary_color = COALESCE(NULLIF($6, ''), theme_primary_color),
			theme_secondary_color = COALESCE(NULLIF($7, ''), theme_secondary_color),
			theme_logo_url = $8,
			terminology_shop_label = COALESCE(NULLIF($9, ''), terminology_shop_label),
			terminology_product_label = COALESCE(NULLIF($10, ''), terminology_product_label),
			modules = COALESCE($11, modules),
			features = COALESCE($12, features),
			updated_at = NOW()
		WHERE id = $13
		RETURNING id, name, address, photo_url, whatsapp, owner_id, timezone, business_type_id,
		          theme_primary_color, theme_secondary_color, theme_logo_url,
		          terminology_shop_label, terminology_product_label,
		          modules, features, status, created_at, updated_at
	`

	var modulesArg, featuresArg interface{}
	if shop.Modules != nil {
		modulesArg = string(shop.Modules)
	}
	if shop.Features != nil {
		featuresArg = string(shop.Features)
	}

	var modulesJSON, featuresJSON []byte

	err := r.DB.QueryRow(query,
		shop.Name, shop.Address, shop.PhotoURL, shop.WhatsApp, shop.Timezone,
		shop.ThemePrimaryColor, shop.ThemeSecondaryColor, shop.ThemeLogoURL,
		shop.TerminologyShopLabel, shop.TerminologyProductLabel,
		modulesArg, featuresArg, shop.ID,
	).Scan(
		&shop.ID, &shop.Name, &shop.Address, &shop.PhotoURL, &shop.WhatsApp,
		&shop.OwnerID, &shop.Timezone, &shop.BusinessTypeID,
		&shop.ThemePrimaryColor, &shop.ThemeSecondaryColor, &shop.ThemeLogoURL,
		&shop.TerminologyShopLabel, &shop.TerminologyProductLabel,
		&modulesJSON, &featuresJSON, &shop.Status,
		&shop.CreatedAt, &shop.UpdatedAt,
	)
	
	if err == nil {
		shop.Modules = modulesJSON
		shop.Features = featuresJSON
	}
	return err
}

func (r *ShopRepository) Approve(id string) error {
	query := `UPDATE shops SET status = 'active', updated_at = NOW() WHERE id = $1 RETURNING id`
	var updatedID string
	return r.DB.QueryRow(query, id).Scan(&updatedID)
}

type MemberWithUser struct {
	models.ShopMember
	FirstName string  `json:"first_name"`
	LastName  string  `json:"last_name"`
	Email     string  `json:"email"`
	Phone     *string `json:"phone,omitempty"`
	PhotoURL  *string `json:"photo_url,omitempty"`
}

func (r *ShopRepository) GetMembers(shopID string) ([]MemberWithUser, error) {
	query := `
		SELECT sm.shop_id, sm.user_id, sm.role_id, sm.role, sm.permissions, sm.added_at,
		       u.first_name, u.last_name, u.email, u.phone, u.photo_url
		FROM shop_members sm
		JOIN users u ON u.id = sm.user_id
		WHERE sm.shop_id = $1
		ORDER BY sm.added_at ASC
	`
	rows, err := r.DB.Query(query, shopID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var members []MemberWithUser
	for rows.Next() {
		var m MemberWithUser
		var permJSON []byte
		if err := rows.Scan(
			&m.ShopID, &m.UserID, &m.RoleID, &m.Role, &permJSON, &m.AddedAt,
			&m.FirstName, &m.LastName, &m.Email, &m.Phone, &m.PhotoURL,
		); err != nil {
			continue
		}
		m.Permissions = permJSON
		members = append(members, m)
	}
	return members, nil
}

func (r *ShopRepository) scanShops(rows *sql.Rows) ([]models.Shop, error) {
	var shops []models.Shop
	for rows.Next() {
		var s models.Shop
		var modulesJSON, featuresJSON []byte
		if err := rows.Scan(
			&s.ID, &s.Name, &s.Address, &s.PhotoURL, &s.WhatsApp,
			&s.OwnerID, &s.Timezone, &s.BusinessTypeID,
			&s.ThemePrimaryColor, &s.ThemeSecondaryColor, &s.ThemeLogoURL,
			&s.TerminologyShopLabel, &s.TerminologyProductLabel,
			&modulesJSON, &featuresJSON, &s.Status,
			&s.CreatedAt, &s.UpdatedAt,
		); err != nil {
			log.Printf("Error scanning shop row: %v", err)
			continue
		}
		s.Modules = modulesJSON
		s.Features = featuresJSON
		shops = append(shops, s)
	}
	return shops, nil
}

func (r *ShopRepository) FindShopsByClient(clientID string) ([]models.Shop, error) {
	query := `
		SELECT s.id, s.name, s.address, s.photo_url, s.whatsapp, s.owner_id, s.timezone, s.business_type_id,
		       s.theme_primary_color, s.theme_secondary_color, s.theme_logo_url,
		       s.terminology_shop_label, s.terminology_product_label,
		       s.modules, s.features, s.status, s.created_at, s.updated_at
		FROM shops s
		JOIN client_shop_accounts csa ON csa.shop_id = s.id
		WHERE csa.client_id = $1 AND s.status = 'active'
		ORDER BY s.name ASC
	`
	rows, err := r.DB.Query(query, clientID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	return r.scanShops(rows)
}

func (r *ShopRepository) FindClientsByShop(shopID string) ([]map[string]interface{}, error) {
	query := `
		SELECT u.id, u.first_name, u.last_name, u.email, u.phone, u.document_id, u.photo_url, u.created_at,
		       csa.credits, csa.debt, csa.is_credit_enabled, csa.credit_limit
		FROM users u
		JOIN client_shop_accounts csa ON u.id = csa.client_id
		WHERE csa.shop_id = $1
		ORDER BY u.first_name, u.last_name
	`

	rows, err := r.DB.Query(query, shopID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	clients := []map[string]interface{}{}
	for rows.Next() {
		var id, firstName, lastName, email, phone string
		var photoURL, documentID sql.NullString
		var createdAt interface{} // Use interface{} or string/time.Time to match what is needed
		var credits, debt float64
		var isCreditEnabled bool
		var creditLimit sql.NullFloat64

		if err := rows.Scan(&id, &firstName, &lastName, &email, &phone, &documentID, &photoURL, &createdAt, &credits, &debt, &isCreditEnabled, &creditLimit); err != nil {
			log.Printf("Error scanning client row: %v", err)
			continue
		}

		client := map[string]interface{}{
			"id":                id,
			"uid":               id,
			"first_name":        firstName,
			"firstName":         firstName,
			"last_name":         lastName,
			"lastName":          lastName,
			"email":             email,
			"phone":             phone,
			"document_id":       documentID.String,
			"documentId":        documentID.String,
			"photo_url":         photoURL.String,
			"photoURL":          photoURL.String,
			"created_at":        createdAt,
			"createdAt":         createdAt, // Send timestamp directly
			"credits":           credits,
			"debt":              debt,
			"isCreditEnabled":   isCreditEnabled,
			"is_credit_enabled": isCreditEnabled,
			"creditLimit":       creditLimit.Float64,
			"credit_limit":      creditLimit.Float64,
			"role":              "client",
		}
		clients = append(clients, client)
	}
	return clients, nil
}
