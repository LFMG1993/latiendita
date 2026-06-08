-- ==========================================
-- 4. CUSTOM ROLES / ROLES PERSONALIZADOS
-- ==========================================
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (shop_id, name)
);

-- Many-to-many: roles <-> permissions
CREATE TABLE role_permissions (
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    permission_id VARCHAR(100) REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- Add FK from shop_members.role_id -> roles.id
ALTER TABLE shop_members
    ADD CONSTRAINT fk_shop_members_role
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE SET NULL;
