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
    id VARCHAR(255) PRIMARY KEY, -- Auth system ID (Firebase UID) / ID del sistema de autenticación (Firebase UID)
    first_name VARCHAR(100) NOT NULL, -- First name of the user / Nombre del usuario
    last_name VARCHAR(100) NOT NULL, -- Last name of the user / Apellido del usuario
    email VARCHAR(255) UNIQUE NOT NULL, -- Email address / Dirección de correo electrónico
    identify VARCHAR(50), -- Document type or generic document number / Tipo de documento o número genérico
    document_id VARCHAR(50), -- Client identity card number / Número de cédula o documento del cliente
    phone VARCHAR(50), -- Contact phone number / Teléfono de contacto
    role VARCHAR(50) DEFAULT 'client' CHECK (role IN ('owner', 'employee', 'superAdmin', 'client')), -- System-wide user role / Rol global de usuario en el sistema
    role_id UUID, -- Global role ID if using custom roles / ID del rol global si se usan roles personalizados
    photo_url TEXT, -- Profile picture URL / URL de la foto de perfil
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, -- Account creation date / Fecha de creación de la cuenta
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP -- Account last update date / Fecha de última actualización de la cuenta
);

-- ==========================================
-- 1B. CLIENT ACCOUNTS PER SHOP / CUENTAS DE CLIENTE POR TIENDA (CRÉDITOS Y FIADOS POR HELADERÍA)
-- ==========================================
-- This allows the same client to have independent credit, debt and credit limits
-- in different shops (multi-tenancy isolation).
-- Esto permite que un mismo cliente pueda tener crédito, deuda y límite de deuda
-- independientes en diferentes tiendas (aislamiento de multi-tenancy).
CREATE TABLE client_shop_accounts (
    shop_id UUID NOT NULL REFERENCES ice_cream_shops(id) ON DELETE CASCADE, -- Shop ID reference / ID de la heladería de referencia
    client_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- Client ID reference / ID del cliente de referencia
    credits NUMERIC(12, 2) DEFAULT 0.00, -- Client credit balance in this shop / Saldo a favor en esta heladería específica
    debt NUMERIC(12, 2) DEFAULT 0.00, -- Client debt balance in this shop / Saldo en contra (deuda) en esta heladería específica
    is_credit_enabled BOOLEAN DEFAULT FALSE, -- If credit is enabled for this client in this shop / Si la heladería habilitó fiado para este cliente
    credit_limit NUMERIC(12, 2) DEFAULT 0.00, -- Max debt allowed by this shop for this client / Límite máximo de deuda permitido por esta heladería
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, -- Balances creation timestamp / Fecha de creación del registro de saldos
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, -- Balances last update timestamp / Fecha de última actualización de los saldos
    PRIMARY KEY (shop_id, client_id)
);

-- ==========================================
-- 2. ICE CREAM SHOPS / HELADERÍAS
-- ==========================================
-- Multi-tenant configuration for each shop.
-- Configuración multi-inquilino para cada heladería.
CREATE TABLE ice_cream_shops (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), -- Unique identifier of the shop / Identificador único de la heladería
    name VARCHAR(255) NOT NULL, -- Name of the shop / Nombre de la heladería
    address TEXT, -- Physical address / Dirección física
    photo_url TEXT, -- Banner or shop picture URL / URL del banner o foto de la tienda
    whatsapp VARCHAR(50), -- WhatsApp contact link or number / Número o enlace de contacto de WhatsApp
    owner_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE RESTRICT, -- User ID of the owner / ID del usuario dueño
    timezone VARCHAR(100) DEFAULT 'America/Bogota' NOT NULL, -- Timezone for sales and schedules / Zona horaria para ventas y horarios
    
    -- Branding / Theme config / Configuración de Marca y Tema
    theme_primary_color VARCHAR(7) DEFAULT '#000000', -- Brand primary color (hex code) / Color primario de marca (código hex)
    theme_secondary_color VARCHAR(7) DEFAULT '#ffffff', -- Brand secondary color (hex code) / Color secundario de marca (código hex)
    theme_logo_url TEXT, -- Header/sidebar logo URL / URL del logotipo para el header/sidebar
    
    -- Terminology localization / Localización de la terminología
    terminology_shop_label VARCHAR(100) DEFAULT 'Heladería', -- Translation/term for 'Shop' / Término personalizado para 'Heladería'
    terminology_product_label VARCHAR(100) DEFAULT 'Producto', -- Translation/term for 'Product' / Término personalizado para 'Producto'
    
    -- Feature flags and active modules stored as JSONB for flexiblity
    -- Módulos activos y banderas de características guardados como JSONB para flexibilidad
    modules JSONB DEFAULT '{}'::jsonb, -- Enabled SaaS modules / Módulos SaaS habilitados
    features JSONB DEFAULT '{}'::jsonb, -- Enabled feature flags / Banderas de características habilitadas
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, -- Shop creation timestamp / Fecha de creación de la heladería
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP -- Shop last update timestamp / Fecha de última actualización de la heladería
);

