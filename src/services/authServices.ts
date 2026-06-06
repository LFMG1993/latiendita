import {auth, db} from "../firebase.js";
import {createUserWithEmailAndPassword, updateProfile, User, deleteUser} from "firebase/auth";
import {doc, collection, writeBatch, serverTimestamp, query, where, getDocs} from "firebase/firestore";
import {RegisterFormData} from "../types";

/**
 * Registra un nuevo usuario en Firebase Authentication y crea sus documentos
 * de usuario y heladería asociados en Firestore usando una transacción batch.
 */
export const registerUser = async (formData: RegisterFormData): Promise<User> => {
    let user: User | null = null;
    try {
        // Registro en Authentication
        const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        user = userCredential.user;

        // Usamos un batch para asegurar que todas las escrituras se realicen o ninguna
        const batch = writeBatch(db);

        // Creamos el documento de la heladería
        const heladeriaRef = doc(collection(db, "iceCreamShops"));
        const iceCreamShopDocData = {
            name: formData.iceCreamShopName,
            owner: user.uid,
            timezone: formData.timezone,
            createdAt: serverTimestamp(),
            // Añadimos el mapa de miembros con el propietario como primer miembro.
            members: {
                [user.uid]: {
                    role: 'owner',
                    addedAt: serverTimestamp()
                }
            }
        };
        batch.set(heladeriaRef, iceCreamShopDocData);

        // Creamos el documento del usuario con la referencia a su heladería
        const usuarioRef = doc(db, "users", user.uid);
        const userDocData: { [key: string]: any } = {
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            role: 'owner',
            identify: formData.identify,
            phone: formData.phone,
            createdAt: serverTimestamp(),
            iceCreamShopIds: [heladeriaRef.id]
        };
        batch.set(usuarioRef, userDocData);

        await batch.commit();

        await updateProfile(user, {
            displayName: `${formData.firstName} ${formData.lastName}`.trim()
        });

        return user!;
    } catch (err) {
        // Si algo falla después de crear el usuario en Auth, lo borramos para revertir la operación.
        if (user) {
            await deleteUser(user);
            console.log('Usuario de Auth revertido debido a un fallo en la creación de documentos.');
        }
        console.error("Error registrando el usuario: ", err);
        const error = err as { code?: string };

        if (error.code === 'auth/email-already-in-use') {
            throw new Error('Este correo electrónico ya está registrado.');
        }
        if (error.code === 'auth/weak-password') {
            throw new Error('La contraseña debe tener al menos 6 caracteres.');
        }
        if (error.code === 'auth/invalid-email') {
            throw new Error('El formato del correo electrónico no es válido.');
        }
        throw new Error('Ocurrió un error inesperado al registrar el usuario.');
    }
};

export interface ClientRegisterData {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone: string;
    documentId: string; // Cédula / Documento de identidad
    shopId?: string; // Tienda desde la que se registra
}

/**
 * Registra un nuevo CLIENTE (comprador final) en Firebase Auth y Firestore.
 * NO crea heladería. Asigna rol 'client'.
 */
export const registerClient = async (formData: ClientRegisterData): Promise<User> => {
    let user: User | null = null;
    try {
        // 0. Verificar si la cédula ya está registrada para algún cliente en Firestore
        const existingEmail = await getClientEmailByDocumentId(formData.documentId);
        if (existingEmail) {
            throw new Error('Este documento de identidad ya está registrado.');
        }

        // 1. Crear Auth User
        const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        user = userCredential.user;

        // 2. Crear documento de usuario en Firestore
        const userRef = doc(db, "users", user.uid);
        const userDocData = {
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            role: 'client', // Rol específico para clientes
            phone: formData.phone,
            documentId: formData.documentId, // Guardamos la cédula
            createdAt: serverTimestamp(),
            iceCreamShopIds: formData.shopId ? [formData.shopId] : [] // Asociamos tienda inicial si existe
        };
        
        await writeBatch(db).set(userRef, userDocData).commit();

        // 3. Update Auth Profile
        await updateProfile(user, {
            displayName: `${formData.firstName} ${formData.lastName}`.trim()
        });

        return user;
    } catch (err: any) {
        if (err.message === 'Este documento de identidad ya está registrado.') {
            throw err;
        }

        if (user) {
            await deleteUser(user);
             console.log('Usuario de Auth revertido (Client) debido a un fallo en la creación de documentos.');
        }
        console.error("Error registrando cliente: ", err);
        const error = err as { code?: string };

        if (error.code === 'auth/email-already-in-use') throw new Error('Este correo electrónico ya está registrado.');
        if (error.code === 'auth/weak-password') throw new Error('La contraseña debe tener al menos 6 caracteres.');
        if (error.code === 'auth/invalid-email') throw new Error('El formato del correo electrónico no es válido.');
        
        throw new Error('Ocurrió un error inesperado al registrar el cliente.');
    }
};

/**
 * Busca el correo electrónico de un cliente en Firestore usando su número de documento.
 * Retorna el email si lo encuentra, o null si no existe.
 */
export const getClientEmailByDocumentId = async (documentId: string): Promise<string | null> => {
    try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('role', '==', 'client'), where('documentId', '==', documentId.trim()));
        const snap = await getDocs(q);
        if (snap.empty) return null;
        return snap.docs[0].data().email as string;
    } catch (err) {
        console.error('Error buscando cliente por documento:', err);
        return null;
    }
};