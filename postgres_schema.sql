-- ===========================================================================
-- POSTGRESQL SCHEMA FOR "LA TIENDITA" (ICE CREAM SHOP SAAS / MULTI-TENANT)
-- ESQUEMA POSTGRESQL PARA "LA TIENDITA" (SAAS DE HELADERÍA / MULTI-INQUILINO)
-- ===========================================================================
-- This schema represents a robust relational translation of the Firestore
-- document models found in the codebase.
-- Este esquema representa una traducción relacional robusta de los modelos
-- de documentos de Firestore encontrados en el código base.
-- ===========================================================================

-- Enable UUID extension / Habilitar la extensión UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. USERS & PROFILES / USUARIOS Y PERFILES
-- ==========================================
-- Stores the users of the system (Owners, Employees, SuperAdmins, Clients).
-- Almacena los usuarios del sistema (Dueños, Empleados, Superadmins, Clientes).
-- We use VARCHAR(255) for the primary key 'id' to support Firebase auth UIDs.
-- Usamos VARCHAR(255) para la clave primaria 'id' para soportar los UIDs de Firebase Auth.
CREATE TABLE users (
    id VARCHAR(255) PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    identify VARCHAR(50), -- Document ID e.g. DNI/CC / Documento de Identificación ej. DNI/CC
    document_id VARCHAR(50), -- Unique document for clients / Documento único para clientes
    phone VARCHAR(50),
    role VARCHAR(50) DEFAULT 'client' CHECK (role IN ('owner', 'employee', 'superAdmin', 'client')),
    role_id UUID, -- References custom role if needed (assigned in shop) / Referencia al rol personalizado si es necesario (asignado en la tienda)
    photo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 1B. CLIENT ACCOUNTS PER SHOP / CUENTAS DE CLIENTE POR TIENDA (CRÉDITOS Y FIADOS POR HELADERÍA)
-- ==========================================
-- This allows the same client to have independent credit, debt and credit limits
-- in different shops (multi-tenancy isolation).
-- Esto permite que un mismo cliente pueda tener crédito, deuda y límite de deuda
-- independientes en diferentes tiendas (aislamiento de multi-tenancy).
CREATE TABLE client_shop_accounts (
    shop_id UUID NOT NULL REFERENCES ice_cream_shops(id) ON DELETE CASCADE,
    client_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    credits NUMERIC(12, 2) DEFAULT 0.00, -- Client credit balance in this specific shop / Saldo a favor en esta heladería específica
    debt NUMERIC(12, 2) DEFAULT 0.00, -- Client debt balance in this specific shop / Saldo en contra (deuda) en esta heladería específica
    is_credit_enabled BOOLEAN DEFAULT FALSE, -- Whether credit/fiat is enabled for this client in this shop / Si la heladería habilitó fiado para este cliente
    credit_limit NUMERIC(12, 2) DEFAULT 0.00, -- Max debt allowed by this shop for this client / Límite máximo de deuda permitido por esta heladería
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (shop_id, client_id)
);

-- ==========================================
-- 2. ICE CREAM SHOPS / HELADERÍAS
-- ==========================================
-- Multi-tenant configuration for each shop.
-- Configuración multi-inquilino para cada heladería.
CREATE TABLE ice_cream_shops (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    address TEXT,
    photo_url TEXT,
    whatsapp VARCHAR(50),
    owner_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE RESTRICT, -- Owner user id / ID del usuario propietario
    timezone VARCHAR(100) DEFAULT 'America/Bogota' NOT NULL,
    
    -- Branding / Theme config / Configuración de Marca y Tema
    theme_primary_color VARCHAR(7) DEFAULT '#000000', -- Branding theme primary color (hex code) / Color primario del tema de marca (código hex)
    theme_secondary_color VARCHAR(7) DEFAULT '#ffffff', -- Branding theme secondary color (hex code) / Color secundario del tema de marca (código hex)
    theme_logo_url TEXT, -- URL for header/sidebar logo / URL específica para el logo del header/sidebar
    
    -- Terminology localization / Localización de la terminología
    terminology_shop_label VARCHAR(100) DEFAULT 'Heladería', -- Customized label for 'Shop' / Etiqueta personalizada para 'Heladería'
    terminology_product_label VARCHAR(100) DEFAULT 'Producto', -- Customized label for 'Product' / Etiqueta personalizada para 'Producto'
    
    -- Feature flags and active modules stored as JSONB for flexiblity
    -- Módulos activos y banderas de características guardados como JSONB para flexibilidad
    modules JSONB DEFAULT '{}'::jsonb, -- e.g., {"sales": true} / ej., {"sales": true}
    features JSONB DEFAULT '{}'::jsonb, -- e.g., {"permissionId": true} / ej., {"permissionId": true}
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 3. SHOP MEMBERSHIP & PERMISSIONS / MIEMBROS Y PERMISOS DE HELADERÍA
-- ==========================================
-- Links users to shops with specific roles/permissions.
-- Relaciona usuarios con heladerías con roles y permisos específicos.
CREATE TABLE shop_members (
    shop_id UUID REFERENCES ice_cream_shops(id) ON DELETE CASCADE,
    user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID, -- References a specific custom role in the shop / Referencia a un rol personalizado específico en la tienda
    role VARCHAR(50) NOT NULL CHECK (role IN ('owner', 'employee')),
    permissions JSONB DEFAULT '{}'::jsonb, -- Custom permissions Map (permission_id -> boolean) / Mapa de permisos personalizados (permission_id -> boolean)
    added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (shop_id, user_id)
);

-- Work Schedules for employees / Horarios de trabajo para empleados
CREATE TABLE work_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES ice_cream_shops(id) ON DELETE CASCADE,
    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday, 1=Monday... / 0=Domingo, 1=Lunes...
    start_time TIME NOT NULL, -- Start time e.g., "15:00" / Hora de inicio ej., "15:00"
    end_time TIME NOT NULL, -- End time e.g., "22:00" / Hora de fin ej., "22:00"
    UNIQUE (shop_id, user_id, day_of_week)
);

-- Work Schedule Exceptions (e.g. holidays or days off) / Excepciones de horarios (ej. festivos o días libres)
CREATE TABLE schedule_exceptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES ice_cream_shops(id) ON DELETE CASCADE,
    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    exception_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    UNIQUE (shop_id, user_id, exception_date)
);

