import { NewPromotionData, Promotion, UpdatePromotionData } from "../types";
import { apiClient } from "./apiClient";

/**
 * Obtiene TODAS las promociones de una heladería.
 */
export const getAllPromotions = async (heladeriaId: string): Promise<Promotion[]> => {
    return await apiClient<Promotion[]>(`/shops/${heladeriaId}/promotions`);
};

/**
 * Obtiene todas las promociones ACTIVAS y VÁLIDAS para el día de hoy.
 */
export const getActivePromotionsForToday = async (heladeriaId: string, currentDay: number): Promise<Promotion[]> => {
    const allPromos = await getAllPromotions(heladeriaId);
    return allPromos.filter(p => p.isEnabled && p.activeDays && p.activeDays.includes(currentDay));
};

/** Añadir una nueva promoción */
export const addPromotion = async (heladeriaId: string, data: NewPromotionData): Promise<void> => {
    await apiClient(`/shops/${heladeriaId}/promotions`, {
        method: 'POST',
        body: JSON.stringify(data)
    });
};

/** Actualizar una promoción existente */
export const updatePromotion = async (heladeriaId: string, promotionId: string, data: UpdatePromotionData): Promise<void> => {
    await apiClient(`/shops/${heladeriaId}/promotions/${promotionId}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    });
};

/** Eliminar una promoción */
export const deletePromotion = async (heladeriaId: string, promotionId: string): Promise<void> => {
    await apiClient(`/shops/${heladeriaId}/promotions/${promotionId}`, {
        method: 'DELETE'
    });
};