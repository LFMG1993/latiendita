
export interface DebtPaymentRequest {
    id: string;
    clientId: string;
    clientName: string;
    clientPhone?: string;
    shopId: string;
    amount: number;
    paymentMethodId: string;
    paymentMethodName: string;
    voucherNumber: string;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: string;
    updatedAt?: string;
    notes?: string; // Optional notes from admin
}

export type NewDebtPaymentRequest = Omit<DebtPaymentRequest, 'id' | 'createdAt'>;