-- ==========================================
-- 4. ROLES & PERMISSIONS DEFINITION / DEFINICIÓN DE ROLES Y PERMISOS
-- ==========================================
-- Table for storing standard system permissions
-- Tabla para almacenar los permisos estándar del sistema
CREATE TABLE permissions (
    id VARCHAR(100) PRIMARY KEY, -- e.g. "manage_inventory", "view_reports" / ej., "manage_inventory", "view_reports"
    name VARCHAR(255) NOT NULL,
    description TEXT
);

-- Custom roles defined inside a shop / Roles personalizados definidos dentro de una heladería
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES ice_cream_shops(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (shop_id, name)
);

-- Many-to-many relationship linking custom roles and permissions
-- Relación muchos a muchos entre roles y permisos
CREATE TABLE role_permissions (
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    permission_id VARCHAR(100) REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- Add Foreign Key constraint for shop_members role_id
-- Añadir restricción de clave foránea para role_id en shop_members
ALTER TABLE shop_members 
ADD CONSTRAINT fk_shop_members_role 
FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE SET NULL;

-- ==========================================
-- 5. INVENTORY & RECIPES / INVENTARIO Y RECETAS
-- ==========================================
-- Raw ingredients used in recipes.
-- Ingredientes crudos utilizados en las recetas.
CREATE TABLE ingredients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES ice_cream_shops(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL, -- e.g. 'Helados', 'Toppings' / ej. 'Helados', 'Toppings'
    purchase_unit VARCHAR(50) NOT NULL, -- e.g. 'Kilogram', 'Box' / ej. 'Kilogramo', 'Caja'
    consumption_unit VARCHAR(50) NOT NULL, -- e.g. 'gram', 'unit' / ej. 'gramo', 'unidad'
    consumption_units_per_purchase_unit NUMERIC(12, 3) NOT NULL, -- conversion factor / factor de conversión
    stock NUMERIC(12, 3) DEFAULT 0.000, -- current stock in consumption units / inventario actual en unidades de consumo
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Finished products that are sold to customers.
-- Productos terminados que se venden a los clientes.
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES ice_cream_shops(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    price NUMERIC(12, 2) NOT NULL, -- Retail price / Precio de venta al público
    category VARCHAR(100) NOT NULL, -- Product category / Categoría del producto
    cost NUMERIC(12, 2) DEFAULT 0.00, -- Direct cost or calculated cost / Costo directo o costo calculado
    stock NUMERIC(12, 3) DEFAULT 0.000, -- For non-recipe items (e.g. bottled water) / Para artículos sin receta (ej. agua embotellada)
    image_url TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Many-to-many link representing Recipes: Products made of multiple ingredients
-- Relación muchos a muchos que representa recetas: productos compuestos por múltiples ingredientes
CREATE TABLE product_recipes (
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    ingredient_id UUID REFERENCES ingredients(id) ON DELETE CASCADE,
    quantity NUMERIC(12, 3) NOT NULL, -- Quantity in ingredient's consumption unit / Cantidad en la unidad de consumo del ingrediente
    PRIMARY KEY (product_id, ingredient_id)
);

-- ==========================================
-- 6. SUPPLIERS & PURCHASES / PROVEEDORES Y COMPRAS
-- ==========================================
-- Suppliers registry / Registro de proveedores
CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES ice_cream_shops(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    phone VARCHAR(50),
    email VARCHAR(255),
    purchase_count INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Purchase invoices / Facturas de compra
CREATE TABLE purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES ice_cream_shops(id) ON DELETE CASCADE,
    supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
    supplier_name VARCHAR(255) NOT NULL, -- Snapshot of supplier name / Copia del nombre del proveedor
    invoice_number VARCHAR(100),
    internal_invoice_number VARCHAR(100) NOT NULL, -- Auto-generated unique tracking ID / ID único auto-generado para seguimiento
    total NUMERIC(12, 2) NOT NULL,
    purchased_by_employee_id VARCHAR(255) REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (shop_id, internal_invoice_number)
);

-- Items included in a purchase / Artículos incluidos en una compra
CREATE TABLE purchase_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    purchase_id UUID NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
    item_type VARCHAR(50) NOT NULL CHECK (item_type IN ('ingredient', 'product')),
    ingredient_id UUID REFERENCES ingredients(id) ON DELETE SET NULL,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL, -- Item name snapshot / Copia del nombre del artículo
    purchase_unit VARCHAR(50) NOT NULL,
    quantity NUMERIC(12, 3) NOT NULL, -- Purchased quantity / Cantidad comprada
    unit_cost NUMERIC(12, 2) NOT NULL, -- Cost per purchase unit / Costo por unidad de compra
    consumption_units_per_purchase_unit NUMERIC(12, 3) NOT NULL,
    supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
    supplier_name VARCHAR(255)
);

-- ==========================================
-- 7. CASH REGISTER & EXPENSES / CAJA REGISTRADORA Y GASTOS
-- ==========================================
-- Cash register sessions / Sesiones de caja registradora
CREATE TABLE cash_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES ice_cream_shops(id) ON DELETE CASCADE,
    employee_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    employee_name VARCHAR(255) NOT NULL, -- Denormalized name / Nombre denormalizado
    start_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'closed')),
    opening_balance NUMERIC(12, 2) NOT NULL,
    closing_balance NUMERIC(12, 2),
    
    -- Calculated summary statistics upon closure / Estadísticas resumidas calculadas al cierre
    cash_sales NUMERIC(12, 2) DEFAULT 0.00,
    transfer_sales NUMERIC(12, 2) DEFAULT 0.00,
    total_sales NUMERIC(12, 2) DEFAULT 0.00,
    total_expenses NUMERIC(12, 2) DEFAULT 0.00,
    unregistered_sales NUMERIC(12, 2) DEFAULT 0.00, -- Difference / Surplus (sobrantes) / Diferencia / Sobrantes
    expected_cash_in_box NUMERIC(12, 2) DEFAULT 0.00, -- opening + cash_sales - expenses + unregistered / saldo inicial + ventas efectivo - gastos + sobrantes
    difference NUMERIC(12, 2) DEFAULT 0.00, -- closing - expected / saldo final - esperado
    notes TEXT
);

