import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clinicalHistoryService } from '@/services/clinicalHistory.service';
import { toast } from 'sonner';

export const clinicalHistoryKeys = {
    all: ['clinicalHistory'] as const,
    byPatient: (patientId: number) => [...clinicalHistoryKeys.all, 'patient', patientId] as const,
    treatments: (patientId: number) => [...clinicalHistoryKeys.all, 'treatments', patientId] as const,
    sessions: (treatmentId: number) => [...clinicalHistoryKeys.all, 'sessions', treatmentId] as const,
};

// Obtener historia clínica por paciente
export const useClinicalHistory = (patientId: number) => {
    return useQuery({
        queryKey: clinicalHistoryKeys.byPatient(patientId),
        queryFn: () => clinicalHistoryService.getByPatientId(patientId),
        enabled: !!patientId,
    });
};

// Obtener tratamientos por paciente
export const useTreatments = (patientId: number) => {
    return useQuery({
        queryKey: clinicalHistoryKeys.treatments(patientId),
        queryFn: () => clinicalHistoryService.getTreatmentsByPatient(patientId),
        enabled: !!patientId,
    });
};

// Crear tratamiento
export const useCreateTreatment = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ clinicalHistoryId, data }: { clinicalHistoryId: number; data: any }) =>
            clinicalHistoryService.createTreatment(clinicalHistoryId, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: clinicalHistoryKeys.treatments(variables.clinicalHistoryId) });
            toast.success('Tratamiento creado exitosamente');
        },
        onError: () => {
            toast.error('Error al crear tratamiento');
        },
    });
};

// Actualizar tratamiento
export const useUpdateTreatment = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: any }) =>
            clinicalHistoryService.updateTreatment(id, data),
        onSuccess: (_, _variables) => {
            queryClient.invalidateQueries({ queryKey: clinicalHistoryKeys.all });
            toast.success('Tratamiento actualizado');
        },
        onError: () => {
            toast.error('Error al actualizar tratamiento');
        },
    });
};

// Crear sesión
export const useCreateSession = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: any) => clinicalHistoryService.createSession(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: clinicalHistoryKeys.all });
            toast.success('Sesión registrada');
        },
        onError: () => {
            toast.error('Error al registrar sesión');
        },
    });
};