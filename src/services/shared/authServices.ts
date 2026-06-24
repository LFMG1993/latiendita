import { UserProfile } from "../../types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

/**
 * Autentica a un usuario contra el backend de Go y persiste los datos en localStorage.
 */
export const loginUser = async (email: string, password: string): Promise<any> => {
    try {
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                email: email,
                password: password
            })
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error || "Correo o contraseña incorrectos / Invalid credentials");
        }

        const data = await response.json();

        const mappedUser = {
            uid: data.id,
            id: data.id,
            firstName: data.first_name || "",
            lastName: data.last_name || "",
            email: data.email || "",
            identify: data.identify || "",
            documentId: data.document_id || "",
            phone: data.phone || "",
            role: data.role || "client",
            photoURL: data.photo_url || "",
            permissions: data.role === "owner" ? [
                "shop_details_manage",
                "pos_access",
                "ingredients_view",
                "products_view",
                "purchases_view",
                "team_view",
                "promotions_view",
                "suppliers_view",
                "reports_view_sales",
                "cash_session_access",
                "expenses_view"
            ] : []
        };

        localStorage.setItem("authenticated_user", JSON.stringify(mappedUser));
        console.log("Sesión iniciada con éxito en el Backend:", mappedUser);
        return mappedUser;
    } catch (err: any) {
        console.error("Error en el login:", err);
        throw new Error(err.message || "Error al conectar con el servidor de autenticación.");
    }
};

/**
 * Retrieves the current authenticated user's profile from the backend
 * Relies on the HttpOnly session cookie
 */
export async function getMe(): Promise<UserProfile> {
    try {
        const response = await fetch(`${API_BASE_URL}/me`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Unauthorized');
        }

        const data = await response.json();

        const mappedUser: UserProfile = {
            uid: data.id,
            firstName: data.first_name || data.firstName || "",
            lastName: data.last_name || data.lastName || "",
            email: data.email || "",
            identify: data.identify || "",
            documentId: data.document_id || "",
            phone: data.phone || "",
            role: data.role || "client",
            photoURL: data.photo_url || data.photoURL || "",
            createdAt: data.created_at || new Date().toISOString(),
            permissions: data.permissions || [],
            shopIds: []
        };
        return mappedUser;
    } catch (error) {
        throw error;
    }
}

/**
 * Cierra la sesión activa borrando los datos de localStorage.
 */
export const logoutUser = (): void => {
    localStorage.removeItem("authenticated_user");
    console.log("Sesión cerrada y removida de localStorage.");
};
