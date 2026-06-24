
export interface SessionExpense {
    description: string;
    amount: number;
}

export interface CashSession {
    id: string;
    employeeId: string;     // UID del empleado que abrió la caja
    employeeName: string;   // Nombre del empleado
    startTime: string;
    endTime?: string;
    status: 'open' | 'closed';

    openingBalance: number; // Base inicial
    closingBalance?: number; // Conteo final de efectivo

    // Datos calculados al momento del cierre
    cashSales?: number;
    transferSales?: number;
    totalSales?: number;
    purchasesSummary?: SessionExpense[]; // Resumen de compras de inventario
    operationalExpenses?: SessionExpense[]; // Resumen de gastos operativos
    totalExpenses?: number;
    unregisteredSales?: number; // "Sobrantes"
    notes?: string; // "Observaciones"
    expectedCashInBox?: number;   // openingBalance + cashSales - totalExpenses + unregisteredSales
    difference?: number;     // closingBalance - expectedCash (sobrante o faltante)
}

export type NewCashSessionData = Pick<CashSession, 'employeeId' | 'employeeName' | 'openingBalance'>;
export type CloseCashSessionData = Pick<CashSession, 'closingBalance' | 'purchasesSummary' | 'operationalExpenses'>;