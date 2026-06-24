const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export interface ClientRegisterData {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone: string;
    documentId: string;
    shopId?: string;
}

/**
 * Registra un nuevo CLIENTE (comprador final).
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
                password: formData.password,
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
 * Busca si un documento ya existe. Retorna null por defecto para permitir
 * el registro paso a paso mientras no implementemos consultas en Go.
 */
export const getClientEmailByDocumentId = async (_documentId: string): Promise<string | null> => {
    return null;
};
