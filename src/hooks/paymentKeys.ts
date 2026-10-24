export const paymentKeys = {
    all: ['payments'] as const,
    kpis: (startDate?: string, endDate?: string) => 
        [...paymentKeys.all, 'kpis', startDate, endDate] as const,
    history: (filters: any) => 
        [...paymentKeys.all, 'history', filters] as const,
    pendingBalances: () => 
        [...paymentKeys.all, 'pending-balances'] as const,
};