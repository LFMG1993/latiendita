import {db} from "../firebase.ts";
import {collection, getDocs, query, where, orderBy, addDoc, serverTimestamp, doc, updateDoc, deleteDoc} from "firebase/firestore";
import {NewPromotionData, Promotion, UpdatePromotionData} from "../types";

/**
 * Obtiene todas las promociones ACTIVAS y VÁLIDAS para el día de hoy.
 * @param heladeriaId
 * @param currentDay - El día de la semana actual (0-6)
 */
export const getActivePromotionsForToday = async (heladeriaId: string, currentDay: number): Promise<Promotion[]> => {
    const promotionsRef = collection(db, "iceCreamShops", heladeriaId, "promotions");
    const q = query(promotionsRef,
        where("isEnabled", "==", true),
        where("activeDays", "array-contains", currentDay)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({id: doc.id, ...doc.data()}) as Promotion);
};

/**
 * Obtiene TODAS las promociones de una heladería para la página de gestión.
 * @param heladeriaId - El ID de la heladería.
 */
export const getAllPromotions = async (heladeriaId: string): Promise<Promotion[]> => {
    const promotionsRef = collection(db, "iceCreamShops", heladeriaId, "promotions");
    const q = query(promotionsRef, orderBy("name", "asc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({id: doc.id, ...doc.data()}) as Promotion);
};

/** Añadir una nueva promoción */
export const addPromotion = async (heladeriaId: string, data: NewPromotionData): Promise<void> => {
    const promotionsRef = collection(db, "iceCreamShops", heladeriaId, "promotions");
    await addDoc(promotionsRef, {...data, createdAt: serverTimestamp()});
};

/** Actualizar una promoción existente */
export const updatePromotion = async (heladeriaId: string, promotionId: string, data: UpdatePromotionData): Promise<void> => {
    const promotionRef = doc(db, "iceCreamShops", heladeriaId, "promotions", promotionId);
    await updateDoc(promotionRef, {...data, updatedAt: serverTimestamp()});
};

/** Eliminar una promoción */
export const deletePromotion = async (heladeriaId: string, promotionId: string): Promise<void> => {
    const promotionRef = doc(db, "iceCreamShops", heladeriaId, "promotions", promotionId);
    await deleteDoc(promotionRef);
};