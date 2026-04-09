export interface ClinicalHistory {
    id: number;
    patientId: number;
    odontogram?: any;
    medicalHistory?: string;
    allergies?: string;
    observations?: string;
    createdAt?: string;
    updatedAt?: string;
}

export  interface Treatment {
    id: number;
    name: string;
    description?: string;
    type: 'DIAGNOSIS' | 'PREVENTIVE' | 'RESTORATIVE' | 'ENDODONTIC' | 'PERIODONTAL' | 'ORTHODONTIC' | 'SURGICAL' | 'PROSTHETIC' | 'AESTHETIC' | 'MAINTENANCE';
    estimatedSessions: number;
    status: 'PLANNED' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';
    clinicalHistoryId: number;
    createdAt?: string;
    updatedAt?: string;
}

export interface TreatmentSession {
    id: number;
    treatmentId: number;
    sessionNumber: number;
    description: string;
    notes?: string;
    procedures?: any;
    sessionDate: string;
    appointmentId?: number;
    isCompleted: boolean;
    date?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface CreateTreatmentDto {
    name: string;
    description?: string;
    type: Treatment['type'];
    estimatedSessions: number;
    status?: Treatment['status'];
}

export interface CreateTreatmentSessionDto {
    treatmentId: number;
    sessionNumber: number;
    description: string;
    notes?: string;
    procedures?: any;
    appointmentId?: number;
}