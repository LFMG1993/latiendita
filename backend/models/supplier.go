package models

import "time"

// Supplier represents a product/ingredient provider for a shop
type Supplier struct {
	ID            string     `json:"id"`
	ShopID        string     `json:"shop_id"`
	Name          string     `json:"name"`
	ContactPerson *string    `json:"contact_person,omitempty"`
	Phone         *string    `json:"phone,omitempty"`
	Email         *string    `json:"email,omitempty"`
	PurchaseCount int        `json:"purchase_count"`
	CreatedAt     *time.Time `json:"created_at,omitempty"`
}

// Purchase represents a purchase invoice
type Purchase struct {
	ID                     string          `json:"id"`
	ShopID                 string          `json:"shop_id"`
	SupplierID             *string         `json:"supplier_id,omitempty"`
	SupplierName           string          `json:"supplier_name"`
	InvoiceNumber          *string         `json:"invoice_number,omitempty"`
	InternalInvoiceNumber  string          `json:"internal_invoice_number"`
	Total                  float64         `json:"total"`
	PurchasedByEmployeeID  *string         `json:"purchased_by_employee_id,omitempty"`
	CreatedAt              *time.Time      `json:"created_at,omitempty"`
	Items                  []PurchaseItem  `json:"items,omitempty"`
}

// PurchaseItem represents a single line item in a purchase
type PurchaseItem struct {
	ID                              string   `json:"id"`
	PurchaseID                      string   `json:"purchase_id"`
	ItemType                        string   `json:"item_type"` // 'ingredient' or 'product'
	IngredientID                    *string  `json:"ingredient_id,omitempty"`
	ProductID                       *string  `json:"product_id,omitempty"`
	Name                            string   `json:"name"`
	PurchaseUnit                    string   `json:"purchase_unit"`
	Quantity                        float64  `json:"quantity"`
	UnitCost                        float64  `json:"unit_cost"`
	ConsumptionUnitsPerPurchaseUnit float64  `json:"consumption_units_per_purchase_unit"`
	SupplierID                      *string  `json:"supplier_id,omitempty"`
	SupplierName                    *string  `json:"supplier_name,omitempty"`
}
