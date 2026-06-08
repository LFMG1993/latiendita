package models

import "time"

// PaymentMethod represents a payment option configured for a shop
type PaymentMethod struct {
	ID             string     `json:"id"`
	ShopID         string     `json:"shop_id"`
	Name           string     `json:"name"`
	Type           string     `json:"type"` // cash, electronic, credit
	Enabled        bool       `json:"enabled"`
	AccountDetails *string    `json:"account_details,omitempty"`
	CreatedAt      *time.Time `json:"created_at,omitempty"`
}

// Promotion represents a bundle deal or discount offer for a shop
type Promotion struct {
	ID          string          `json:"id"`
	ShopID      string          `json:"shop_id"`
	Name        string          `json:"name"`
	Description *string         `json:"description,omitempty"`
	Type        string          `json:"type"`
	Price       float64         `json:"price"`
	ActiveDays  []int           `json:"active_days"`
	IsEnabled   bool            `json:"is_enabled"`
	Cost        float64         `json:"cost"`
	Profit      float64         `json:"profit"`
	CreatedAt   *time.Time      `json:"created_at,omitempty"`
	Items       []PromotionItem `json:"items,omitempty"`
}

// PromotionItem represents a product included in a promotion bundle
type PromotionItem struct {
	ID          string  `json:"id"`
	PromotionID string  `json:"promotion_id"`
	ProductID   string  `json:"product_id"`
	ProductName string  `json:"product_name"`
	Quantity    float64 `json:"quantity"`
}
