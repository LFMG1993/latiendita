import {auth} from '../firebase';
import {signOut} from 'firebase/auth';
import {useAuthStore} from "../store/authStore";

/** Cierra la sesión del usuario actual en Firebase. */
export const logoutService = async (): Promise<void> => {
    try {
        await signOut(auth);
        // Actualizamos el estado global de la aplicación
        useAuthStore.getState().logout();
        console.log('User signed out successfully');

    } catch (err) {
        const error = err instanceof Error ? err : new Error('Error desconocido al cerrar sesión');
        console.error('Error signing out: ', error.message);
        throw error;
    }
}