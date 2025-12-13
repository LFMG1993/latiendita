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
    Receipt
} from 'react-bootstrap-icons';

export interface NavItemConfig {
    to: string;
    Icon: FC<IconProps>
    label: string;
    permissionId?: string;
    isMobilePrimary?: boolean;
}

export const navItemsConfig: NavItemConfig[] = [
    {to: "/dashboard", Icon: HouseDoor, label: "DashboardPage", isMobilePrimary: true},
    {to: "/pos", Icon: Cart3, label: "Punto de Venta", permissionId: 'pos_access', isMobilePrimary: true},
    {to: "/cash-session", Icon: CashCoin, label: "Caja", permissionId: 'cash_session_access'},
    {to: "/ice-cream-shop", Icon: Shop, label: "Heladerías", permissionId: 'shop_details_manage'},
    {to: "/team-management", Icon: PersonCheck, label: "Usuarios y Roles", permissionId: 'team_view'},
    {to: "/ingredients-page", Icon: Basket3, label: "Ingredientes", permissionId: 'ingredients_view'},
    {to: "/expenses", Icon: Receipt, label: "Gastos", permissionId: 'expenses_view'},
    {to: "/promotions", Icon: Megaphone, label: "Promociones", permissionId: 'promotions_view'},
    {to: "/products", Icon: Tags, label: "Productos", permissionId: 'products_view'},
    {to: "/purchases", Icon: Truck, label: "Compras", permissionId: 'purchases_view'},
    {to: "/suppliers", Icon: Boxes, label: "Proveedores", permissionId: 'suppliers_view'},
    {to: "/reports", Icon: BarChart, label: "Reportes", permissionId: 'reports_view_sales', isMobilePrimary: true},
    {to: "/settings", Icon: Gear, label: "Configuración", permissionId: 'shop_details_manage'},
];