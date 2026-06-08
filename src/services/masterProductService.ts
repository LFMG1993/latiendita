import { apiClient } from './apiClient';
import {
    MasterProduct,
    MasterProductRequest,
    CreateMasterProductPayload,
    CreateProductRequestPayload,
    ApproveProductRequestPayload,
} from '../types/masterProduct.types';

// ---- SUPER ADMIN: Master Catalog ----

/** Get all master products, with optional search/filter */
export const getAllMasterProducts = async (q?: string, category?: string): Promise<MasterProduct[]> => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (category) params.set('category', category);
    const qs = params.toString();
    return await apiClient<MasterProduct[]>(`/admin/master-products${qs ? '?' + qs : ''}`);
};

/** Create a new master product (Super Admin only) */
export const createMasterProduct = async (data: CreateMasterProductPayload): Promise<MasterProduct> => {
    return await apiClient<MasterProduct>('/admin/master-products', {
        method: 'POST',
        body: JSON.stringify(data),
    });
};

/** Update a master product (Super Admin only) */
export const updateMasterProduct = async (id: string, data: Partial<CreateMasterProductPayload>): Promise<MasterProduct> => {
    return await apiClient<MasterProduct>(`/admin/master-products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
};

/** Delete a master product (Super Admin only) */
export const deleteMasterProduct = async (id: string): Promise<void> => {
    await apiClient(`/admin/master-products/${id}`, { method: 'DELETE' });
};

// ---- SHOP OWNERS: Search Catalog ----

/** Search the master catalog by name, brand, or barcode */
export const searchMasterProducts = async (q: string): Promise<MasterProduct[]> => {
    if (!q.trim()) return [];
    return await apiClient<MasterProduct[]>(`/master-products/search?q=${encodeURIComponent(q)}`);
};

// ---- SHOP OWNERS: Product Requests ----

/** Submit a request to add a product to the master catalog */
export const createProductRequest = async (shopId: string, data: CreateProductRequestPayload): Promise<MasterProductRequest> => {
    return await apiClient<MasterProductRequest>(`/shops/${shopId}/product-requests`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
};

/** Get all product requests for a shop */
export const getShopProductRequests = async (shopId: string): Promise<MasterProductRequest[]> => {
    return await apiClient<MasterProductRequest[]>(`/shops/${shopId}/product-requests`);
};

// ---- SUPER ADMIN: Product Requests ----

/** Get all product requests across all shops */
export const getAllProductRequests = async (status?: string): Promise<MasterProductRequest[]> => {
    const qs = status ? `?status=${status}` : '';
    return await apiClient<MasterProductRequest[]>(`/admin/product-requests${qs}`);
};

/** Approve a product request (adds product to master catalog) */
export const approveProductRequest = async (id: string, data?: ApproveProductRequestPayload): Promise<{ message: string; master_product_id: string }> => {
    return await apiClient(`/admin/product-requests/${id}/approve`, {
        method: 'PUT',
        body: JSON.stringify(data || {}),
    });
};

/** Reject a product request */
export const rejectProductRequest = async (id: string, adminNotes?: string): Promise<void> => {
    await apiClient(`/admin/product-requests/${id}/reject`, {
        method: 'PUT',
        body: JSON.stringify({ admin_notes: adminNotes }),
    });
};

// ---- PUBLIC CATALOG INTERACTION ----

export interface ShopProductStatus {
    shop_id: string;
    shop_name: string;
    price: number;
    stock: number;
    is_open: boolean;
    is_enrolled: boolean;
}

/** Get all shops selling a specific master product and the client enrollment status */
export const getMasterProductShops = async (masterProductId: string, clientId?: string): Promise<ShopProductStatus[]> => {
    const qs = clientId ? `?client_id=${clientId}` : '';
    return await apiClient<ShopProductStatus[]>(`/public/master-products/${masterProductId}/shops${qs}`);
};

/** Enroll a client in a specific shop */
export const enrollClientToShop = async (shopId: string, clientId: string): Promise<{ success: boolean; message: string }> => {
    return await apiClient<{ success: boolean; message: string }>(`/public/shops/${shopId}/enroll`, {
        method: 'POST',
        body: JSON.stringify({ client_id: clientId }),
    });
};
