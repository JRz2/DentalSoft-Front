import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService, UpdateProfileDto, ChangePasswordDto } from '@/services/user.service';
import { toast } from 'sonner';

export const userKeys = {
    profile: ['user-profile'] as const,
};

export const useUserProfile = () => {
    return useQuery({
        queryKey: userKeys.profile,
        queryFn: () => userService.getProfile(),
        staleTime: 1000 * 60 * 5,
    });
};

export const useUpdateProfile = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: UpdateProfileDto) => userService.updateProfile(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: userKeys.profile });
            toast.success('Perfil actualizado exitosamente');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Error al actualizar perfil');
        },
    });
};

export const useChangePassword = () => {
    return useMutation({
        mutationFn: (data: ChangePasswordDto) => userService.changePassword(data),
        onSuccess: () => {
            toast.success('Contraseña cambiada exitosamente');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Error al cambiar contraseña');
        },
    });
};