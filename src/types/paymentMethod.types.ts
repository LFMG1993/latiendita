import { Timestamp } from "firebase/firestore";

export interface PaymentMethod {
    id: string;
    name: string; // Ej: "Efectivo", "Nequi", "Tarjeta Visa"
    type: 'cash' | 'electronic' | 'credit'; // 'cash' afecta la caja, 'electronic' no, 'credit' suma deuda al cliente.
    enabled: boolean; // Para poder activarlo o desactivarlo
    createdAt: Timestamp;
}

export type NewPaymentMethodData = Omit<PaymentMethod, 'id' | 'createdAt'>;
export type UpdatePaymentMethodData = Partial<NewPaymentMethodData>;