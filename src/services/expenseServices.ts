import {db} from "../firebase";
import {
    collection,
    addDoc,
    serverTimestamp,
    getDocs,
    doc,
    updateDoc,
    deleteDoc,
    query,
    where
} from "firebase/firestore";
import {Expense, NewExpenseData} from "../types";

/** Obtener todos los gastos de una heladería */
export const getExpenses = async (heladeriaId: string): Promise<Expense[]> => {
    const expensesRef = collection(db, "iceCreamShops", heladeriaId, "expenses");
    const querySnapshot = await getDocs(expensesRef);
    return querySnapshot.docs.map(doc => ({id: doc.id, ...doc.data()}) as Expense);
};

/** Registrar un nuevo gasto */
export const addExpense = async (heladeriaId: string, expenseData: NewExpenseData): Promise<void> => {
    const expensesRef = collection(db, `iceCreamShops/${heladeriaId}/expenses`);
    await addDoc(expensesRef, {
        ...expenseData,
        createdAt: serverTimestamp(),
    });
};

/** Actualizar un gasto existente. */
export const updateExpense = async (heladeriaId: string, expenseId: string, dataToUpdate: Partial<NewExpenseData>): Promise<void> => {
    const expenseRef = doc(db, "iceCreamShops", heladeriaId, "expenses", expenseId);
    await updateDoc(expenseRef, {
        ...dataToUpdate,
        updatedAt: serverTimestamp() // Opcional: para auditoría
    });
};

/** Eliminar un gasto. */
export const deleteExpense = async (heladeriaId: string, expenseId: string): Promise<void> => {
    const expenseRef = doc(db, "iceCreamShops", heladeriaId, "expenses", expenseId);
    await deleteDoc(expenseRef);
};

/** Obtener todos los gastos asociados a una sesión de caja específica. */
export const getExpensesForSession = async (heladeriaId: string, sessionId: string): Promise<Expense[]> => {
    const expensesRef = collection(db, `iceCreamShops/${heladeriaId}/expenses`);
    const q = query(
        expensesRef,
        where("sessionId", "==", sessionId)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({id: doc.id, ...doc.data()}) as Expense);
};

/**
 * Obtiene todos los gastos operativos dentro de un rango de fechas.
 * @param heladeriaId - El ID de la heladería.
 * @param startDate - La fecha de inicio.
 * @param endDate - La fecha de fin.
 */
export const getExpensesForPeriod = async (heladeriaId: string, startDate: Date, endDate: Date): Promise<Expense[]> => {
    const expensesRef = collection(db, `iceCreamShops/${heladeriaId}/expenses`);
    const q = query(
        expensesRef,
        where("createdAt", ">=", startDate),
        where("createdAt", "<=", endDate)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Expense);
};