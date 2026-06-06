import { collection, doc, addDoc, getDocs, updateDoc, query, where, Timestamp, orderBy, runTransaction } from "firebase/firestore";
import { db } from "../firebase";
import { DebtPaymentRequest, NewDebtPaymentRequest } from "../types";

export const createDebtPaymentRequest = async (data: NewDebtPaymentRequest): Promise<string> => {
    try {
        const debtPaymentsRef = collection(db, "debtPayments");
        const docRef = await addDoc(debtPaymentsRef, {
            ...data,
            status: 'pending',
            createdAt: Timestamp.now(),
        });
        return docRef.id;
    } catch (error) {
        console.error("Error creating debt payment request:", error);
        throw error;
    }
};

export const getPendingDebtPayments = async (shopId: string): Promise<DebtPaymentRequest[]> => {
    try {
        const q = query(
            collection(db, "debtPayments"),
            where("shopId", "==", shopId),
            where("status", "==", "pending")
        );
        const querySnapshot = await getDocs(q);
        const requests: DebtPaymentRequest[] = [];
        querySnapshot.forEach((doc) => {
            requests.push({ id: doc.id, ...doc.data() } as DebtPaymentRequest);
        });
        // Ordenar en memoria (los más recientes primero) para no requerir un índice compuesto
        requests.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
        return requests;
    } catch (error) {
        console.error("Error fetching pending debt payments:", error);
        throw error;
    }
};

export const getClientDebtPayments = async (clientId: string): Promise<DebtPaymentRequest[]> => {
    try {
        const q = query(
            collection(db, "debtPayments"),
            where("clientId", "==", clientId)
        );
        const querySnapshot = await getDocs(q);
        const requests: DebtPaymentRequest[] = [];
        querySnapshot.forEach((doc) => {
            requests.push({ id: doc.id, ...doc.data() } as DebtPaymentRequest);
        });
        // Sort in memory by createdAt descending
        requests.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
        return requests;
    } catch (error) {
        console.error("Error fetching client debt payments:", error);
        throw error;
    }
};

export const approveDebtPayment = async (requestId: string, clientId: string, amount: number): Promise<number> => {
    try {
        const requestRef = doc(db, "debtPayments", requestId);
        const userRef = doc(db, "users", clientId);
        let newDebt = 0;

        await runTransaction(db, async (transaction) => {
            const requestDoc = await transaction.get(requestRef);
            if (!requestDoc.exists()) {
                throw new Error("Request does not exist!");
            }
            if (requestDoc.data().status !== 'pending') {
                throw new Error("Request is not pending!");
            }

            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists()) {
                throw new Error("User does not exist!");
            }

            const currentDebt = userDoc.data().debt || 0;
            newDebt = Math.max(0, currentDebt - amount);

            transaction.update(userRef, { debt: newDebt });
            transaction.update(requestRef, { 
                status: 'approved',
                updatedAt: Timestamp.now()
            });
        });

        return newDebt; // Retornamos la deuda resultante para que el UI sepa si quedó en 0
    } catch (error) {
        console.error("Error approving debt payment:", error);
        throw error;
    }
};

export const rejectDebtPayment = async (requestId: string, notes?: string): Promise<void> => {
    try {
        const requestRef = doc(db, "debtPayments", requestId);
        await updateDoc(requestRef, {
            status: 'rejected',
            notes: notes || null,
            updatedAt: Timestamp.now()
        });
    } catch (error) {
        console.error("Error rejecting debt payment:", error);
        throw error;
    }
};

export const updateClientCreditLimit = async (clientId: string, newCredit: number): Promise<void> => {
    try {
        const userRef = doc(db, "users", clientId);
        await updateDoc(userRef, {
            credits: newCredit,
            updatedAt: Timestamp.now()
        });
    } catch (error) {
        console.error("Error updating client credit:", error);
        throw error;
    }
};
