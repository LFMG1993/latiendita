import {Heladeria} from "../types";

const API_BASE_URL = "http://localhost:8080/api";

/**
 * Obtiene todas las tiendas (solo para SuperAdmin).
 */
export const getAllShops = async (): Promise<Heladeria[]> => {
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
        
        // Mapeo de Go struct a TS Interface
        return data.map((item: any) => ({
            id: item.id,
            name: item.name,
            address: item.address,
            photoURL: item.photo_url,
            whatsapp: item.whatsapp,
            owner: item.owner_id, // "owner_id" mapped to "owner" for legacy compatibility
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
            updatedAt: item.updated_at
        }));
    } catch (err: any) {
        console.error("Error obteniendo tiendas: ", err);
        throw new Error(err.message || "Ocurrió un error inesperado al obtener tiendas.");
    }
};

/**
 * Crea una nueva tienda y la asocia a un usuario dueño.
 */
export const createShop = async (shopData: Partial<Heladeria>): Promise<Heladeria> => {
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
            updatedAt: item.updated_at
        };
    } catch (err: any) {
        console.error("Error creando tienda: ", err);
        throw new Error(err.message || "Ocurrió un error inesperado al crear la tienda.");
    }
};

/**
 * Actualiza los módulos y configuraciones de una tienda.
 */
export const updateShop = async (id: string, shopData: Partial<Heladeria>): Promise<Heladeria> => {
    try {
        const payload = {
            name: shopData.name,
            address: shopData.address,
            whatsapp: shopData.whatsapp,
            timezone: shopData.timezone,
            modules: shopData.modules,
            features: shopData.features,
        };

        const response = await fetch(`${API_BASE_URL}/shops/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error || "Error al actualizar la tienda en el servidor.");
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
            updatedAt: item.updated_at
        };
    } catch (err: any) {
        console.error("Error actualizando tienda: ", err);
        throw new Error(err.message || "Ocurrió un error inesperado al actualizar la tienda.");
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
