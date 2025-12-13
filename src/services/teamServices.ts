import {db} from "../firebase.ts";
import {
    collection,
    getDocs,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    deleteField,
    writeBatch,
    serverTimestamp,
    setDoc,
    query,
    where,
    getDoc,
} from "firebase/firestore";
import {Role, NewRoleData, InvitationData, PendingInvitation, WorkSchedule, ScheduleException} from "../types";

/**
 * Obtiene todos los roles de una heladería específica.
 * @param shopId - El ID de la heladería.
 */
export const getRoles = async (shopId: string): Promise<Role[]> => {
    const rolesRef = collection(db, "iceCreamShops", shopId, "roles");
    const querySnapshot = await getDocs(rolesRef);
    return querySnapshot.docs.map(doc => ({id: doc.id, ...doc.data()}) as Role);
};

/**
 * Obtiene un rol específico por su ID.
 * @param shopId - El ID de la heladería.
 * @param roleId - El ID del rol.
 */
export const getRoleById = async (shopId: string, roleId: string): Promise<Role | null> => {
    const roleRef = doc(db, "iceCreamShops", shopId, "roles", roleId);
    const docSnap = await getDoc(roleRef);
    return docSnap.exists() ? {id: docSnap.id, ...docSnap.data()} as Role : null;
};


/**
 * Añade un nuevo rol a una heladería.
 * @param shopId - El ID de la heladería.
 * @param roleData - Los datos del nuevo rol.
 */
export const addRole = async (shopId: string, roleData: NewRoleData): Promise<void> => {
    const rolesRef = collection(db, "iceCreamShops", shopId, "roles");
    await addDoc(rolesRef, roleData);
};

/**
 * Actualiza un rol existente.
 * @param shopId - El ID de la heladería.
 * @param roleId - El ID del rol a actualizar.
 * @param data - Los nuevos datos para el rol.
 */
export const updateRole = async (shopId: string, roleId: string, data: NewRoleData): Promise<void> => {
    const batch = writeBatch(db);

    // 1. Actualizar el documento del rol principal
    const roleRef = doc(db, "iceCreamShops", shopId, "roles", roleId);
    batch.update(roleRef, {...data});

    // 2. Buscar y actualizar los permisos denormalizados de todos los miembros con este rol.
    const shopRef = doc(db, "iceCreamShops", shopId);
    const shopSnap = await getDoc(shopRef);

    if (shopSnap.exists()) {
        const members = shopSnap.data().members || {};
        for (const uid in members) {
            if (members[uid].roleId === roleId) {
                // Este miembro tiene el rol que se acaba de actualizar.
                const memberPermissionsPath = `members.${uid}.permissions`;
                batch.update(shopRef, {[memberPermissionsPath]: data.permissions});
            }
        }
    }

    // 3. Ejecutar todas las actualizaciones de forma atómica.
    await batch.commit();
};

/**
 * Elimina un rol.
 * @param shopId - El ID de la heladería.
 * @param roleId - El ID del rol a eliminar.
 */
export const deleteRole = async (shopId: string, roleId: string): Promise<void> => {
    // TODO: Añadir lógica para verificar que el rol no esté en uso antes de borrar.
    const roleRef = doc(db, "iceCreamShops", shopId, "roles", roleId);
    await deleteDoc(roleRef);
};

/**
 * Crea un documento de invitación para un nuevo miembro.
 * @param invitationData - Datos de la invitación (shopId, email, roleId).
 * @returns El ID del documento de la invitación creada.
 */
export const inviteMember = async (invitationData: InvitationData): Promise<string> => {
    const invitationsRef = collection(db, "iceCreamShops", invitationData.shopId, "invitations");
    const newDocRef = await addDoc(invitationsRef, {
        ...invitationData,
        status: "pending",
        createdAt: serverTimestamp()
    });
    return newDocRef.id;
};

/**
 * Obtiene los datos de una invitación específica.
 * @param shopId
 * @param invitationId
 */
export const getInvitationData = async (shopId: string, invitationId: string): Promise<PendingInvitation | null> => {
    const invRef = doc(db, "iceCreamShops", shopId, "invitations", invitationId);
    const docSnap = await getDoc(invRef);
    if (docSnap.exists()) {
        return {id: docSnap.id, ...docSnap.data()} as PendingInvitation;
    }
    return null;
};

