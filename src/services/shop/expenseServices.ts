import { Expense, NewExpenseData } from "../../types";
import { apiClient } from "../shared/apiClient";

/** Obtener todos los gastos de una heladería */
export const getExpenses = async (shopId: string): Promise<Expense[]> => {
    return await apiClient<Expense[]>(`/shops/${shopId}/expenses`);
};

/** Registrar un nuevo gasto */
export const addExpense = async (shopId: string, expenseData: NewExpenseData): Promise<void> => {
    await apiClient(`/shops/${shopId}/expenses`, {
        method: 'POST',
        body: JSON.stringify(expenseData)
    });
};

/** Actualizar un gasto existente. */
export const updateExpense = async (shopId: string, expenseId: string, dataToUpdate: Partial<NewExpenseData>): Promise<void> => {
    console.warn("updateExpense is not yet implemented in Go backend.");
    await apiClient(`/shops/${shopId}/expenses/${expenseId}`, {
        method: 'PUT',
        body: JSON.stringify(dataToUpdate)
    });
};

/** Eliminar un gasto. */
export const deleteExpense = async (shopId: string, expenseId: string): Promise<void> => {
    console.warn("deleteExpense is not yet implemented in Go backend.");
    await apiClient(`/shops/${shopId}/expenses/${expenseId}`, {
        method: 'DELETE'
    });
};

/** Obtener todos los gastos asociados a una sesión de caja específica. */
export const getExpensesForSession = async (shopId: string, sessionId: string): Promise<Expense[]> => {
    const expenses = await getExpenses(shopId);
    return expenses.filter(e => e.sessionId === sessionId);
};

/**
 * Obtiene todos los gastos operativos dentro de un rango de fechas.
 */
export const getExpensesForPeriod = async (shopId: string, startDate: Date, endDate: Date): Promise<Expense[]> => {
    const expenses = await getExpenses(shopId);
    return expenses
        .map(e => ({
            ...e,
            createdAt: { toDate: () => new Date(e.createdAt as any) } as any
        }))
        .filter(e => {
            const date = new Date(e.createdAt);
            return date >= startDate && date <= endDate;
        });
};