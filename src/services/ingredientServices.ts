import { Ingredient, NewIngredientData } from "../types";
import { apiClient } from "./apiClient";

/** Obtener los ingredientes de una heladería */
export const getIngredients = async (heladeriaId: string): Promise<Ingredient[]> => {
    return await apiClient<Ingredient[]>(`/shops/${heladeriaId}/ingredients`);
};

/** Agregar un producto a la subcolección "ingredientes" de una heladería. */
export const addIngredient = async (heladeriaId: string, ingredientData: NewIngredientData): Promise<void> => {
    await apiClient(`/shops/${heladeriaId}/ingredients`, {
        method: 'POST',
        body: JSON.stringify(ingredientData)
    });
};

/** Actualizar un ingrediente existente. */
export const updateIngredient = async (heladeriaId: string, ingredientId: string, dataToUpdate: Partial<NewIngredientData>): Promise<void> => {
    await apiClient(`/shops/${heladeriaId}/ingredients/${ingredientId}`, {
        method: 'PUT',
        body: JSON.stringify(dataToUpdate)
    });
};

/** Eliminar un ingrediente. */
export const deleteIngredient = async (heladeriaId: string, ingredientId: string): Promise<void> => {
    await apiClient(`/shops/${heladeriaId}/ingredients/${ingredientId}`, {
        method: 'DELETE'
    });
};

/**
 * Ajusta el stock de un ingrediente.
 * Note: Audit log for inventory adjustments is pending backend implementation.
 */
export const adjustIngredientStock = async (
    heladeriaId: string,
    ingredientId: string,
    adjustment: number,
    _reason: string,
    _employeeId: string,
    _owner: string
) => {
    // Fetch current ingredient to get its stock
    const ingredients = await getIngredients(heladeriaId);
    const ingredient = ingredients.find(i => i.id === ingredientId);
    
    if (!ingredient) {
        throw new Error('Ingredient not found');
    }

    const newStock = Math.max(0, ingredient.stock + adjustment);
    
    await updateIngredient(heladeriaId, ingredientId, { stock: newStock });
};