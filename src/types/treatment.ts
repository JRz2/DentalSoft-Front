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
    createdAt?: string;
    updatedAt?: string;
    patient?: {
        id: number;
        fullName: string;
        medicalRecordNum: string;
    };
}

export interface CreateTreatmentDto {
    name: string;
    description?: string;
    type: Treatment['type'];
    estimatedSessions: number;
    totalCost: number;
    paymentAmount?: number;     
    paymentMethod?: 'CASH' | 'CARD' | 'TRANSFER' | 'CHECK' | 'OTHER'; 
    paymentReference?: string;
}

export interface UpdateTreatmentDto {
    name?: string;
    description?: string;
    type?: Treatment['type'];
    estimatedSessions?: number;
    status?: Treatment['status'];
}