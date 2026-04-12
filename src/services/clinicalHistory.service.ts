import api from './api';
import { ClinicalHistory, Treatment, TreatmentSession, CreateTreatmentDto, CreateTreatmentSessionDto } from '@/types/clinicalHistory';

export const clinicalHistoryService = {
    // Obtener historia clínica por paciente
    getByPatientId: async (patientId: number): Promise<ClinicalHistory> => {
        const response = await api.get(`/clinical-history/${patientId}`);
        return response.data;
    },

    // Crear historia clínica (generalmente automático al crear paciente)
    create: async (patientId: number): Promise<ClinicalHistory> => {
        const response = await api.post('/clinical-history', { patientId });
        return response.data;
    },

    // Actualizar historia clínica
    update: async (id: number, data: Partial<ClinicalHistory>): Promise<ClinicalHistory> => {
        const response = await api.put(`/clinical-history/${id}`, data);
        return response.data;
    },

    // Obtener tratamientos por paciente
    getTreatmentsByPatient: async (patientId: number): Promise<Treatment[]> => {
        const response = await api.get(`/treatment/patient/${patientId}`);
        return response.data;
    },

    // Crear tratamiento
    createTreatment: async (clinicalHistoryId: number, data: CreateTreatmentDto): Promise<Treatment> => {
        const response = await api.post(`/treatment/${clinicalHistoryId}`, data);
        return response.data;
    },

    // Actualizar tratamiento
    updateTreatment: async (id: number, data: Partial<Treatment>): Promise<Treatment> => {
        const response = await api.put(`/treatment/${id}`, data);
        return response.data;
    },

    // Cancelar tratamiento
    cancelTreatment: async (id: number): Promise<void> => {
        await api.delete(`/treatment/${id}`);
    },

    // Crear sesión de tratamiento
    createSession: async (data: CreateTreatmentSessionDto): Promise<TreatmentSession> => {     
        try {
            const response = await api.post('/treatment-session', data);
            return response.data;
        } catch (error: any) {
            throw error;
        }
    },

    // Actualizar sesión
    updateSession: async (id: number, data: Partial<TreatmentSession>): Promise<TreatmentSession> => {
        const response = await api.put(`/treatment-session/${id}`, data);
        return response.data;
    },

    // Completar sesión
    completeSession: async (id: number): Promise<TreatmentSession> => {
        const response = await api.patch(`/treatment-session/${id}/complete`);
        return response.data;
    },

    // Eliminar sesión
    deleteSession: async (id: number): Promise<void> => {
        await api.delete(`/treatment-session/${id}`);
    },

    // Obtener sesiones por tratamiento
    getSessionsByTreatment: async (treatmentId: number): Promise<TreatmentSession[]> => {
        const response = await api.get(`/treatment-session/treatment/${treatmentId}`);
        return response.data;
    },

    getTreatmentById: async (id: number): Promise<Treatment> => {
        const response = await api.get(`/treatment/${id}`);
        return response.data;
    },
};