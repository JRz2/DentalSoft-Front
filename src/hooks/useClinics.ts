import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clinicService } from '@/services/clinic.service';
import { CreateClinicDto, UpdateClinicDto } from '@/types/clinic';
import { toast } from 'sonner';

export const clinicKeys = {
    all: ['clinics'] as const,
    lists: () => [...clinicKeys.all, 'list'] as const,
    list: (filters: any) => [...clinicKeys.lists(), filters] as const,
    details: () => [...clinicKeys.all, 'detail'] as const,
    detail: (id: number) => [...clinicKeys.details(), id] as const,
};

export const useClinics = (params?: { search?: string }) => {
    return useQuery({
        queryKey: clinicKeys.list(params || {}),
        queryFn: () => clinicService.getAll(params),
    });
};

export const useClinic = (id: number) => {
    return useQuery({
        queryKey: clinicKeys.detail(id),
        queryFn: () => clinicService.getById(id),
        enabled: !!id,
    });
};

export const useCreateClinic = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateClinicDto) => clinicService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: clinicKeys.lists() });
            toast.success('Clínica creada exitosamente');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Error al crear clínica');
        },
    });
};

export const useUpdateClinic = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: UpdateClinicDto }) =>
            clinicService.update(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: clinicKeys.lists() });
            queryClient.invalidateQueries({ queryKey: clinicKeys.detail(variables.id) });
            toast.success('Clínica actualizada exitosamente');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Error al actualizar clínica');
        },
    });
};

export const useDeleteClinic = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => clinicService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: clinicKeys.lists() });
            toast.success('Clínica eliminada exitosamente');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Error al eliminar clínica');
        },
    });
};