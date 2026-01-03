import {useAuthStore} from "../store/authStore.ts";
import {navItemsConfig} from "../config/navConfig.ts";

/** Un hook personalizado que proporciona herramientas para la gestión de permisos. */
export const usePermissions = () => {
    const {user, iceCreamShops, activeIceCreamShopId} = useAuthStore();

    const hasPermission = (permissionId: string): boolean => {
        if (!user) return false;

        // 1. Verificar si el MÓDULO está habilitado en la tienda activa
        if (activeIceCreamShopId && iceCreamShops) {
            const currentShop = iceCreamShops.find(s => s.id === activeIceCreamShopId);

            // Encontramos a qué categoría pertenece este permiso
            const navItem = navItemsConfig.find(item => item.permissionId === permissionId);
            
             // Si el permiso está asociado a una categoría (módulo) y la tienda tiene módulos definidos
            if (navItem) {
                // 1.1 Verificar Módulo (Global)
                if (currentShop?.modules) {
                    const moduleName = navItem.category;
                    if (currentShop.modules[moduleName] === false) {
                        return false;
                    }
                }

                // 1.2 Verificar Feature (Granular)
                if (currentShop?.features) {
                    // Si la feature específica está explícitamente deshabilitada
                    if (currentShop.features[permissionId] === false) {
                        return false;
                    }
                }
            }
        }

        // 2. Verificar Permisos de Rol
        // El dueño y el Super Admin siempre tienen todos los permisos.
        if (user.role === 'owner' || user.role === 'superAdmin') return true;

        return user.permissions.includes(permissionId);
    };

    return { hasPermission };
};