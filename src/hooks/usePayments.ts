import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { paymentService } from '@/services/payment.service';
import { treatmentService } from '@/services/treatment.service';
import { paymentKeys } from './paymentKeys';

export const usePaymentKPIs = (startDate?: string, endDate?: string) => {
    return useQuery({
        queryKey: paymentKeys.kpis(startDate, endDate),
        queryFn: () => paymentService.getKPIs(startDate, endDate),
        staleTime: 1000 * 60 * 5,
        placeholderData: keepPreviousData,
    });
};

export const usePaymentsHistory = (filters: {
    page: number;
    limit: number;
    startDate?: string;
    endDate?: string;
    search?: string;
    paymentMethod?: string;
    status?: string;
}) => {
    return useQuery({
        queryKey: paymentKeys.history(filters),
        queryFn: () => paymentService.getHistory(filters),
        staleTime: 1000 * 60 * 2,
        placeholderData: keepPreviousData,
    });
};

export const usePendingBalances = () => {
    return useQuery({
        queryKey: paymentKeys.pendingBalances(),
        queryFn: () => paymentService.getPendingBalances(),
        staleTime: 1000 * 60 * 2,
    });
};

// ═══════════════════════════════════════════════════════════════
// MUTATIONS (Escritura + Invalidación)
// ═══════════════════════════════════════════════════════════════


export const useRegisterPayment = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ treatmentId, data, idempotencyKey }: {
            treatmentId: number;
            data: { amount: number; paymentMethod: 'CASH' | 'TRANSFER'; reference?: string; notes?: string };
            idempotencyKey: string;
        }) => treatmentService.registerPayment(treatmentId, data, idempotencyKey),

        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: paymentKeys.all });
            queryClient.invalidateQueries({ queryKey: ['treatments'] });
            queryClient.invalidateQueries({ queryKey: ['appointments'] });
        },
    });
};

export const useVoidPayment = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ treatmentId, paymentId, reason }: {
            treatmentId: number;
            paymentId: number;
            reason: string
        }) => treatmentService.voidPayment(treatmentId, paymentId, { reason }),

        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: paymentKeys.all });
            queryClient.invalidateQueries({ queryKey: ['treatments'] });
        },
    });
};