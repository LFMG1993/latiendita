import {collection, getDocs, query, where, Timestamp} from "firebase/firestore";
import {db} from "../firebase.ts";
import {Sale, CashSession, Purchase} from "../types";

/**
 * Obtiene todas las ventas dentro de un rango de fechas para una heladería específica.
 * @param iceCreamShopId - El ID de la heladería.
 * @param startDate - La fecha de inicio.
 * @param endDate - La fecha de fin.
 * @returns Una promesa que se resuelve con un array de objetos Sale.
 */
export const getSalesForPeriod = async (iceCreamShopId: string, startDate: Date, endDate: Date): Promise<Sale[]> => {
    const salesRef = collection(db, `iceCreamShops/${iceCreamShopId}/sales`);
    const q = query(
        salesRef,
        where("createdAt", ">=", Timestamp.fromDate(startDate)),
        where("createdAt", "<=", Timestamp.fromDate(endDate))
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({id: doc.id, ...doc.data()}) as Sale);
};

/**
 * Obtiene todas las compras dentro de un rango de fechas para una heladería específica.
 * @param iceCreamShopId - El ID de la heladería.
 * @param startDate - La fecha de inicio.
 * @param endDate - La fecha de fin.
 * @returns Una promesa que se resuelve con un array de objetos Purchase.
 */
export const getPurchasesForPeriod = async (iceCreamShopId: string, startDate: Date, endDate: Date): Promise<Purchase[]> => {
    const purchasesRef = collection(db, `iceCreamShops/${iceCreamShopId}/compras`);
    const q = query(
        purchasesRef,
        where("createdAt", ">=", Timestamp.fromDate(startDate)),
        where("createdAt", "<=", Timestamp.fromDate(endDate))
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({id: doc.id, ...doc.data()}) as Purchase);
};

/**
 * Obtiene todas las compras realizadas por un empleado durante un rango de tiempo específico (una sesión).
 * @param iceCreamShopId - El ID de la heladería.
 * @param employeeId - El ID del empleado que realizó las compras.
 * @param startTime - La fecha de inicio de la sesión.
 * @param endTime - La fecha de fin de la sesión.
 * @returns Una promesa que se resuelve con un array de objetos Purchase.
 */
export const getPurchasesForSession = async (iceCreamShopId: string, employeeId: string, startTime: Date, endTime: Date): Promise<Purchase[]> => {
    const purchasesRef = collection(db, `iceCreamShops/${iceCreamShopId}/compras`);
    const q = query(purchasesRef,
        where("purchasedByEmployeeId", "==", employeeId),
        where("createdAt", ">=", startTime),
        where("createdAt", "<=", endTime)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({id: doc.id, ...doc.data()}) as Purchase);
};

/**
 * Obtiene todos los cierres de caja (que contienen los gastos) en un rango de fechas.
 * @param iceCreamShopId - El ID de la heladería.
 * @param startDate - La fecha de inicio.
 * @param endDate - La fecha de fin.
 * @returns Una promesa que se resuelve con un array de objetos CashSession.
 */
export const getCashSessionsForPeriod = async (iceCreamShopId: string, startDate: Date, endDate: Date): Promise<CashSession[]> => {
    const sessionsRef = collection(db, `iceCreamShops/${iceCreamShopId}/cashSessions`);
    const q = query(
        sessionsRef,
        where("status", "==", "closed"),
        where("endTime", ">=", Timestamp.fromDate(startDate)),
        where("endTime", "<=", Timestamp.fromDate(endDate))
    );

    const querySnapshot = await getDocs(q);
    // Aquí transformamos los datos antiguos al formato nuevo.
    return querySnapshot.docs.map(doc => {
        const data = doc.data() as any; // Usamos 'any' temporalmente para la transformación

        // Si el documento tiene el campo 'expenses' pero no 'purchasesSummary', es un formato antiguo.
        if (data.expenses && !data.purchasesSummary) {
            // Asumimos que los 'expenses' antiguos eran solo compras de inventario.
            data.purchasesSummary = data.expenses;
            // Los gastos operativos no existían, así que los inicializamos como un array vacío.
            data.operationalExpenses = [];
            // Opcional: eliminamos el campo antiguo para evitar confusiones.
            delete data.expenses;
        }

        // Nos aseguramos de que los nuevos campos siempre existan, aunque estén vacíos.
        if (!data.purchasesSummary) data.purchasesSummary = [];
        if (!data.operationalExpenses) data.operationalExpenses = [];

        return {id: doc.id, ...data} as CashSession;
    });
};

/* --- Funciones de Procesamiento de Datos --- */

/**
 * Procesa las ventas para agruparlas por día.
 * @param sales - Array de ventas.
 * @returns Un objeto con fechas como claves y totales de ventas como valores.
 */
export const processSalesByDay = (sales: Sale[]): { [key: string]: number } => {
    const dailySales: { [key: string]: number } = {};
    sales.forEach(sale => {
        const date = sale.createdAt.toDate().toLocaleDateString('es-ES', {day: '2-digit', month: '2-digit'});
        if (!dailySales[date]) {
            dailySales[date] = 0;
        }
        dailySales[date] += sale.total;
    });
    return dailySales;
};

/**
 * Procesa las ventas para obtener el top 5 de productos.
 * @param sales - Array de ventas.
 * @returns Un array de objetos con el nombre del producto y sus ingresos totales.
 */
export const processTopProducts = (sales: Sale[]): { name: string, revenue: number }[] => {
    const productRevenue: { [key: string]: { name: string, revenue: number } } = {};

    sales.forEach(sale => {
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

/**
 * Procesa las ventas para obtener el promedio por día de la semana.
 * @param sales - Array de ventas.
 * @returns Un array con 7 valores, uno para cada día de la semana (Domingo=0).
 */
export const processSalesByWeekday = (sales: Sale[]): number[] => {
    const totalSalesByDay = new Array(7).fill(0);

    sales.forEach(sale => {
        const dayOfWeek = sale.createdAt.toDate().getDay(); // Domingo = 0, Lunes = 1, etc.
        totalSalesByDay[dayOfWeek] += sale.total;
    });

    // Reordenamos para que empiece en Lunes
    const [sunday, ...weekdays] = totalSalesByDay;
    return [...weekdays, sunday];
};