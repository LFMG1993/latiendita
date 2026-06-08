package models

import "time"

// Order represents a client order from the customer portal
type Order struct {
	ID            string      `json:"id"`
	ShopID        string      `json:"shop_id"`
	ClientID      string      `json:"client_id"`
	ClientName    string      `json:"client_name"`
	ClientPhone   *string     `json:"client_phone,omitempty"`
	TotalAmount   float64     `json:"total_amount"`
	TotalItems    float64     `json:"total_items"`
	Status        string      `json:"status"` // pending, preparing, ready, delivered, cancelled
	PaymentMethod string      `json:"payment_method"` // cash, credit, electronic
	UsedCredits   float64     `json:"used_credits"`
	PendingDebt   float64     `json:"pending_debt"`
	Note          *string     `json:"note,omitempty"`
	CreatedAt     *time.Time  `json:"created_at,omitempty"`
	UpdatedAt     *time.Time  `json:"updated_at,omitempty"`
	Items         []OrderItem `json:"items,omitempty"`
}

// OrderItem represents a product line within an order
type OrderItem struct {
	ID              string  `json:"id"`
	OrderID         string  `json:"order_id"`
	ProductID       *string `json:"product_id,omitempty"`
	ProductName     string  `json:"product_name"`
	Quantity        float64 `json:"quantity"`
	PriceAtPurchase float64 `json:"price_at_purchase"`
}

// DebtPaymentRequest represents a client's request to pay back their debt
type DebtPaymentRequest struct {
	ID                string     `json:"id"`
	ClientID          string     `json:"client_id"`
	ClientName        string     `json:"client_name"`
	ClientPhone       *string    `json:"client_phone,omitempty"`
	ShopID            string     `json:"shop_id"`
	Amount            float64    `json:"amount"`
	PaymentMethodID   *string    `json:"payment_method_id,omitempty"`
	PaymentMethodName string     `json:"payment_method_name"`
	VoucherNumber     string     `json:"voucher_number"`
	Status            string     `json:"status"` // pending, approved, rejected
	Notes             *string    `json:"notes,omitempty"`
	CreatedAt         *time.Time `json:"created_at,omitempty"`
	UpdatedAt         *time.Time `json:"updated_at,omitempty"`
}

// ClientShopFinancials holds aggregated financial info for a client at a shop
type ClientShopFinancials struct {
	Credits         float64  `json:"credits"`
	Debt            float64  `json:"debt"`
	IsCreditEnabled bool     `json:"is_credit_enabled"`
	CreditLimit     *float64 `json:"credit_limit,omitempty"`
}
