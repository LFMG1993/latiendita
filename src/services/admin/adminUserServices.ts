import { UserProfile } from "../../types";
import { apiClient } from "../shared/apiClient";

/**
 * Obtiene todos los usuarios con el rol 'client'.
 */
export const getAllClients = async (): Promise<UserProfile[]> => {
    console.warn("getAllClients is a global query. Returning empty array until scoped by shop.");
    return [];
};

/**
 * Obtiene todos los usuarios registrados como dueños ('owner').
 * Utilizado por el Super Administrador para crear y vincular Negocios.
 */
export const getAllOwners = async (): Promise<UserProfile[]> => {
    try {
        const response = await apiClient<any[]>('/admin/owners');
        return response.map(user => ({
            ...user,
            firstName: user.first_name || user.firstName,
            lastName: user.last_name || user.lastName,
            documentId: user.document_id || user.documentId,
            photoURL: user.photo_url || user.photoURL,
        })) as UserProfile[];
    } catch (err) {
        console.error("Error fetching owners:", err);
        return [];
    }
};
