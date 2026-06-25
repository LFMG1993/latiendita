import { apiClient } from "../shared/apiClient";

export interface UpdateClientFinancialsPayload {
    credits: number;
    debt: number;
    isCreditEnabled: boolean;
    creditLimit: number;
}

/**
 * Actualiza los saldos y configuraciones de crédito de un cliente para una tienda específica.
 */
export const updateClientFinancials = async (
    shopId: string, 
    clientId: string, 
    data: UpdateClientFinancialsPayload
): Promise<void> => {
    await apiClient(`/shops/${shopId}/clients/${clientId}/financials`, {
        method: 'PUT',
        body: JSON.stringify({
            credits: data.credits,
            debt: data.debt,
            is_credit_enabled: data.isCreditEnabled,
            credit_limit: data.creditLimit
        })
    });
};
