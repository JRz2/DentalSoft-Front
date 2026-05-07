export interface Clinic {
    id: number;
    name: string;
    subdomain: string;
    phone?: string;
    email?: string;
    address?: string;
    logoUrl?: string;
    faviconUrl?: string;
    isActive?: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface CreateClinicDto {
    name: string;
    subdomain: string;
    phone?: string;
    email?: string;
    address?: string;
    logoUrl?: string;
    faviconUrl?: string;
}

export interface UpdateClinicDto {
    name?: string;
    subdomain?: string;
    phone?: string;
    email?: string;
    address?: string;
    logoUrl?: string;
    faviconUrl?: string;
    isActive?: boolean;
}