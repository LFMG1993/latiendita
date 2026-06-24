-- ==========================================
-- 2. SHOPS / TIENDAS
-- ==========================================
CREATE TABLE shops (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    address TEXT,
    photo_url TEXT,
    whatsapp VARCHAR(50),
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    timezone VARCHAR(100) DEFAULT 'America/Bogota' NOT NULL,
    business_type_id UUID REFERENCES business_types(id) ON DELETE SET NULL,
    -- Branding / Theme
    theme_primary_color VARCHAR(7) DEFAULT '#000000',
    theme_secondary_color VARCHAR(7) DEFAULT '#ffffff',
    theme_logo_url TEXT,
    -- Terminology
    terminology_shop_label VARCHAR(100) DEFAULT 'Tienda',
    terminology_product_label VARCHAR(100) DEFAULT 'Producto',
    -- Feature flags
    modules JSONB DEFAULT '{}'::jsonb,
    features JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 3. SHOP MEMBERSHIP / MIEMBROS DE TIENDA
-- ==========================================
CREATE TABLE shop_members (
    shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID,
    role VARCHAR(50) NOT NULL CHECK (role IN ('owner', 'employee')),
    permissions JSONB DEFAULT '{}'::jsonb,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (shop_id, user_id)
);

-- Work Schedules for employees / Horarios de trabajo para empleados
CREATE TABLE work_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    UNIQUE (shop_id, user_id, day_of_week)
);

-- Work Schedule Exceptions / Excepciones de horarios
CREATE TABLE schedule_exceptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    exception_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    UNIQUE (shop_id, user_id, exception_date)
);

-- Also add the client_shop_accounts table here since it needs shops
-- Tabla de cuentas de cliente por tienda (créditos y fiados)
CREATE TABLE client_shop_accounts (
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    credits NUMERIC(12, 2) DEFAULT 0.00,
    debt NUMERIC(12, 2) DEFAULT 0.00,
    is_credit_enabled BOOLEAN DEFAULT FALSE,
    credit_limit NUMERIC(12, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (shop_id, client_id)
);

-- Indexes / Índices
CREATE INDEX idx_shops_owner ON shops(owner_id);
CREATE INDEX idx_shop_members_user ON shop_members(user_id);
CREATE INDEX idx_client_shop_accounts_client ON client_shop_accounts(client_id);
