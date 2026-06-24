import { Expense, NewExpenseData } from "../types";
import { apiClient } from "./apiClient";

/** Mapea un gasto de la API (snake_case) al modelo de la App (camelCase) */
const mapExpenseToFrontend = (expense: any): Expense => {
    return {
        id: expense.id,
        description: expense.description,
        amount: Number(expense.amount),
        category: expense.category,
        createdAt: expense.created_at ? ({ toDate: () => new Date(expense.created_at) } as any) : undefined,
        recordedByEmployeeId: expense.recorded_by_employee_id,
        sessionId: expense.session_id,
        owner: expense.owner_id || '',
    };
};

/** Mapea un gasto del modelo de la App (camelCase) al de la API (snake_case) */
const mapExpenseToBackend = (expenseData: Partial<NewExpenseData>) => {
    return {
        description: expenseData.description,
        amount: expenseData.amount,
        category: expenseData.category,
        recorded_by_employee_id: expenseData.recordedByEmployeeId,
        session_id: expenseData.sessionId,
        owner_id: expenseData.owner,
    };
};

/** Obtener todos los gastos de una heladería */
export const getExpenses = async (heladeriaId: string): Promise<Expense[]> => {
    const expenses = await apiClient<any[]>(`/shops/${heladeriaId}/expenses`);
    return (expenses || []).map(mapExpenseToFrontend);
};

/** Registrar un nuevo gasto */
export const addExpense = async (heladeriaId: string, expenseData: NewExpenseData): Promise<void> => {
    await apiClient(`/shops/${heladeriaId}/expenses`, {
        method: 'POST',
        body: JSON.stringify(mapExpenseToBackend(expenseData))
    });
};

/** Actualizar un gasto existente. */
export const updateExpense = async (heladeriaId: string, expenseId: string, dataToUpdate: Partial<NewExpenseData>): Promise<void> => {
    console.warn("updateExpense is not yet implemented in Go backend.");
    await apiClient(`/shops/${heladeriaId}/expenses/${expenseId}`, {
        method: 'PUT',
        body: JSON.stringify(mapExpenseToBackend(dataToUpdate))
    });
};

/** Eliminar un gasto. */
export const deleteExpense = async (heladeriaId: string, expenseId: string): Promise<void> => {
    console.warn("deleteExpense is not yet implemented in Go backend.");
    await apiClient(`/shops/${heladeriaId}/expenses/${expenseId}`, {
        method: 'DELETE'
    });
};

/** Obtener todos los gastos asociados a una sesión de caja específica. */
export const getExpensesForSession = async (heladeriaId: string, sessionId: string): Promise<Expense[]> => {
    const expenses = await getExpenses(heladeriaId);
    return expenses.filter(e => e.sessionId === sessionId);
};

/**
 * Obtiene todos los gastos operativos dentro de un rango de fechas.
 */
export const getExpensesForPeriod = async (heladeriaId: string, startDate: Date, endDate: Date): Promise<Expense[]> => {
    const expenses = await getExpenses(heladeriaId);
    return expenses
        .filter(e => {
            if (!e.createdAt) return false;
            const date = e.createdAt.toDate();
            return date >= startDate && date <= endDate;
        });
};