import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { patientService } from '../services/patient.service';
import { CreatePatientInput, UpdatePatientInput } from '../lib/validations/patient.schema';
import { toast } from 'sonner';

// Query keys para cache
export const patientKeys = {
    all: ['patients'] as const,
    lists: () => [...patientKeys.all, 'list'] as const,
    list: (filter: any) => [...patientKeys.lists(), filter] as const,
    details: () => [...patientKeys.all, 'details'] as const,
    detail: (id: number) => [...patientKeys.details(), id] as const,
};

// Hook para obtener todos los pacientes
export const usePatients = (params?: {
    page?: number;
    limit?: number;
    search?: string;
}) => {
    return useQuery({
        queryKey: patientKeys.list(params || {}),
        queryFn: () => patientService.getAll(params),
    });
};


// Hook para obtener un paciente po ID
export const usePatient = (id: number) => {
    return useQuery({
        queryKey: patientKeys.detail(id),
        queryFn: () => patientService.getById(id),
        enabled: !!id,
    });
};

// Hook para crear paciente
export const useCreatePatient = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreatePatientInput) => patientService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: patientKeys.lists() });
            toast.success('Paciente creado exitosamente');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Error al crear paciente');
        },
    });
};

// Hook para actulizar paciente
export const useUpdatePatient = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: UpdatePatientInput }) =>
            patientService.update(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: patientKeys.lists() });
            queryClient.invalidateQueries({ queryKey: patientKeys.detail(variables.id) });
            toast.success('Paciente actualizado exitosamente');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Error al actualizar paciente');
        },
    });
};

// Hook para eliminar paciente
export const useDeletePatient = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => patientService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: patientKeys.lists() });
            toast.success('Paciente eliminado exitosamente');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Error al eliminar paciente');
        },
    });
};