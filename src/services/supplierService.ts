import {db} from "../firebase.ts";
import {collection, getDocs, addDoc, serverTimestamp, query, orderBy, doc, updateDoc, deleteDoc} from "firebase/firestore";
import {NewSupplierData, Supplier, UpdateSupplierData} from "../types";

/**
 * Obtiene todos los proveedores de una heladería, ordenados por nombre.
 * @param heladeriaId - El ID de la heladería.
 */
export const getSuppliers = async (heladeriaId: string): Promise<Supplier[]> => {
    const suppliersRef = collection(db, "iceCreamShops", heladeriaId, "suppliers");
    const q = query(suppliersRef, orderBy("name", "asc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({id: doc.id, ...doc.data()}) as Supplier);
};

/** Añadir un nuevo proveedor */
export const addSupplier = async (heladeriaId: string, supplierData: NewSupplierData): Promise<string> => {
    const suppliersRef = collection(db, "iceCreamShops", heladeriaId, "suppliers");
    const docRef = await addDoc(suppliersRef, {
        ...supplierData,
        createdAt: serverTimestamp(),
    });
    return docRef.id;
};

/** Actualizar un proveedor existente */
export const updateSupplier = async (heladeriaId: string, supplierId: string, dataToUpdate: UpdateSupplierData): Promise<void> => {
    const supplierRef = doc(db, "iceCreamShops", heladeriaId, "suppliers", supplierId);
    await updateDoc(supplierRef, {
        ...dataToUpdate,
        updatedAt: serverTimestamp()
    });
};

/** Eliminar un proveedor */
export const deleteSupplier = async (heladeriaId: string, supplierId: string): Promise<void> => {
    const supplierRef = doc(db, "iceCreamShops", heladeriaId, "suppliers", supplierId);
    await deleteDoc(supplierRef);
};