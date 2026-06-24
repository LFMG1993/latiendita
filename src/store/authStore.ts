import { create } from 'zustand';
import { AuthStoreState, Shop } from "../types";

export const useAuthStore = create<AuthStoreState>((set) => ({
    user: null,
    isAuthenticated: false,
    loading: true,
    activeShopId: null,
    activeShop: null,
    shops: [],
    setAuthUser: (user) => set({ user, isAuthenticated: !!user }),
    setUserShop: (nuevasShops: Shop[]) => set(state => {
        const newActiveId = state.activeShopId || (nuevasShops.length > 0 ? nuevasShops[0].id : null);
        const newActiveShop = nuevasShops.find(shop => shop.id === newActiveId) || null;
        return {
            shops: nuevasShops,
            activeShopId: newActiveId,
            activeShop: newActiveShop,
        };
    }),
    setActiveShopId: (shopId: string | null) => set(state => ({
        activeShopId: shopId,
        activeShop: state.shops.find(shop => shop.id === shopId) || null,
    })),
    setLoading: (isLoading) => set({ loading: isLoading }),

    logout: () => set({
        user: null,
        isAuthenticated: false,
        shops: [],
        activeShopId: null,
        activeShop: null,
    }),
}));