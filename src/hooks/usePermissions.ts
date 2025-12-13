import {useAuthStore} from "../store/authStore.ts";

/** Un hook personalizado que proporciona herramientas para la gestión de permisos. */
export const usePermissions = () => {
    const {user} = useAuthStore();

    const hasPermission = (permissionId: string): boolean => {
        if (!user) return false;

    // El dueño siempre tiene todos los permisos.
    if (user.role === 'owner') return true;

        return user.permissions.includes(permissionId);
    };

    return { hasPermission };
};