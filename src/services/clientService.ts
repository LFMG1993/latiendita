import { UserProfile } from "../types";
import { apiClient } from "./apiClient";

export interface ClientFinancials {
    credits: number;
    debt: number;
    isCreditEnabled: boolean;
    creditLimit?: number;
}

export const getClientFinancials = async (shopId: string, clientId: string): Promise<ClientFinancials> => {
    try {
        const data = await apiClient<any>(`/shops/${shopId}/clients/${clientId}/account`);
        
        return {
            credits: data.credits || 0,
            debt: data.debt || 0,
            isCreditEnabled: !!data.is_credit_enabled,
            creditLimit: data.credit_limit
        };
    } catch (error) {
        console.error("Error fetching client financials:", error);
        return { credits: 0, debt: 0, isCreditEnabled: false }; // Fallback seguro
    }
};
