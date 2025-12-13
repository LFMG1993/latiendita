import {db} from "../firebase";
import {
    collection,
    getDocs,
    serverTimestamp,
    CollectionReference,
    DocumentData,
    writeBatch,
    doc,
    increment,
    runTransaction,
    getDoc,
    query,
    where,
    Timestamp
} from "firebase/firestore";
import {Purchase, PurchasePayload, UpdatePurchaseData} from "../types";

const getPurchasesCollection = (heladeriaId: string): CollectionReference<DocumentData> => {
    return collection(db, "iceCreamShops", heladeriaId, "compras");
};

/** Obtener todas las compras de una heladería */
export const getPurchases = async (heladeriaId: string): Promise<Purchase[]> => {
    const querySnapshot = await getDocs(getPurchasesCollection(heladeriaId));
    return querySnapshot.docs.map(doc => ({id: doc.id, ...doc.data()}) as Purchase);
};

/** Obtiene las compras realizadas por un empleado durante una sesión de caja específica */
export const getPurchasesForSession = async (heladeriaId: string, startTime: Timestamp, employeeId: string): Promise<Purchase[]> => {
    const purchasesRef = collection(db, "iceCreamShops", heladeriaId, "compras");
    const q = query(purchasesRef,
        where("createdAt", ">=", startTime),
        where("purchasedByEmployeeId", "==", employeeId)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({id: doc.id, ...doc.data()}) as Purchase);
};

/** Registrar una nueva compra */
export const addPurchase = async (heladeriaId: string, purchaseData: PurchasePayload): Promise<void> => {
    // Usamos una transacción para garantizar la atomicidad de la operación.
    await runTransaction(db, async (transaction) => {
        const supplierRef = doc(db, "iceCreamShops", heladeriaId, "suppliers", purchaseData.supplierId);
        const supplierSnap = await transaction.get(supplierRef);

        if (!supplierSnap.exists()) {
            throw new Error("El proveedor seleccionado no existe.");
        }

        // 1. Obtener y actualizar el contador de facturas del proveedor.
        const currentCount = supplierSnap.data().purchaseCount || 0;
        const newCount = currentCount + 1;
        const internalInvoiceNumber = String(newCount).padStart(4, '0'); // Formato "0001"

        // 2. Crear la nueva compra con el número de factura interno.
        const newPurchaseRef = doc(collection(db, "iceCreamShops", heladeriaId, "compras"));
        transaction.set(newPurchaseRef, {
            ...purchaseData,
            internalInvoiceNumber,
            createdAt: serverTimestamp(),
        });

        // 3. Actualizar el stock de cada ingrediente.
        purchaseData.items.forEach(item => {
            const ingredientRef = doc(db, "iceCreamShops", heladeriaId, "ingredientes", item.ingredientId);
            const stockToAdd = item.quantity * item.consumptionUnitsPerPurchaseUnit;
            transaction.update(ingredientRef, {stock: increment(stockToAdd)});
        });

        // 4. Actualizar el contador en el documento del proveedor.
        transaction.update(supplierRef, {purchaseCount: newCount});
    });
};

/** Actualizar una compra existente y ajustar el stock correspondientemente */
export const updatePurchase = async (heladeriaId: string, purchaseId: string, dataToUpdate: UpdatePurchaseData): Promise<void> => {
    const purchaseRef = doc(db, "iceCreamShops", heladeriaId, "compras", purchaseId);
    const oldPurchaseSnap = await getDoc(purchaseRef);
    if (!oldPurchaseSnap.exists()) {
        throw new Error("La compra que intentas actualizar no existe.");
    }
    const oldData = oldPurchaseSnap.data() as Purchase;

    const batch = writeBatch(db);

    // 1. Revertir el stock de los ítems antiguos
    oldData.items.forEach(item => {
        const ingredientRef = doc(db, "iceCreamShops", heladeriaId, "ingredientes", item.ingredientId);
        const stockToRevert = item.quantity * item.consumptionUnitsPerPurchaseUnit;
        batch.update(ingredientRef, {stock: increment(-stockToRevert)});
    });

    // 2. Añadir el stock de los nuevos ítems
    dataToUpdate.items?.forEach(item => {
        const ingredientRef = doc(db, "iceCreamShops", heladeriaId, "ingredientes", item.ingredientId);
        const stockToAdd = item.quantity * item.consumptionUnitsPerPurchaseUnit;
        batch.update(ingredientRef, {stock: increment(stockToAdd)});
    });

    // 3. Actualizar el documento de la compra
    batch.update(purchaseRef, {
        dataToUpdate,
        updatedAt: serverTimestamp()
    });

    await batch.commit();
};

/** Eliminar una compra y revertir el stock de los ingredientes */
export const deletePurchase = async (heladeriaId: string, purchaseId: string) => {
    // Para la eliminación, simplemente revertimos el stock. Reutilizamos la lógica de update pasándole datos vacíos.
    const purchaseRef = doc(db, "iceCreamShops", heladeriaId, "compras", purchaseId);
    const oldPurchaseSnap = await getDoc(purchaseRef);

    if (!oldPurchaseSnap.exists()) return; // Si no existe, no hay nada que hacer

    const oldData = oldPurchaseSnap.data() as Purchase;
    const batch = writeBatch(db);

    // 1. Revertir el stock de los ítems
    oldData.items.forEach(item => {
        const ingredientRef = doc(db, "iceCreamShops", heladeriaId, "ingredientes", item.ingredientId);
        const stockToRevert = item.quantity * item.consumptionUnitsPerPurchaseUnit;
        batch.update(ingredientRef, {stock: increment(-stockToRevert)});
    });

    // 2. Eliminar el documento de la compra
    batch.delete(purchaseRef);

    await batch.commit();
};