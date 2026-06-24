import { NewPaymentMethodData, PaymentMethod, UpdatePaymentMethodData } from "../types";
import { apiClient } from "./apiClient";

/**
 * Map from backend snake_case to frontend camelCase
 */
const mapPaymentMethodToFrontend = (data: any): PaymentMethod => ({
    ...data,
    accountDetails: data.account_details || data.accountDetails,
    createdAt: data.created_at ? { toDate: () => new Date(data.created_at) } : undefined
});

/**
 * Obtiene TODOS los métodos de pago de una heladería.
 */
export const getAllPaymentMethods = async (heladeriaId: string): Promise<PaymentMethod[]> => {
    const data = await apiClient<any[]>(`/shops/${heladeriaId}/payment-methods`);
    return (data || []).map(mapPaymentMethodToFrontend);
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
    const payload = {
        ...data,
        account_details: data.accountDetails
    };
    await apiClient(`/shops/${heladeriaId}/payment-methods`, {
        method: 'POST',
        body: JSON.stringify(payload)
    });
};

/** Actualizar un método de pago existente */
export const updatePaymentMethod = async (heladeriaId: string, methodId: string, data: UpdatePaymentMethodData): Promise<void> => {
    const payload = {
        ...data,
        account_details: data.accountDetails
    };
    await apiClient(`/shops/${heladeriaId}/payment-methods/${methodId}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
    });
};

/** Eliminar un método de pago */
export const deletePaymentMethod = async (heladeriaId: string, methodId: string): Promise<void> => {
    await apiClient(`/shops/${heladeriaId}/payment-methods/${methodId}`, {
        method: 'DELETE'
    });
};