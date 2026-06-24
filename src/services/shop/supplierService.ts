import { NewSupplierData, Supplier, UpdateSupplierData } from "../../types";
import { apiClient } from "../shared/apiClient";

/**
 * Obtiene todos los proveedores de una heladería.
 */
export const getSuppliers = async (shopId: string): Promise<Supplier[]> => {
    return await apiClient<Supplier[]>(`/shops/${shopId}/suppliers`);
};

/** Añadir un nuevo proveedor */
export const addSupplier = async (shopId: string, supplierData: NewSupplierData): Promise<string> => {
    const res = await apiClient<Supplier>(`/shops/${shopId}/suppliers`, {
        method: 'POST',
        body: JSON.stringify(supplierData)
    });
    return res.id;
};

/** Actualizar un proveedor existente */
export const updateSupplier = async (shopId: string, supplierId: string, dataToUpdate: UpdateSupplierData): Promise<void> => {
    await apiClient(`/shops/${shopId}/suppliers/${supplierId}`, {
        method: 'PUT',
        body: JSON.stringify(dataToUpdate)
    });
};

/** Eliminar un proveedor */
export const deleteSupplier = async (shopId: string, supplierId: string): Promise<void> => {
    await apiClient(`/shops/${shopId}/suppliers/${supplierId}`, {
        method: 'DELETE'
    });
};