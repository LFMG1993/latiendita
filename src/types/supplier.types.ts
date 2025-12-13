import { Timestamp } from "firebase/firestore";

export interface Supplier {
    id: string;
    name: string;
    contactPerson?: string;
    phone?: string;
    email?: string;
    purchaseCount?: number;
    createdAt: Timestamp;
}

export type NewSupplierData = Omit<Supplier, 'id' | 'createdAt'>;

export type UpdateSupplierData = Partial<NewSupplierData>;