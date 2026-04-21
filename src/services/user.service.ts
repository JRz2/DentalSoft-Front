import api from './api';
import { User, CreateUserDto, UpdateUserDto, Clinic } from '@/types/user';

export interface UserProfile {
    id: number;
    name: string;
    email: string;
    role: string;
    specialty?: string;
    licenseNumber?: string;
    phoneNumber?: string;
    isActive: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface UpdateProfileDto {
    name?: string;
    email?: string;
    phoneNumber?: string;
    specialty?: string;
    licenseNumber?: string;
}

export interface ChangePasswordDto {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}

export const userService = {
    getProfile: async (): Promise<UserProfile> => {
        const response = await api.get('/users/profile');
        return response.data;
    },

    updateProfile: async (data: UpdateProfileDto): Promise<UserProfile> => {
        const response = await api.patch('/users/profile', data);
        return response.data;
    },

    changePassword: async (data: ChangePasswordDto): Promise<{ message: string }> => {
        const response = await api.post('/users/change-password', data);
        return response.data;
    },

    getUsers: async (params?: { role?: string; clinicId?: number }): Promise<User[]> => {
        const response = await api.get('/users', { params });
        return response.data;
    },

    getUserById: async (id: number): Promise<User> => {
        const response = await api.get(`/users/${id}`);
        return response.data;
    },

    createUser: async (data: CreateUserDto): Promise<User> => {
        const response = await api.post('/users', data);
        return response.data;
    },

    updateUser: async (id: number, data: UpdateUserDto): Promise<User> => {
        const response = await api.patch(`/users/${id}`, data);
        return response.data;
    },

    deleteUser: async (id: number): Promise<void> => {
        const response = await api.delete(`/users/${id}`);
        return response.data;
    },
    
    getClinics: async (): Promise<Clinic[]> => {
        const response = await api.get('/clinics');
        return response.data;
    },
};