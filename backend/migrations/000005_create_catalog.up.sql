-- ==========================================
-- 5A. MASTER PRODUCTS / CATÁLOGO MAESTRO GLOBAL
-- ==========================================
CREATE TABLE master_products (
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

-- ==========================================
-- 5B. INGREDIENTS / INGREDIENTES
-- ==========================================
CREATE TABLE ingredients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    purchase_unit VARCHAR(50) NOT NULL,
    consumption_unit VARCHAR(50) NOT NULL,
    consumption_units_per_purchase_unit NUMERIC(12, 3) NOT NULL,
    stock NUMERIC(12, 3) DEFAULT 0.000,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 5C. PRODUCTS / PRODUCTOS
-- ==========================================
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    master_product_id UUID REFERENCES master_products(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    price NUMERIC(12, 2) NOT NULL,
    category VARCHAR(100) NOT NULL,
    cost NUMERIC(12, 2) DEFAULT 0.00,
    stock NUMERIC(12, 3) DEFAULT 0.000,
    image_url TEXT,
    description TEXT,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 5D. PRODUCT RECIPES / RECETAS DE PRODUCTOS
-- ==========================================
CREATE TABLE product_recipes (
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    ingredient_id UUID REFERENCES ingredients(id) ON DELETE CASCADE,
    quantity NUMERIC(12, 3) NOT NULL,
    PRIMARY KEY (product_id, ingredient_id)
);

-- Indexes / Índices
CREATE INDEX idx_products_shop ON products(shop_id);
CREATE INDEX idx_ingredients_shop ON ingredients(shop_id);
CREATE INDEX idx_products_master ON products(master_product_id);
CREATE INDEX idx_master_products_barcode ON master_products(barcode);
