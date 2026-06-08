-- ==========================================
-- 9. SALES / VENTAS (POS)
-- ==========================================
CREATE TABLE sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    session_id UUID REFERENCES cash_sessions(id) ON DELETE SET NULL,
    total NUMERIC(12, 2) NOT NULL,
    employee_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    employee_name VARCHAR(255) NOT NULL,
    client_id VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL,
    client_name VARCHAR(255),
    pending_debt NUMERIC(12, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sale_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    product_name VARCHAR(255) NOT NULL,
    quantity NUMERIC(12, 3) NOT NULL,
    unit_price NUMERIC(12, 2) NOT NULL,
    is_promotion BOOLEAN DEFAULT FALSE,
    promotion_id UUID REFERENCES promotions(id) ON DELETE SET NULL
);

CREATE TABLE sale_item_ingredients_used (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sale_item_id UUID NOT NULL REFERENCES sale_items(id) ON DELETE CASCADE,
    ingredient_id UUID REFERENCES ingredients(id) ON DELETE SET NULL,
    quantity NUMERIC(12, 3) NOT NULL
);

CREATE TABLE sale_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    method_id UUID REFERENCES payment_methods(id) ON DELETE SET NULL,
    method_name VARCHAR(255) NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('cash', 'electronic', 'credit'))
);

CREATE INDEX idx_sales_shop_date ON sales(shop_id, created_at DESC);
