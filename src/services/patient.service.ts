import api from './api';
import { Patient, CreatePatientDto, UpdatePatientDto, PaginatedResponse } from '../types/patient';

export const patientService = {
    getAll: async (params?: {
        page?: number;
        limit?: number;
        search?: string;
    }): Promise<PaginatedResponse<Patient>> => {
        const response = await api.get('/patient', { params });
        const responseData = response.data;

        if (responseData.data && responseData.meta) {
            return {
                data: responseData.data.map((item: any) => ({
                    id: item.id,
                    fullName: item.fullName,
                    phoneNumber: item.phoneNumber,
                    email: item.email,
                    birthDate: item.birthDate ? new Date(item.birthDate).toISOString().split('T')[0] : '',
                    address: item.address,
                    dentalHistory: item.dentalHistory,
                    habits: item.habits,
                    medicalConditions: item.medicalConditions,
                    medicalRecordNum: item.medicalRecordNum,
                    isActive: item.isActive,
                    photoUrl: item.photoUrl,
                    deletedAt: item.deletedAt,
                    createdAt: item.createdAt,
                    updatedAt: item.updatedAt,
                })),
                meta: {
                    total: responseData.meta.total || 0,
                    page: responseData.meta.page || 1,
                    limit: responseData.meta.limit || 10,
                    totalPages: responseData.meta.totalPages || 1,
                    stats: responseData.meta.stats || {
                        totalActive: 0,
                        newThisMonth: 0,
                    },
                },
            };
        }

        const data = Array.isArray(responseData) ? responseData : [];
        return {
            data: data.map((item: any) => ({
                id: item.id,
                fullName: item.fullName,
                phoneNumber: item.phoneNumber,
                email: item.email,
                birthDate: item.birthDate ? new Date(item.birthDate).toISOString().split('T')[0] : '',
                address: item.address,
                dentalHistory: item.dentalHistory,
                habits: item.habits,
                medicalConditions: item.medicalConditions,
                medicalRecordNum: item.medicalRecordNum,
                isActive: item.isActive,
                photoUrl: item.photoUrl,
                deletedAt: item.deletedAt,
                createdAt: item.createdAt,
                updatedAt: item.updatedAt,
            })),
            meta: {
                total: data.length,
                page: params?.page || 1,
                limit: params?.limit || 10,
                totalPages: Math.ceil(data.length / (params?.limit || 10)) || 1,
                stats: {
                    totalActive: data.filter((p: any) => p.isActive).length,
                    newThisMonth: 0,
                },
            },
        };
    },
    
    getById: async (id: number): Promise<Patient> => {
        const response = await api.get(`/patient/${id}`);
        const data = response.data;
        return {
            id: data.id,
            fullName: data.fullName,
            phoneNumber: data.phoneNumber,
            email: data.email,
            birthDate: data.birthDate ? new Date(data.birthDate).toISOString().split('T')[0] : '',
            address: data.address,
            dentalHistory: data.dentalHistory,
            habits: data.habits,
            medicalConditions: data.medicalConditions,
            medicalRecordNum: data.medicalRecordNum,
            isActive: data.isActive,
            photoUrl: data.photoUrl,
            deletedAt: data.deletedAt,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
        };
    },

    // Crear nuevo paciente
    create: async (data: CreatePatientDto): Promise<Patient> => {
        const response = await api.post('/patient', data);
        return response.data;
    },

    // Actualizar paciente
    update: async (id: number, data: UpdatePatientDto): Promise<Patient> => {
        const response = await api.patch(`/patient/${id}`, data);
        return response.data;
    },

    delete: async (id: number): Promise<{ message: string }> => {
        try {
            const response = await api.delete(`/patient/${id}`);
            return response.data;
        } catch (error: any) {
            console.error('❌ Error al eliminar:', error.response?.data);
            throw error;
        }
    },

    restore: async (id: number): Promise<{ message: string }> => {
        const response = await api.patch(`/patient/${id}/restore`);
        return response.data;
    },

    uploadPhoto: async (patientId: number, file: File): Promise<{ photoUrl: string; message: string }> => {
        const formData = new FormData();
        formData.append('file', file);

        const response = await api.post(`/patient/${patientId}/photo`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    deletePhoto: async (patientId: number): Promise<{ message: string }> => {
        const response = await api.delete(`/patient/${patientId}/photo`);
        return response.data;
    },
};