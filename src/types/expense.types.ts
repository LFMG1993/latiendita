
export interface Expense {
    id: string;
    description: string;
    amount: number;
    category: 'operacional' | 'servicios' | 'salarios' | 'marketing' | 'otro';
    createdAt: string;
    recordedByEmployeeId: string;
    sessionId?: string;
    owner: string;
}

export type NewExpenseData = Omit<Expense, 'id' | 'createdAt'>;