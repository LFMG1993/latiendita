import { Purchase, PurchasePayload, UpdatePurchaseData } from "../../types";
import { apiClient } from "../shared/apiClient";

/** Obtener todas las compras de una heladería */
export const getPurchases = async (shopId: string): Promise<Purchase[]> => {
    return await apiClient<Purchase[]>(`/shops/${shopId}/purchases`);
};

/** Obtiene las compras realizadas por un empleado durante una sesión de caja específica */
export const getPurchasesForSession = async (shopId: string, startTime: any, employeeId: string): Promise<Purchase[]> => {
    const purchases = await getPurchases(shopId);
    return purchases.filter(p => {
        // Handle mock Date parsing 
        const dateObj = new Date(p.createdAt as string);
        const startObj = new Date(startTime);
        
        return p.purchasedByEmployeeId === employeeId && dateObj >= startObj;
    });
};

/** Registrar una nueva compra */
export const addPurchase = async (shopId: string, purchaseData: PurchasePayload): Promise<void> => {
    // El backend en Go maneja la transacción atómica (stock, contadores, facturas) internamente.
    await apiClient(`/shops/${shopId}/purchases`, {
        method: 'POST',
        body: JSON.stringify(purchaseData)
    });
};

/** Actualizar una compra existente y ajustar el stock correspondientemente */
export const updatePurchase = async (shopId: string, purchaseId: string, dataToUpdate: UpdatePurchaseData): Promise<void> => {
    console.warn("Update purchase endpoint is not implemented in Go backend yet.");
    await apiClient(`/shops/${shopId}/purchases/${purchaseId}`, {
        method: 'PUT',
        body: JSON.stringify(dataToUpdate)
    });
};

/** Eliminar una compra y revertir el stock de los ingredientes */
export const deletePurchase = async (shopId: string, purchaseId: string) => {
    console.warn("Delete purchase endpoint is not implemented in Go backend yet.");
    await apiClient(`/shops/${shopId}/purchases/${purchaseId}`, {
        method: 'DELETE'
    });
};