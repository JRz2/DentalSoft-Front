import api from './api';
import { Treatment, CreateTreatmentDto, UpdateTreatmentDto } from '@/types/treatment';

export interface RegisterPaymentPayload {
    amount: number;
    paymentMethod: 'CASH' | 'TRANSFER' | 'CARD' | 'CHECK' | 'OTHER';
    reference?: string;
    notes?: string;
}

export interface UpdateCostPayload {
    totalCost: number;
    discount?: number;
    reason?: string;
}

export interface VoidPaymentPayload {
    reason: string;
}

export const treatmentService = {
    // Registrar pago
    registerPayment: async (
        treatmentId: number,
        data: RegisterPaymentPayload,
        idempotencyKey?: string,
    ) => {
        const response = await api.post(
            `/treatment/${treatmentId}/payment`,
            data,
            {
                headers: idempotencyKey
                    ? { 'Idempotency-Key': idempotencyKey }
                    : {},
            },
        );
        return response.data;
    },

    // Anular pago
    voidPayment: async (
        treatmentId: number,
        paymentId: number,
        data: VoidPaymentPayload,
    ) => {
        const response = await api.patch(
            `/treatment/${treatmentId}/payment/${paymentId}/void`,
            data,
        );
        return response.data;
    },

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
        const response = await api.patch(`/treatment/${id}/cancel`);
        return response.data;
    },

    // Iniciar tratamiento (PLANNED -> IN_PROGRESS)
    start: async (id: number): Promise<Treatment> => {
        const response = await api.patch(`/treatment/${id}/start`);
        return response.data;
    },

    // Completar tratamiento (IN_PROGRESS -> COMPLETED)
    complete: async (id: number): Promise<Treatment> => {
        const response = await api.patch(`/treatment/${id}/complete`);
        return response.data;
    },

    updateCost: async (treatmentId: number, data: UpdateCostPayload) => {
        const response = await api.patch(`/treatment/${treatmentId}/cost`, data);
        return response.data;
    },
};