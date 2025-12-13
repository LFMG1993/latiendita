import {create} from 'zustand';
import {AuthStoreState, Heladeria} from "../types";

export const useAuthStore = create<AuthStoreState>((set) => ({
    user: null,
    isAuthenticated: false,
    loading: true,
    activeIceCreamShopId: null,
    activeIceCreamShop: null,
    iceCreamShops: [],
    setAuthUser: (user) => set({user, isAuthenticated: !!user}),
    setUserIceCreamShop: (nuevasHeladerias: Heladeria[]) => set(state => {
        const newActiveId = state.activeIceCreamShopId || (nuevasHeladerias.length > 0 ? nuevasHeladerias[0].id : null);
        const newActiveShop = nuevasHeladerias.find(shop => shop.id === newActiveId) || null;
        return {
            iceCreamShops: nuevasHeladerias,
            activeIceCreamShopId: newActiveId,
            activeIceCreamShop: newActiveShop, // <-- 2. Actualizamos la heladería activa cuando la lista cambia
        };
    }),
    setActiveIceCreamShopId: (heladeriaId: string | null) => set(state => ({
        activeIceCreamShopId: heladeriaId,
        activeIceCreamShop: state.iceCreamShops.find(shop => shop.id === heladeriaId) || null, // <-- 3. Actualizamos la heladería activa cuando el ID cambia
    })),
    setLoading: (isLoading) => set({loading: isLoading}),

    // Metodo Logout
    logout: () => set({
        user: null,
        isAuthenticated: false,
        iceCreamShops: [],
        activeIceCreamShopId: null,
        activeIceCreamShop: null,
    }),
}));