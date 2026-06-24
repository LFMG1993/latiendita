-- ==========================================
-- 1.1 SESSIONS & SECURITY / SESIONES Y SEGURIDAD
-- ==========================================
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    fingerprint VARCHAR(255) NOT NULL,
    ip_address VARCHAR(50),
    user_agent TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE login_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL,
    ip_address VARCHAR(50) NOT NULL,
    fingerprint VARCHAR(255),
    success BOOLEAN DEFAULT FALSE,
    attempted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 1.2 AUDIT / AUDITORÍA
-- ==========================================
CREATE SCHEMA IF NOT EXISTS audit;

CREATE TABLE audit.logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    shop_id UUID,
    action VARCHAR(50) NOT NULL,
    table_name VARCHAR(100) NOT NULL,
    old_data JSONB,
    new_data JSONB,
    ip_address VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
