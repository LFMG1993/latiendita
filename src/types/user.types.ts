import {Timestamp} from 'firebase/firestore';

// Renombramos a UserProfile para diferenciarlo del objeto User de Firebase.
export interface UserProfile {
    uid?: string;
    firstName: string;
    lastName: string;
    email: string;
    identify: string;
    phone: string;
    role?: 'owner' | 'employee' | 'superAdmin' | 'client';
    roleId?: string;
    photoURL?: string | null;
    createdAt: Timestamp;
    updatedAt?: Timestamp;
    iceCreamShopIds: string[];
    permissions: string[];
    // Campos Financieros (Principalmente para clientes)
    credits?: number; // Saldo a favor
    debt?: number;    // Saldo en contra (Deuda)
    isCreditEnabled?: boolean; // Si el admin habilitó crédito para este cliente
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