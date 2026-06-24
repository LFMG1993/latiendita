import {FC, useState, useEffect} from 'react';
import {useAuthStore} from "../../store/authStore.ts";
import FullScreenLoader from "../../components/shared/FullScreenLoader.tsx";
import Breadcrumbs from "../../components/shared/Breadcrumbs.tsx";
import {apiClient} from "../../services/shared/apiClient.ts";
import {Permission, Role, Member, PendingInvitation} from "../../types";
import Modal from "../../components/shared/Modal.tsx";
import RoleForm from "../../components/shop/team/RoleForm.tsx";
import InviteMemberForm from "../../components/shop/team/InviteMemberForm.tsx";
import {approveInvitation, getPendingInvitations} from "../../services/shop/teamServices.ts";
import PendingInvitationsTable from "../../components/shop/team/PendingInvitationsTable.tsx";
import MembersTable from "../../components/shop/team/MembersTable.tsx";
import RolesTable from "../../components/shop/team/RolesTable.tsx";
import ScheduleForm from "../../components/shop/team/SheduleForm.tsx";

const TeamManagementPage: FC = () => {
    const {activeShopId: shopId, loading: authLoading, user} = useAuthStore();
    const [pageLoading, setPageLoading] = useState(true);
    const [roles, setRoles] = useState<Role[]>([]);
    const [members, setMembers] = useState<Member[]>([]);
    const [pendingInvitations, setPendingInvitations] = useState<PendingInvitation[]>([]);
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
    const [editingMember, setEditingMember] = useState<Member | null>(null);
    const [editingRole, setEditingRole] = useState<Role | undefined>(undefined);
    const [refetchTrigger, setRefetchTrigger] = useState(0);

    const hasAccess = user?.role === 'owner' || user?.role === 'superAdmin';

    useEffect(() => {
        const fetchData = async () => {
            if (!shopId || !hasAccess) {
                setPageLoading(false);
                return;
            }
            setPageLoading(true);
            try {
                // Cargar todos los datos en paralelo para máxima eficiencia
                const [availablePermissions, shopRoles, shopData, invitations] = await Promise.all([
                    apiClient<Permission[]>("/permissions").catch(() => []),
                    apiClient<Role[]>(`/shops/${shopId}/roles`).catch(() => []),
                    apiClient<any>(`/shops/${shopId}`).catch(() => null),
                    getPendingInvitations(shopId)
                ]);

                // Procesar permisos
                setPermissions(availablePermissions);

                // Procesar roles
                setRoles(shopRoles);

                // Procesar miembros
                if (shopData && shopData.members) {
                    // This assumes backend returns members object/array compatible with this structure
                    // If it's an array, we map it directly:
                    const resolvedMembers = Array.isArray(shopData.members) ? shopData.members.map((m: any) => {
                        const roleName = shopRoles.find(r => r.id === m.roleId)?.name || (m.role === 'owner' ? 'Propietario' : 'Sin rol');
                        return {...m, roleName};
                    }) : [];
                    setMembers(resolvedMembers);
                }
                setPendingInvitations(invitations as PendingInvitation[]);

            } catch (error) {
                console.error("Error al cargar datos del equipo:", error);
            } finally {
                setPageLoading(false);
            }
        };

        fetchData();
    }, [shopId, hasAccess, refetchTrigger]);

    if (authLoading || pageLoading) {
        return <FullScreenLoader/>;
    }

    if (!hasAccess) {
        return (
            <main className="px-md-4">
                <div className="alert alert-danger mt-4">No tienes permiso para acceder a esta sección.</div>
            </main>
        );
    }

    if (!shopId) {
        return (
            <main className="px-md-4">
                <div className="alert alert-warning mt-4">Debes seleccionar o tener una tienda activa para gestionar su equipo de trabajo.</div>
            </main>
        );
    }

    const handleOpenAddRole = () => {
        setEditingRole(undefined);
        setIsRoleModalOpen(true);
    };

    const handleOpenEditRole = (role: Role) => {
        setEditingRole(role);
        setIsRoleModalOpen(true);
    };

    const handleFormSubmit = () => {
        setIsRoleModalOpen(false);
        setIsInviteModalOpen(false);
        setRefetchTrigger(c => c + 1); // Dispara la recarga de datos
    };

    const handleOpenScheduleModal = (member: Member) => {
        setEditingMember(member);
        setIsScheduleModalOpen(true);
    };

    // TODO: Implementar handleDeleteRole y handleRemoveMember
    const handleDeleteRole = (roleId: string) => alert(`Eliminar rol ${roleId}`);
    const handleRemoveMember = (memberId: string) => alert(`Eliminar miembro ${memberId}`);
    const handleApprove = async (invitation: PendingInvitation) => {
        if (!invitation.memberUid) return;
        try {
            await approveInvitation(invitation as PendingInvitation & { memberUid: string });
            handleFormSubmit(); // Recargar todos los datos
        } catch (error) {
            console.error("Error al aprobar la invitación:", error);
        }
    };

    return (
        <main className="px-md-4">
            <Breadcrumbs/>
            <div
                className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pb-2 mb-3 border-bottom">
                <h1 className="h2">Gestión de Equipo y Roles</h1>
            </div>
            <PendingInvitationsTable invitations={pendingInvitations} onApprove={handleApprove}/>

            <MembersTable
                members={members}
                onAdd={() => setIsInviteModalOpen(true)}
                onRemove={handleRemoveMember}
                onManageSchedule={handleOpenScheduleModal}
            />

            <RolesTable roles={roles} onAdd={handleOpenAddRole} onEdit={handleOpenEditRole}
                        onDelete={handleDeleteRole}/>
            {/* Modales */}
            <Modal title={editingRole ? "Editar Rol" : "Crear Nuevo Rol"} show={isRoleModalOpen}
                   onClose={() => setIsRoleModalOpen(false)}>
                <RoleForm
                    shopId={shopId!}
                    onFormSubmit={handleFormSubmit}
                    allPermissions={permissions}
                    roleToEdit={editingRole}
                />
            </Modal>

            <Modal title="Invitar Nuevo Miembro" show={isInviteModalOpen} onClose={() => setIsInviteModalOpen(false)}>
                <InviteMemberForm shopId={shopId!} roles={roles} onFormSubmit={handleFormSubmit}/>
            </Modal>
            {editingMember && (
                <Modal title={`Gestionar Horario de ${editingMember.email}`} show={isScheduleModalOpen}
                       onClose={() => setIsScheduleModalOpen(false)} size="lg">
                    <ScheduleForm shopId={shopId!} member={editingMember} onFormSubmit={() => {
                        setIsScheduleModalOpen(false);
                        setRefetchTrigger(c => c + 1);
                    }}/>
                </Modal>
            )}
        </main>
    );
};

export default TeamManagementPage;