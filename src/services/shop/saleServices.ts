import { NewSaleData, Sale } from "../../types";
import { apiClient } from "../shared/apiClient";

const mapSalePaymentToBackend = (p: any) => ({
    method_id: p.methodId || null,
    method_name: p.methodName || '',
    amount: Number(p.amount),
    type: p.type,
});

const mapSaleItemToBackend = (i: any) => {
    let finalProductId = i.productId || null;
    if (finalProductId && typeof finalProductId === 'string' && finalProductId.startsWith('PROMO::')) {
        finalProductId = null;
    }
    
    return {
        product_id: finalProductId,
        product_name: i.productName || '',
        quantity: Number(i.quantity),
        unit_price: Number(i.unitPrice),
        is_promotion: !!i.isPromotion,
        promotion_id: i.promotionId || null,
    };
};

const mapSaleToBackend = (s: NewSaleData) => ({
    session_id: s.sessionId || null,
    total: Number(s.total),
    employee_id: s.employeeId,
    employee_name: s.employeeName,
    client_id: s.clientId || null,
    client_name: s.clientName || null,
    pending_debt: Number(s.pendingDebt || 0),
    items: (s.items || []).map(mapSaleItemToBackend),
    payments: (s.payments || []).map(mapSalePaymentToBackend),
});

/**
 * Registra una nueva venta y descuenta el stock de los ingredientes utilizados de forma atómica.
 */
export const registerSale = async (shopId: string, saleData: NewSaleData): Promise<void> => {
    // The Go backend handles the transaction natively
    await apiClient(`/shops/${shopId}/sales`, {
        method: 'POST',
        body: JSON.stringify(mapSaleToBackend(saleData))
    });
};

/**
 * Obtiene todas las ventas dentro de un rango de fechas específico.
 */
export const getSalesByDateRange = async (shopId: string, startDate: Date, endDate: Date): Promise<Sale[]> => {
    const from = startDate.toISOString().split('T')[0];
    const to = endDate.toISOString().split('T')[0];
    
    const sales = await apiClient<Sale[]>(`/shops/${shopId}/sales?from=${from}&to=${to}`);
    return sales;
};

/**
 * Obtiene todas las ventas asociadas a un ID de sesión de caja específico.
 */
export const getSalesBySessionId = async (shopId: string, sessionId: string): Promise<Sale[]> => {
    const sales = await apiClient<Sale[]>(`/shops/${shopId}/sales`);
    return sales.filter(s => s.sessionId === sessionId);
};

/**
 * Obtiene todas las ventas POS asociadas a un cliente específico.
 */
export const getSalesByClientId = async (shopId: string, clientId: string): Promise<Sale[]> => {
    const sales = await apiClient<Sale[]>(`/shops/${shopId}/sales?client_id=${clientId}`);
    return sales;
};

/**
 * Obtiene todas las ventas POS asociadas a un cliente en todas las tiendas.
 */
export const getAllClientSales = async (clientId: string): Promise<Sale[]> => {
    const sales = await apiClient<Sale[]>(`/clients/${clientId}/sales`);
    return sales;
};