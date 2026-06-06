import {FC} from "react";
import {
    Shop,
    Basket3,
    Cart3,
    Truck,
    Tags,
    BarChart,
    IconProps,
    PersonCheck,
    Boxes,
    CashCoin,
    Gear,
    Megaphone,
    HouseDoor,
    Receipt,
    People
} from 'react-bootstrap-icons';

export interface NavItemConfig {
    to: string;
    Icon: FC<IconProps>
    label: string;
    permissionId?: string;
    isMobilePrimary?: boolean;
    category: 'sales' | 'inventory' | 'finance' | 'settings';
}

export const navItemsConfig: NavItemConfig[] = [
    {to: "/dashboard", Icon: HouseDoor, label: "Dashboard", category: 'sales', isMobilePrimary: true},
    {to: "/pos", Icon: Cart3, label: "Punto de Venta", permissionId: 'pos_access', category: 'sales', isMobilePrimary: true},
    {to: "/orders", Icon: Receipt, label: "Pedidos Online", permissionId: 'pos_access', category: 'sales', isMobilePrimary: true},
    {to: "/clients", Icon: People, label: "Clientes y Créditos", permissionId: 'pos_access', category: 'sales'},
    {to: "/debt-payments", Icon: CashCoin, label: "Abonos a Deudas", permissionId: 'pos_access', category: 'sales'},
    {to: "/cash-session", Icon: CashCoin, label: "Caja", permissionId: 'cash_session_access', category: 'sales'},
    
    {to: "/products", Icon: Tags, label: "Productos", permissionId: 'products_view', category: 'inventory'},
    {to: "/ingredients-page", Icon: Basket3, label: "Ingredientes", permissionId: 'ingredients_view', category: 'inventory'},
    {to: "/purchases", Icon: Truck, label: "Compras", permissionId: 'purchases_view', category: 'inventory'},
    {to: "/suppliers", Icon: Boxes, label: "Proveedores", permissionId: 'suppliers_view', category: 'inventory'},
    
    {to: "/reports", Icon: BarChart, label: "Reportes", permissionId: 'reports_view_sales', category: 'finance', isMobilePrimary: true},
    {to: "/expenses", Icon: Receipt, label: "Gastos", permissionId: 'expenses_view', category: 'finance'},
    {to: "/promotions", Icon: Megaphone, label: "Promociones", permissionId: 'promotions_view', category: 'finance'},
    
    // {to: "/ice-cream-shop", Icon: Shop, label: "Heladerías", permissionId: 'shop_details_manage', category: 'settings'},
    {to: "/team-management", Icon: PersonCheck, label: "Usuarios y Roles", permissionId: 'team_view', category: 'settings'},
    {to: "/settings", Icon: Gear, label: "Configuración", permissionId: 'shop_details_manage', category: 'settings'},
];