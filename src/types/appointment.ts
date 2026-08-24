export type AppointmentStatus =
    | 'SCHEDULED'
    | 'CONFIRMED'
    | 'IN_PROGRESS'
    | 'COMPLETED'
    | 'CANCELLED'
    | 'NO_SHOW';

export interface Appointment {
    id: number;
    clinicId: number;
    patientId: number;
    doctorId: number;
    appointmentDate: string;
    duration: number;
    status: AppointmentStatus;
    treatmentId?: number;
    reason: string;
    diagnosis?: string;
    notes?: string;
    createdBy?: number;
    createdAt: string;
    updatedAt: string;
    cancelledAt?: string;
    cancellationReason?: string;
    patient?: {
        id: number;
        fullName: string;
        phoneNumber?: string;
        email?: string;
    };
    doctor?: {
        id: number;
        name: string;
        specialty?: string;
    };
    treatment?: {
        id: number;
        name: string;
        type: string;
    };
}

export interface CreateAppointmentDto {
    patientId: number;
    doctorId: number;
    appointmentDate: string;
    duration?: number;
    reason: string;
    notes?: string;
    treatmentId?: number;
}

export interface UpdateAppointmentDto {
    patientId?: number;
    doctorId?: number;
    appointmentDate?: string;
    duration?: number;
    reason?: string;
    notes?: string;
    treatmentId?: number;
    status?: AppointmentStatus;
}

export interface AppointmentFilters {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
    status?: AppointmentStatus;
    doctorId?: number;
    patientId?: number;
}

export interface AvailableSlot {
    startTime: string;
    endTime: string;
    available: boolean;
}