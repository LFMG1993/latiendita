# Documentación de Arquitectura - La Tiendita SaaS

## Resumen del Proyecto

**La Tiendita** es un sistema SaaS (Software as a Service) diseñado para la gestión de puntos de venta (POS) físicos y tiendas virtuales. Inicialmente concebido para heladerías, el sistema ha pivotado hacia un modelo agnóstico donde cada cliente (Tenant) administra su propia tienda, catálogo, inventario, ventas y clientes. 

El proyecto cuenta con una arquitectura de **Domain-Driven Design (DDD)** simplificada, separando el backend (Go + Firebase/Supabase) del frontend (React + Vite).

---

## 1. Arquitectura del Frontend (React + Vite)

El frontend está estructurado para soportar múltiples tiendas bajo un esquema Multitenant. Se utiliza `shopId` en lugar de IDs específicos como `heladeriaId` para mantener la escalabilidad.

### 1.1 Estructura de Directorios

```text
src/
├── assets/          # Imágenes estáticas y recursos visuales.
├── components/      # Componentes de UI reutilizables.
│   ├── admin/       # Componentes exclusivos para la administración global SaaS.
│   ├── shared/      # Componentes genéricos (Botones, Modales, Layouts, Tablas).
│   ├── shop/        # Componentes de gestión interna de la tienda (POS, Inventario).
│   └── shopPublic/  # Componentes públicos (Vitrina de cara al consumidor final).
├── config/          # Configuraciones globales (Rutas, Temas, Navegación).
├── context/         # React Contexts (Autenticación, Tema, Notificaciones, Tenant).
├── hooks/           # Custom hooks (Ej: usePermissions para RBAC).
├── pages/           # Vistas principales de la aplicación.
│   ├── admin/       # Panel SaaS Master (Gestión de tiendas y catálogo maestro).
│   ├── landing/     # Páginas informativas y de registro inicial (Landing Page).
│   ├── shared/      # Páginas comunes (Perfil, Errores).
│   ├── shop/        # Dashboard del dueño de la tienda (Ventas, Empleados, Caja).
│   └── shopPublic/  # La vista de la tienda virtual para los clientes.
├── services/        # Capa de comunicación con el Backend (API Services).
│   ├── admin/       # Llamadas exclusivas de SuperAdmin (Catálogo Maestro).
│   ├── shared/      # Servicios transversales (Auth, User Profile).
│   ├── shop/        # Servicios internos de tienda (Ventas, Gastos, Sesiones).
│   └── shopPublic/  # Servicios expuestos para la tienda virtual.
├── store/           # Zustand stores (Manejo de estado global ligero).
├── types/           # Interfaces y tipos de TypeScript para mantener el tipado estricto.
└── utils/           # Funciones de ayuda general (Formateo de fechas, moneda).
```

### 1.2 Reglas de Desarrollo Frontend
1. **Nomenclatura**: Todo debe referirse a `shopId` y `Shop`. Nunca usar `heladeria` ni términos atados a un nicho específico.
2. **Servicios (API)**: No interactuar con Firebase directamente desde los componentes. Usar las funciones exportadas en `src/services/` que encapsulan las llamadas HTTP vía `apiClient`.
3. **Tipado Estricto**: Todos los modelos deben estar declarados en la carpeta `src/types/`. Evitar el uso de `any`.
4. **Fechas**: El backend envía fechas en formato ISO (strings). Siempre convertir las fechas utilizando `new Date(string)` y nunca asumir que vienen como objetos de Firestore (`.toDate()`).
5. **Control de Accesos**: Utilizar el hook `usePermissions` y el contexto de Tenant para validar si un usuario puede ver un botón o acceder a una ruta.

---

## 2. Arquitectura del Backend (Golang)

El backend ha sido migrado de Firebase directo (BaaS) a una API RESTful desarrollada en Go.

### 2.1 Estructura del Backend

Se utiliza una arquitectura de capas estándar:
- **Routers**: Definen los endpoints (Ej: `/api/shops/:shopId/sales`).
- **Handlers / Controllers**: Procesan la request HTTP, validan los inputs y llaman a los servicios.
- **Services (Business Logic)**: Contienen las reglas de negocio, validaciones complejas y cálculos financieros.
- **Repositories (Data Access)**: Interactúan exclusivamente con la base de datos (Firestore / Supabase). Es la única capa que conoce cómo se guardan los datos.
- **Models**: Estructuras de datos (Structs).

### 2.2 Roles y Control de Acceso (RBAC)

La validación de roles no utiliza una tabla separada de "roles de usuario" genérica, sino un mapeo de **Relación Usuario-Tienda**:
1. **SuperAdmin**: Controla el catálogo maestro y gestiona las cuentas SaaS.
2. **ShopOwner**: Creador de la tienda, acceso total a su respectivo `shopId`.
3. **Cashier/Employee**: Acceso limitado basado en los módulos habilitados por el ShopOwner en el contexto del Tenant.

### 2.3 Manejo de Sesiones de Caja
- El backend es responsable de auditar aperturas y cierres de caja.
- Las ventas (Sales) y gastos (Expenses) deben ir obligatoriamente asociados a una Sesión de Caja Activa.

---

## 3. Guía de Continuación (Handover)

Si un nuevo desarrollador toma el control del repositorio, debe seguir estos pasos:
1. **Resolución de Errores de Tipado Restantes**: Durante el merge más reciente se han migrado rutas de servicios. Ejecutar `pnpm tsc --noEmit` y corregir las inconsistencias de rutas en las importaciones (Ej: `../../general/` que ahora es `../../shared/`).
2. **Limpieza de Firebase**: El código residual de Firebase (importaciones de `firestore` y `.toDate()`) en el frontend debe continuar siendo reemplazado por los endpoints del backend Go mediante `apiClient`.
3. **Catálogo Maestro**: Finalizar la refactorización de `MasterCatalogPage.tsx` para que consuma los servicios desde `src/services/admin/masterProductService.ts`.
4. **Despliegue**: El frontend se compila con `pnpm build` (Vite). El backend se compila con `go build`. Para evitar exponer el código, el repositorio debe mantenerse Privado en GitHub y usar servicios de CI/CD (como Vercel/Netlify para frontend, y Render/Railway para Go).

> **Aviso Importante**: Nunca comitear el archivo `.env`. Utilizar `.env.example` para documentar las variables necesarias.
