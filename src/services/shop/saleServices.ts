import { NewSaleData, Sale } from "../../types";
import { apiClient } from "../shared/apiClient";

/**
 * Registra una nueva venta y descuenta el stock de los ingredientes utilizados de forma atómica.
 */
export const registerSale = async (shopId: string, saleData: NewSaleData): Promise<void> => {
    // The Go backend handles the transaction natively
    await apiClient(`/shops/${shopId}/sales`, {
        method: 'POST',
        body: JSON.stringify(saleData)
    });
};

/**
 * Obtiene todas las ventas dentro de un rango de fechas específico.
 */
export const getSalesByDateRange = async (shopId: string, startDate: Date, endDate: Date): Promise<Sale[]> => {
    const from = startDate.toISOString().split('T')[0];
    const to = endDate.toISOString().split('T')[0];
    
    const sales = await apiClient<Sale[]>(`/shops/${shopId}/sales?from=${from}&to=${to}`);
    
    return sales.map(sale => ({
        ...sale,
        createdAt: { toDate: () => new Date(sale.createdAt as any) } as any
    }));
};

/**
 * Obtiene todas las ventas asociadas a un ID de sesión de caja específico.
 */
export const getSalesBySessionId = async (shopId: string, sessionId: string): Promise<Sale[]> => {
    // We fetch recent sales and filter by sessionId. 
    // If the backend supported ?session_id=... we could pass it directly.
    const sales = await apiClient<Sale[]>(`/shops/${shopId}/sales`);
    
    return sales
        .filter(s => s.sessionId === sessionId)
        .map(sale => ({
            ...sale,
            createdAt: { toDate: () => new Date(sale.createdAt as any) } as any
        }));
};