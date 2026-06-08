-- ==========================================
-- 12A. MASTER PRODUCT REQUESTS
-- Solicitudes de tenderos para agregar productos al catálogo maestro
-- ==========================================
CREATE TABLE IF NOT EXISTS master_product_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    requested_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    requested_name VARCHAR(255) NOT NULL,
    requested_brand VARCHAR(100),
    requested_barcode VARCHAR(100),
    requested_category VARCHAR(100),
    requested_description TEXT,
    requested_image_url TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending | approved | rejected
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_product_requests_shop ON master_product_requests(shop_id);
CREATE INDEX idx_product_requests_status ON master_product_requests(status);
