export interface LoginDto {
    email: string;
    password: string;
}

export interface RegisterDto {
    name: string;
    email: string;
    password: string;
    role?: 'ADMIN' | 'DOCTOR' | 'RECEPTIONIST';
    specialty?: string;
    licenseNumber?: string;
    phoneNumber?: string;
}

export interface User {
    id: number;
    name: string;
    email: string;
    role: string;
    specialty?: string;
    isActive: boolean;
}

export interface AuthResponse {
    token: string;
    user: User;
}

export interface Patient {
    id: number;
    fullName: string;
    phoneNumber: string;
    email: string;
    birthDate: string;
    address?: string;
    dentalHistory?: string;
    habits?: string;
    medicalConditions?: string;
    IsActive?: boolean;
}