package models

import "time"

// Sale represents a completed POS transaction
type Sale struct {
	ID           string        `json:"id"`
	ShopID       string        `json:"shop_id"`
	SessionID    *string       `json:"session_id,omitempty"`
	Total        float64       `json:"total"`
	EmployeeID   string        `json:"employee_id"`
	EmployeeName string        `json:"employee_name"`
	ClientID     *string       `json:"client_id,omitempty"`
	ClientName   *string       `json:"client_name,omitempty"`
	PendingDebt  float64       `json:"pending_debt"`
	CreatedAt    *time.Time    `json:"created_at,omitempty"`
	Items        []SaleItem    `json:"items,omitempty"`
	Payments     []SalePayment `json:"payments,omitempty"`
}

// SaleItem represents a product line within a sale
type SaleItem struct {
	ID          string  `json:"id"`
	SaleID      string  `json:"sale_id"`
	ProductID   *string `json:"product_id,omitempty"`
	ProductName string  `json:"product_name"`
	Quantity    float64 `json:"quantity"`
	UnitPrice   float64 `json:"unit_price"`
	IsPromotion bool    `json:"is_promotion"`
	PromotionID *string `json:"promotion_id,omitempty"`
}

// SalePayment represents one payment method used in a sale
type SalePayment struct {
	ID         string  `json:"id"`
	SaleID     string  `json:"sale_id"`
	MethodID   *string `json:"method_id,omitempty"`
	MethodName string  `json:"method_name"`
	Amount     float64 `json:"amount"`
	Type       string  `json:"type"` // cash, electronic, credit
}
