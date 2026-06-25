# La Tiendita - Sistema de Gestión SaaS para Puntos de Venta

![La Tiendita](https://img.shields.io/badge/Estado-En_Desarrollo-orange) ![Licencia](https://img.shields.io/badge/Licencia-Privada-red)

**La Tiendita** es una plataforma integral SaaS (Software as a Service) diseñada para digitalizar y centralizar la gestión operativa y financiera de pequeños y medianos negocios. Nuestra solución empodera a los dueños de tiendas ofreciéndoles un sistema de Punto de Venta (POS) en la nube, gestión de inventarios, reportes en tiempo real y una tienda virtual para sus clientes.

## 🚀 Características Principales

- **Punto de Venta (POS) en la Nube:** Sistema rápido e intuitivo para registrar ventas, manejar diferentes métodos de pago y gestionar sesiones de caja.
- **Arquitectura Multitenant:** Un solo núcleo de software sirviendo a múltiples negocios de forma aislada y segura. Cada cliente tiene su propia base de datos lógica y control de usuarios.
- **Gestión de Inventario y Catálogo Maestro:** Sincronización en tiempo real de stock, ingredientes y productos base para cadenas o franquicias.
- **Vitrina Virtual:** Cada tienda obtiene una URL pública (ej: `latiendita.com/shop/:id`) donde sus clientes pueden ver el catálogo, solicitar pedidos y gestionar créditos/fiados.
- **Roles y Permisos (RBAC):** Control granular sobre qué pueden ver o hacer los cajeros, administradores y dueños.
- **Reportes y Analíticas:** Gráficos y tablas exportables sobre ventas, márgenes de ganancia y rendimiento por empleado.

## 🛠 Stack Tecnológico

El proyecto utiliza tecnologías modernas y de alto rendimiento:

- **Frontend:** React 18, Vite, TypeScript, Zustand (Estado), Bootstrap Icons.
- **Backend (API):** Golang (Go) implementando Arquitectura Limpia (Domain-Driven Design).
- **Base de Datos:** Firestore / Supabase (Dependiendo del tenant y despliegue).
- **Autenticación:** Firebase Auth (Gestión de JWT segura).
- **Infraestructura:** Despliegue agnóstico (Docker / Serverless).

## 📁 Estructura del Proyecto

Consulta la [Documentación de Arquitectura](./docs/ARCHITECTURE.md) para detalles profundos sobre cómo se estructuraron las carpetas y cómo fluye la información entre el Frontend y Backend.

## 🔒 Privacidad y Seguridad

> **Aviso de Privacidad**: El código fuente de este repositorio es **PRIVADO** y confidencial. No está permitido bifurcarlo (fork) ni hacerlo público sin el consentimiento expreso de la compañía. El backend reside en un repositorio/servicio separado para garantizar la integridad de las reglas de negocio.

## 🤝 Contribución (Solo Desarrolladores Internos)

1. Clonar el repositorio.
2. Crear un archivo `.env.local` basado en `.env.example` solicitando las credenciales al administrador del equipo.
3. Instalar dependencias con `pnpm install`.
4. Ejecutar el servidor de desarrollo con `pnpm dev`.
5. Asegurarse de ejecutar `pnpm tsc --noEmit` para validar el tipado antes de crear un Pull Request.

---
*Transformando la manera en que los negocios locales operan y crecen en la era digital.*
