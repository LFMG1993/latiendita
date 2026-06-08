import { Product, NewProductData } from "../types";
import { apiClient } from "./apiClient";

/** Obtener todos los productos de una heladería */
export const getProducts = async (heladeriaId: string): Promise<Product[]> => {
    return await apiClient<Product[]>(`/shops/${heladeriaId}/products`);
};

/** Añadir un nuevo producto */
export const addProduct = async (heladeriaId: string, productData: NewProductData): Promise<Product> => {
    return await apiClient<Product>(`/shops/${heladeriaId}/products`, {
        method: 'POST',
        body: JSON.stringify(productData)
    });
};

/** Actualizar un producto existente */
export const updateProduct = async (heladeriaId: string, productId: string, productData: Partial<NewProductData>): Promise<void> => {
    await apiClient(`/shops/${heladeriaId}/products/${productId}`, {
        method: 'PUT',
        body: JSON.stringify(productData)
    });
};

/** Eliminar un producto */
export const deleteProduct = async (heladeriaId: string, productId: string): Promise<void> => {
    await apiClient(`/shops/${heladeriaId}/products/${productId}`, {
        method: 'DELETE'
    });
};