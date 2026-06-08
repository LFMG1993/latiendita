import { Sale, CashSession, Purchase } from "../types";
import { apiClient } from "./apiClient";

/**
 * Obtiene todas las ventas dentro de un rango de fechas para una heladería específica.
 */
export const getSalesForPeriod = async (iceCreamShopId: string, startDate: Date, endDate: Date): Promise<Sale[]> => {
    // Convert dates to YYYY-MM-DD for the backend
    const from = startDate.toISOString().split('T')[0];
    const to = endDate.toISOString().split('T')[0];
    
    // The Go backend supports 'from' and 'to' query parameters for sales
    const sales = await apiClient<Sale[]>(`/shops/${iceCreamShopId}/sales?from=${from}&to=${to}`);
    
    // Convert string dates back to Date objects if needed by UI
    return sales.map(sale => ({
        ...sale,
        // Assuming backend returns string like "2026-06-08T00:00:00Z"
        createdAt: { toDate: () => new Date(sale.createdAt as any) } as any
    }));
};

/**
 * Obtiene todas las compras dentro de un rango de fechas para una heladería específica.
 */
export const getPurchasesForPeriod = async (iceCreamShopId: string, startDate: Date, endDate: Date): Promise<Purchase[]> => {
    // Currently backend fetches all, we filter in frontend
    const purchases = await apiClient<Purchase[]>(`/shops/${iceCreamShopId}/purchases`);
    
    return purchases
        .map(p => ({
            ...p,
            createdAt: { toDate: () => new Date(p.createdAt as any) } as any
        }))
        .filter(p => {
            const date = p.createdAt.toDate();
            return date >= startDate && date <= endDate;
        });
};

/**
 * Obtiene todas las compras realizadas por un empleado durante un rango de tiempo específico.
 */
export const getPurchasesForSession = async (iceCreamShopId: string, employeeId: string, startTime: Date, endTime: Date): Promise<Purchase[]> => {
    const purchases = await apiClient<Purchase[]>(`/shops/${iceCreamShopId}/purchases`);
    
    return purchases
        .map(p => ({
            ...p,
            createdAt: { toDate: () => new Date(p.createdAt as any) } as any
        }))
        .filter(p => {
            const date = p.createdAt.toDate();
            return p.purchasedByEmployeeId === employeeId && date >= startTime && date <= endTime;
        });
};

/**
 * Obtiene todos los cierres de caja (que contienen los gastos) en un rango de fechas.
 */
export const getCashSessionsForPeriod = async (iceCreamShopId: string, startDate: Date, endDate: Date): Promise<CashSession[]> => {
    const sessions = await apiClient<CashSession[]>(`/shops/${iceCreamShopId}/cash-sessions?status=closed`);
    
    return sessions
        .map(s => {
            const data: any = { ...s };
            // Map Go snake_case or specific struct names if they differ
            if (!data.purchasesSummary) data.purchasesSummary = [];
            if (!data.operationalExpenses) data.operationalExpenses = [];
            
            return {
                ...data,
                startTime: { toDate: () => new Date(s.startTime as any) },
                endTime: s.endTime ? { toDate: () => new Date(s.endTime as any) } : null,
                createdAt: { toDate: () => new Date(s.createdAt as any) }
            } as any;
        })
        .filter(s => {
            if (!s.endTime) return false;
            const date = s.endTime.toDate();
            return date >= startDate && date <= endDate;
        });
};

/* --- Funciones de Procesamiento de Datos --- */

export const processSalesByDay = (sales: Sale[]): { [key: string]: number } => {
    const dailySales: { [key: string]: number } = {};
    sales.forEach(sale => {
        // Handle both Firebase Timestamp and our mock {toDate: ()}
        const dateObj = (sale.createdAt as any).toDate ? (sale.createdAt as any).toDate() : new Date(sale.createdAt);
        const date = dateObj.toLocaleDateString('es-ES', {day: '2-digit', month: '2-digit'});
        if (!dailySales[date]) {
            dailySales[date] = 0;
        }
        dailySales[date] += sale.total;
    });
    return dailySales;
};

export const processTopProducts = (sales: Sale[]): { name: string, revenue: number }[] => {
    const productRevenue: { [key: string]: { name: string, revenue: number } } = {};

    sales.forEach(sale => {
        if (!sale.items) return;
        sale.items.forEach(item => {
            if (!productRevenue[item.productId]) {
                productRevenue[item.productId] = {name: item.productName, revenue: 0};
            }
            productRevenue[item.productId].revenue += item.quantity * item.unitPrice;
        });
    });

    return Object.values(productRevenue)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);
};

export const processSalesByWeekday = (sales: Sale[]): number[] => {
    const totalSalesByDay = new Array(7).fill(0);

    sales.forEach(sale => {
        const dateObj = (sale.createdAt as any).toDate ? (sale.createdAt as any).toDate() : new Date(sale.createdAt);
        const dayOfWeek = dateObj.getDay(); // Domingo = 0, Lunes = 1, etc.
        totalSalesByDay[dayOfWeek] += sale.total;
    });

    const [sunday, ...weekdays] = totalSalesByDay;
    return [...weekdays, sunday];
};