import { Shop, NewShopData } from "../../types";
import { apiClient } from "../shared/apiClient";
import { useAuthStore } from "../../store/authStore";

/**
 * Obtiene el ID del primer Negocio asociado al usuario actualmente autenticado.
 */
export const getShopId = async (): Promise<string | null> => {
    const user = useAuthStore.getState().user;
    if (!user) throw new Error("No hay usuario autenticado");

    const shops = await getShopsByUserId(user.uid || "");

    return shops.length > 0 ? shops[0].id : null;
};

/**
 * Obtiene los detalles de un Negocio específico por su ID.
 */
export const getShopDetails = async (shopId: string): Promise<Shop | null> => {
    if (!shopId) return null;

    try {
        return await apiClient<Shop>(`/shops/${shopId}`);
    } catch (err) {
        console.warn(`No se encontró el Negocio con ID: ${shopId}`);
        return null;
    }
};

/**
 * Obtiene los detalles de todos los Negocios asociados a un usuario.
 */
export const getShopsByUserId = async (userId: string): Promise<Shop[]> => {
    if (!userId) return [];
    return await apiClient<Shop[]>(`/shops?owner_id=${userId}`);
};

/**
 * Actualiza el nombre o datos de un Negocio existente.
 */
export const updateShop = async (shopId: string, dataToUpdate: Partial<NewShopData>): Promise<void> => {
    await apiClient(`/shops/${shopId}`, {
        method: 'PUT',
        body: JSON.stringify(dataToUpdate)
    });
};
