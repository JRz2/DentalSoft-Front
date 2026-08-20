import api from './api';
import { Treatment, CreateTreatmentDto, UpdateTreatmentDto } from '@/types/treatment';

export const treatmentService = {
    // Obtener tratamientos por paciente
    getByPatientId: async (patientId: number): Promise<Treatment[]> => {
        const response = await api.get(`/treatment/patient/${patientId}`);
        return response.data;
    },

    // Obtener todos los tratamientos de la clínica
    getAll: async (): Promise<Treatment[]> => {
        const response = await api.get('/treatment');
        return response.data;
    },

    // Obtener un tratamiento por ID
    getById: async (id: number): Promise<Treatment> => {
        const response = await api.get(`/treatment/${id}`);
        return response.data;
    },

    // Crear tratamiento
    create: async (clinicalHistoryId: number, data: CreateTreatmentDto): Promise<Treatment> => {
        const response = await api.post(`/treatment/${clinicalHistoryId}`, data);
        return response.data;
    },

    // Actualizar tratamiento
    update: async (id: number, data: UpdateTreatmentDto): Promise<Treatment> => {
        const response = await api.put(`/treatment/${id}`, data);
        return response.data;
    },

    // Cancelar tratamiento
    cancel: async (id: number): Promise<void> => {
        await api.delete(`/treatment/${id}`);
    },

    registerPayment: async (treatmentId: number, data: {
        amount: number;
        paymentMethod: string;
        reference?: string;
        notes?: string;
    }): Promise<any> => {
        const response = await api.post(`/treatment/${treatmentId}/payment`, data);
        return response.data;
    },
};