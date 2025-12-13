import {db} from "../firebase.ts";
import {collection, getDocs, query, where, orderBy, addDoc, serverTimestamp, doc, updateDoc, deleteDoc} from "firebase/firestore";
import {NewPaymentMethodData, PaymentMethod, UpdatePaymentMethodData} from "../types";

/**
 * Obtiene todos los métodos de pago ACTIVOS de una heladería.
 * @param heladeriaId - El ID de la heladería.
 */
export const getActivePaymentMethods = async (heladeriaId: string): Promise<PaymentMethod[]> => {
    const methodsRef = collection(db, "iceCreamShops", heladeriaId, "paymentMethods");
    const q = query(methodsRef, where("enabled", "==", true), orderBy("name", "asc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({id: doc.id, ...doc.data()}) as PaymentMethod);
};

/**
 * Obtiene TODOS los métodos de pago de una heladería para la página de gestión.
 * @param heladeriaId - El ID de la heladería.
 */
export const getAllPaymentMethods = async (heladeriaId: string): Promise<PaymentMethod[]> => {
    const methodsRef = collection(db, "iceCreamShops", heladeriaId, "paymentMethods");
    const q = query(methodsRef, orderBy("name", "asc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({id: doc.id, ...doc.data()}) as PaymentMethod);
};

/** Añadir un nuevo método de pago */
export const addPaymentMethod = async (heladeriaId: string, data: NewPaymentMethodData): Promise<void> => {
    const methodsRef = collection(db, "iceCreamShops", heladeriaId, "paymentMethods");
    await addDoc(methodsRef, {...data, createdAt: serverTimestamp()});
};

/** Actualizar un método de pago existente */
export const updatePaymentMethod = async (heladeriaId: string, methodId: string, data: UpdatePaymentMethodData): Promise<void> => {
    const methodRef = doc(db, "iceCreamShops", heladeriaId, "paymentMethods", methodId);
    await updateDoc(methodRef, {...data, updatedAt: serverTimestamp()});
};

/** Eliminar un método de pago */
export const deletePaymentMethod = async (heladeriaId: string, methodId: string): Promise<void> => {
    const methodRef = doc(db, "iceCreamShops", heladeriaId, "paymentMethods", methodId);
    await deleteDoc(methodRef);
};