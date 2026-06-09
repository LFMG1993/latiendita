import { NewOrderData, Order, OrderStatus } from "../types/order.types";
import { apiClient } from "./apiClient";

export const createOrder = async (orderData: NewOrderData): Promise<string> => {
    // Map camelCase to snake_case for the Go backend
    const backendPayload = {
        shop_id: orderData.shopId,
        client_id: orderData.clientId,
        client_name: orderData.clientName,
        client_phone: orderData.clientPhone,
        total_amount: orderData.totalAmount,
        total_items: orderData.totalItems,
        payment_method: orderData.paymentMethod,
        used_credits: orderData.usedCredits || 0,
        pending_debt: orderData.pendingDebt || 0,
        note: orderData.note,
        items: orderData.items.map(item => ({
            product_id: item.product.id,
            product_name: item.product.name,
            quantity: item.quantity,
            price_at_purchase: item.priceAtPurchase
        }))
    };
    
    const res = await apiClient<any>(`/shops/${orderData.shopId}/orders`, {
        method: 'POST',
        body: JSON.stringify(backendPayload)
    });

    return res.id || "dummy_order_id";
};

export const getClientOrders = async (clientId: string, shopId?: string): Promise<Order[]> => {
    if (!clientId) return [];
    
    // Go backend endpoint: /api/clients/{client_id}/orders?shop_id={shop_id}
    const url = shopId ? `/clients/${clientId}/orders?shop_id=${shopId}` : `/clients/${clientId}/orders`;
    const orders = await apiClient<Order[]>(url);
    
    return orders.map((o: any) => ({
        ...o,
        shopId: o.shop_id || o.shopId,
        clientId: o.client_id || o.clientId,
        clientName: o.client_name || o.clientName,
        clientPhone: o.client_phone || o.clientPhone,
        totalAmount: o.total_amount || o.totalAmount || 0,
        totalItems: o.total_items || o.totalItems || 0,
        paymentMethod: o.payment_method || o.paymentMethod,
        usedCredits: o.used_credits || o.usedCredits,
        pendingDebt: o.pending_debt || o.pendingDebt,
        items: (o.items || []).map((item: any) => ({
            ...item,
            product: {
                id: item.product_id || item.productId || 'unknown',
                name: item.product_name || item.productName || 'Producto',
                price: item.price_at_purchase || item.priceAtPurchase || 0
            }
        })),
        createdAt: { toDate: () => new Date(o.createdAt as any) } as any,
        updatedAt: { toDate: () => new Date(o.updatedAt as any) } as any
    }));
};

export const getShopOrders = async (shopId: string): Promise<Order[]> => {
    const orders = await apiClient<Order[]>(`/shops/${shopId}/orders`);
    return orders.map((o: any) => ({
        ...o,
        shopId: o.shop_id || o.shopId,
        clientId: o.client_id || o.clientId,
        clientName: o.client_name || o.clientName,
        clientPhone: o.client_phone || o.clientPhone,
        totalAmount: o.total_amount || o.totalAmount || 0,
        totalItems: o.total_items || o.totalItems || 0,
        paymentMethod: o.payment_method || o.paymentMethod,
        usedCredits: o.used_credits || o.usedCredits,
        pendingDebt: o.pending_debt || o.pendingDebt,
        items: (o.items || []).map((item: any) => ({
            ...item,
            product: {
                id: item.product_id || item.productId || 'unknown',
                name: item.product_name || item.productName || 'Producto',
                price: item.price_at_purchase || item.priceAtPurchase || 0
            }
        })),
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
