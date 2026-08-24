import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appointmentService } from '@/services/appointment.service';
import { CreateAppointmentDto, UpdateAppointmentDto, AppointmentFilters } from '@/types/appointment';
import { toast } from 'sonner';

// Obtener citas con filtros
export const useAppointments = (filters?: AppointmentFilters) => {
    return useQuery({
        queryKey: ['appointments', filters],
        queryFn: () => appointmentService.getAll(filters),
        enabled: true,
        staleTime: 1000 * 60,
    });
};

// Obtener cita por ID
export const useAppointment = (id: number) => {
    return useQuery({
        queryKey: ['appointment', id],
        queryFn: () => appointmentService.getById(id),
        enabled: !!id,
    });
};

// Obtener slots disponibles
export const useAvailableSlots = (doctorId: number, date: string) => {
    return useQuery({
        queryKey: ['available-slots', doctorId, date],
        queryFn: () => appointmentService.getAvailableSlots(doctorId, date),
        enabled: !!doctorId && !!date,
        staleTime: 1000 * 60, // 1 minuto
    });
};

// Crear cita
export const useCreateAppointment = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateAppointmentDto) => appointmentService.create(data),
        onSuccess: () => {
            toast.success('Cita creada correctamente');
            queryClient.invalidateQueries({ queryKey: ['appointments'] });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Error al crear la cita');
        },
    });
};

// Actualizar cita
export const useUpdateAppointment = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: UpdateAppointmentDto }) =>
            appointmentService.update(id, data),
        onSuccess: (data) => {
            toast.success('Cita actualizada correctamente');
            queryClient.invalidateQueries({ queryKey: ['appointments'] });
            queryClient.invalidateQueries({ queryKey: ['appointment', data.id] });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Error al actualizar la cita');
        },
    });
};

// Actualizar estado de cita
export const useUpdateAppointmentStatus = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, status, cancellationReason }: {
            id: number;
            status: string;
            cancellationReason?: string
        }) => appointmentService.updateStatus(id, status, cancellationReason),
        onSuccess: (data) => {
            toast.success('Estado actualizado correctamente');
            queryClient.invalidateQueries({ queryKey: ['appointments'] });
            queryClient.invalidateQueries({ queryKey: ['appointment', data.id] });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Error al actualizar el estado');
        },
    });
};

// Eliminar cita
export const useDeleteAppointment = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => appointmentService.delete(id),
        onSuccess: () => {
            toast.success('Cita eliminada correctamente');
            queryClient.invalidateQueries({ queryKey: ['appointments'] });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Error al eliminar la cita');
        },
    });
};