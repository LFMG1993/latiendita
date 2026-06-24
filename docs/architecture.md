# Arquitectura de La Tiendita SaaS

Este documento explica la estructura fundamental del proyecto, cómo interactúa el Frontend (React/Vite) con el Backend (Go), y los patrones arquitectónicos utilizados para mantener un código limpio y escalable.

## 1. Patrón Multi-Tenancy (SaaS)
La aplicación está diseñada bajo un modelo **SaaS Freemium**. Esto significa que existe un único Backend y un único Frontend, pero soporta múltiples tiendas o "Negocios" (Tenants) simultáneamente.

### Roles Principales
- **Super Admin (`super_admin`)**: El dueño de la plataforma (tú). Tiene acceso a métricas globales y creación/aprobación de nuevos negocios.
- **Dueño (`owner`)**: El dueño de un negocio específico. Tiene permisos totales sobre su propia tienda (inventario, POS, reportes, personal).
- **Cliente (`client`)**: El cliente final que compra en las tiendas. Tiene un portal B2C propio para ver sus facturas y deudas.

## 2. Backend (Go)
El backend está escrito en **Go (Golang)**. Es el único responsable de la lógica de negocio, reglas de seguridad y conexión a la base de datos (PostgreSQL u otro motor relacional que utilices).

### Autenticación y Seguridad
- **Cookies `HttpOnly`**: La autenticación no usa localStorage para los tokens sensibles. El backend emite una Cookie segura `HttpOnly` tras un `/login` exitoso. El navegador envía esta cookie automáticamente en todas las peticiones a `/api`.
- **Endpoints Protegidos**: Cada endpoint en Go valida la sesión y comprueba que el usuario pertene a la tienda que intenta modificar.

### Respuestas (Snake Case)
Go envía las respuestas en formato `snake_case` (ej. `first_name`, `document_id`). Esto es un estándar en APIs REST.

## 3. Frontend (React + Vite + TypeScript)
El Frontend es una Single Page Application (SPA) extremadamente rápida gracias a Vite y PWA.

### Mapeo de Datos
Dado que Go envía `snake_case`, el frontend tiene la responsabilidad de **mapear** esos datos a `camelCase` (ej. `firstName`, `documentId`) antes de inyectarlos al estado global, para cumplir con las convenciones de JavaScript/TypeScript. Esto ocurre principalmente en los archivos de la capa de Servicios.

### Arquitectura por Dominios (Domain-Driven Design)
Para evitar el "Código Espagueti", el frontend está dividido estrictamente en 5 grandes dominios. Esta misma división aplica tanto para **Rutas**, **Componentes** y **Servicios**:

1. **`landing` (Público B2B)**: 
   - La página web principal para captar negocios y hacer el onboarding (registro).
   - Servicios: `onboardingServices.ts`.
2. **`shopPublic` (Portal B2C de Clientes)**:
   - El catálogo público y el portal donde los clientes inician sesión para ver sus deudas y compras.
   - Servicios: `clientAuthServices.ts`, `clientAccountServices.ts`, etc.
3. **`shop` (Operativa del Tenant)**:
   - El núcleo del SaaS. El panel de control del dueño y del cajero (POS, Inventario, Reportes).
   - Servicios: `tenantShopServices.ts`, `posServices.ts`, `inventoryServices.ts`, etc.
4. **`admin` (Poder Absoluto)**:
   - Rutas y lógica exclusiva para el Super Administrador.
   - Servicios: `adminShopServices.ts`, `adminUserServices.ts`.
5. **`shared` (Lógica Común)**:
   - Elementos que se usan en más de un dominio (ej. Navbars, Botones, lógica de Auth genérica).
   - Servicios: `apiClient.ts`, `authServices.ts` (Login y getMe).

### Gestión del Estado (Zustand)
Utilizamos **Zustand** para manejar la sesión global (`authStore`) y el contexto activo de la tienda. 
- `useAuthStore.getState().user`: Fuente de la verdad sobre quién está navegando.

### Control de Acceso (RBAC en el Frontend)
La interfaz de usuario implementa RBAC (Role-Based Access Control) mediante el componente `<ProtectedRoute>`. 
Los permisos se cargan dinámicamente al iniciar sesión y el componente decide si renderiza una ruta (o botón) dependiendo de si el usuario posee la etiqueta de permiso requerida (ej. `pos_access` o `reports_view_sales`).

## 4. Notas para Desarrolladores Futuros
- **No mezclar dominios**: Nunca importes un servicio de `src/services/admin/` dentro de un componente en `src/components/shopPublic/`. Si dos dominios necesitan lo mismo, la función debe ir a `src/services/shared/`.
- **Cero Firebase**: Este proyecto fue migrado de Firebase a Go. Todas las referencias a tipos `Timestamp`, métodos como `.toDate()` o bases de datos NoSQL fueron erradicadas. Trata siempre las fechas como strings ISO 8601 o inicialízalas explícitamente (`new Date(fechaTexto)`).
- **Service Worker (PWA)**: Vite gestiona el SW. La actualización del SW está expuesta a través de `virtual:pwa-register/react` en `App.tsx`. Si necesitas notificaciones push en el futuro, cambia el modo en `vite.config.ts` de `generateSW` a `injectManifest` y crea tu propio `sw.js`.