-- Individual expenses logged during a cash register session or generally
-- Gastos individuales registrados durante una sesión de caja o de manera general
CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES ice_cream_shops(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('operacional', 'servicios', 'salarios', 'marketing', 'otro')),
    recorded_by_employee_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    session_id UUID REFERENCES cash_sessions(id) ON DELETE SET NULL,
    owner_id VARCHAR(255) REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Session expense snapshot list for quick caching in cash_sessions
-- Lista de instantánea de gastos de sesión para almacenamiento rápido en cash_sessions
CREATE TABLE cash_session_expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES cash_sessions(id) ON DELETE CASCADE,
    expense_type VARCHAR(50) NOT NULL CHECK (expense_type IN ('purchase', 'operational')),
    description TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL
);

-- ==========================================
-- 8. PAYMENT METHODS & PROMOTIONS / MÉTODOS DE PAGO Y PROMOCIONES
-- ==========================================
CREATE TABLE payment_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES ice_cream_shops(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL, -- e.g., 'Cash', 'Nequi', 'Card' / ej., 'Efectivo', 'Nequi', 'Tarjeta'
    type VARCHAR(50) NOT NULL CHECK (type IN ('cash', 'electronic', 'credit')),
    enabled BOOLEAN DEFAULT TRUE,
    account_details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (shop_id, name)
);

