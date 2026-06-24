import { NewPaymentMethodData, PaymentMethod, UpdatePaymentMethodData } from "../../types";
import { apiClient } from "../shared/apiClient";

/**
 * Obtiene TODOS los métodos de pago de una heladería.
 */
export const getAllPaymentMethods = async (shopId: string): Promise<PaymentMethod[]> => {
    return await apiClient<PaymentMethod[]>(`/shops/${shopId}/payment-methods`);
};

/**
 * Obtiene todos los métodos de pago ACTIVOS de una heladería.
 */
export const getActivePaymentMethods = async (shopId: string): Promise<PaymentMethod[]> => {
    const allMethods = await getAllPaymentMethods(shopId);
    return allMethods.filter(m => m.enabled === true);
};

/** Añadir un nuevo método de pago */
export const addPaymentMethod = async (shopId: string, data: NewPaymentMethodData): Promise<void> => {
    await apiClient(`/shops/${shopId}/payment-methods`, {
        method: 'POST',
        body: JSON.stringify(data)
    });
};

/** Actualizar un método de pago existente */
export const updatePaymentMethod = async (shopId: string, methodId: string, data: UpdatePaymentMethodData): Promise<void> => {
    await apiClient(`/shops/${shopId}/payment-methods/${methodId}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    });
};

/** Eliminar un método de pago */
export const deletePaymentMethod = async (shopId: string, methodId: string): Promise<void> => {
    await apiClient(`/shops/${shopId}/payment-methods/${methodId}`, {
        method: 'DELETE'
    });
};