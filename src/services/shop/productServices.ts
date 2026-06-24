import { Product, NewProductData } from "../../types";
import { apiClient } from "../shared/apiClient";

/** Obtener todos los productos de una heladería */
export const getProducts = async (shopId: string): Promise<Product[]> => {
    return await apiClient<Product[]>(`/shops/${shopId}/products`);
};

/** Añadir un nuevo producto */
export const addProduct = async (shopId: string, productData: NewProductData): Promise<Product> => {
    return await apiClient<Product>(`/shops/${shopId}/products`, {
        method: 'POST',
        body: JSON.stringify(productData)
    });
};

/** Actualizar un producto existente */
export const updateProduct = async (shopId: string, productId: string, productData: Partial<NewProductData>): Promise<void> => {
    await apiClient(`/shops/${shopId}/products/${productId}`, {
        method: 'PUT',
        body: JSON.stringify(productData)
    });
};

/** Eliminar un producto */
export const deleteProduct = async (shopId: string, productId: string): Promise<void> => {
    await apiClient(`/shops/${shopId}/products/${productId}`, {
        method: 'DELETE'
    });
};