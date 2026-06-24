-- ==========================================
-- 6. SUPPLIERS / PROVEEDORES
-- ==========================================
CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    phone VARCHAR(50),
    email VARCHAR(255),
    purchase_count INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 6B. PURCHASES / COMPRAS
-- ==========================================
CREATE TABLE purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
    supplier_name VARCHAR(255) NOT NULL,
    invoice_number VARCHAR(100),
    internal_invoice_number VARCHAR(100) NOT NULL,
    total NUMERIC(12, 2) NOT NULL,
    purchased_by_employee_id UUID REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (shop_id, internal_invoice_number)
);

CREATE TABLE purchase_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    purchase_id UUID NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
    item_type VARCHAR(50) NOT NULL CHECK (item_type IN ('ingredient', 'product')),
    ingredient_id UUID REFERENCES ingredients(id) ON DELETE SET NULL,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    purchase_unit VARCHAR(50) NOT NULL,
    quantity NUMERIC(12, 3) NOT NULL,
    unit_cost NUMERIC(12, 2) NOT NULL,
    consumption_units_per_purchase_unit NUMERIC(12, 3) NOT NULL,
    supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
    supplier_name VARCHAR(255)
);
