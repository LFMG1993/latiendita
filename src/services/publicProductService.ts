import {collection, getDocs, QuerySnapshot, DocumentData} from "firebase/firestore";
import {db} from "../firebase";
import {PublicProduct} from "../types/public.types";
import {Product} from "../types";

/**
 * Mapea un producto crudo de Firestore (con datos sensibles) a una versión pública segura.
 * ELIMINA: cost, recipe, history, providerId, etc.
 */
export const mapToPublicProduct = (data: Product): PublicProduct => {
    return {
        id: data.id,
        name: data.name,
        price: data.price,
        category: data.category,
        imageURL: (data as any).imageURL || undefined, // Soporte futuro para imágenes si se agregan al tipo principal
        description: (data as any).description || undefined
    };
};

/**
 * Obtiene los productos de una heladería específica para vista pública.
 * @param heladeriaId ID de la heladería (Tenant)
 */
export const getPublicProducts = async (heladeriaId: string): Promise<PublicProduct[]> => {
    try {
        const productsRef = collection(db, "iceCreamShops", heladeriaId, "productos");
        const snapshot: QuerySnapshot<DocumentData> = await getDocs(productsRef);
        
        // Importante: La sanitización ocurre AQUÍ, antes de que los datos salgan de este servicio hacia la UI.
        return snapshot.docs.map(doc => {
            const rawData = { id: doc.id, ...doc.data() } as Product;
            return mapToPublicProduct(rawData);
        });
    } catch (error) {
        console.error("Error al obtener productos públicos:", error);
        // En caso de error (por ejemplo permisos), retornamos array vacío para no romper la UI.
        return [];
    }
};

/**
 * Obtiene todas las tiendas públicas disponibles.
 * Nota: En producción, esto debería estar paginado o limitado.
 */
export const getAllPublicShops = async (): Promise<{id: string, name: string, logoURL?: string}[]> => {
    try {
        const shopsRef = collection(db, "iceCreamShops");
        const snapshot = await getDocs(shopsRef);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            name: doc.data().name || "Tienda sin nombre",
            logoURL: doc.data().theme?.logoURL
        }));
    } catch (error) {
        console.error("Error al obtener tiendas:", error);
        return [];
    }
};