-- ==========================================
-- 3. SHOP MEMBERSHIP & PERMISSIONS / MIEMBROS Y PERMISOS DE HELADERÍA
-- ==========================================
-- Links users to shops with specific roles/permissions.
-- Relaciona usuarios con heladerías con roles y permisos específicos.
CREATE TABLE shop_members (
    shop_id UUID REFERENCES ice_cream_shops(id) ON DELETE CASCADE, -- Associated shop ID / ID de la heladería asociada
    user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE, -- Associated user ID / ID del usuario asociado
    role_id UUID, -- Associated shop-level role / Rol asociado a nivel de heladería
    role VARCHAR(50) NOT NULL CHECK (role IN ('owner', 'employee')), -- Standard member role in the shop / Rol estándar del miembro en la heladería
    permissions JSONB DEFAULT '{}'::jsonb, -- Specific permissions overrides / Anulaciones de permisos específicos
    added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, -- Date user was added as member / Fecha en la que el usuario fue añadido como miembro
    PRIMARY KEY (shop_id, user_id)
);

-- Work Schedules for employees / Horarios de trabajo para empleados
CREATE TABLE work_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), -- Schedule entry unique identifier / Identificador único de la entrada del horario
    shop_id UUID NOT NULL REFERENCES ice_cream_shops(id) ON DELETE CASCADE, -- Associated shop ID / ID de la heladería asociada
    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- Associated employee ID / ID del empleado asociado
    day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- Day of week (0=Sunday ... 6=Saturday) / Día de la semana (0=Domingo ... 6=Sábado)
    start_time TIME NOT NULL, -- Daily start working time / Hora diaria de inicio de labores
    end_time TIME NOT NULL, -- Daily end working time / Hora diaria de finalización de labores
    UNIQUE (shop_id, user_id, day_of_week)
);

-- Work Schedule Exceptions (e.g. holidays or days off) / Excepciones de horarios (ej. festivos o días libres)
CREATE TABLE schedule_exceptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), -- Exception entry unique identifier / Identificador único de la entrada de excepción
    shop_id UUID NOT NULL REFERENCES ice_cream_shops(id) ON DELETE CASCADE, -- Associated shop ID / ID de la heladería asociada
    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- Associated employee ID / ID del empleado asociado
    exception_date DATE NOT NULL, -- Date of the schedule exception / Fecha de la excepción de horario
    start_time TIME NOT NULL, -- Modified start working time / Hora modificada de inicio de labores
    end_time TIME NOT NULL, -- Modified end working time / Hora modificada de finalización de labores
    UNIQUE (shop_id, user_id, exception_date)
);

-- ==========================================
-- 4. ROLES & PERMISSIONS DEFINITION / DEFINICIÓN DE ROLES Y PERMISOS
-- ==========================================
-- Table for storing standard system permissions
-- Tabla para almacenar los permisos estándar del sistema
CREATE TABLE permissions (
    id VARCHAR(100) PRIMARY KEY, -- Unique code for permission / Código único de permiso
    name VARCHAR(255) NOT NULL, -- Friendly name of permission / Nombre descriptivo del permiso
    description TEXT -- Details about what it allows / Detalles sobre lo que permite
);

