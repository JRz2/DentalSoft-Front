import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { treatmentService } from '@/services/treatment.service';
import { CreateTreatmentDto, UpdateTreatmentDto } from '@/types/treatment';
import { toast } from 'sonner';

export const treatmentKeys = {
    all: ['treatments'] as const,
    lists: () => [...treatmentKeys.all, 'list'] as const,
    list: (filters: any) => [...treatmentKeys.lists(), filters] as const,
    byPatient: (patientId: number) => [...treatmentKeys.lists(), { patientId }] as const,
    details: () => [...treatmentKeys.all, 'detail'] as const,
    detail: (id: number) => [...treatmentKeys.details(), id] as const,
};

function extractErrorMessage(error: any, fallback: string): string {
    const message = error.response?.data?.message;

    if (typeof message === 'string') return message;

    if (Array.isArray(message)) {
        const messages = message
            .map((item: any) => {
                if (typeof item === 'string') return item;
                if (item?.constraints) {
                    return Object.values(item.constraints).join(', ');
                }
                return item?.message || null;
            })
            .filter(Boolean);
        if (messages.length > 0) return messages.join('. ');
    }

    if (message?.message) return message.message;
    return fallback;
}

// Obtener tratamientos por paciente
export const useTreatmentsByPatient = (patientId: number) => {
    return useQuery({
        queryKey: treatmentKeys.byPatient(patientId),
        queryFn: () => treatmentService.getByPatientId(patientId),
        enabled: !!patientId,
    });
};

// Obtener todos los tratamientos
export const useTreatments = () => {
    return useQuery({
        queryKey: treatmentKeys.lists(),
        queryFn: () => treatmentService.getAll(),
    });
};

// Crear tratamiento
export const useCreateTreatment = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ clinicalHistoryId, data }: { clinicalHistoryId: number; data: CreateTreatmentDto }) =>
            treatmentService.create(clinicalHistoryId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: treatmentKeys.lists() });
            toast.success('Tratamiento creado exitosamente');
        },
        onError: (error: any) => {
            toast.error(extractErrorMessage(error, 'Error al crear tratamiento'));
        },
    });
};

// Actualizar tratamiento
export const useUpdateTreatment = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: UpdateTreatmentDto }) =>
            treatmentService.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: treatmentKeys.lists() });
            toast.success('Tratamiento actualizado exitosamente');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Error al actualizar tratamiento');
        },
    });
};

// Cancelar tratamiento
export const useCancelTreatment = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => treatmentService.cancel(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: treatmentKeys.lists() });
            toast.success('Tratamiento cancelado exitosamente');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Error al cancelar tratamiento');
        },
    });
};

// Iniciar tratamiento
export const useStartTreatment = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => treatmentService.start(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: treatmentKeys.lists() });
            toast.success('Tratamiento iniciado');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Error al iniciar el tratamiento');
        },
    });
};

// Completar tratamiento
export const useCompleteTreatment = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => treatmentService.complete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: treatmentKeys.lists() });
            toast.success('Tratamiento completado');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Error al completar el tratamiento');
        },
    });
};