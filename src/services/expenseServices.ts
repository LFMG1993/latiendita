import { Expense, NewExpenseData } from "../types";
import { apiClient } from "./apiClient";

/** Obtener todos los gastos de una heladería */
export const getExpenses = async (heladeriaId: string): Promise<Expense[]> => {
    return await apiClient<Expense[]>(`/shops/${heladeriaId}/expenses`);
};

/** Registrar un nuevo gasto */
export const addExpense = async (heladeriaId: string, expenseData: NewExpenseData): Promise<void> => {
    await apiClient(`/shops/${heladeriaId}/expenses`, {
        method: 'POST',
        body: JSON.stringify(expenseData)
    });
};

/** Actualizar un gasto existente. */
export const updateExpense = async (heladeriaId: string, expenseId: string, dataToUpdate: Partial<NewExpenseData>): Promise<void> => {
    console.warn("updateExpense is not yet implemented in Go backend.");
    await apiClient(`/shops/${heladeriaId}/expenses/${expenseId}`, {
        method: 'PUT',
        body: JSON.stringify(dataToUpdate)
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
        .map(e => ({
            ...e,
            createdAt: { toDate: () => new Date(e.createdAt as any) } as any
        }))
        .filter(e => {
            const date = e.createdAt.toDate();
            return date >= startDate && date <= endDate;
        });
};