-- Custom roles defined inside a shop / Roles personalizados definidos dentro de una heladería
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), -- Role unique identifier / Identificador único del rol
    shop_id UUID NOT NULL REFERENCES ice_cream_shops(id) ON DELETE CASCADE, -- Associated shop ID / ID de la heladería asociada
    name VARCHAR(100) NOT NULL, -- Name of the custom role / Nombre del rol personalizado
    description TEXT, -- Details about the role / Detalles sobre el rol
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, -- Role creation timestamp / Fecha de creación del rol
    UNIQUE (shop_id, name)
);

-- Many-to-many relationship linking custom roles and permissions
-- Relación muchos a muchos entre roles y permisos
CREATE TABLE role_permissions (
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE, -- Associated role ID / ID del rol asociado
    permission_id VARCHAR(100) REFERENCES permissions(id) ON DELETE CASCADE, -- Associated permission ID / ID del permiso asociado
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
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), -- Ingredient unique identifier / Identificador único del ingrediente
    shop_id UUID NOT NULL REFERENCES ice_cream_shops(id) ON DELETE CASCADE, -- Associated shop ID / ID de la heladería asociada
    name VARCHAR(255) NOT NULL, -- Ingredient name / Nombre del ingrediente
    category VARCHAR(100) NOT NULL, -- Category of ingredient / Categoría del ingrediente
    purchase_unit VARCHAR(50) NOT NULL, -- Buying unit (e.g. Box, Kg) / Unidad de compra (ej. Caja, Kg)
    consumption_unit VARCHAR(50) NOT NULL, -- Recipe unit (e.g. Gram) / Unidad de consumo en receta (ej. Gramo)
    consumption_units_per_purchase_unit NUMERIC(12, 3) NOT NULL, -- Conversion factor between units / Factor de conversión entre unidades
    stock NUMERIC(12, 3) DEFAULT 0.000, -- Current stock in consumption units / Stock actual en unidades de consumo
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, -- Creation timestamp / Fecha de creación
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP -- Last update timestamp / Fecha de última actualización
);

-- Finished products that are sold to customers.
-- Productos terminados que se venden a los clientes.
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), -- Product unique identifier / Identificador único del producto
    shop_id UUID NOT NULL REFERENCES ice_cream_shops(id) ON DELETE CASCADE, -- Associated shop ID / ID de la heladería asociada
    name VARCHAR(255) NOT NULL, -- Product name / Nombre del producto
    price NUMERIC(12, 2) NOT NULL, -- Public sale price / Precio de venta al público
    category VARCHAR(100) NOT NULL, -- Category of product / Categoría del producto
    cost NUMERIC(12, 2) DEFAULT 0.00, -- Raw production or wholesale cost / Costo de producción o costo mayorista
    stock NUMERIC(12, 3) DEFAULT 0.000, -- Inventory for non-recipe items / Inventario para artículos sin receta
    image_url TEXT, -- Product image URL / URL de la imagen del producto
    description TEXT, -- Detailed product description / Descripción detallada del producto
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, -- Creation timestamp / Fecha de creación
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP -- Last update timestamp / Fecha de última actualización
);

-- Many-to-many link representing Recipes: Products made of multiple ingredients
-- Relación muchos a muchos que representa recetas: productos compuestos por múltiples ingredientes
CREATE TABLE product_recipes (
    product_id UUID REFERENCES products(id) ON DELETE CASCADE, -- Product ID reference / ID del producto de referencia
    ingredient_id UUID REFERENCES ingredients(id) ON DELETE CASCADE, -- Ingredient ID reference / ID del ingrediente de referencia
    quantity NUMERIC(12, 3) NOT NULL, -- Quantity of ingredient required / Cantidad de ingrediente requerida
    PRIMARY KEY (product_id, ingredient_id)
);

-- ==========================================
-- 6. SUPPLIERS & PURCHASES / PROVEEDORES Y COMPRAS
-- ==========================================
-- Suppliers registry / Registro de proveedores
CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), -- Supplier unique identifier / Identificador único del proveedor
    shop_id UUID NOT NULL REFERENCES ice_cream_shops(id) ON DELETE CASCADE, -- Associated shop ID / ID de la heladería asociada
    name VARCHAR(255) NOT NULL, -- Supplier name or company name / Nombre del proveedor o empresa
    contact_person VARCHAR(255), -- Name of the contact person / Nombre de la persona de contacto
    phone VARCHAR(50), -- Contact phone number / Teléfono de contacto
    email VARCHAR(255), -- Contact email address / Correo electrónico de contacto
    purchase_count INT DEFAULT 0, -- Total purchases made from this supplier / Total de compras realizadas a este proveedor
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP -- Supplier creation timestamp / Fecha de creación del proveedor
);

