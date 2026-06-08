-- Enable UUID extension / Habilitar la extensión UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 0. BUSINESS TYPES / TIPOS DE NEGOCIO
-- ==========================================
CREATE TABLE business_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), -- Business type unique identifier / Identificador único del tipo de negocio
    name VARCHAR(100) NOT NULL, -- Name of the business type / Nombre del tipo de negocio
    description TEXT, -- Description of the business type / Descripción del tipo de negocio
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, -- Creation timestamp / Fecha de creación
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP -- Last update timestamp / Fecha de última actualización
);

-- ==========================================
-- 1. USERS & PROFILES / USUARIOS Y PERFILES
-- ==========================================
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
-- 4. ROLES & PERMISSIONS DEFINITION / DEFINICIÓN DE ROLES Y PERMISOS
-- ==========================================
CREATE TABLE permissions (
    id VARCHAR(100) PRIMARY KEY, -- Unique code for permission / Código único de permiso
    name VARCHAR(255) NOT NULL, -- Friendly name of permission / Nombre descriptivo del permiso
    description TEXT -- Details about what it allows / Detalles sobre lo que permite
);
