import { UserProfile } from "../../types";
import { apiClient } from "../shared/apiClient";

export interface QuickClientData {
    firstName: string;
    lastName?: string;
    phone?: string;
    documentId?: string;
}

/**
 * Crea un cliente rápido (offline) desde el POS sin necesidad de Auth
 */
export const createQuickClient = async (data: QuickClientData): Promise<UserProfile> => {
    const res = await apiClient<any>(`/users`, {
        method: "POST",
        body: JSON.stringify({
            first_name: data.firstName,
            last_name: data.lastName || '',
            role: 'client',
            phone: data.phone || '',
            document_id: data.documentId || '',
            password: "defaultPassword123!",
            identify: "CC"
        })
    });

    return {
        uid: res.id,
        id: res.id,
        firstName: res.first_name,
        lastName: res.last_name,
        role: 'client',
        phone: res.phone,
        documentId: res.document_id,
        isOfflineClient: true,
        isCreditEnabled: true,
        credits: 0,
        debt: 0,
        creditLimit: 0
    } as any;
};