-- Purchase invoices / Facturas de compra
CREATE TABLE purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), -- Purchase unique identifier / Identificador único de la compra
    shop_id UUID NOT NULL REFERENCES ice_cream_shops(id) ON DELETE CASCADE, -- Associated shop ID / ID de la heladería asociada
    supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL, -- Supplier ID reference / ID del proveedor de referencia
    supplier_name VARCHAR(255) NOT NULL, -- Supplier name snapshot / Copia del nombre del proveedor
    invoice_number VARCHAR(100), -- Supplier invoice number / Número de factura del proveedor
    internal_invoice_number VARCHAR(100) NOT NULL, -- Internal tracking invoice code / Código de factura interno de seguimiento
    total NUMERIC(12, 2) NOT NULL, -- Total purchase amount / Monto total de la compra
    purchased_by_employee_id VARCHAR(255) REFERENCES users(id) ON DELETE RESTRICT, -- Employee ID who bought it / ID del empleado que realizó la compra
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, -- Purchase timestamp / Fecha de registro de la compra
    UNIQUE (shop_id, internal_invoice_number)
);

-- Items included in a purchase / Artículos incluidos en una compra
CREATE TABLE purchase_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), -- Purchase item unique identifier / Identificador único del ítem de compra
    purchase_id UUID NOT NULL REFERENCES purchases(id) ON DELETE CASCADE, -- Associated purchase ID / ID de la compra asociada
    item_type VARCHAR(50) NOT NULL CHECK (item_type IN ('ingredient', 'product')), -- Type of purchased item / Tipo de artículo comprado
    ingredient_id UUID REFERENCES ingredients(id) ON DELETE SET NULL, -- Associated ingredient ID / ID del ingrediente asociado
    product_id UUID REFERENCES products(id) ON DELETE SET NULL, -- Associated product ID / ID del producto asociado
    name VARCHAR(255) NOT NULL, -- Item name snapshot / Copia del nombre del artículo
    purchase_unit VARCHAR(50) NOT NULL, -- Purchase unit used / Unidad de compra utilizada
    quantity NUMERIC(12, 3) NOT NULL, -- Purchased quantity / Cantidad comprada
    unit_cost NUMERIC(12, 2) NOT NULL, -- Cost per purchase unit / Costo por unidad de compra
    consumption_units_per_purchase_unit NUMERIC(12, 3) NOT NULL, -- Conversion factor / Factor de conversión
    supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL, -- Associated supplier ID / ID del proveedor asociado
    supplier_name VARCHAR(255) -- Supplier name / Nombre del proveedor
);

-- ==========================================
-- 7. CASH REGISTER & EXPENSES / CAJA REGISTRADORA Y GASTOS
-- ==========================================
-- Cash register sessions / Sesiones de caja registradora
CREATE TABLE cash_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), -- Cash session unique identifier / Identificador único de la sesión de caja
    shop_id UUID NOT NULL REFERENCES ice_cream_shops(id) ON DELETE CASCADE, -- Associated shop ID / ID de la heladería asociada
    employee_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE RESTRICT, -- Employee who opened the session / Empleado que abrió la sesión
    employee_name VARCHAR(255) NOT NULL, -- Employee name snapshot / Copia del nombre del empleado
    start_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, -- Cash register open time / Fecha y hora de apertura de caja
    end_time TIMESTAMP WITH TIME ZONE, -- Cash register close time / Fecha y hora de cierre de caja
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'closed')), -- Session active state / Estado activo de la sesión
    opening_balance NUMERIC(12, 2) NOT NULL, -- Initial cash amount / Dinero inicial en caja
    closing_balance NUMERIC(12, 2), -- Counted cash at closure / Dinero final contado al cerrar
    
    -- Calculated summary statistics upon closure / Estadísticas resumidas calculadas al cierre
    cash_sales NUMERIC(12, 2) DEFAULT 0.00, -- Total cash sales registered / Total de ventas en efectivo registradas
    transfer_sales NUMERIC(12, 2) DEFAULT 0.00, -- Total electronic sales registered / Total de ventas electrónicas registradas
    total_sales NUMERIC(12, 2) DEFAULT 0.00, -- Sum of all sales / Suma de todas las ventas
    total_expenses NUMERIC(12, 2) DEFAULT 0.00, -- Sum of all operational expenses / Suma de todos los gastos operativos
    unregistered_sales NUMERIC(12, 2) DEFAULT 0.00, -- Cash surplus / Dinero sobrante no registrado
    expected_cash_in_box NUMERIC(12, 2) DEFAULT 0.00, -- Calculated box balance / Saldo teórico esperado en caja
    difference NUMERIC(12, 2) DEFAULT 0.00, -- Closing balance minus expected balance / Diferencia entre lo contado y lo esperado
    notes TEXT -- Closure observations / Observaciones del cierre
);

