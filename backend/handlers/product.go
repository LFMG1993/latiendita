package handlers

import (
	"encoding/json"
	"net/http"
	"strings"

	"backend/models"
	"backend/services"
)

// ProductHandler handles product and ingredient CRUD
type ProductHandler struct {
	productService *services.ProductService
}

func NewProductHandler(productService *services.ProductService) *ProductHandler {
	return &ProductHandler{productService: productService}
}

// ---- PRODUCTS ----

// CreateProduct handles POST /api/shops/{shop_id}/products
func (h *ProductHandler) CreateProduct(w http.ResponseWriter, r *http.Request) {
	shopID := extractShopID(r.URL.Path, "/products")
	if shopID == "" {
		jsonError(w, "shop_id required in path", http.StatusBadRequest)
		return
	}

	var p models.Product
	if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
		jsonError(w, "Invalid JSON", http.StatusBadRequest)
		return
	}
	p.ShopID = shopID

	if err := h.productService.CreateProduct(&p); err != nil {
		if strings.Contains(err.Error(), "required") {
			jsonError(w, err.Error(), http.StatusBadRequest)
		} else {
			jsonError(w, "Internal server error", http.StatusInternalServerError)
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(p)
}

// GetProducts handles GET /api/shops/{shop_id}/products
func (h *ProductHandler) GetProducts(w http.ResponseWriter, r *http.Request) {
	shopID := extractShopID(r.URL.Path, "/products")
	if shopID == "" {
		jsonError(w, "shop_id required in path", http.StatusBadRequest)
		return
	}

	products, err := h.productService.GetProductsByShop(shopID)
	if err != nil {
		jsonError(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(products)
}

// UpdateProduct handles PUT /api/shops/{shop_id}/products/{id}
func (h *ProductHandler) UpdateProduct(w http.ResponseWriter, r *http.Request) {
	parts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
	if len(parts) < 5 {
		jsonError(w, "Invalid path", http.StatusBadRequest)
		return
	}
	productID := parts[len(parts)-1]

	var p models.Product
	if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
		jsonError(w, "Invalid JSON structure", http.StatusBadRequest)
		return
	}
	p.ID = productID

	if err := h.productService.UpdateProduct(&p); err != nil {
		if strings.Contains(err.Error(), "required") {
			jsonError(w, err.Error(), http.StatusBadRequest)
		} else if strings.Contains(err.Error(), "no rows") {
			jsonError(w, "Product not found", http.StatusNotFound)
		} else {
			jsonError(w, "Internal server error", http.StatusInternalServerError)
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(p)
}

// DeleteProduct handles DELETE /api/shops/{shop_id}/products/{id}
func (h *ProductHandler) DeleteProduct(w http.ResponseWriter, r *http.Request) {
	parts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
	productID := parts[len(parts)-1]

	if err := h.productService.DeleteProduct(productID); err != nil {
		if strings.Contains(err.Error(), "required") {
			jsonError(w, err.Error(), http.StatusBadRequest)
		} else {
			jsonError(w, "Internal server error", http.StatusInternalServerError)
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Product deleted"})
}

// ---- INGREDIENTS ----

// CreateIngredient handles POST /api/shops/{shop_id}/ingredients
func (h *ProductHandler) CreateIngredient(w http.ResponseWriter, r *http.Request) {
	shopID := extractShopID(r.URL.Path, "/ingredients")
	if shopID == "" {
		jsonError(w, "shop_id required in path", http.StatusBadRequest)
		return
	}

	var ing models.Ingredient
	if err := json.NewDecoder(r.Body).Decode(&ing); err != nil {
		jsonError(w, "Invalid JSON", http.StatusBadRequest)
		return
	}
	ing.ShopID = shopID

	if err := h.productService.CreateIngredient(&ing); err != nil {
		if strings.Contains(err.Error(), "required") {
			jsonError(w, err.Error(), http.StatusBadRequest)
		} else {
			jsonError(w, "Internal server error", http.StatusInternalServerError)
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(ing)
}

// GetIngredients handles GET /api/shops/{shop_id}/ingredients
func (h *ProductHandler) GetIngredients(w http.ResponseWriter, r *http.Request) {
	shopID := extractShopID(r.URL.Path, "/ingredients")
	if shopID == "" {
		jsonError(w, "shop_id required in path", http.StatusBadRequest)
		return
	}

	ings, err := h.productService.GetIngredientsByShop(shopID)
	if err != nil {
		jsonError(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(ings)
}

// UpdateIngredient handles PUT /api/shops/{shop_id}/ingredients/{id}
func (h *ProductHandler) UpdateIngredient(w http.ResponseWriter, r *http.Request) {
	parts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
	ingredientID := parts[len(parts)-1]

	var ing models.Ingredient
	if err := json.NewDecoder(r.Body).Decode(&ing); err != nil {
		jsonError(w, "Invalid JSON", http.StatusBadRequest)
		return
	}
	ing.ID = ingredientID

	if err := h.productService.UpdateIngredient(&ing); err != nil {
		if strings.Contains(err.Error(), "required") {
			jsonError(w, err.Error(), http.StatusBadRequest)
		} else if strings.Contains(err.Error(), "no rows") {
			jsonError(w, "Ingredient not found", http.StatusNotFound)
		} else {
			jsonError(w, "Internal server error", http.StatusInternalServerError)
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(ing)
}

// DeleteIngredient handles DELETE /api/shops/{shop_id}/ingredients/{id}
func (h *ProductHandler) DeleteIngredient(w http.ResponseWriter, r *http.Request) {
	parts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
	id := parts[len(parts)-1]

	if err := h.productService.DeleteIngredient(id); err != nil {
		if strings.Contains(err.Error(), "required") {
			jsonError(w, err.Error(), http.StatusBadRequest)
		} else {
			jsonError(w, "Internal server error", http.StatusInternalServerError)
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Ingredient deleted"})
}

// extractShopID extracts the shop_id from paths like /api/shops/{shop_id}/products
func extractShopID(path, suffix string) string {
	// Trim the suffix endpoint from the path
	trimmed := strings.TrimSuffix(path, suffix)
	// Also trim any trailing /
	trimmed = strings.TrimSuffix(trimmed, "/")
	// Get last segment
	parts := strings.Split(trimmed, "/")
	if len(parts) == 0 {
		return ""
	}
	return parts[len(parts)-1]
}
