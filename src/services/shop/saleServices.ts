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

const mapSalePaymentToFrontend = (p: any) => ({
    id: p.id,
    saleId: p.sale_id,
    methodId: p.method_id || '',
    methodName: p.method_name || '',
    amount: Number(p.amount),
    type: p.type,
});

const mapSaleItemToFrontend = (i: any) => ({
    id: i.id,
    saleId: i.sale_id,
    productId: i.product_id || '',
    productName: i.product_name || '',
    quantity: Number(i.quantity),
    unitPrice: Number(i.unit_price),
    isPromotion: !!i.is_promotion,
    promotionId: i.promotion_id || '',
    ingredientsUsed: [],
});

const mapSaleToFrontend = (s: any): Sale => ({
    id: s.id,
    sessionId: s.session_id || '',
    total: Number(s.total),
    employeeId: s.employee_id,
    employeeName: s.employee_name,
    clientId: s.client_id || undefined,
    clientName: s.client_name || undefined,
    pendingDebt: s.pending_debt !== undefined ? Number(s.pending_debt) : undefined,
    createdAt: s.created_at ? ({ toDate: () => new Date(s.created_at) } as any) : undefined,
    items: s.items ? s.items.map(mapSaleItemToFrontend) : [],
    payments: s.payments ? s.payments.map(mapSalePaymentToFrontend) : [],
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
    
<<<<<<< HEAD:src/services/shop/saleServices.ts
    const sales = await apiClient<Sale[]>(`/shops/${shopId}/sales?from=${from}&to=${to}`);
    
    return sales.map(sale => ({
        ...sale,
        createdAt: { toDate: () => new Date(sale.createdAt as any) } as any
    }));
=======
    const sales = await apiClient<any[]>(`/shops/${heladeriaId}/sales?from=${from}&to=${to}`);
    return (sales || []).map(mapSaleToFrontend);
>>>>>>> refs/remotes/origin/main:src/services/saleServices.ts
};

/**
 * Obtiene todas las ventas asociadas a un ID de sesión de caja específico.
 */
<<<<<<< HEAD:src/services/shop/saleServices.ts
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
=======
export const getSalesBySessionId = async (iceCreamShopId: string, sessionId: string): Promise<Sale[]> => {
    // Fetch all sales for the shop and filter by session_id
    const sales = await apiClient<any[]>(`/shops/${iceCreamShopId}/sales`);
    return (sales || [])
        .filter(s => s.session_id === sessionId)
        .map(mapSaleToFrontend);
};

/**
 * Obtiene todas las ventas POS asociadas a un cliente específico.
 */
export const getSalesByClientId = async (shopId: string, clientId: string): Promise<Sale[]> => {
    const sales = await apiClient<any[]>(`/shops/${shopId}/sales?client_id=${clientId}`);
    return (sales || []).map(mapSaleToFrontend);
};

/**
 * Obtiene todas las ventas POS asociadas a un cliente en todas las tiendas.
 */
export const getAllClientSales = async (clientId: string): Promise<Sale[]> => {
    const sales = await apiClient<any[]>(`/clients/${clientId}/sales`);
    return (sales || []).map(mapSaleToFrontend);
>>>>>>> refs/remotes/origin/main:src/services/saleServices.ts
};