import {db} from "../firebase";
import {collection, getDocs, addDoc, serverTimestamp, doc, updateDoc, deleteDoc, writeBatch, increment} from "firebase/firestore";
import {Ingredient, NewIngredientData} from "../types";

/** Obtener los ingredientes de una heladería */
export const getIngredients = async (heladeriaId: string): Promise<Ingredient[]> => {
    try {
        const ingredientsRef = collection(db, "iceCreamShops", heladeriaId, "ingredientes");
        const querySnapshot = await getDocs(ingredientsRef);
        return querySnapshot.docs.map(doc => ({id: doc.id, ...doc.data()}) as Ingredient);
    } catch (err) {
        console.error("Error al obtener los ingredientes:", err);
        throw new Error('No se pudieron obtener los ingredientes.');
    }
};

/** Agregar un producto a la subcolección "ingredientes" de una heladería. */
export const addIngredient = async (heladeriaId: string, ingredientData: NewIngredientData): Promise<void> => {
    try {
        const ingredientsRef = collection(db, "iceCreamShops", heladeriaId, "ingredientes");
        await addDoc(ingredientsRef, {
            ...ingredientData,
            createdAt: serverTimestamp(),
        });
    } catch (err) {
        console.error("Error al agregar el ingrediente:", err);
        throw new Error('No se pudo agregar el ingrediente.');
    }
};

/** Actualizar un ingrediente existente. */
export const updateIngredient = async (heladeriaId: string, ingredientId: string, dataToUpdate: Partial<NewIngredientData>): Promise<void> => {
    try {
        const ingredientRef = doc(db, "iceCreamShops", heladeriaId, "ingredientes", ingredientId);
        await updateDoc(ingredientRef, dataToUpdate);
    } catch (err) {
        console.error("Error al actualizar el ingrediente:", err);
        throw new Error('No se pudo actualizar el ingrediente.');
    }
};

/** Eliminar un ingrediente. */
export const deleteIngredient = async (heladeriaId: string, ingredientId: string): Promise<void> => {
    try {
        const ingredientRef = doc(db, "iceCreamShops", heladeriaId, "ingredientes", ingredientId);
        await deleteDoc(ingredientRef);
    } catch (err) {
        console.error("Error al eliminar el ingrediente:", err);
        throw new Error('No se pudo eliminar el ingrediente.');
    }
};

/**
 * Ajusta el stock de un ingrediente y registra la acción.
 * @param heladeriaId
 * @param ingredientId
 * @param adjustment - La cantidad a ajustar (positiva para añadir, negativa para quitar).
 * @param reason - La razón del ajuste (ej: "Conteo físico", "Producto dañado").
 * @param employeeId - El ID del empleado que realiza el ajuste.
 * @param owner - El ID del dueño de la heladería para las reglas de seguridad.
 */
export const adjustIngredientStock = async (
    heladeriaId: string,
    ingredientId: string,
    adjustment: number,
    reason: string,
    employeeId: string,
    owner: string
) => {
    const batch = writeBatch(db);

    // 1. Referencia al documento del ingrediente
    const ingredientRef = doc(db, "iceCreamShops", heladeriaId, "ingredientes", ingredientId);
    batch.update(ingredientRef, { stock: increment(adjustment) });

    // 2. Crear un registro de auditoría en una nueva subcolección
    const adjustmentLogRef = doc(collection(db, "iceCreamShops", heladeriaId, "inventoryAdjustments"));
    batch.set(adjustmentLogRef, {
        ingredientId,
        adjustment,
        reason,
        employeeId,
        owner,
        createdAt: serverTimestamp(),
    });

    await batch.commit();
};