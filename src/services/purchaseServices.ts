import { Purchase, PurchasePayload, UpdatePurchaseData } from "../types";
import { apiClient } from "./apiClient";

/** Obtener todas las compras de una heladería */
export const getPurchases = async (heladeriaId: string): Promise<Purchase[]> => {
    return await apiClient<Purchase[]>(`/shops/${heladeriaId}/purchases`);
};

/** Obtiene las compras realizadas por un empleado durante una sesión de caja específica */
export const getPurchasesForSession = async (heladeriaId: string, startTime: any, employeeId: string): Promise<Purchase[]> => {
    const purchases = await getPurchases(heladeriaId);
    return purchases.filter(p => {
        // Handle mock Date parsing 
        const dateObj = (p.createdAt as any).toDate ? (p.createdAt as any).toDate() : new Date(p.createdAt as any);
        const startObj = startTime.toDate ? startTime.toDate() : new Date(startTime);
        
        return p.purchasedByEmployeeId === employeeId && dateObj >= startObj;
    });
};

/** Registrar una nueva compra */
export const addPurchase = async (heladeriaId: string, purchaseData: PurchasePayload): Promise<void> => {
    // El backend en Go maneja la transacción atómica (stock, contadores, facturas) internamente.
    await apiClient(`/shops/${heladeriaId}/purchases`, {
        method: 'POST',
        body: JSON.stringify(purchaseData)
    });
};

/** Actualizar una compra existente y ajustar el stock correspondientemente */
export const updatePurchase = async (heladeriaId: string, purchaseId: string, dataToUpdate: UpdatePurchaseData): Promise<void> => {
    console.warn("Update purchase endpoint is not implemented in Go backend yet.");
    await apiClient(`/shops/${heladeriaId}/purchases/${purchaseId}`, {
        method: 'PUT',
        body: JSON.stringify(dataToUpdate)
    });
};

/** Eliminar una compra y revertir el stock de los ingredientes */
export const deletePurchase = async (heladeriaId: string, purchaseId: string) => {
    console.warn("Delete purchase endpoint is not implemented in Go backend yet.");
    await apiClient(`/shops/${heladeriaId}/purchases/${purchaseId}`, {
        method: 'DELETE'
    });
};