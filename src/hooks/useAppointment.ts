import { appointmentService } from "@/services/appointment";
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner";

export const useCreateAppointment = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: appointmentService.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [`appointments`]});
            toast.success('Cita creada exitosamente');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Error al crear la cita');
        },
    });
};