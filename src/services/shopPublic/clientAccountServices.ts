/**
 * Actualiza los saldos de un cliente
 */
export const updateClientFinancials = async (_clientId: string, _credits: number, _debt: number, _isCreditEnabled: boolean, _creditLimit?: number): Promise<void> => {
    console.warn("updateClientFinancials should be called through orderService.updateClientAccount with shopId instead.");
};
