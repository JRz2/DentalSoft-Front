export interface Patient {
    id: number;
    fullName: string;
    phoneNumber: string;
    email: string;
    birthDate: string;
    address?: string;
    dentalHistory?: string;
    habits?: string;
    medicalRecordNum?: string;
    medicalConditions?: string;
    IsActive?: boolean;
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
    dentalHistory?: string;
    habits?: string;
    medicalConditions?: string;
}

export interface UpdatePatientDto {
    fullName?: string;
    phoneNumber?: string;
    email?: string;
    birthDate?: string;
    address?: string;
    dentalHistory?: string;
    habits?: string;
    medicalConditions?: string;
    IsActive?: boolean;
}

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}