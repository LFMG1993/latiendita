import { NewPromotionData, Promotion, UpdatePromotionData } from "../../types";
import { apiClient } from "../shared/apiClient";

/**
 * Obtiene TODAS las promociones de una heladería.
 */
export const getAllPromotions = async (shopId: string): Promise<Promotion[]> => {
    return await apiClient<Promotion[]>(`/shops/${shopId}/promotions`);
};

/**
 * Obtiene todas las promociones ACTIVAS y VÁLIDAS para el día de hoy.
 */
export const getActivePromotionsForToday = async (shopId: string, currentDay: number): Promise<Promotion[]> => {
    const allPromos = await getAllPromotions(shopId);
    return allPromos.filter(p => p.isEnabled && p.activeDays && p.activeDays.includes(currentDay));
};

/** Añadir una nueva promoción */
export const addPromotion = async (shopId: string, data: NewPromotionData): Promise<void> => {
    await apiClient(`/shops/${shopId}/promotions`, {
        method: 'POST',
        body: JSON.stringify(data)
    });
};

/** Actualizar una promoción existente */
export const updatePromotion = async (shopId: string, promotionId: string, data: UpdatePromotionData): Promise<void> => {
    await apiClient(`/shops/${shopId}/promotions/${promotionId}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    });
};

/** Eliminar una promoción */
export const deletePromotion = async (shopId: string, promotionId: string): Promise<void> => {
    await apiClient(`/shops/${shopId}/promotions/${promotionId}`, {
        method: 'DELETE'
    });
};