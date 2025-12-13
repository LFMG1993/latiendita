import { Timestamp } from "firebase/firestore";

/**
 * Representa la carga útil (payload) de datos que se envía desde el formulario
 * al servicio para crear una nueva compra. No incluye campos generados por el backend.
 */
export interface PurchasePayload {
    supplierId: string;
    supplierName: string;
    invoiceNumber: string;
    items: PurchaseItem[];
    purchasedByEmployeeId: string;
    total: number;
}

// Define la estructura de un solo ítem dentro de una compra.
export interface PurchaseItem {
    ingredientId: string;
    name: string;
    purchaseUnit: string;
    quantity: number;
    unitCost: number;
    consumptionUnitsPerPurchaseUnit: number;
}

export interface Purchase {
    id: string;
    supplierId: string;
    supplierName: string;
    invoiceNumber: string;
    internalInvoiceNumber: string;
    total: number;
    items: PurchaseItem[];
    createdAt: Timestamp;
    purchasedByEmployeeId: string;
}

// Tipo para los datos al crear una nueva compra
export type NewPurchaseData = Omit<Purchase, 'id' | 'createdAt'>;
export type UpdatePurchaseData = Partial<Omit<Purchase, 'id' | 'createdAt' | 'internalInvoiceNumber'>>;