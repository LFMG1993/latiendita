/**
 * Representa los datos agregados para un solo producto en un reporte de ventas.
 */
export interface ProductSalesReport {
    productId: string;
    productName: string;
    quantitySold: number;
    totalRevenue: number;
}

/**
 * Representa los datos agregados para las ventas en una hora específica.
 */
export interface HourlySalesReport {
    hour: number; // 0-23
    totalRevenue: number;
    transactionCount: number;
}