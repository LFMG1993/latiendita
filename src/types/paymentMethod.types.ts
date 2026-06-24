
export interface PaymentMethod {
    id: string;
    name: string; // Ej: "Efectivo", "Nequi", "Tarjeta Visa"
    type: 'cash' | 'electronic' | 'credit'; // 'cash' afecta la caja, 'electronic' no, 'credit' suma deuda al cliente.
    enabled: boolean; // Para poder activarlo o desactivarlo
    accountDetails?: string; // Para mostrar números de Nequi o cuenta
    createdAt: string;
}

export type NewPaymentMethodData = Omit<PaymentMethod, 'id' | 'createdAt'>;
export type UpdatePaymentMethodData = Partial<NewPaymentMethodData>;