package models

import "time"

// MasterProduct represents an official product in the global catalog
// MasterProduct representa un producto oficial en el catálogo maestro global
type MasterProduct struct {
	ID             string     `json:"id"`
	Name           string     `json:"name"`
	Brand          *string    `json:"brand,omitempty"`
	Barcode        *string    `json:"barcode,omitempty"`
	Description    *string    `json:"description,omitempty"`
	ImageURL       *string    `json:"image_url,omitempty"`
	BusinessTypeID *string    `json:"business_type_id,omitempty"`
	Category       string     `json:"category"`
	CreatedAt      *time.Time `json:"created_at,omitempty"`
	UpdatedAt      *time.Time `json:"updated_at,omitempty"`
}

// MasterProductRequest represents a shop's request to add a new product to the global catalog
// MasterProductRequest representa la solicitud de un tendero para añadir un producto al catálogo
type MasterProductRequest struct {
	ID                   string     `json:"id"`
	ShopID               string     `json:"shop_id"`
	ShopName             string     `json:"shop_name,omitempty"`
	RequestedByUserID    *string    `json:"requested_by_user_id,omitempty"`
	RequestedName        string     `json:"requested_name"`
	RequestedBrand       *string    `json:"requested_brand,omitempty"`
	RequestedBarcode     *string    `json:"requested_barcode,omitempty"`
	RequestedCategory    *string    `json:"requested_category,omitempty"`
	RequestedDescription *string    `json:"requested_description,omitempty"`
	RequestedImageURL    *string    `json:"requested_image_url,omitempty"`
	Status               string     `json:"status"` // pending | approved | rejected
	AdminNotes           *string    `json:"admin_notes,omitempty"`
	CreatedAt            *time.Time `json:"created_at,omitempty"`
	UpdatedAt            *time.Time `json:"updated_at,omitempty"`
}
