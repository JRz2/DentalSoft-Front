import api from './api';

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
};