-- Individual expenses logged during a cash register session or generally
-- Gastos individuales registrados durante una sesión de caja o de manera general
CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), -- Expense unique identifier / Identificador único del gasto
    shop_id UUID NOT NULL REFERENCES ice_cream_shops(id) ON DELETE CASCADE, -- Associated shop ID / ID de la heladería asociada
    description TEXT NOT NULL, -- Reason for the expense / Motivo del gasto
    amount NUMERIC(12, 2) NOT NULL, -- Amount spent / Monto gastado
    category VARCHAR(50) NOT NULL CHECK (category IN ('operacional', 'servicios', 'salarios', 'marketing', 'otro')), -- Category of expense / Categoría del gasto
    recorded_by_employee_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE RESTRICT, -- Employee who registered it / Empleado que registró el gasto
    session_id UUID REFERENCES cash_sessions(id) ON DELETE SET NULL, -- Associated cash session / Sesión de caja asociada
    owner_id VARCHAR(255) REFERENCES users(id) ON DELETE RESTRICT, -- Associated owner ID / ID del dueño asociado
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP -- Expense timestamp / Fecha del gasto
);

-- Session expense snapshot list for quick caching in cash_sessions
-- Lista de instantánea de gastos de sesión para almacenamiento rápido en cash_sessions
CREATE TABLE cash_session_expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), -- Entry unique identifier / Identificador único de la entrada
    session_id UUID NOT NULL REFERENCES cash_sessions(id) ON DELETE CASCADE, -- Associated cash session / Sesión de caja asociada
    expense_type VARCHAR(50) NOT NULL CHECK (expense_type IN ('purchase', 'operational')), -- Type of session expense / Tipo de gasto de la sesión
    description TEXT NOT NULL, -- Brief details / Detalles breves
    amount NUMERIC(12, 2) NOT NULL -- Amount spent / Monto gastado
);

-- ==========================================
-- 8. PAYMENT METHODS & PROMOTIONS / MÉTODOS DE PAGO Y PROMOCIONES
-- ==========================================
CREATE TABLE payment_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), -- Payment method identifier / Identificador del método de pago
    shop_id UUID NOT NULL REFERENCES ice_cream_shops(id) ON DELETE CASCADE, -- Associated shop ID / ID de la heladería asociada
    name VARCHAR(255) NOT NULL, -- Display name of payment method / Nombre visible del método de pago
    type VARCHAR(50) NOT NULL CHECK (type IN ('cash', 'electronic', 'credit')), -- Cash, electronic or credit / Tipo: efectivo, electrónico o crédito
    enabled BOOLEAN DEFAULT TRUE, -- Active status of method / Estado activo del método
    account_details TEXT, -- Account details or notes / Detalles o notas de cuenta
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, -- Creation timestamp / Fecha de creación
    UNIQUE (shop_id, name)
);

