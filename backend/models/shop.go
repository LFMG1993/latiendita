package models

import (
	"encoding/json"
	"time"
)

// Shop represents a store in the multi-tenant system
// Shop representa una tienda en el sistema multi-inquilino
type Shop struct {
	ID          string    `json:"id"`
	Name        string    `json:"name"`
	Address     *string   `json:"address,omitempty"`
	PhotoURL    *string   `json:"photo_url,omitempty"`
	WhatsApp    *string   `json:"whatsapp,omitempty"`
	OwnerID     string    `json:"owner_id"`
	Timezone    string    `json:"timezone"`
	Status      string    `json:"status"` // pending, active, suspended
	BusinessTypeID *string `json:"business_type_id,omitempty"`

	// Branding
	ThemePrimaryColor   string  `json:"theme_primary_color"`
	ThemeSecondaryColor string  `json:"theme_secondary_color"`
	ThemeLogoURL        *string `json:"theme_logo_url,omitempty"`

	// Terminology
	TerminologyShopLabel    string `json:"terminology_shop_label"`
	TerminologyProductLabel string `json:"terminology_product_label"`

	// Feature flags stored as raw JSON
	Modules  json.RawMessage `json:"modules,omitempty"`
	Features json.RawMessage `json:"features,omitempty"`

	CreatedAt *time.Time `json:"created_at,omitempty"`
	UpdatedAt *time.Time `json:"updated_at,omitempty"`
}

// ShopMember represents a user's membership in a shop with their role and permissions
// ShopMember representa la membresía de un usuario en una tienda con su rol y permisos
type ShopMember struct {
	ShopID      string          `json:"shop_id"`
	UserID      string          `json:"user_id"`
	RoleID      *string         `json:"role_id,omitempty"`
	Role        string          `json:"role"`
	Permissions json.RawMessage `json:"permissions,omitempty"`
	AddedAt     *time.Time      `json:"added_at,omitempty"`
}

// ClientShopAccount represents a client's financial balance in a specific shop
// ClientShopAccount representa el saldo financiero de un cliente en una tienda específica
type ClientShopAccount struct {
	ShopID          string     `json:"shop_id"`
	ClientID        string     `json:"client_id"`
	Credits         float64    `json:"credits"`
	Debt            float64    `json:"debt"`
	IsCreditEnabled bool       `json:"is_credit_enabled"`
	CreditLimit     float64    `json:"credit_limit"`
	CreatedAt       *time.Time `json:"created_at,omitempty"`
	UpdatedAt       *time.Time `json:"updated_at,omitempty"`
}
