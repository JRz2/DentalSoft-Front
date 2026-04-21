import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService, UpdateProfileDto, ChangePasswordDto } from '@/services/user.service';
import { toast } from 'sonner';
import { CreateUserDto, UpdateUserDto } from '@/types/user';

export const userKeys = {
    profile: ['user-profile'] as const,
    all: ['users'] as const,
    lists: () => [...userKeys.all, 'list'] as const,
    list: (filters: any) => [...userKeys.lists(), filters] as const,
    details: () => [...userKeys.all, 'detail'] as const,
    detail: (id: number) => [...userKeys.details(), id] as const,
    clinics: ['clinics'] as const,
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

export const useUsers = (params?: { role?: string; clinicId?: number }) => {
    return useQuery({
        queryKey: userKeys.list(params || {}),
        queryFn: () => userService.getUsers(params),
    });
};

export const useClinics = () => {
    return useQuery({
        queryKey: userKeys.clinics,
        queryFn: () => userService.getClinics(),
    });
};

export const useCreateUser = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateUserDto) => userService.createUser(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: userKeys.lists() });
            toast.success('Usuario creado exitosamente');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Error al crear usuario');
        },
    });
};

export const useUpdateUser = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: UpdateUserDto }) =>
            userService.updateUser(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: userKeys.lists() });
            toast.success('Usuario actualizado exitosamente');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Error al actualizar usuario');
        },
    });
};

export const useDeleteUser = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => userService.deleteUser(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: userKeys.lists() });
            toast.success('Usuario eliminado exitosamente');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Error al eliminar usuario');
        },
    });
};