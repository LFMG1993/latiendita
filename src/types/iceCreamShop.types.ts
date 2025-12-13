import { Timestamp } from 'firebase/firestore';

export interface WorkSchedule {
    dayOfWeek: number; // 0=Domingo, 1=Lunes, ..., 6=Sábado
    startTime: string; // Formato "HH:mm" ej: "15:00"
    endTime: string;   // Formato "HH:mm" ej: "22:00"
}

export interface ScheduleException {
    date: string; // Formato "YYYY-MM-DD"
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
    addedAt: Timestamp;
    permissions: Record<string, boolean>;
    workSchedule?: WorkSchedule[];
    scheduleExceptions?: ScheduleException[];
}

export interface Heladeria {
    id: string;
    name: string;
    address?: string;
    photoURL?: string;
    whatsapp?: string;
    owner: string;
    timezone: string;
    members: Record<string, ShopMember>; // Mapa de UID a perfil del miembro
    createdAt: Timestamp;
}

// Tipo para crear una nueva heladería
export type NewHeladeriaData = Omit<Heladeria, 'id' | 'ownerId' | 'createdAt' | 'members'>;

// Tipo para actualizar una heladería
export type UpdateHeladeriaData = Partial<NewHeladeriaData>;