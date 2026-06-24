import { Shop } from './shop.types';
import { UserProfile } from './user.types';

export interface AuthStoreState {
    user: UserProfile | null;
    shops: Shop[];
    isAuthenticated: boolean;
    loading: boolean;
    activeShopId: string | null;
    activeShop: Shop | null;
    setAuthUser: (user: UserProfile | null) => void;
    setUserShop: (shops: Shop[]) => void;
    setLoading: (loading: boolean) => void;
    setActiveShopId: (id: string | null) => void;
    logout: () => void;
}