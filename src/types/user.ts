export interface User {
    id: number;
    name: string;
    email: string;
    role: 'SUPER_ADMIN' | 'ADMIN' | 'DOCTOR' | 'RECEPTIONIST';
    clinicId?: number;
    clinic?: Clinic;
    specialty?: string;
    licenseNumber?: string;
    phoneNumber?: string;
    isActive: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface Clinic {
    id: number;
    name: string;
    commercialName?: string;
    nit?: string;
    address?: string;
    mobile?: string;
    email?: string;
    logoUrl?: string;
}

export interface CreateUserDto {
    name: string;
    email: string;
    password: string;
    role: 'SUPER_ADMIN' | 'ADMIN' | 'DOCTOR' | 'RECEPTIONIST';
    clinicId?: number;
    specialty?: string;
    licenseNumber?: string;
    phoneNumber?: string;
}

export interface UpdateUserDto {
    name?: string;
    email?: string;
    role?: string;
    clinicId?: number;
    specialty?: string;
    licenseNumber?: string;
    phoneNumber?: string;
    isActive?: boolean;
}