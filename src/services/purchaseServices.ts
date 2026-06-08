import { Purchase, PurchasePayload, UpdatePurchaseData } from "../types";
import { apiClient } from "./apiClient";

/** Mapea un PurchaseItem de la API (snake_case) al modelo Frontend (camelCase) */
const mapPurchaseItemToFrontend = (item: any): any => {
    return {
        id: item.id,
        purchaseId: item.purchase_id,
        itemType: item.item_type,
        ingredientId: item.ingredient_id,
        productId: item.product_id,
        name: item.name,
        purchaseUnit: item.purchase_unit,
        quantity: Number(item.quantity),
        unitCost: Number(item.unit_cost),
        consumptionUnitsPerPurchaseUnit: Number(item.consumption_units_per_purchase_unit),
        supplierId: item.supplier_id,
        supplierName: item.supplier_name,
    };
};

/** Mapea una compra de la API (snake_case) al modelo Frontend (camelCase) */
const mapPurchaseToFrontend = (p: any): Purchase => {
    return {
        id: p.id,
        supplierId: p.supplier_id || '',
        supplierName: p.supplier_name,
        invoiceNumber: p.invoice_number || '',
        internalInvoiceNumber: p.internal_invoice_number,
        total: Number(p.total),
        createdAt: p.created_at ? ({ toDate: () => new Date(p.created_at) } as any) : undefined,
        purchasedByEmployeeId: p.purchased_by_employee_id,
        items: p.items ? p.items.map(mapPurchaseItemToFrontend) : [],
    };
};

/** Mapea una compra del frontend (camelCase) a la carga útil en snake_case para la API */
const mapPurchasePayloadToBackend = (purchaseData: PurchasePayload) => {
    return {
        supplier_id: purchaseData.supplierId === 'MULTI' ? null : (purchaseData.supplierId || null),
        supplier_name: purchaseData.supplierName,
        invoice_number: purchaseData.invoiceNumber,
        internal_invoice_number: (purchaseData as any).internalInvoiceNumber || 'PENDING',
        total: purchaseData.total,
        purchased_by_employee_id: purchaseData.purchasedByEmployeeId,
        items: (purchaseData.items || []).map(item => ({
            item_type: item.itemType,
            ingredient_id: item.ingredientId || null,
            product_id: item.productId || null,
            name: item.name,
            purchase_unit: item.purchaseUnit,
            quantity: item.quantity,
            unit_cost: item.unitCost,
            consumption_units_per_purchase_unit: item.consumptionUnitsPerPurchaseUnit,
            supplier_id: item.supplierId || null,
            supplier_name: item.supplierName || null,
        })),
    };
};

/** Obtener todas las compras de una heladería */
export const getPurchases = async (heladeriaId: string): Promise<Purchase[]> => {
    const purchases = await apiClient<any[]>(`/shops/${heladeriaId}/purchases`);
    return (purchases || []).map(mapPurchaseToFrontend);
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
        body: JSON.stringify(mapPurchasePayloadToBackend(purchaseData))
    });
};

/** Actualizar una compra existente y ajustar el stock correspondientemente */
export const updatePurchase = async (heladeriaId: string, purchaseId: string, dataToUpdate: UpdatePurchaseData): Promise<void> => {
    console.warn("Update purchase endpoint is not implemented in Go backend yet.");
    await apiClient(`/shops/${heladeriaId}/purchases/${purchaseId}`, {
        method: 'PUT',
        body: JSON.stringify(dataToUpdate) // If this gets implemented, it should also be mapped, but backend has no endpoint yet.
    });
};

/** Eliminar una compra y revertir el stock de los ingredientes */
export const deletePurchase = async (heladeriaId: string, purchaseId: string) => {
    console.warn("Delete purchase endpoint is not implemented in Go backend yet.");
    await apiClient(`/shops/${heladeriaId}/purchases/${purchaseId}`, {
        method: 'DELETE'
    });
};