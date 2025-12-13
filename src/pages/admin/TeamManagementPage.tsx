import {FC, useState, useEffect} from 'react';
import {useAuthStore} from "../../store/authStore.ts";
import FullScreenLoader from "../../components/general/FullScreenLoader.tsx";
import Breadcrumbs from "../../components/general/Breadcrumbs.tsx";
import {db} from "../../firebase.ts";
import {collection, getDocs, doc, getDoc} from "firebase/firestore";
import {Permission, Role, Member, PendingInvitation} from "../../types";
import Modal from "../../components/general/Modal.tsx";
import RoleForm from "../../components/team/RoleForm.tsx";
import InviteMemberForm from "../../components/team/InviteMemberForm.tsx";
import {approveInvitation, getPendingInvitations} from "../../services/teamServices.ts";
import PendingInvitationsTable from "../../components/team/PendingInvitationsTable.tsx";
import MembersTable from "../../components/team/MembersTable.tsx";
import RolesTable from "../../components/team/RolesTable.tsx";
import ScheduleForm from "../../components/team/SheduleForm.tsx";

const TeamManagementPage: FC = () => {
    const {activeIceCreamShopId: shopId, loading: authLoading, user} = useAuthStore();
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

    const isOwner = user?.role === 'owner';

    useEffect(() => {
        const fetchData = async () => {
            if (!shopId || !isOwner) {
                setPageLoading(false);
                return;
            }
            setPageLoading(true);
            try {
                // Cargar todos los datos en paralelo para máxima eficiencia
                const [permissionsQuery, rolesQuery, shopDoc, invitations] = await Promise.all([
                    getDocs(collection(db, "permissions")),
                    getDocs(collection(db, "iceCreamShops", shopId, "roles")),
                    getDoc(doc(db, "iceCreamShops", shopId)),
                    getPendingInvitations(shopId)
                ]);

                // Procesar permisos
                const availablePermissions = permissionsQuery.docs.map(doc => ({id: doc.id, ...doc.data()})) as Permission[];
                setPermissions(availablePermissions);

                // Procesar roles
                const shopRoles = rolesQuery.docs.map(doc => ({id: doc.id, ...doc.data()})) as Role[];
                setRoles(shopRoles);

                // Procesar miembros
                const shopData = shopDoc.data();
                if (shopData && shopData.members) {
                    const resolvedMembers = Object.keys(shopData.members).map((uid) => {
                        const memberData = shopData.members[uid];
                        const roleName = shopRoles.find(r => r.id === memberData.roleId)?.name || (memberData.role === 'owner' ? 'Propietario' : 'Sin rol');
                        return {uid, ...memberData, roleName};
                    });
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
    }, [shopId, isOwner, refetchTrigger]);

    if (authLoading || pageLoading) {
        return <FullScreenLoader/>;
    }

    if (!isOwner) {
        return (
            <main className="px-md-4">
                <div className="alert alert-danger">No tienes permiso para acceder a esta sección.</div>
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