/**
 * Obtiene todas las invitaciones pendientes para una heladería específica.
 * @param shopId - El ID de la heladería.
 */
export const getPendingInvitations = async (shopId: string) => {
    const invRef = collection(db, "iceCreamShops", shopId, "invitations");
    const q = query(invRef, where("status", "in", ["pending", "claimed"]));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({id: doc.id, ...doc.data()})) as PendingInvitation[];
};

/**
 * Un usuario recién registrado "reclama" una invitación actualizándola con su UID.
 * @param shopId
 * @param invitationId
 * @param userId
 */
export const claimInvitation = async (shopId: string, invitationId: string, userId: string) => {
    const invRef = doc(db, "iceCreamShops", shopId, "invitations", invitationId);
    await updateDoc(invRef, {memberUid: userId, status: 'claimed'});
};

/**
 * Crea el documento de un usuario en la colección 'users' después de que se registra
 * a través de una invitación. No lo vincula a la tienda, solo crea su perfil.
 * @param user - El objeto de usuario de Firebase Auth.
 */
export const createInvitedUser = async (user: { uid: string, email: string | null }, roleId: string) => {
    if (!user.email) {
        throw new Error("El usuario debe tener un email.");
    }
    const userDocRef = doc(db, "users", user.uid);
    // Usamos set con merge por si el usuario ya existía de un flujo anterior.
    await setDoc(userDocRef, {
        role: 'employee',
        roleId: roleId,
        email: user.email,
        createdAt: serverTimestamp()
    }, {merge: true});
};

/**
 * Aprobado por el dueño, esta función finaliza el proceso de invitación:
 * 1. Añade al miembro a la heladería.
 * 2. Elimina la invitación.
 * @param invitation - El objeto de la invitación a aprobar.
 */
export const approveInvitation = async (invitation: InvitationData & { id: string, memberUid: string }) => {
    const {id: invitationId, shopId, roleId, memberUid, email} = invitation;
    const invitationRef = doc(db, "iceCreamShops", shopId, "invitations", invitationId);

    // Antes de escribir, el dueño lee el rol.
    const roleDoc = await getRoleById(shopId, roleId);
    if (!roleDoc) {
        throw new Error("El rol asignado a esta invitación ya no existe.");
    }
    const rolePermissions = roleDoc.permissions;

    const batch = writeBatch(db);

    // 1. Añadir al miembro a la heladería usando UPDATE con DOT NOTATION.
    const shopDocRef = doc(db, "iceCreamShops", shopId);
    batch.update(shopDocRef, {
        [`members.${memberUid}`]: {
            role: 'employee',
            permissions: rolePermissions,
            roleId,
            email, // Denormalización
            addedAt: serverTimestamp()
        }
    });

    // 2. Eliminar la invitación para que no se pueda volver a usar.
    batch.delete(invitationRef);

    await batch.commit();
};

/**
 * Elimina a un miembro de una heladería.
 * @param shopId - El ID de la heladería.
 * @param memberId - El UID del miembro a eliminar.
 */
export const removeMember = async (shopId: string, memberId: string): Promise<void> => {
    const shopRef = doc(db, "iceCreamShops", shopId);
    await updateDoc(shopRef, {
        [`members.${memberId}`]: deleteField()
    });
};

/**
 * Actualiza el horario de trabajo y las excepciones de un miembro específico.
 * @param shopId - El ID de la heladería.
 * @param memberId - El UID del miembro a actualizar.
 * @param schedule - El objeto que contiene los nuevos horarios y excepciones.
 */
export const updateMemberSchedule = async (shopId: string, memberId: string, schedule: { workSchedule: WorkSchedule[], scheduleExceptions: ScheduleException[] }): Promise<void> => {
    const shopRef = doc(db, "iceCreamShops", shopId);
    await updateDoc(shopRef, {
        [`members.${memberId}.workSchedule`]: schedule.workSchedule,
        [`members.${memberId}.scheduleExceptions`]: schedule.scheduleExceptions
    });
};
