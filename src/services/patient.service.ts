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
        return response.data;
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