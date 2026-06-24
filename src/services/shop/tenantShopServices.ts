import { Shop } from "../../types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

/**
 * Actualiza los módulos y configuraciones de un Negocio.
 */
export const updateShop = async (id: string, shopData: Partial<Shop>): Promise<Shop> => {
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
            updatedAt: item.updated_at,
            members: item.members || {}
        };
    } catch (err: any) {
        console.error("Error actualizando tienda: ", err);
        throw new Error(err.message || "Ocurrió un error inesperado al actualizar la tienda.");
    }
};
