import { UpdateProfileData, UserProfile } from "../../types";
import { useAuthStore } from "../../store/authStore";

/**
 * Obtiene los datos del perfil de un usuario.
 */
export const getUserProfileData = async (userId: string): Promise<UserProfile | null> => {
    if (!userId) return null;
    const user = useAuthStore.getState().user;
    if (user && user.uid === userId) {
        return user;
    }
    return null;
};

/**
 * Actualiza el perfil de un usuario.
 */
export const updateUserProfile = async (userId: string, dataToUpdate: UpdateProfileData): Promise<void> => {
    console.warn("User profile updates are partially stubbed in REST mode until Go endpoint is added.");
    const user = useAuthStore.getState().user;
    if (user && user.uid === userId) {
        useAuthStore.getState().setAuthUser({ ...user, ...dataToUpdate } as UserProfile);
    }
};
