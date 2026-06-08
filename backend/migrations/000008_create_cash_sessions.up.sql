-- ==========================================
-- 7. CASH REGISTER / CAJA REGISTRADORA
-- ==========================================
CREATE TABLE cash_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    employee_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    employee_name VARCHAR(255) NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'closed')),
    opening_balance NUMERIC(12, 2) NOT NULL,
    closing_balance NUMERIC(12, 2),
    cash_sales NUMERIC(12, 2) DEFAULT 0.00,
    transfer_sales NUMERIC(12, 2) DEFAULT 0.00,
    total_sales NUMERIC(12, 2) DEFAULT 0.00,
    total_expenses NUMERIC(12, 2) DEFAULT 0.00,
    unregistered_sales NUMERIC(12, 2) DEFAULT 0.00,
    expected_cash_in_box NUMERIC(12, 2) DEFAULT 0.00,
    difference NUMERIC(12, 2) DEFAULT 0.00,
    notes TEXT
);

CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('operacional', 'servicios', 'salarios', 'marketing', 'otro')),
    recorded_by_employee_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    session_id UUID REFERENCES cash_sessions(id) ON DELETE SET NULL,
    owner_id VARCHAR(255) REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE cash_session_expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES cash_sessions(id) ON DELETE CASCADE,
    expense_type VARCHAR(50) NOT NULL CHECK (expense_type IN ('purchase', 'operational')),
    description TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL
);

CREATE INDEX idx_cash_sessions_shop_status ON cash_sessions(shop_id, status);
CREATE INDEX idx_expenses_shop_date ON expenses(shop_id, created_at DESC);
