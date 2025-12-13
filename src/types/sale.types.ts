import { Timestamp } from "firebase/firestore";

/**
 * Representa un ingrediente específico y su cantidad tal como se usó en una venta.
 * Es una instantánea para el descuento de inventario.
 */
export interface IngredientUsage {
    ingredientId: string;
    quantity: number; // Cantidad en la 'unidad de consumo' del ingrediente.
}

/**
 * Define la estructura de un solo ítem dentro de una venta.
 */
export interface SaleItem {
    id: string,
    productId: string;
    productName: string;
    quantity: number;      // Cuántas unidades de este producto se vendieron (ej: 2 conos).
    unitPrice: number;     // Precio de una unidad del producto al momento de la venta.
    isPromotion?: boolean; // Flag para identificar si es una promoción
    promotionId?: string; // ID de la promoción original
    ingredientsUsed: IngredientUsage[]; // La lista exacta de ingredientes descontados del stock.
}

export interface SalePayment {
    methodId: string;
    methodName: string;
    amount: number;
    type: 'cash' | 'electronic';
}

export interface Sale {
    id: string;
    sessionId: string;
    total: number;
    items: SaleItem[];
    payments: SalePayment[];
    createdAt: Timestamp;
    employeeId: string; // UID del empleado que hizo la venta
    employeeName: string; // Nombre de normalizado para fácil visualización
}

// Tipo para los datos al crear una nueva venta.
export type NewSaleData = Omit<Sale, 'id' | 'createdAt'>;