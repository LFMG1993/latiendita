import { Heladeria, NewHeladeriaData, UpdateProfileData, UserProfile } from "../types";
import { apiClient } from "./apiClient";

/**
 * Obtiene el ID de la primera heladería asociada al usuario actualmente autenticado.
 */
export const getHeladeriaId = async (): Promise<string | null> => {
    // In our Go backend, we first fetch the authenticated user's ID from localStorage
    const authUserStr = localStorage.getItem("authenticated_user");
    if (!authUserStr) throw new Error("No hay usuario autenticado");
    
    const user = JSON.parse(authUserStr);
    const shops = await getHeladeriasByUserId(user.id);
    
    return shops.length > 0 ? shops[0].id : null;
};

/**
 * Obtiene los detalles de una heladería específica por su ID.
 */
export const getHeladeriaDetails = async (heladeriaId: string): Promise<Heladeria | null> => {
    if (!heladeriaId) return null;

    try {
        return await apiClient<Heladeria>(`/shops/${heladeriaId}`);
    } catch (err) {
        console.warn(`No se encontró la heladería con ID: ${heladeriaId}`);
        return null;
    }
};

/**
 * Obtiene los datos del perfil de un usuario.
 */
export const getUserProfileData = async (userId: string): Promise<UserProfile | null> => {
    if (!userId) return null;
    // For now we might just get this from localStorage since we don't have a GET /api/users/{id}
    const authUserStr = localStorage.getItem("authenticated_user");
    if (authUserStr) {
        const user = JSON.parse(authUserStr);
        if (user.id === userId) return user as UserProfile;
    }
    return null;
};

/**
 * Obtiene los detalles de todas las heladerías asociadas a un usuario.
 */
export const getHeladeriasByUserId = async (userId: string): Promise<Heladeria[]> => {
    if (!userId) return [];
    return await apiClient<Heladeria[]>(`/shops?owner_id=${userId}`);
};

/**
 * Añade una nueva heladería y la asocia a un usuario.
 */
export const addHeladeriaToUser = async (userId: string, heladeriaData: NewHeladeriaData, timezone: string): Promise<void> => {
    await apiClient(`/shops`, {
        method: 'POST',
        body: JSON.stringify({
            ...heladeriaData,
            owner_id: userId,
            timezone: timezone
        })
    });
};

/**
 * Actualiza el nombre de una heladería existente.
 */
export const updateHeladeria = async (heladeriaId: string, dataToUpdate: Partial<NewHeladeriaData>): Promise<void> => {
    await apiClient(`/shops/${heladeriaId}`, {
        method: 'PUT',
        body: JSON.stringify(dataToUpdate)
    });
};

/**
 * Actualiza el perfil de un usuario.
 */
export const updateUserProfile = async (userId: string, dataToUpdate: UpdateProfileData): Promise<void> => {
    // We don't have a full user update endpoint right now, this is a mock representation
    // To properly update, we'd add a PUT /api/users/{id} in Go.
    console.warn("User profile updates are partially stubbed in REST mode until Go endpoint is added.");
    const authUserStr = localStorage.getItem("authenticated_user");
    if (authUserStr) {
        const user = JSON.parse(authUserStr);
        if (user.id === userId) {
            localStorage.setItem("authenticated_user", JSON.stringify({...user, ...dataToUpdate}));
        }
    }
};

/**
 * Elimina una heladería.
 */
export const deleteHeladeria = async (userId: string, heladeriaId: string): Promise<void> => {
    // Assuming backend will cascade delete or we just leave it. 
    // Go backend hasn't exposed a DELETE /api/shops/id yet.
    console.warn(`deleteHeladeria called for ${heladeriaId}, but DELETE /api/shops is not implemented in Go backend.`);
};

/**
 * Obtiene todos los usuarios con el rol 'client'.
 */
export const getAllClients = async (): Promise<UserProfile[]> => {
    // If shopID was known, we could query shop members. 
    // Since we don't have a direct "getAllClients" in Go without a shop scope right now:
    console.warn("getAllClients is a global query. Returning empty array until scoped by shop.");
    return [];
};

/**
 * Obtiene todos los usuarios registrados como dueños ('owner').
 * Utilizado por el Super Administrador para crear y vincular tiendas.
 */
export const getAllOwners = async (): Promise<UserProfile[]> => {
    try {
        const response = await apiClient<any[]>('/admin/owners');
        // El backend de Go retorna snake_case (first_name), el frontend espera camelCase (firstName)
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

/**
 * Actualiza los saldos de un cliente (mock stubbed since it moved to clientAccount in Go)
 */
export const updateClientFinancials = async (clientId: string, credits: number, debt: number, isCreditEnabled: boolean, creditLimit?: number): Promise<void> => {
    console.warn("updateClientFinancials should be called through orderService.updateClientAccount with shopId instead.");
};

export interface QuickClientData {
    firstName: string;
    lastName?: string;
    phone?: string;
    documentId?: string;
}

/**
 * Crea un cliente rápido (offline) desde el POS sin necesidad de Auth
 */
export const createQuickClient = async (data: QuickClientData): Promise<UserProfile> => {
    // Call the same auth register endpoint but for a client
    const res = await apiClient<any>(`/users`, {
        method: "POST",
        body: JSON.stringify({
            first_name: data.firstName,
            last_name: data.lastName || '',
            role: 'client',
            phone: data.phone || '',
            document_id: data.documentId || '',
            password: "defaultPassword123!", // Dummy password for offline clients
            identify: "CC"
        })
    });
    
    return {
        uid: res.id,
        id: res.id,
        firstName: res.first_name,
        lastName: res.last_name,
        role: 'client',
        phone: res.phone,
        documentId: res.document_id,
        isOfflineClient: true,
        isCreditEnabled: true,
        credits: 0,
        debt: 0,
        creditLimit: 0
    } as any;
};