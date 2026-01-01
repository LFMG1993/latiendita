import {doc, getDoc} from "firebase/firestore";
import {db} from "../firebase";
import {UserProfile} from "../types";

export interface ClientFinancials {
    credits: number;
    debt: number;
    isCreditEnabled: boolean;
}

export const getClientFinancials = async (clientId: string): Promise<ClientFinancials> => {
    try {
        const userRef = doc(db, "users", clientId);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
            const data = userSnap.data() as UserProfile;
            return {
                credits: data.credits || 0,
                debt: data.debt || 0,
                isCreditEnabled: !!data.isCreditEnabled
            };
        }
        return { credits: 0, debt: 0, isCreditEnabled: false };
    } catch (error) {
        console.error("Error fetching client financials:", error);
        return { credits: 0, debt: 0, isCreditEnabled: false }; // Fallback seguro
    }
};
