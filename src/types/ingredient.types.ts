
export interface Ingredient {
    id: string;
    name: string;
    category: string;          // Ejemplo: 'Helados', 'Toppings', 'Bases'
    purchaseUnit: string;      // La unidad seleccionada. Ejemplo: 'Kilogramo'
    consumptionUnit: string;   // La unidad que usas en las recetas. Ejemplo: 'gramo'
    consumptionUnitsPerPurchaseUnit: number;// Cuántas 'consumptionUnit' hay en una 'purchaseUnit'. Ejemplo: 4900 (gramos por caja)
    stock: number;
    createdAt: string;
    updatedAt?: string;
}

export interface EnrichedIngredient extends Ingredient {
    cost: number; // Costo por 'purchaseUnit'
}

// Tipo para los datos al crear un nuevo ingrediente
export type NewIngredientData = Omit<Ingredient, 'id' | 'createdAt' | 'updatedAt'>;

// Permite actualizar cualquier campo del nuevo ingrediente.
export type UpdateIngredientData = Partial<NewIngredientData>;