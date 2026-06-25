-- ==========================================
-- 12. MASTER CATALOG
-- Catálogo maestro global gestionado por los Super Administradores
-- ==========================================
CREATE TABLE IF NOT EXISTS master_products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    brand VARCHAR(100),
    barcode VARCHAR(100) UNIQUE,
    description TEXT,
    image_url TEXT,
    business_type_id UUID REFERENCES business_types(id) ON DELETE SET NULL,
    category VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_master_products_name ON master_products(name);
CREATE INDEX idx_master_products_barcode ON master_products(barcode);

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