-- Promotions definitions / Definiciones de promociones
CREATE TABLE promotions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES ice_cream_shops(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) DEFAULT 'bundle' CHECK (type = 'bundle'),
    price NUMERIC(12, 2) NOT NULL,
    active_days INT[] NOT NULL, -- e.g., [0,1,2,3,4,5,6] representing Sunday-Saturday / ej., [0,1,2,3,4,5,6] representa Domingo-Sábado
    is_enabled BOOLEAN DEFAULT TRUE,
    cost NUMERIC(12, 2) DEFAULT 0.00,
    profit NUMERIC(12, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Items included in a promotion / Artículos incluidos en una promoción
CREATE TABLE promotion_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    promotion_id UUID NOT NULL REFERENCES promotions(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    product_name VARCHAR(255) NOT NULL, -- Denormalized for rendering / Denormalizado para visualización
    quantity NUMERIC(12, 3) NOT NULL
);

-- ==========================================
-- 9. SALES & POINT OF SALE (POS) / VENTAS Y PUNTO DE VENTA (POS)
-- ==========================================
CREATE TABLE sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES ice_cream_shops(id) ON DELETE CASCADE,
    session_id UUID REFERENCES cash_sessions(id) ON DELETE SET NULL,
    total NUMERIC(12, 2) NOT NULL,
    employee_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    employee_name VARCHAR(255) NOT NULL,
    client_id VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL,
    client_name VARCHAR(255),
    pending_debt NUMERIC(12, 2) DEFAULT 0.00, -- Amount added to client's debt / Monto añadido a la deuda del cliente
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Individual items sold / Artículos individuales vendidos
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

-- Tracks exact ingredients deducted from inventory per sale item (snapshot)
-- Registra los ingredientes exactos descontados del inventario por artículo vendido (instantánea)
CREATE TABLE sale_item_ingredients_used (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sale_item_id UUID NOT NULL REFERENCES sale_items(id) ON DELETE CASCADE,
    ingredient_id UUID REFERENCES ingredients(id) ON DELETE SET NULL,
    quantity NUMERIC(12, 3) NOT NULL -- Quantity consumed / Cantidad consumida
);

-- Allows multiple payment methods per sale transaction
-- Permite múltiples métodos de pago por transacción de venta
CREATE TABLE sale_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    method_id UUID REFERENCES payment_methods(id) ON DELETE SET NULL,
    method_name VARCHAR(255) NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('cash', 'electronic', 'credit'))
);

-- ==========================================
-- 10. DEBT REPAYMENTS / ABONOS Y PAGOS DE DEUDAS
-- ==========================================
CREATE TABLE debt_payment_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    client_name VARCHAR(255) NOT NULL,
    client_phone VARCHAR(50),
    shop_id UUID NOT NULL REFERENCES ice_cream_shops(id) ON DELETE CASCADE,
    amount NUMERIC(12, 2) NOT NULL,
    payment_method_id UUID REFERENCES payment_methods(id) ON DELETE SET NULL,
    payment_method_name VARCHAR(255) NOT NULL,
    voucher_number VARCHAR(100) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 11. ONLINE/CLIENT ORDERS / PEDIDOS ONLINE Y DE CLIENTES
-- ==========================================
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES ice_cream_shops(id) ON DELETE CASCADE,
    client_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    client_name VARCHAR(255) NOT NULL,
    client_phone VARCHAR(50),
    total_amount NUMERIC(12, 2) NOT NULL,
    total_items NUMERIC(12, 3) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'preparing', 'ready', 'delivered', 'cancelled')),
    payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('cash', 'credit', 'electronic')),
    used_credits NUMERIC(12, 2) DEFAULT 0.00,
    pending_debt NUMERIC(12, 2) DEFAULT 0.00,
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    product_name VARCHAR(255) NOT NULL,
    quantity NUMERIC(12, 3) NOT NULL,
    price_at_purchase NUMERIC(12, 2) NOT NULL
);

-- ===========================================================================
-- INDEXES FOR PERFORMANCE OPTIMIZATION
-- ÍNDICES PARA OPTIMIZACIÓN DE RENDIMIENTO
-- ===========================================================================
CREATE INDEX idx_products_shop ON products(shop_id);
CREATE INDEX idx_ingredients_shop ON ingredients(shop_id);
CREATE INDEX idx_sales_shop_date ON sales(shop_id, created_at DESC);
CREATE INDEX idx_orders_shop_status ON orders(shop_id, status);
CREATE INDEX idx_debt_payment_requests_client ON debt_payment_requests(client_id);
CREATE INDEX idx_cash_sessions_shop_status ON cash_sessions(shop_id, status);
CREATE INDEX idx_expenses_shop_date ON expenses(shop_id, created_at DESC);
CREATE INDEX idx_client_shop_accounts_client ON client_shop_accounts(client_id);
