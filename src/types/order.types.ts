import {PublicProduct} from "./public.types";

export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
export type PaymentMethodType = 'cash' | 'credit' | 'electronic';

export interface OrderItem {
    product: PublicProduct;
    quantity: number;
    priceAtPurchase: number; // Guardamos el precio al momento de la compra
}

export interface Order {
    id: string;
    shopId: string;
    clientId: string;
    clientName: string; 
    clientPhone?: string; // Útil para contactar
    
    items: OrderItem[];
    totalAmount: number;
    totalItems: number;
    
    status: OrderStatus;
    paymentMethod: PaymentMethodType;
    
    createdAt: string;
    updatedAt?: string;
    
    // Campos para sistema de crédito refinado
    usedCredits?: number;    // Monto cubierto por "Saldo a Favor" al momento del pedido
    pendingDebt?: number;    // Monto que se sumará a "Deuda" al ser entregado
    
    // Opcional: Notas del cliente
    note?: string;
}

export type NewOrderData = Omit<Order, 'id' | 'createdAt' | 'status'>;
