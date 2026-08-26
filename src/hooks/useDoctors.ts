import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';

export const useDoctors = () => {
    return useQuery({
        queryKey: ['doctors'],
        queryFn: async () => {
            const response = await api.get('/users', {
                params: { role: 'DOCTOR' }
            });
            return response.data;
        },
        staleTime: 1000 * 60 * 5,
    });
};

export const useDoctor = (id: number) => {
    return useQuery({
        queryKey: ['doctor', id],
        queryFn: async () => {
            const response = await api.get(`/users/${id}`);
            return response.data;
        },
        enabled: !!id,
        staleTime: 1000 * 60 * 5,
    });
};

export const useStaff = () => {
    return useQuery({
        queryKey: ['staff'],
        queryFn: async () => {
            const response = await api.get('/users/clinic/staff');
            return response.data;
        },
        staleTime: 1000 * 60 * 5,
    });
};