import { useAuthStore } from "../store/authStore.ts";

export const usePermissions = () => {
    const { user } = useAuthStore();

    const hasPermission = (permissionId: string): boolean => {
        if (!user) return false;
        if (user.role === 'owner' || user.role === 'superAdmin') return true;
        return user.permissions.includes(permissionId);
    };

    return { hasPermission };
};