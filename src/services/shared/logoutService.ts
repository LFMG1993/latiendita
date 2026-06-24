import { useAuthStore } from "../../store/authStore";
import { logoutUser } from "./authServices";

/** Cierra la sesión del usuario actual. */
export const logoutService = async (): Promise<void> => {
    try {
        logoutUser();
        useAuthStore.getState().logout();
        console.log('User logged out successfully from local session.');
    } catch (err) {
        const error = err instanceof Error ? err : new Error('Error desconocido al cerrar sesión');
        console.error('Error signing out: ', error.message);
        throw error;
    }
}