import api from "./api";

export interface CreateAppointmentDto {
    patientId: number;
    doctorId: number;
    appointmentDate: string;
    duration?: number;
    reason: string;
    treatmentId: number;
    notes?: string;
}

export const appointmentService = {
    create: async (data: CreateAppointmentDto) => {
        const response = await api.post(`/appointment`, data);
        return response.data;
    }
}