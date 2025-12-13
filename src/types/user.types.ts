import {Timestamp} from 'firebase/firestore';

// Renombramos a UserProfile para diferenciarlo del objeto User de Firebase.
export interface UserProfile {
    firstName: string;
    lastName: string;
    email: string;
    identify: string;
    phone: string;
    role?: 'owner' | 'employee' | 'superAdmin';
    roleId?: string;
    photoURL?: string | null;
    createdAt: Timestamp;
    updatedAt?: Timestamp;
    iceCreamShopIds: string[];
    permissions: string[];
}

// El "contrato" para los datos del formulario de registro.
export interface RegisterFormData {
    email: string;
    password: string;
    iceCreamShopName: string;
    firstName: string;
    lastName: string;
    identify: string;
    phone: string;
    timezone: string;
}

//Tipo para los datos que se pueden actualizar en el perfil de un usuario.
export interface UpdateProfileData {
    firstName?: string;
    lastName?: string;
    phone?: string;
    photoURL?: string;
}