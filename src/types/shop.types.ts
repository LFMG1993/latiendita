
export interface WorkSchedule {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
}

export interface ScheduleException {
    date: string;
    startTime: string;
    endTime: string;
}

/**
 * Representa el perfil de un miembro tal como se almacena DENTRO del documento de la heladería.
 * Contiene los permisos denormalizados para optimizar las lecturas y la seguridad.
 */
export interface ShopMember {
    roleId: string;
    role: 'owner' | 'employee';
    email: string;
    addedAt: string;
    permissions: Record<string, boolean>;
    workSchedule?: WorkSchedule[];
    scheduleExceptions?: ScheduleException[];
}

export interface Shop {
    id: string;
    name: string;
    address?: string;
    photoURL?: string;
    whatsapp?: string;
    owner: string;
    timezone: string;
    status?: string; // 'pending', 'active', 'suspended'
    members: Record<string, ShopMember>; // Mapa de UID a perfil del miembro
    businessTypeId?: number | string;
    createdAt: string;
    updatedAt?: string;
    // Multi-tenancy & Branding
    theme?: {
        primaryColor?: string;
        secondaryColor?: string;
        logoURL?: string; // URL específica para el logo del header/sidebar
    };
    terminology?: {
        shopLabel: string;
        productLabel: string;
    };
    modules?: Record<string, boolean>;
    features?: Record<string, boolean>;
}

// Tipo para crear un nuevo negocio.
export type NewShopData = Omit<Shop, 'id' | 'ownerId' | 'createdAt' | 'members'>;

// Tipo para actualizar un negocio.
export type UpdateShopData = Partial<NewShopData>;