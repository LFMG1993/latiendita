import { Shop, NewShopData } from "../../types";
import { apiClient } from "../shared/apiClient";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

/**
 * Obtiene todas las tiendas (solo para SuperAdmin).
 */
export const getAllShops = async (): Promise<Shop[]> => {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/shops`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            }
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error || "Error al obtener las tiendas del servidor.");
        }

        const data = await response.json();

        return data.map((item: any) => ({
            id: item.id,
            name: item.name,
            address: item.address,
            photoURL: item.photo_url,
            whatsapp: item.whatsapp,
            owner: item.owner_id,
            timezone: item.timezone,
            status: item.status,
            businessTypeId: item.business_type_id,
            theme: {
                primaryColor: item.theme_primary_color,
                secondaryColor: item.theme_secondary_color,
                logoURL: item.theme_logo_url
            },
            terminology: {
                shopLabel: item.terminology_shop_label,
                productLabel: item.terminology_product_label
            },
            modules: item.modules,
            features: item.features,
            createdAt: item.created_at,
            updatedAt: item.updated_at,
            members: item.members || {}
        }));
    } catch (err: any) {
        console.error("Error obteniendo tiendas: ", err);
        throw new Error(err.message || "Ocurrió un error inesperado al obtener tiendas.");
    }
};

/**
 * Crea una nueva tienda y la asocia a un usuario dueño.
 */
export const createShop = async (shopData: Partial<Shop>): Promise<Shop> => {
    try {
        const payload = {
            name: shopData.name,
            owner_id: shopData.owner,
            address: shopData.address,
            whatsapp: shopData.whatsapp,
            timezone: shopData.timezone || "America/Bogota",
            modules: shopData.modules || {}
        };

        const response = await fetch(`${API_BASE_URL}/shops`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error || "Error al crear la tienda en el servidor.");
        }

        const item = await response.json();

        return {
            id: item.id,
            name: item.name,
            address: item.address,
            photoURL: item.photo_url,
            whatsapp: item.whatsapp,
            owner: item.owner_id,
            timezone: item.timezone,
            status: item.status,
            businessTypeId: item.business_type_id,
            theme: {
                primaryColor: item.theme_primary_color,
                secondaryColor: item.theme_secondary_color,
                logoURL: item.theme_logo_url
            },
            terminology: {
                shopLabel: item.terminology_shop_label,
                productLabel: item.terminology_product_label
            },
            modules: item.modules,
            features: item.features,
            createdAt: item.created_at,
            updatedAt: item.updated_at,
            members: item.members || {}
        };
    } catch (err: any) {
        console.error("Error creando tienda: ", err);
        throw new Error(err.message || "Ocurrió un error inesperado al crear la tienda.");
    }
};

/**
 * Aprueba una tienda pendiente (Solo SuperAdmin)
 */
export const approveShop = async (id: string): Promise<boolean> => {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/shops/${id}/approve`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            }
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error || "Error al aprobar la tienda en el servidor.");
        }

        return true;
    } catch (err: any) {
        console.error("Error aprobando tienda: ", err);
        throw new Error(err.message || "Ocurrió un error inesperado al aprobar la tienda.");
    }
};

/**
 * Añade un nuevo Negocio y lo asocia a un usuario.
 */
export const addShopToUser = async (userId: string, shopData: NewShopData, timezone: string): Promise<void> => {
    await apiClient(`/shops`, {
        method: 'POST',
        body: JSON.stringify({
            ...shopData,
            owner_id: userId,
            timezone: timezone
        })
    });
};

/**
 * Elimina un Negocio.
 */
export const deleteShop = async (_userId: string, shopId: string): Promise<void> => {
    console.warn(`deleteShop called for ${shopId}, but DELETE /api/shops is not implemented in Go backend.`);
};