-- Promotions definitions / Definiciones de promociones
CREATE TABLE promotions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), -- Promotion unique identifier / Identificador único de la promoción
    shop_id UUID NOT NULL REFERENCES ice_cream_shops(id) ON DELETE CASCADE, -- Associated shop ID / ID de la heladería asociada
    name VARCHAR(255) NOT NULL, -- Name of the promotion / Nombre de la promoción
    description TEXT, -- Promotion description / Descripción de la promoción
    type VARCHAR(50) DEFAULT 'bundle' CHECK (type = 'bundle'), -- Promotion structure type / Tipo de estructura de la promoción
    price NUMERIC(12, 2) NOT NULL, -- Promotional price / Precio de la promoción
    active_days INT[] NOT NULL, -- Active days array / Días activos de la semana
    is_enabled BOOLEAN DEFAULT TRUE, -- Is promotion active / Si la promoción está activa
    cost NUMERIC(12, 2) DEFAULT 0.00, -- Calculated total cost / Costo total calculado
    profit NUMERIC(12, 2) DEFAULT 0.00, -- Calculated estimated profit / Ganancia estimada calculada
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP -- Creation timestamp / Fecha de creación
);

-- Items included in a promotion / Artículos incluidos en una promoción
CREATE TABLE promotion_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), -- Promotion item unique identifier / Identificador único del artículo de promoción
    promotion_id UUID NOT NULL REFERENCES promotions(id) ON DELETE CASCADE, -- Associated promotion ID / ID de la promoción asociada
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE, -- Included product ID / ID del producto incluido
    product_name VARCHAR(255) NOT NULL, -- Included product name snapshot / Copia del nombre del producto incluido
    quantity NUMERIC(12, 3) NOT NULL -- Quantity of product included / Cantidad de producto incluida
);

-- ==========================================
-- 9. SALES & POINT OF SALE (POS) / VENTAS Y PUNTO DE VENTA (POS)
-- ==========================================
CREATE TABLE sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), -- Sale unique identifier / Identificador único de la venta
    shop_id UUID NOT NULL REFERENCES ice_cream_shops(id) ON DELETE CASCADE, -- Associated shop ID / ID de la heladería asociada
    session_id UUID REFERENCES cash_sessions(id) ON DELETE SET NULL, -- Associated cash session ID / ID de la sesión de caja asociada
    total NUMERIC(12, 2) NOT NULL, -- Sale total amount / Monto total de la venta
    employee_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE RESTRICT, -- Employee ID who made the sale / ID del empleado que realizó la venta
    employee_name VARCHAR(255) NOT NULL, -- Employee name snapshot / Copia del nombre del empleado
    client_id VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL, -- Client ID reference / ID del cliente de referencia
    client_name VARCHAR(255), -- Client name snapshot / Copia del nombre del cliente
    pending_debt NUMERIC(12, 2) DEFAULT 0.00, -- Amount added to client's debt / Monto añadido a la deuda del cliente
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP -- Sale creation timestamp / Fecha y hora de la venta
);

-- Individual items sold / Artículos individuales vendidos
CREATE TABLE sale_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), -- Sale item unique identifier / Identificador único del artículo de venta
    sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE, -- Associated sale ID / ID de la venta asociada
    product_id UUID REFERENCES products(id) ON DELETE SET NULL, -- Associated product ID / ID del producto asociado
    product_name VARCHAR(255) NOT NULL, -- Product name snapshot / Copia del nombre del producto
    quantity NUMERIC(12, 3) NOT NULL, -- Quantity sold / Cantidad vendida
    unit_price NUMERIC(12, 2) NOT NULL, -- Price sold at / Precio de venta unitario
    is_promotion BOOLEAN DEFAULT FALSE, -- True if sold as a bundle / Verdadero si se vendió en combo
    promotion_id UUID REFERENCES promotions(id) ON DELETE SET NULL -- Associated promotion ID / ID de la promoción asociada
);

-- Tracks exact ingredients deducted from inventory per sale item (snapshot)
-- Registra los ingredientes exactos descontados del inventario por artículo vendido (instantánea)
CREATE TABLE sale_item_ingredients_used (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), -- Record unique identifier / Identificador único del registro
    sale_item_id UUID NOT NULL REFERENCES sale_items(id) ON DELETE CASCADE, -- Associated sale item / Artículo de venta asociado
    ingredient_id UUID REFERENCES ingredients(id) ON DELETE SET NULL, -- Associated ingredient / Ingrediente asociado
    quantity NUMERIC(12, 3) NOT NULL -- Quantity consumed / Cantidad consumida
);

