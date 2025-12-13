import {User} from 'firebase/auth';
import {Heladeria} from './iceCreamShop.types';
import {UserProfile} from './user.types';

// El "contrato" completo que debe cumplir nuestro store de autenticación.
export interface AuthStoreState {
    // El usuario es una combinación del de Firebase y nuestro perfil de Firestore.
    user: (User & UserProfile) | null;
    iceCreamShops: Heladeria[];
    isAuthenticated: boolean;
    loading: boolean;
    activeIceCreamShopId: string | null;
    activeIceCreamShop: Heladeria | null;
    setAuthUser: (user: (User & UserProfile) | null) => void;
    setUserIceCreamShop: (heladerias: Heladeria[]) => void;
    setLoading: (loading: boolean) => void;
    setActiveIceCreamShopId: (id: string | null) => void;
    logout: () => void;
}