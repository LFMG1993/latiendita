import { NewOrderData, Order, OrderStatus } from "../../types/order.types";
import { apiClient } from "../shared/apiClient";

export const createOrder = async (orderData: NewOrderData): Promise<string> => {
    // Note: Debt/Credit logic is handled by the Go backend natively upon order creation.
    // The frontend only needs to pass 'usedCredits' and 'pendingDebt' in the payload.
    const rawSanitized = JSON.parse(JSON.stringify(orderData));
    
    // Convert field names to snake_case if backend requires, or keep camelCase if the Go model uses json:"camelCase".
    // Our Go model typically maps JSON tags correctly based on the struct definition.
    const res = await apiClient<any>(`/shops/${orderData.shopId}/orders`, {
        method: 'POST',
        body: JSON.stringify(rawSanitized)
    });

    return res.id || "dummy_order_id";
};

export const getClientOrders = async (clientId: string, shopId?: string): Promise<Order[]> => {
    if (!clientId) return [];
    
    // Go backend endpoint: /api/clients/{client_id}/orders?shop_id={shop_id}
    const url = shopId ? `/clients/${clientId}/orders?shop_id=${shopId}` : `/clients/${clientId}/orders`;
    const orders = await apiClient<Order[]>(url);
    
    return orders.map(o => ({
        ...o,
        createdAt: { toDate: () => new Date(o.createdAt as any) } as any,
        updatedAt: { toDate: () => new Date(o.updatedAt as any) } as any
    }));
};

export const getShopOrders = async (shopId: string): Promise<Order[]> => {
    const orders = await apiClient<Order[]>(`/shops/${shopId}/orders`);
    return orders.map(o => ({
        ...o,
        createdAt: { toDate: () => new Date(o.createdAt as any) } as any,
        updatedAt: { toDate: () => new Date(o.updatedAt as any) } as any
    }));
};

export const updateOrderStatus = async (orderId: string, status: OrderStatus): Promise<void> => {
    // The Go backend automatically handled the credit/debt deduction on creation, 
    // so we don't need to recalculate it here during delivery status change.
    await apiClient(`/orders/${orderId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status })
    });
};
