import api from './api';
import {
    Appointment,
    CreateAppointmentDto,
    UpdateAppointmentDto,
    AppointmentFilters,
    AvailableSlot
} from '@/types/appointment';

export const appointmentService = {
    // Obtener citas con filtros
    getAll: async (params?: AppointmentFilters): Promise<{ data: Appointment[]; total: number }> => {
        const response = await api.get('/appointment', {
            params: {
                page: params?.page || 1,
                limit: params?.limit || 10,
                startDate: params?.startDate,
                endDate: params?.endDate,
                status: params?.status,
                doctorId: params?.doctorId,
                patientId: params?.patientId,
            }
        });
        return response.data;
    },

    // Obtener cita por ID
    getById: async (id: number): Promise<Appointment> => {
        const response = await api.get(`/appointment/${id}`);
        return response.data;
    },

    // Crear cita
    create: async (data: CreateAppointmentDto): Promise<Appointment> => {
        const response = await api.post('/appointment', data);
        return response.data;
    },

    // Actualizar cita
    update: async (id: number, data: UpdateAppointmentDto): Promise<Appointment> => {
        const response = await api.put(`/appointment/${id}`, data);
        return response.data;
    },

    // Actualizar estado
    updateStatus: async (id: number, status: string, cancellationReason?: string): Promise<Appointment> => {
        const response = await api.patch(`/appointment/${id}/status`, { status, cancellationReason });
        return response.data;
    },

    // Obtener slots disponibles
    getAvailableSlots: async (doctorId: number, date: string): Promise<AvailableSlot[]> => {
        const response = await api.get('/appointment/available-slots', {
            params: { doctorId, date }
        });
        return response.data;
    },

    // Obtener citas por doctor
    getByDoctor: async (doctorId: number, date?: string): Promise<Appointment[]> => {
        const response = await api.get(`/appointment/doctor/${doctorId}`, {
            params: { date }
        });
        return response.data;
    },

    // Obtener citas por paciente
    getByPatient: async (patientId: number): Promise<Appointment[]> => {
        const response = await api.get(`/appointment/patient/${patientId}`);
        return response.data;
    },

    // Eliminar cita
    delete: async (id: number): Promise<void> => {
        await api.delete(`/appointment/${id}`);
    },
};