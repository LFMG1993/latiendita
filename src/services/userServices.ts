import {
    doc,
    getDoc,
    collection,
    writeBatch,
    serverTimestamp,
    arrayUnion,
    updateDoc,
    arrayRemove,
    getDocs,
    query,
    where
} from "firebase/firestore";
import {db, auth} from "../firebase.js";
import {updateProfile} from "firebase/auth";
import {Heladeria, NewHeladeriaData, UpdateProfileData, UserProfile} from "../types";

/**
 * Obtiene el ID de la primera heladería asociada al usuario actualmente autenticado.
 * Lanza un error si no hay un usuario autenticado o si el documento del usuario no existe.
 * @returns {Promise<string | null>} El ID de la heladería o null si el usuario no tiene ninguna.
 */
export const getHeladeriaId = async (): Promise<string | null> => {
    const uid = auth.currentUser?.uid;
    if (!uid) {
        throw new Error("No hay usuario autenticado");
    }

    const userDocRef = doc(db, "users", uid);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
        const userData = userDocSnap.data() as UserProfile;
        return userData.iceCreamShopIds && userData.iceCreamShopIds.length > 0 ? userData.iceCreamShopIds[0] : null;
    } else {
        throw new Error("El documento del usuario no existe");
    }
};
/**
 * Obtiene los detalles de una heladería específica por su ID.
 * @param heladeriaId - El ID del documento de la heladería.
 * @returns Un objeto con los datos de la heladería o null si no se encuentra.
 */
export const getHeladeriaDetails = async (heladeriaId: string): Promise<Heladeria | null> => {
    if (!heladeriaId) return null;

    const heladeriaDocRef = doc(db, "iceCreamShops", heladeriaId);
    const heladeriaDocSnap = await getDoc(heladeriaDocRef);

    if (heladeriaDocSnap.exists()) {
        return {id: heladeriaDocSnap.id, ...heladeriaDocSnap.data()} as Heladeria;
    } else {
        console.warn(`No se encontró la heladería con ID: ${heladeriaId}`);
        return null;
    }
};

/**
 * Obtiene los datos del perfil de un usuario desde la colección 'usuarios' en Firestore.
 * @param userId - El UID del usuario.
 * @returns Los datos del perfil del usuario o null si no existe.
 */
export const getUserProfileData = async (userId: string): Promise<UserProfile | null> => {
    if (!userId) return null;
    const userDocRef = doc(db, "users", userId);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
        return userDocSnap.data() as UserProfile;
    } else {
        console.warn(`No se encontró el perfil para el usuario con ID: ${userId}`);
        return null;
    }
};

/**
 * Obtiene los detalles de todas las heladerías asociadas a un usuario.
 * @param userId - El UID del usuario.
 * @returns Una lista de objetos de heladería.
 */
export const getHeladeriasByUserId = async (userId: string): Promise<Heladeria[]> => {
    if (!userId) {
        console.warn("getHeladeriasByUserId called with null userId.");
        return [];
    }
    // Query iceCreamShops where the user is a member
    const iceCreamShopsRef = collection(db, "iceCreamShops");
    // This query checks if the user's UID exists as a key in the 'members' map.
    // Firestore allows querying map keys directly.
    const q = query(iceCreamShopsRef, where(`members.${userId}`, '!=', null));
    const querySnapshot = await getDocs(q);

    // Map the documents to Heladeria objects
    return querySnapshot.docs.map(doc => ({id: doc.id, ...doc.data()})) as Heladeria[];
};

/**
 * Añade una nueva heladería y la asocia a un usuario.
 * @param {string} userId - El UID del usuario.
 * @param {NewHeladeriaData} heladeriaData - El objeto con los datos de la nueva heladería.
 */
export const addHeladeriaToUser = async (userId: string, heladeriaData: NewHeladeriaData, timezone: string): Promise<void> => {
    const batch = writeBatch(db);

    // 1. Crear el nuevo documento de heladería
    const newHeladeriaRef = doc(collection(db, "iceCreamShops"));
    batch.set(newHeladeriaRef, {
        ...heladeriaData,
        userId: userId,
        timezone: timezone,
        createdAt: serverTimestamp()
    });

    // 2. Actualizar el documento del usuario para añadir el ID de la nueva heladería
    const userDocRef = doc(db, "users", userId);
    batch.update(userDocRef, {
        heladeriaIds: arrayUnion(newHeladeriaRef.id) // CORRECCIÓN: Usamos 'heladeriaIds'
    });

    await batch.commit();
};

/**
 * Actualiza el nombre de una heladería existente.
 * @param heladeriaId - El ID de la heladería a actualizar.
 * @param dataToUpdate - Un objeto con los campos a actualizar.
 */
export const updateHeladeria = async (heladeriaId: string, dataToUpdate: Partial<NewHeladeriaData>): Promise<void> => {
    const heladeriaRef = doc(db, "iceCreamShops", heladeriaId);
    await updateDoc(heladeriaRef, dataToUpdate);
};

/**
 * Actualiza el perfil de un usuario en Firebase Auth.
 * @param userId - El UID del usuario (para futuras validaciones).
 * @param dataToUpdate - Objeto con los datos a actualizar (ejemplo: { displayName, photoURL }).
 */
export const updateUserProfile = async (userId: string, dataToUpdate: UpdateProfileData): Promise<void> => {

    if (!auth.currentUser || auth.currentUser.uid !== userId) {
        throw new Error("No autorizado para realizar esta acción.");
    }

    const {firstName, lastName, photoURL} = dataToUpdate;

    // 1. Actualizaciones para Firebase Auth (displayName y photoURL)
    const authUpdates: { displayName?: string; photoURL?: string } = {};
    if (firstName || lastName) {
        authUpdates.displayName = `${firstName || auth.currentUser.displayName?.split(' ')[0]} ${lastName || ''}`.trim();
    }
    if (photoURL) {
        authUpdates.photoURL = photoURL;
    }

    // 2. Actualizaciones para Firestore
    const firestoreUpdates: { [key: string]: any } = {
        ...dataToUpdate,
        updatedAt: serverTimestamp()
    };

    // 3. Ejecutamos las actualizaciones en paralelo
    if (Object.keys(authUpdates).length > 0) {
        await updateProfile(auth.currentUser, authUpdates);
    }

    const userDocRef = doc(db, "users", userId);
    await updateDoc(userDocRef, firestoreUpdates);
};

/**
 * Elimina una heladería y su referencia en el documento del usuario.
 * @param  userId - El UID del usuario propietario.
 * @param  heladeriaId - El ID de la heladería a eliminar.
 */
export const deleteHeladeria = async (userId: string, heladeriaId: string): Promise<void> => {
    // Usamos un batch para asegurar que ambas operaciones (borrar documento y borrar referencia)
    const batch = writeBatch(db);

    // Referencia al documento de la heladería para eliminarlo
    const heladeriaRef = doc(db, "iceCreamShops", heladeriaId);
    batch.delete(heladeriaRef);

    // Referencia al documento del usuario para quitar el ID del array
    const userRef = doc(db, "users", userId);
    batch.update(userRef, {
        heladeriaIds: arrayRemove(heladeriaId)
    });

    await batch.commit();
};