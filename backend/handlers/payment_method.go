package handlers

import (
	"encoding/json"
	"net/http"
	"strings"

	"backend/models"
	"backend/services"
)

// PaymentMethodHandler handles payment methods and promotions
type PaymentMethodHandler struct {
	paymentMethodService *services.PaymentMethodService
}

func NewPaymentMethodHandler(paymentMethodService *services.PaymentMethodService) *PaymentMethodHandler {
	return &PaymentMethodHandler{paymentMethodService: paymentMethodService}
}

// ---- PAYMENT METHODS ----
func (h *PaymentMethodHandler) CreatePaymentMethod(w http.ResponseWriter, r *http.Request) {
	shopID := extractShopID(r.URL.Path, "/payment-methods")
	if shopID == "" {
		jsonError(w, "shop_id required", http.StatusBadRequest)
		return
	}

	var pm models.PaymentMethod
	if err := json.NewDecoder(r.Body).Decode(&pm); err != nil {
		jsonError(w, "Invalid JSON", http.StatusBadRequest)
		return
	}
	pm.ShopID = shopID

	if err := h.paymentMethodService.CreatePaymentMethod(&pm); err != nil {
		if strings.Contains(err.Error(), "required") {
			jsonError(w, err.Error(), http.StatusBadRequest)
		} else if strings.Contains(err.Error(), "duplicate") || strings.Contains(err.Error(), "unique") {
			jsonError(w, "Payment method name already exists for this shop", http.StatusConflict)
		} else {
			jsonError(w, "Internal server error", http.StatusInternalServerError)
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(pm)
}

func (h *PaymentMethodHandler) GetPaymentMethods(w http.ResponseWriter, r *http.Request) {
	shopID := extractShopID(r.URL.Path, "/payment-methods")
	if shopID == "" {
		jsonError(w, "shop_id required", http.StatusBadRequest)
		return
	}

	methods, err := h.paymentMethodService.GetPaymentMethodsByShop(shopID)
	if err != nil {
		jsonError(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(methods)
}

func (h *PaymentMethodHandler) UpdatePaymentMethod(w http.ResponseWriter, r *http.Request) {
	parts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
	id := parts[len(parts)-1]

	var pm models.PaymentMethod
	if err := json.NewDecoder(r.Body).Decode(&pm); err != nil {
		jsonError(w, "Invalid JSON", http.StatusBadRequest)
		return
	}
	pm.ID = id

	if err := h.paymentMethodService.UpdatePaymentMethod(&pm); err != nil {
		if strings.Contains(err.Error(), "required") {
			jsonError(w, err.Error(), http.StatusBadRequest)
		} else if strings.Contains(err.Error(), "no rows") {
			jsonError(w, "Payment method not found", http.StatusNotFound)
		} else {
			jsonError(w, "Internal server error", http.StatusInternalServerError)
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(pm)
}

func (h *PaymentMethodHandler) DeletePaymentMethod(w http.ResponseWriter, r *http.Request) {
	parts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
	id := parts[len(parts)-1]

	if err := h.paymentMethodService.DeletePaymentMethod(id); err != nil {
		jsonError(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Payment method deleted"})
}

// ---- PROMOTIONS ----

func (h *PaymentMethodHandler) CreatePromotion(w http.ResponseWriter, r *http.Request) {
	shopID := extractShopID(r.URL.Path, "/promotions")
	if shopID == "" {
		jsonError(w, "shop_id required", http.StatusBadRequest)
		return
	}

	var promo models.Promotion
	if err := json.NewDecoder(r.Body).Decode(&promo); err != nil {
		jsonError(w, "Invalid JSON", http.StatusBadRequest)
		return
	}
	promo.ShopID = shopID

	if err := h.paymentMethodService.CreatePromotion(&promo); err != nil {
		if strings.Contains(err.Error(), "required") {
			jsonError(w, err.Error(), http.StatusBadRequest)
		} else {
			jsonError(w, "Internal server error", http.StatusInternalServerError)
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(promo)
}

func (h *PaymentMethodHandler) GetPromotions(w http.ResponseWriter, r *http.Request) {
	shopID := extractShopID(r.URL.Path, "/promotions")
	if shopID == "" {
		jsonError(w, "shop_id required", http.StatusBadRequest)
		return
	}

	promos, err := h.paymentMethodService.GetPromotionsByShop(shopID)
	if err != nil {
		jsonError(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(promos)
}

func (h *PaymentMethodHandler) UpdatePromotion(w http.ResponseWriter, r *http.Request) {
	parts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
	id := parts[len(parts)-1]

	var promo models.Promotion
	if err := json.NewDecoder(r.Body).Decode(&promo); err != nil {
		jsonError(w, "Invalid JSON", http.StatusBadRequest)
		return
	}
	promo.ID = id

	if err := h.paymentMethodService.UpdatePromotion(&promo); err != nil {
		jsonError(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(promo)
}

func (h *PaymentMethodHandler) DeletePromotion(w http.ResponseWriter, r *http.Request) {
	parts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
	id := parts[len(parts)-1]

	if err := h.paymentMethodService.DeletePromotion(id); err != nil {
		jsonError(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Promotion deleted"})
}
