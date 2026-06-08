package models

import "time"

// Product represents a sellable item in a shop
// Product representa un artículo vendible en una tienda
type Product struct {
	ID              string     `json:"id"`
	ShopID          string     `json:"shop_id"`
	MasterProductID *string    `json:"master_product_id,omitempty"`
	Name            string     `json:"name"`
	Price           float64    `json:"price"`
	Category        string     `json:"category"`
	Cost            float64    `json:"cost"`
	Stock           float64    `json:"stock"`
	ImageURL        *string    `json:"image_url,omitempty"`
	Description     *string    `json:"description,omitempty"`
	IsAvailable     bool       `json:"is_available"`
	CreatedAt       *time.Time `json:"created_at,omitempty"`
	UpdatedAt       *time.Time `json:"updated_at,omitempty"`
}

// Ingredient represents a raw material used in product recipes
// Ingredient representa una materia prima usada en las recetas de productos
type Ingredient struct {
	ID                              string     `json:"id"`
	ShopID                          string     `json:"shop_id"`
	Name                            string     `json:"name"`
	Category                        string     `json:"category"`
	PurchaseUnit                    string     `json:"purchase_unit"`
	ConsumptionUnit                 string     `json:"consumption_unit"`
	ConsumptionUnitsPerPurchaseUnit float64    `json:"consumption_units_per_purchase_unit"`
	Stock                           float64    `json:"stock"`
	CreatedAt                       *time.Time `json:"created_at,omitempty"`
	UpdatedAt                       *time.Time `json:"updated_at,omitempty"`
}

// ProductRecipe links a product to its ingredient quantities
// ProductRecipe vincula un producto con las cantidades de sus ingredientes
type ProductRecipe struct {
	ProductID    string  `json:"product_id"`
	IngredientID string  `json:"ingredient_id"`
	Quantity     float64 `json:"quantity"`
}
