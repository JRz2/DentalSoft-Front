import api from './api';
import { Clinic, CreateClinicDto, UpdateClinicDto } from '@/types/clinic';

export const clinicService = {
    getAll: async (params?: { search?: string }): Promise<Clinic[]> => {
        const response = await api.get('/clinic', { params });
        return response.data;
    },

    getById: async (id: number): Promise<Clinic> => {
        const response = await api.get(`/clinic/${id}`);
        return response.data;
    },

    create: async (data: CreateClinicDto): Promise<Clinic> => {
        const response = await api.post('/clinic', data);
        return response.data;
    },

    update: async (id: number, data: UpdateClinicDto): Promise<Clinic> => {
        const response = await api.patch(`/clinic/${id}`, data);
        return response.data;
    },

    delete: async (id: number): Promise<void> => {
        await api.delete(`/clinic/${id}`);
    },
};