-- Allows multiple payment methods per sale transaction
-- Permite múltiples métodos de pago por transacción de venta
CREATE TABLE sale_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), -- Payment unique identifier / Identificador único de la línea de pago
    sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE, -- Associated sale ID / ID de la venta asociada
    method_id UUID REFERENCES payment_methods(id) ON DELETE SET NULL, -- Payment method ID reference / ID del método de pago de referencia
    method_name VARCHAR(255) NOT NULL, -- Payment method name snapshot / Copia del nombre del método de pago
    amount NUMERIC(12, 2) NOT NULL, -- Amount paid with this method / Monto pagado con este método
    type VARCHAR(50) NOT NULL CHECK (type IN ('cash', 'electronic', 'credit')) -- Payment type category / Categoría de tipo de pago
);

-- ==========================================
-- 10. DEBT REPAYMENTS / ABONOS Y PAGOS DE DEUDAS
-- ==========================================
CREATE TABLE debt_payment_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), -- Request unique identifier / Identificador único de la solicitud
    client_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- Associated client ID / ID del cliente asociado
    client_name VARCHAR(255) NOT NULL, -- Client name snapshot / Copia del nombre del cliente
    client_phone VARCHAR(50), -- Client contact phone / Teléfono de contacto del cliente
    shop_id UUID NOT NULL REFERENCES ice_cream_shops(id) ON DELETE CASCADE, -- Associated shop ID / ID de la heladería asociada
    amount NUMERIC(12, 2) NOT NULL, -- Repayment amount / Monto a abonar
    payment_method_id UUID REFERENCES payment_methods(id) ON DELETE SET NULL, -- Payment method ID / ID del método de pago
    payment_method_name VARCHAR(255) NOT NULL, -- Payment method name / Nombre del método de pago
    voucher_number VARCHAR(100) NOT NULL, -- Payment support receipt number / Número de comprobante de pago
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')), -- Request approval status / Estado de aprobación de la solicitud
    notes TEXT, -- Verification notes / Notas de verificación
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, -- Creation timestamp / Fecha de creación
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP -- Decision/update timestamp / Fecha de resolución o actualización
);

-- ==========================================
-- 11. ONLINE/CLIENT ORDERS / PEDIDOS ONLINE Y DE CLIENTES
-- ==========================================
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), -- Order unique identifier / Identificador único del pedido
    shop_id UUID NOT NULL REFERENCES ice_cream_shops(id) ON DELETE CASCADE, -- Associated shop ID / ID de la heladería asociada
    client_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- Client who placed the order / Cliente que realizó el pedido
    client_name VARCHAR(255) NOT NULL, -- Client name snapshot / Copia del nombre del cliente
    client_phone VARCHAR(50), -- Client contact phone / Teléfono de contacto del cliente
    total_amount NUMERIC(12, 2) NOT NULL, -- Order total price / Precio total del pedido
    total_items NUMERIC(12, 3) NOT NULL, -- Total count of products / Total de productos en el pedido
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'preparing', 'ready', 'delivered', 'cancelled')), -- Order dispatch status / Estado de despacho del pedido
    payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('cash', 'credit', 'electronic')), -- Payment method type / Categoría de método de pago
    used_credits NUMERIC(12, 2) DEFAULT 0.00, -- Credits used to cover part of the price / Saldo a favor usado
    pending_debt NUMERIC(12, 2) DEFAULT 0.00, -- Debt generated upon delivery / Deuda generada al entregar
    note TEXT, -- Customer notes / Notas adicionales del cliente
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, -- Order creation timestamp / Fecha y hora de creación
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP -- Last update timestamp / Fecha de última actualización
);

CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), -- Order item unique identifier / Identificador único del ítem del pedido
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE, -- Associated order ID / ID del pedido asociado
    product_id UUID REFERENCES products(id) ON DELETE SET NULL, -- Associated product ID / ID del producto asociado
    product_name VARCHAR(255) NOT NULL, -- Product name snapshot / Copia del nombre del producto
    quantity NUMERIC(12, 3) NOT NULL, -- Quantity ordered / Cantidad solicitada
    price_at_purchase NUMERIC(12, 2) NOT NULL -- Selling price at order time / Precio de venta al momento del pedido
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
