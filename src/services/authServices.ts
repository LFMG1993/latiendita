import {RegisterFormData} from "../types";

// Base URL of the Go API server
// URL base del servidor API en Go
const API_BASE_URL = "http://localhost:8080/api";

/**
 * Registra un nuevo usuario propietario en el backend de Go.
 */
export const registerUser = async (formData: RegisterFormData): Promise<any> => {
    try {
        const response = await fetch(`${API_BASE_URL}/register-saas`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                first_name: formData.firstName,
                last_name: formData.lastName,
                email: formData.email,
                password: formData.password, // Pasamos la contraseña para cifrarla en el backend
                identify: formData.identify,
                phone: formData.phone,
                shop_name: formData.iceCreamShopName
            })
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error || "Error registrando usuario en el servidor.");
        }

        const data = await response.json();
        console.log("Usuario registrado con éxito en el Backend:", data);
        return data;
    } catch (err: any) {
        console.error("Error registrando el usuario: ", err);
        throw new Error(err.message || 'Ocurrió un error inesperado al registrar el usuario.');
    }
};

export interface ClientRegisterData {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone: string;
    documentId: string; // Cédula / Documento de identidad
    shopId?: string; // Tienda desde la que se registra
}

/**
 * Registra un nuevo CLIENTE (comprador final) en el backend de Go.
 */
export const registerClient = async (formData: ClientRegisterData): Promise<any> => {
    try {
        const response = await fetch(`${API_BASE_URL}/users`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                first_name: formData.firstName,
                last_name: formData.lastName,
                email: formData.email,
                password: formData.password, // Pasamos la contraseña para cifrarla en el backend
                identify: "CC",
                document_id: formData.documentId,
                phone: formData.phone,
                role: "client"
            })
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error || "Error registrando cliente en el servidor.");
        }

        const data = await response.json();
        console.log("Cliente registrado con éxito en el Backend:", data);
        return data;
    } catch (err: any) {
        console.error("Error registrando cliente: ", err);
        throw new Error(err.message || 'Ocurrió un error inesperado al registrar el cliente.');
    }
};

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
        
        // Mapeamos los campos de snake_case del backend Go a camelCase requeridos por el frontend de React
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
            // Para el modo desarrollo y pruebas locales inyectamos todos los permisos al rol de propietario (owner)
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

        // Guardamos el usuario de forma persistente en localStorage para mantener la sesión activa
        localStorage.setItem("authenticated_user", JSON.stringify(mappedUser));
        console.log("Sesión iniciada con éxito en el Backend:", mappedUser);
        return mappedUser;
    } catch (err: any) {
        console.error("Error en el login:", err);
        throw new Error(err.message || "Error al conectar con el servidor de autenticación.");
    }
};



/**
 * Cierra la sesión activa borrando los datos de localStorage.
 */
export const logoutUser = (): void => {
    localStorage.removeItem("authenticated_user");
    console.log("Sesión cerrada y removida de localStorage.");
};

/**
 * Busca si un documento ya existe. Retorna null por defecto para permitir
 * el registro paso a paso mientras no implementemos consultas en Go.
 */
export const getClientEmailByDocumentId = async (documentId: string): Promise<string | null> => {
    return null;
};