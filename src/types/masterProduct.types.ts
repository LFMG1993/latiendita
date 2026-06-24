export interface MasterProduct {
    id: string;
    name: string;
    brand?: string;
    barcode?: string;
    description?: string;
    image_url?: string;
    business_type_id?: string;
    category: string;
    created_at?: string;
    updated_at?: string;
}

export interface MasterProductRequest {
    id: string;
    shop_id: string;
    shop_name?: string;
    requested_by_user_id?: string;
    requested_name: string;
    requested_brand?: string;
    requested_barcode?: string;
    requested_category?: string;
    requested_description?: string;
    requested_image_url?: string;
    status: 'pending' | 'approved' | 'rejected';
    admin_notes?: string;
    created_at?: string;
    updated_at?: string;
}

export interface CreateMasterProductPayload {
    name: string;
    brand?: string;
    barcode?: string;
    description?: string;
    image_url?: string;
    category: string;
}

export interface CreateProductRequestPayload {
    requested_name: string;
    requested_brand?: string;
    requested_barcode?: string;
    requested_category?: string;
    requested_description?: string;
}

export interface ApproveProductRequestPayload {
    name?: string;
    brand?: string;
    barcode?: string;
    category?: string;
    description?: string;
    image_url?: string;
    admin_notes?: string;
}
