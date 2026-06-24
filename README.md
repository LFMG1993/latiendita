# La Tiendita - Plataforma SaaS Freemium

**La Tiendita** es una plataforma SaaS (Software as a Service) diseñada para digitalizar y automatizar las operaciones diarias de pequeños y medianos negocios. Permite a los dueños de negocios gestionar su inventario, punto de venta (POS), personal, finanzas y clientes desde un solo panel de control unificado.

## 🚀 Arquitectura Técnica

El proyecto está diseñado bajo un patrón **Multi-Tenancy** (Múltiples inquilinos) aislando de manera estricta los privilegios y accesos para garantizar seguridad y rendimiento:

- **Frontend:** React + Vite + TypeScript. (Single Page Application optimizada con soporte PWA).
- **Backend:** API REST desarrollada en **Go (Golang)**.
- **Seguridad:** Autenticación por Cookies `HttpOnly` y Control de Acceso Basado en Roles (RBAC).

## 📂 Estructura del Frontend (Domain-Driven Design)

Para mantener la base de código escalable, el Frontend está estructurado en 5 dominios principales:

1. **`landing`**: Página B2B pública y flujo de registro SaaS (Onboarding).
2. **`shop`**: Panel operativo del negocio (POS, Inventario, Reportes, Personal).
3. **`shopPublic`**: Portal B2C para los clientes finales (Catálogo de productos, pago de deudas).
4. **`admin`**: Panel exclusivo del Super Administrador (Métricas globales, gestión de negocios).
5. **`shared`**: Componentes, servicios y lógicas comunes.

## 🛠️ Instalación y Desarrollo Local

1. Instala las dependencias usando pnpm:
   ```bash
   pnpm install
   ```

2. Configura las variables de entorno creando un archivo `.env.local`:
   ```env
   VITE_API_BASE_URL=http://localhost:8080/api
   ```

3. Inicia el servidor de desarrollo en modo caliente (HMR):
   ```bash
   pnpm dev
   ```

## 📖 Documentación Adicional

Para más detalles sobre la arquitectura interna y decisiones de diseño, consulta el archivo `docs/architecture.md`.

---
*Desarrollado para empoderar y modernizar negocios.*
