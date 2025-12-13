export interface PermissionConfig {
    id: string;
    name: string;
    description: string;
    module: string;
}

export const allPermissionsConfig: PermissionConfig[] = [
    // Punto de Venta
    { id: 'pos_access', name: 'Acceder al Punto de Venta', description: 'Permite abrir y usar la interfaz de ventas.', module: 'Punto de Venta' },

    // Productos
    { id: 'products_view', name: 'Ver Productos', description: 'Permite ver la lista de productos y sus detalles.', module: 'Productos' },
    { id: 'products_create', name: 'Crear Productos', description: 'Permite añadir nuevos productos al sistema.', module: 'Productos' },
    { id: 'products_update', name: 'Editar Productos', description: 'Permite modificar productos existentes.', module: 'Productos' },
    { id: 'products_delete', name: 'Eliminar Productos', description: 'Permite eliminar productos del sistema.', module: 'Productos' },

    // Ingredientes
    { id: 'ingredients_view', name: 'Ver Ingredientes', description: 'Permite ver la lista de ingredientes.', module: 'Ingredientes' },
    { id: 'ingredients_create', name: 'Crear Ingredientes', description: 'Permite añadir nuevos ingredientes.', module: 'Ingredientes' },
    { id: 'ingredients_update', name: 'Editar Ingredientes', description: 'Permite modificar ingredientes existentes.', module: 'Ingredientes' },
    { id: 'ingredients_delete', name: 'Eliminar Ingredientes', description: 'Permite eliminar ingredientes.', module: 'Ingredientes' },
    { id: 'ingredients_adjust_stock', name: 'Ajustar Stock de Ingredientes', description: 'Permite corregir manualmente las cantidades del inventario.', module: 'Ingredientes' },

    // Compras
    { id: 'purchases_view', name: 'Ver Compras', description: 'Permite ver el historial de compras.', module: 'Compras' },
    { id: 'purchases_create', name: 'Registrar Compras', description: 'Permite añadir nuevas compras y actualizar el stock.', module: 'Compras' },
    { id: 'purchases_update', name: 'Editar Compras', description: 'Permite modificar compras ya registradas.', module: 'Compras' },
    { id: 'purchases_delete', name: 'Eliminar Compras', description: 'Permite eliminar compras, revirtiendo el stock.', module: 'Compras' },

    // Proveedores
    { id: 'suppliers_view', name: 'Ver Proveedores', description: 'Permite ver la lista de proveedores.', module: 'Proveedores' },
    { id: 'suppliers_create', name: 'Crear Proveedores', description: 'Permite añadir nuevos proveedores.', module: 'Proveedores' },
    { id: 'suppliers_update', name: 'Editar Proveedores', description: 'Permite modificar proveedores existentes.', module: 'Proveedores' },
    { id: 'suppliers_delete', name: 'Eliminar Proveedores', description: 'Permite eliminar proveedores.', module: 'Proveedores' },

    // Equipo
    { id: 'team_view', name: 'Ver Equipo', description: 'Permite ver la lista de miembros y sus roles.', module: 'Equipo' },
    { id: 'team_manage_roles', name: 'Gestionar Roles', description: 'Permite crear, editar y eliminar roles.', module: 'Equipo' },
    { id: 'team_invite', name: 'Invitar Miembros', description: 'Permite enviar invitaciones a nuevos miembros.', module: 'Equipo' },
    { id: 'team_remove', name: 'Eliminar Miembros', description: 'Permite remover miembros del equipo.', module: 'Equipo' },

    // Reportes
    { id: 'reports_view_sales', name: 'Ver Reportes de Ventas', description: 'Permite acceder a los reportes de ventas.', module: 'Reportes' },
    { id: 'reports_view_inventory', name: 'Ver Reportes de Inventario', description: 'Permite acceder a los reportes de inventario.', module: 'Reportes' },

    // Caja
    { id: 'cash_session_access', name: 'Acceder a Gestión de Caja', description: 'Permite ver el estado de la caja y las transacciones del turno.', module: 'Caja' },
    { id: 'cash_session_open_close', name: 'Abrir y Cerrar Caja', description: 'Permite iniciar y finalizar una sesión de caja.', module: 'Caja' },
    { id: 'cash_session_view_history', name: 'Ver Historial de Cajas', description: 'Permite ver los cierres de caja pasados.', module: 'Caja' },

    // Configuración de la Tienda
    { id: 'shop_details_manage', name: 'Gestionar Detalles de la Tienda', description: 'Permite editar la información general de la heladería.', module: 'Configuración' },

    // Promociones
    { id: 'promotions_view', name: 'Ver Promociones', description: 'Permite ver la lista de promociones.', module: 'Promociones' },
    { id: 'promotions_create', name: 'Crear Promociones', description: 'Permite crear nuevas promociones.', module: 'Promociones' },
    { id: 'promotions_update', name: 'Editar Promociones', description: 'Permite modificar promociones existentes.', module: 'Promociones' },
    { id: 'promotions_delete', name: 'Eliminar Promociones', description: 'Permite eliminar promociones.', module: 'Promociones' },

    // Gastos Operacionales
    { id: 'expenses_view', name: 'Ver Gastos', description: 'Permite ver la lista de gastos operacionales.', module: 'Gastos' },
    { id: 'expenses_create', name: 'Crear Gastos', description: 'Permite registrar nuevos gastos.', module: 'Gastos' },
    { id: 'expenses_update', name: 'Editar Gastos', description: 'Permite modificar gastos existentes.', module: 'Gastos' },
    { id: 'expenses_delete', name: 'Eliminar Gastos', description: 'Permite eliminar gastos registrados.', module: 'Gastos' },
];