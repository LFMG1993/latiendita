import {Timestamp} from "firebase/firestore";

// Define un solo ingrediente dentro de la receta de un producto.
export interface RecipeItem {
    ingredientId: string;
    // La cantidad del ingrediente en su 'unidad de consumo' (ej: 100 gramos).
    quantity: number;
}

// Define la estructura de un producto en el sistema.
export interface Product {
    id: string;
    name: string;
    price: number;
    category: string;
    recipe: RecipeItem[];
    cost?: number;
    createdAt: Timestamp;
    updatedAt?: Timestamp;
}

// Tipo para los datos al crear un nuevo producto
export type NewProductData = Omit<Product, 'id' | 'createdAt' | 'updatedAt'>;

// Tipos que se pueden actualizar de un producto existente.
export type UpdateProductData = Partial<NewProductData>;

/**
 * Representa un producto enriquecido con datos calculados para la UI.
 * No se almacena así en la base de datos; se calcula en tiempo de ejecución.
 */
export interface EnrichedProduct extends Product {
    recipeCost: number;       // El costo total de los ingredientes de la receta.
    estimatedProfit: number;  // La ganancia estimada (precio de venta - costo de receta).
    availableUnits: number;   // Cuántos productos se pueden hacer con el stock actual.
}

/**
 * Representa un producto en el contexto del Punto de Venta.
 * Enriquecido con su disponibilidad basada en el stock actual.
 */
export interface SellableProduct extends Product {
    isAvailable: boolean;
    availableUnits: number;
}