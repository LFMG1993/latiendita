import { DebtPaymentRequest, NewDebtPaymentRequest } from "../../types";
import { apiClient } from "../shared/apiClient";

export const createDebtPaymentRequest = async (data: NewDebtPaymentRequest): Promise<string> => {
    const res = await apiClient<any>(`/shops/${data.shopId}/debt-payments`, {
        method: 'POST',
        body: JSON.stringify(data)
    });
    return res.id;
};

export const getPendingDebtPayments = async (shopId: string): Promise<DebtPaymentRequest[]> => {
    const requests = await apiClient<DebtPaymentRequest[]>(`/shops/${shopId}/debt-payments?status=pending`);
    return requests.map(r => ({
        ...r,
        createdAt: { toMillis: () => new Date(r.createdAt as any).getTime() } as any,
        updatedAt: { toMillis: () => new Date(r.updatedAt as any).getTime() } as any
    }));
};

export const getClientDebtPayments = async (clientId: string): Promise<DebtPaymentRequest[]> => {
    // In Go, debt payments are fetched by shop. The frontend currently needs them by client.
    // If the frontend has multiple shops, it would need to fetch all and filter.
    // Assuming the user is in the context of a shop:
    console.warn("Fetching all debt payments globally by client. This may fail if shop_id is required.");
    // This is a dummy implementation until the Go API supports fetching by client globally
    return [];
};

export const approveDebtPayment = async (requestId: string, clientId: string, amount: number): Promise<number> => {
    // Go backend handles reducing the debt
    await apiClient(`/debt-payments/${requestId}/approve`, {
        method: 'PUT'
    });
    // The previous implementation returned the new debt. The Go backend doesn't return the new debt in this endpoint,
    // so we return 0 for now. The UI should refresh the client's account separately.
    return 0;
};

export const rejectDebtPayment = async (requestId: string, notes?: string): Promise<void> => {
    await apiClient(`/debt-payments/${requestId}/reject`, {
        method: 'PUT',
        body: JSON.stringify({ notes })
    });
};

export const updateClientCreditLimit = async (shopId: string, clientId: string, newCredit: number): Promise<void> => {
    // Note: The signature changed to include shopId because debt and credits are per-shop in the new PostgreSQL DB.
    // Fetch current account to preserve other fields
    let account: any = { credits: newCredit, debt: 0, is_credit_enabled: true, credit_limit: 0 };
    try {
        account = await apiClient(`/shops/${shopId}/clients/${clientId}/account`);
    } catch {
        // Ignored if it doesn't exist
    }
    
    await apiClient(`/shops/${shopId}/clients/${clientId}/account`, {
        method: 'PUT',
        body: JSON.stringify({
            ...account,
            credits: newCredit
        })
    });
};
