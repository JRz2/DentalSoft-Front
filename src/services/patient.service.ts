import api from './api';
import { Patient, CreatePatientDto, UpdatePatientDto, PaginatedResponse } from '../types/patient';


export const patientService = {
    // Obtener todos los pacientes con paginacion y busqueda
    getAll: async (params?: {
        page?: number;
        limit?: number;
        search?: string;
    }): Promise<PaginatedResponse<Patient>> => {
        const response = await api.get('/patient', { params });
        // Manejar diferentes estructuras de respuesta
        const data = response.data.data || response.data || [];
        const meta = response.data.meta || {
            total: data.length,
            page: params?.page || 1,
            limit: params?.limit || 10
        };
        const mappedData = (Array.isArray(data) ? data : []).map((item: any) => ({
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
            IsActive: item.IsActive,
            photoUrl: item.photoUrl,
            deletedAt: item.deletedAt,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
        }));
        const result = {
            data: mappedData,
            total: meta.total || 0,
            page: meta.page || 1,
            limit: meta.limit || 10,
            totalPages: meta.totalPages || Math.ceil((meta.total || 0) / (meta.limit || 10)) || 1
        };
        return result;
    },
    // Obtener un paciente por ID
    getById: async (id: number): Promise<Patient> => {
        const response = await api.get(`/patient/${id}`);
        return response.data;
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

    // Eliminar paciente (soft delete)
    delete: async (id: number): Promise<void> => {
        try {
            const response = await api.delete(`/patient/${id}`);
            console.log('✅ Paciente eliminado:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('❌ Error al eliminar:', error.response?.data);
            throw error;
        }
    },

};