import { NewCashSessionData, CashSession, Purchase, Expense } from "../types";
import { getSalesByDateRange } from "./saleServices";
import { apiClient } from "./apiClient";

/**
 * Busca si hay una sesión de caja abierta actualmente en la heladería.
 */
export const getOpenCashSession = async (shopId: string): Promise<CashSession | null> => {
    try {
        const session = await apiClient<CashSession>(`/shops/${heladeriaId}/cash-sessions/open`);
        // If the backend returns null/empty obj it means no session is open
        if (!session || !session.id) return null;

        return mapSessionToFrontend(session);
    } catch {
        return null;
    }
};

/**
 * Inicia una nueva sesión de caja.
 */
export const startCashSession = async (shopId: string, sessionData: NewCashSessionData): Promise<void> => {
    await apiClient(`/shops/${shopId}/cash-sessions`, {
        method: 'POST',
        body: JSON.stringify({
            employee_id: sessionData.employeeId,
            employee_name: sessionData.employeeName,
            opening_balance: sessionData.openingBalance
        })
    });
};

/**
 * Cierra una sesión de caja, calculando todos los totales.
 */
export const closeCashSession = async (
    shopId: string,
    session: CashSession,
    closingData: { closingBalance: number, notes: string | undefined }
) => {
    // 1. Obtener todas las ventas realizadas durante esta sesión
    const sales = await getSalesByDateRange(shopId, new Date(session.startTime), new Date());

    // 2. Obtener las compras (gastos) realizadas por el empleado durante la sesión
    const purchases = await apiClient<Purchase[]>(`/shops/${heladeriaId}/purchases`);
    const sessionPurchases = purchases.filter(p => {
        const pDate = new Date(p.createdAt as any);
        return p.purchasedByEmployeeId === session.employeeId && pDate >= session.startTime.toDate();
    });
    const totalPurchaseExpenses = sessionPurchases.reduce((sum, exp) => sum + Number(exp.total), 0);

    // 2.1. OBTENER LOS GASTOS OPERATIVOS REGISTRADOS EN LA SESIÓN
    const allExpenses = await apiClient<Expense[]>(`/shops/${heladeriaId}/expenses`);
    const operationalExpenses = allExpenses.filter(e => e.sessionId === session.id);
    const totalOperationalExpenses = operationalExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0);

    // 2.2. CALCULAR EL TOTAL DE GASTOS CORRECTO
    const totalExpenses = totalPurchaseExpenses + totalOperationalExpenses;

    // 3. Calcular los totales de la sesión a partir de los pagos de cada venta
    let cashSales = 0;
    let transferSales = 0;
    sales.forEach(sale => {
        if (!sale.payments) return;
        sale.payments.forEach(payment => {
            if (payment.type === 'cash') {
                cashSales += Number(payment.amount);
            } else {
                transferSales += Number(payment.amount);
            }
        });
    });

    const expectedCashInBox = Number(session.openingBalance) + cashSales - totalExpenses;
    const difference = closingData.closingBalance - expectedCashInBox;

    // 4. Send PUT request to close session
    await apiClient(`/cash-sessions/${session.id}/close`, {
        method: 'PUT',
        body: JSON.stringify({
            closing_balance: closingData.closingBalance,
            notes: closingData.notes,
            cash_sales: cashSales,
            transfer_sales: transferSales,
            total_sales: cashSales + transferSales,
            total_expenses: totalExpenses,
            expected_cash_in_box: expectedCashInBox,
            difference,
            unregistered_sales: 0 // Default logic
        })
    });
};