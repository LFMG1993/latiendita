import { Role, NewRoleData, InvitationData, PendingInvitation, WorkSchedule, ScheduleException } from "../../types";
import { apiClient } from "../shared/apiClient";

/**
 * Obtiene todos los roles de una heladería específica.
 */
export const getRoles = async (shopId: string): Promise<Role[]> => {
    try {
        return await apiClient<Role[]>(`/shops/${shopId}/roles`);
    } catch (err) {
        console.warn("getRoles: Endpoint might not be fully implemented in Go yet.");
        return [];
    }
};

/**
 * Obtiene un rol específico por su ID.
 */
export const getRoleById = async (shopId: string, roleId: string): Promise<Role | null> => {
    try {
        return await apiClient<Role>(`/shops/${shopId}/roles/${roleId}`);
    } catch (err) {
        return null;
    }
};

/**
 * Añade un nuevo rol a una heladería.
 */
export const addRole = async (shopId: string, roleData: NewRoleData): Promise<void> => {
    await apiClient(`/shops/${shopId}/roles`, {
        method: 'POST',
        body: JSON.stringify(roleData)
    });
};

/**
 * Actualiza un rol existente.
 */
export const updateRole = async (shopId: string, roleId: string, data: NewRoleData): Promise<void> => {
    await apiClient(`/shops/${shopId}/roles/${roleId}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    });
};

/**
 * Elimina un rol.
 */
export const deleteRole = async (shopId: string, roleId: string): Promise<void> => {
    await apiClient(`/shops/${shopId}/roles/${roleId}`, {
        method: 'DELETE'
    });
};

/**
 * Crea un documento de invitación para un nuevo miembro.
 */
export const inviteMember = async (invitationData: InvitationData): Promise<string> => {
    const res = await apiClient<any>(`/shops/${invitationData.shopId}/invitations`, {
        method: 'POST',
        body: JSON.stringify(invitationData)
    });
    return res.id || "dummy_id";
};

/**
 * Obtiene los datos de una invitación específica.
 */
export const getInvitationData = async (shopId: string, invitationId: string): Promise<PendingInvitation | null> => {
    try {
        return await apiClient<PendingInvitation>(`/shops/${shopId}/invitations/${invitationId}`);
    } catch {
        return null;
    }
};

/**
 * Obtiene todas las invitaciones pendientes para una heladería específica.
 */
export const getPendingInvitations = async (shopId: string) => {
    try {
        return await apiClient<PendingInvitation[]>(`/shops/${shopId}/invitations?status=pending`);
    } catch {
        return [];
    }
};

/**
 * Un usuario recién registrado "reclama" una invitación actualizándola con su UID.
 */
export const claimInvitation = async (shopId: string, invitationId: string, userId: string) => {
    await apiClient(`/shops/${shopId}/invitations/${invitationId}/claim`, {
        method: 'PUT',
        body: JSON.stringify({ userId })
    });
};

/**
 * Crea el documento de un usuario en la colección 'users' después de que se registra
 */
export const createInvitedUser = async (user: { uid: string, email: string | null }, roleId: string) => {
    // Usually handled entirely by Go backend upon registration. 
    // This is a stub for compatibility.
    console.warn("createInvitedUser is managed by the Go backend registration endpoint.");
};

/**
 * Aprobado por el dueño, esta función finaliza el proceso de invitación
 */
export const approveInvitation = async (invitation: InvitationData & { id: string, memberUid: string }) => {
    await apiClient(`/shops/${invitation.shopId}/invitations/${invitation.id}/approve`, {
        method: 'PUT'
    });
};

/**
 * Elimina a un miembro de una heladería.
 */
export const removeMember = async (shopId: string, memberId: string): Promise<void> => {
    await apiClient(`/shops/${shopId}/members/${memberId}`, {
        method: 'DELETE'
    });
};

/**
 * Actualiza el horario de trabajo y las excepciones de un miembro específico.
 */
export const updateMemberSchedule = async (shopId: string, memberId: string, schedule: { workSchedule: WorkSchedule[], scheduleExceptions: ScheduleException[] }): Promise<void> => {
    await apiClient(`/shops/${shopId}/members/${memberId}/schedule`, {
        method: 'PUT',
        body: JSON.stringify(schedule)
    });
};
