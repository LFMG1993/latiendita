import {db} from "../firebase.ts";
import {
    collection,
    doc,
    writeBatch,
    serverTimestamp,
    increment,
    query,
    where,
    getDocs,
    Timestamp,
    orderBy
} from "firebase/firestore";
import {NewSaleData, Sale} from "../types";

/**
 * Registra una nueva venta y descuenta el stock de los ingredientes utilizados de forma atómica.
 * @param heladeriaId - El ID de la heladería donde se realiza la venta.
 * @param saleData - Los datos de la venta, incluyendo los ítems y los ingredientes específicos utilizados.
 */
export const registerSale = async (heladeriaId: string, saleData: NewSaleData): Promise<void> => {
    const batch = writeBatch(db);

    // 1. Crear la referencia para el nuevo documento de venta
    const newSaleRef = doc(collection(db, "iceCreamShops", heladeriaId, "sales"));
    batch.set(newSaleRef, {
        ...saleData,
        createdAt: serverTimestamp(),
    });

    // 2. Por cada ítem en la venta, descontar el stock de los ingredientes utilizados
    saleData.items.forEach(item => {
        item.ingredientsUsed.forEach(usage => {
            const ingredientRef = doc(db, "iceCreamShops", heladeriaId, "ingredientes", usage.ingredientId);
            // Descontamos el stock. La cantidad se multiplica por la cantidad de productos vendidos.
            const totalQuantityToDecrement = usage.quantity * item.quantity;
            batch.update(ingredientRef, {stock: increment(-totalQuantityToDecrement)});
        });
    });

    // 3. Ejecutar todas las operaciones del batch
    await batch.commit();
};

/**
 * Obtiene todas las ventas dentro de un rango de fechas específico.
 * @param heladeriaId - El ID de la heladería.
 * @param startDate - La fecha de inicio del reporte.
 * @param endDate - La fecha de fin del reporte.
 */
export const getSalesByDateRange = async (heladeriaId: string, startDate: Date, endDate: Date): Promise<Sale[]> => {
    const salesRef = collection(db, "iceCreamShops", heladeriaId, "sales");
    const q = query(salesRef,
        where("createdAt", ">=", Timestamp.fromDate(startDate)),
        where("createdAt", "<=", Timestamp.fromDate(endDate)),
        orderBy("createdAt", "desc")
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({id: doc.id, ...doc.data()}) as Sale);
};

/**
 * Obtiene todas las ventas asociadas a un ID de sesión de caja específico.
 * @param iceCreamShopId - El ID de la heladería.
 * @param sessionId - El ID de la sesión de caja.
 * @returns Una promesa que se resuelve con un array de objetos Sale.
 */
export const getSalesBySessionId = async (iceCreamShopId: string, sessionId: string): Promise<Sale[]> => {
    const salesRef = collection(db, `iceCreamShops/${iceCreamShopId}/sales`);
    const q = query(
        salesRef,
        where("sessionId", "==", sessionId)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({id: doc.id, ...doc.data()}) as Sale);
};