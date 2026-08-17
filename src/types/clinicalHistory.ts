export interface ClinicalHistory {
    id: number;
    patientId: number;
    odontogram?: any;
    medicalHistory?: string;
    allergies?: string;
    observations?: string;
    createdAt?: string;
    updatedAt?: string;
    patient?: {
        id: number;
        fullName: string;
        medicalRecordNum: string;
    };
}

export interface Treatment {
    id: number;
    clinicId: number;
    clinicalHistoryId: number;
    name: string;
    description?: string;
    type: 'DIAGNOSIS' | 'PREVENTIVE' | 'RESTORATIVE' | 'ENDODONTIC' | 'PERIODONTAL' | 'ORTHODONTIC' | 'SURGICAL' | 'PROSTHETIC' | 'AESTHETIC' | 'MAINTENANCE';
    estimatedSessions: number;
    status: 'PLANNED' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';
    startDate?: string;
    endDate?: string;
    totalCost?: number;
    discount?: number;
    finalAmount?: number;
    amountPaid?: number;
    remainingBalance?: number;
    paymentStatus?: 'UNPAID' | 'PARTIAL' | 'PAID' | 'CANCELLED';
    patient?: {
        id: number;
        fullName: string;
        medicalRecordNum: string;
        email?: string;
        phoneNumber?: string;
        birthDate?: string;
        address?: string;
        createdAt?: string;
    };
    createdAt?: string;
    updatedAt?: string;
    sessions?: TreatmentSession[];
    payments?: any[];
}

export interface TreatmentSession {
    id: number;
    treatmentId: number;
    sessionNumber: number;
    description: string;
    notes?: string;
    procedures?: any;
    appointmentId?: number | null;
    sessionDate?: string;
    isCompleted?: boolean;
    completedAt?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface CreateTreatmentDto {
    name: string;
    description?: string;
    type: Treatment['type'];
    estimatedSessions: number;
    totalCost?: number;
    paymentAmount?: number;
    paymentMethod?: string;
    paymentReference?: string;
}

export interface CreateTreatmentSessionDto {
    treatmentId: number;
    sessionNumber: number;
    description: string;
    notes?: string;
    procedures?: any;
    appointmentId?: number;
}