import { NewCashSessionData, CashSession } from "../types";
import { getSalesByDateRange } from "./saleServices";
import { apiClient } from "./apiClient";
import { getPurchases } from "./purchaseServices";
import { getExpenses } from "./expenseServices";

/**
 * Mapea una sesión de caja de la API (snake_case) al modelo de la App (camelCase).
 */
const mapSessionToFrontend = (session: any): CashSession => {
    if (!session) return session;
    return {
        id: session.id,
        employeeId: session.employee_id,
        employeeName: session.employee_name,
        startTime: { toDate: () => new Date(session.start_time) } as any,
        endTime: session.end_time ? ({ toDate: () => new Date(session.end_time) } as any) : undefined,
        status: session.status,
        openingBalance: Number(session.opening_balance),
        closingBalance: session.closing_balance !== undefined ? Number(session.closing_balance) : undefined,
        cashSales: session.cash_sales !== undefined ? Number(session.cash_sales) : 0,
        transferSales: session.transfer_sales !== undefined ? Number(session.transfer_sales) : 0,
        totalSales: session.total_sales !== undefined ? Number(session.total_sales) : 0,
        totalExpenses: session.total_expenses !== undefined ? Number(session.total_expenses) : 0,
        unregisteredSales: session.unregistered_sales !== undefined ? Number(session.unregistered_sales) : 0,
        expectedCashInBox: session.expected_cash_in_box !== undefined ? Number(session.expected_cash_in_box) : 0,
        difference: session.difference !== undefined ? Number(session.difference) : 0,
        notes: session.notes,
    };
};

/**
 * Busca si hay una sesión de caja abierta actualmente en la heladería.
 */
export const getOpenCashSession = async (heladeriaId: string): Promise<CashSession | null> => {
    try {
        const session = await apiClient<any>(`/shops/${heladeriaId}/cash-sessions/open`);
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
export const startCashSession = async (heladeriaId: string, sessionData: NewCashSessionData): Promise<void> => {
    await apiClient(`/shops/${heladeriaId}/cash-sessions`, {
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
    heladeriaId: string, 
    session: CashSession, 
    closingData: { closingBalance: number, notes: string | undefined }
) => {
    // 1. Obtener todas las ventas realizadas durante esta sesión
    const sales = await getSalesByDateRange(heladeriaId, session.startTime.toDate(), new Date());

    // 2. Obtener las compras (gastos) realizadas por el empleado durante la sesión
    const purchases = await getPurchases(heladeriaId);
    const sessionPurchases = purchases.filter(p => {
        const pDate = p.createdAt ? (p.createdAt as any).toDate() : new Date();
        return p.purchasedByEmployeeId === session.employeeId && pDate >= session.startTime.toDate();
    });
    const totalPurchaseExpenses = sessionPurchases.reduce((sum, exp) => sum + Number(exp.total), 0);

    // 2.1. OBTENER LOS GASTOS OPERATIVOS REGISTRADOS EN LA SESIÓN
    const allExpenses = await getExpenses(heladeriaId);
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