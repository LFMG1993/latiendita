import {auth, db} from "../firebase.js";
import {createUserWithEmailAndPassword, updateProfile, User, deleteUser} from "firebase/auth";
import {doc, collection, writeBatch, serverTimestamp,} from "firebase/firestore";
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