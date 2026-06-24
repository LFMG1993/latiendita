
// Renombramos a UserProfile para diferenciarlo del objeto User de Firebase.
export interface UserProfile {
    uid?: string;
    firstName: string;
    lastName: string;
    email: string;
    identify: string;
    documentId?: string; // Cédula/Documento de identidad único para clientes
    phone: string;
    role?: 'owner' | 'employee' | 'superAdmin' | 'client';
    roleId?: string;
    photoURL?: string | null;
    createdAt: string;
    updatedAt?: string;
    shopIds: string[];
    permissions: string[];
    // Campos Financieros (Principalmente para clientes)
    credits?: number; // Saldo a favor
    debt?: number;    // Saldo en contra (Deuda)
    isCreditEnabled?: boolean; // Si el admin habilitó crédito para este cliente
    creditLimit?: number; // Límite máximo de deuda permitida
}

// El "contrato" para los datos del formulario de registro.
export interface RegisterFormData {
    email: string;
    password: string;
    shopName: string;
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