import { RegisterFormData } from "../../types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

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
                password: formData.password,
                identify: formData.identify,
                phone: formData.phone,
                shop_name: formData.shopName
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
