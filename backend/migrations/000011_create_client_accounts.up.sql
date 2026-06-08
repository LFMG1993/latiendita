-- ==========================================
-- 10. DEBT PAYMENTS / ABONOS DE DEUDA
-- ==========================================
CREATE TABLE debt_payment_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    client_name VARCHAR(255) NOT NULL,
    client_phone VARCHAR(50),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    amount NUMERIC(12, 2) NOT NULL,
    payment_method_id UUID REFERENCES payment_methods(id) ON DELETE SET NULL,
    payment_method_name VARCHAR(255) NOT NULL,
    voucher_number VARCHAR(100) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_debt_payment_requests_client ON debt_payment_requests(client_id);
