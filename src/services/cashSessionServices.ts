import {db} from "../firebase";
import {
    collection, doc, serverTimestamp, query, where, getDocs, limit, updateDoc, addDoc,
} from "firebase/firestore";
import {NewCashSessionData, CashSession, Purchase, Expense} from "../types";
import {getSalesByDateRange} from "./saleServices";

/**
 * Busca si hay una sesión de caja abierta actualmente en la heladería.
 * @param heladeriaId
 */
export const getOpenCashSession = async (heladeriaId: string): Promise<CashSession | null> => {
    const sessionsRef = collection(db, "iceCreamShops", heladeriaId, "cashSessions");
    const q = query(sessionsRef, where("status", "==", "open"), limit(1));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        return null;
    }
    return {id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data()} as CashSession;
};

/**
 * Inicia una nueva sesión de caja.
 * @param heladeriaId
 * @param sessionData
 */
export const startCashSession = async (heladeriaId: string, sessionData: NewCashSessionData): Promise<void> => {
    const sessionsRef = collection(db, "iceCreamShops", heladeriaId, "cashSessions");
    await addDoc(sessionsRef, {
        ...sessionData,
        status: 'open',
        startTime: serverTimestamp(),
    });
};

/**
 * Cierra una sesión de caja, calculando todos los totales.
 * @param heladeriaId
 * @param session
 * @param closingData
 */
export const closeCashSession = async (heladeriaId: string, session: CashSession, closingData: {
    closingBalance: number,
    notes: string | undefined
}) => {
    // 1. Obtener todas las ventas realizadas durante esta sesión
    const sales = await getSalesByDateRange(heladeriaId, session.startTime.toDate(), new Date());

    // 2. Obtener las compras (gastos) realizadas por el empleado durante la sesión
    const purchasesRef = collection(db, "iceCreamShops", heladeriaId, "compras");
    const purchasesQuery = query(purchasesRef,
        where("createdAt", ">=", session.startTime),
        where("purchasedByEmployeeId", "==", session.employeeId)
    );
    const purchasesSnapshot = await getDocs(purchasesQuery);
    const expensesFromPurchases = purchasesSnapshot.docs.map(doc => doc.data() as Purchase);
    const totalPurchaseExpenses = expensesFromPurchases.reduce((sum, exp) => sum + exp.total, 0);

    // 2.1. OBTENER LOS GASTOS OPERATIVOS REGISTRADOS EN LA SESIÓN (LA PARTE QUE FALTABA)
    const expensesRef = collection(db, "iceCreamShops", heladeriaId, "expenses");
    const expensesQuery = query(expensesRef, where("sessionId", "==", session.id));
    const expensesSnapshot = await getDocs(expensesQuery);
    const operationalExpenses = expensesSnapshot.docs.map(doc => doc.data() as Expense);
    const totalOperationalExpenses = operationalExpenses.reduce((sum, exp) => sum + exp.amount, 0);

    // 2.2. CALCULAR EL TOTAL DE GASTOS CORRECTO
    const totalExpenses = totalPurchaseExpenses + totalOperationalExpenses;

    // 3. Calcular los totales de la sesión a partir de los pagos de cada venta
    let cashSales = 0;
    let transferSales = 0;
    sales.forEach(sale => {
        sale.payments.forEach(payment => {
            if (payment.type === 'cash') {
                cashSales += payment.amount;
            } else {
                transferSales += payment.amount;
            }
        });
    });

    const expectedCashInBox = session.openingBalance + cashSales - totalExpenses;
    const difference = closingData.closingBalance - expectedCashInBox;

    // 4. Actualizar el documento de la sesión
    const sessionRef = doc(db, "iceCreamShops", heladeriaId, "cashSessions", session.id);
    await updateDoc(sessionRef, {
        ...closingData,
        // Guardamos cada tipo de egreso en su propio array para una auditoría clara y estructurada.
        purchasesSummary: expensesFromPurchases.map(exp => ({
            description: `Compra #${exp.invoiceNumber || exp.id.substring(0, 5)}`,
            amount: exp.total
        })),
        operationalExpenses: operationalExpenses.map(exp => ({
            description: exp.description,
            amount: exp.amount
        })),
        status: 'closed',
        endTime: serverTimestamp(),
        cashSales,
        transferSales,
        totalSales: cashSales + transferSales,
        totalExpenses,
        expectedCashInBox,
        difference,
    });
};