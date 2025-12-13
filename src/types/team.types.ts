import {WorkSchedule, ScheduleException} from "./iceCreamShop.types";

/**
 * Representa un permiso individual en el sistema.
 */
export interface Permission {
    id: string;
    name: string;
    description: string;
}

/**
 * Representa un rol creado por el dueño de una heladería.
 * Un rol es un conjunto de permisos.
 */
export interface Role {
    id: string;
    name: string;
    description: string;
    permissions: Record<string, boolean>; // Mapa de IDs de permisos a 'true'
}

/**
 * El "contrato" para los datos del formulario de creación/edición de un rol.
 */
export interface NewRoleData {
    name: string;
    description: string;
    permissions: Record<string, boolean>;
}

/**
 * El "contrato" para los datos al actualizar un rol. Hace que todas las propiedades sean opcionales.
 */
export type UpdateRoleData = Partial<NewRoleData>;

/**
 * Representa a un miembro del equipo en la interfaz de usuario.
 * Combina datos de la heladería y del perfil del usuario.
 */
export interface Member {
    uid: string;
    email: string;
    roleId?: string;
    roleName?: string; // Nombre del rol para mostrar en la UI
    workSchedule?: WorkSchedule[];
    scheduleExceptions?: ScheduleException[];
}

/**
 * El "contrato" para los datos del formulario de creación de un nuevo empleado.
 */
export interface InvitationData {
    shopId: string;
    roleId: string;
    email: string;
}

/**
 * Representa una invitación pendiente en la UI, enriquecida con el UID
 * del usuario una vez que este se ha registrado.
 */
export interface PendingInvitation extends InvitationData {
    id: string;
    memberUid?: string;
    status: 'pending' | 'claimed';
}