import api from '@/services/api';
import { PendingBalance } from '@/types/payment';

export const paymentService = {
    // 1. KPIs
    getKPIs: async (startDate?: string, endDate?: string) => {
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);

        const { data } = await api.get(`/payments/kpis?${params.toString()}`);
        return data;
    },

    // 2. Historial de Pagos
    getHistory: async (filters: {
        page: number;
        limit: number;
        startDate?: string;
        endDate?: string;
        search?: string;
        paymentMethod?: string;
        status?: string;
    }) => {
        const params = new URLSearchParams();
        params.append('page', filters.page.toString());
        params.append('limit', filters.limit.toString());

        if (filters.startDate) params.append('startDate', filters.startDate);
        if (filters.endDate) params.append('endDate', filters.endDate);
        if (filters.search) params.append('search', filters.search);
        if (filters.paymentMethod && filters.paymentMethod !== 'all') params.append('paymentMethod', filters.paymentMethod);
        if (filters.status && filters.status !== 'all') params.append('status', filters.status);

        const { data } = await api.get(`/payments?${params.toString()}`);
        return data;
    },

    // 3. Cuentas por Cobrar
    getPendingBalances: async (): Promise<PendingBalance[]> => {
        const { data } = await api.get('/payments/pending-balances');
        return data;
    },
};