import { PublicProduct } from "../../types/public.types";
import { Product } from "../../types";
import { apiClient } from "../shared/apiClient";

/**
 * Mapea un producto de la API a una versión pública segura.
 * ELIMINA: cost, recipe, history, providerId, etc.
 */
export const mapToPublicProduct = (data: Product): PublicProduct => {
    return {
        id: data.id,
        name: data.name,
        price: data.price,
        category: data.category,
        imageURL: (data as any).imageURL || undefined,
        description: (data as any).description || undefined
    };
};

/**
 * Obtiene los productos de una heladería específica para vista pública.
 * @param shopId ID de la heladería (Tenant)
 */
export const getPublicProducts = async (shopId: string): Promise<PublicProduct[]> => {
    try {
        const products = await apiClient<Product[]>(`/shops/${shopId}/products`);
        return products.map(mapToPublicProduct);
    } catch (error) {
        console.error("Error al obtener productos públicos:", error);
        return [];
    }
};

/**
 * Obtiene todas las tiendas públicas disponibles.
 */
export const getAllPublicShops = async (): Promise<{id: string, name: string, logoURL?: string}[]> => {
    try {
        // Todo: El backend actual requiere owner_id para GET /api/shops.
        // Si tienes un endpoint público, ajusta esta URL (por ej. /api/public/shops)
        // Por ahora haremos una llamada al endpoint general, pero fallará si el backend
        // exige el owner_id estrictamente. Deberás crear un endpoint público en Go si quieres un marketplace.
        const shops = await apiClient<any[]>(`/shops?public=true`);
        return shops.map(shop => ({
            id: shop.id,
            name: shop.name || "Tienda sin nombre",
            logoURL: shop.theme_logo_url
        }));
    } catch (error) {
        console.error("Error al obtener tiendas:", error);
        return [];
    }
};
