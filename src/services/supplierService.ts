import { NewSupplierData, Supplier, UpdateSupplierData } from "../types";
import { apiClient } from "./apiClient";

/**
 * Obtiene todos los proveedores de una heladería.
 */
export const getSuppliers = async (heladeriaId: string): Promise<Supplier[]> => {
    return await apiClient<Supplier[]>(`/shops/${heladeriaId}/suppliers`);
};

/** Añadir un nuevo proveedor */
export const addSupplier = async (heladeriaId: string, supplierData: NewSupplierData): Promise<string> => {
    const res = await apiClient<Supplier>(`/shops/${heladeriaId}/suppliers`, {
        method: 'POST',
        body: JSON.stringify(supplierData)
    });
    return res.id;
};

/** Actualizar un proveedor existente */
export const updateSupplier = async (heladeriaId: string, supplierId: string, dataToUpdate: UpdateSupplierData): Promise<void> => {
    await apiClient(`/shops/${heladeriaId}/suppliers/${supplierId}`, {
        method: 'PUT',
        body: JSON.stringify(dataToUpdate)
    });
};

/** Eliminar un proveedor */
export const deleteSupplier = async (heladeriaId: string, supplierId: string): Promise<void> => {
    await apiClient(`/shops/${heladeriaId}/suppliers/${supplierId}`, {
        method: 'DELETE'
    });
};