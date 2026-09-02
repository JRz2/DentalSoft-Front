export interface Patient {
    id: number;
    fullName: string;
    phoneNumber: string;
    email: string;
    birthDate: string;
    address?: string;
    photoUrl?: string;
    dentalHistory?: string;
    habits?: string;
    medicalRecordNum?: string;
    medicalConditions?: string;
    isActive?: boolean;
    deletedAt?: string | null;
    createdAt?: string;
    updatedAt?: string;
}

export interface CreatePatientDto {
    fullName: string;
    phoneNumber: string;
    email: string;
    birthDate: string;
    address?: string;
    photoUrl?: string;
    dentalHistory?: string;
    habits?: string;
    medicalConditions?: string;
    clinicId?: number;
}

export interface UpdatePatientDto {
    fullName?: string;
    phoneNumber?: string;
    email?: string;
    birthDate?: string;
    address?: string;
    photoUrl?: string;
    dentalHistory?: string;
    habits?: string;
    medicalConditions?: string;
    isActive?: boolean;
}

export interface PaginatedResponse<T> {
    data: T[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        stats?: {
            totalActive: number;
            newThisMonth: number;
            totalDeleted?: number;
        };
    };
}