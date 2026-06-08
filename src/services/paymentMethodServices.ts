import { NewPaymentMethodData, PaymentMethod, UpdatePaymentMethodData } from "../types";
import { apiClient } from "./apiClient";

/**
 * Obtiene TODOS los métodos de pago de una heladería.
 */
export const getAllPaymentMethods = async (heladeriaId: string): Promise<PaymentMethod[]> => {
    return await apiClient<PaymentMethod[]>(`/shops/${heladeriaId}/payment-methods`);
};

/**
 * Obtiene todos los métodos de pago ACTIVOS de una heladería.
 */
export const getActivePaymentMethods = async (heladeriaId: string): Promise<PaymentMethod[]> => {
    const allMethods = await getAllPaymentMethods(heladeriaId);
    return allMethods.filter(m => m.enabled === true);
};

/** Añadir un nuevo método de pago */
export const addPaymentMethod = async (heladeriaId: string, data: NewPaymentMethodData): Promise<void> => {
    await apiClient(`/shops/${heladeriaId}/payment-methods`, {
        method: 'POST',
        body: JSON.stringify(data)
    });
};

/** Actualizar un método de pago existente */
export const updatePaymentMethod = async (heladeriaId: string, methodId: string, data: UpdatePaymentMethodData): Promise<void> => {
    await apiClient(`/shops/${heladeriaId}/payment-methods/${methodId}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    });
};

/** Eliminar un método de pago */
export const deletePaymentMethod = async (heladeriaId: string, methodId: string): Promise<void> => {
    await apiClient(`/shops/${heladeriaId}/payment-methods/${methodId}`, {
        method: 'DELETE'
    });
};