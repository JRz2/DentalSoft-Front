export interface Clinic {
    id: number;
    name: string;
    commercialName?: string;
    nit?: string;
    address?: string;
    phone?: string;
    email?: string;
    subdomain?: string;
    logoUrl?: string;
    isActive?: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface CreateClinicDto {
    name: string;
    commercialName?: string;
    nit?: string;
    address?: string;
    phone?: string;
    email?: string;
    subdomain?: string;
    logoUrl?: string;
}

export interface UpdateClinicDto {
    name?: string;
    commercialName?: string;
    nit?: string;
    address?: string;
    phone?: string;
    email?: string;
    subdomain?: string;
    logoUrl?: string;
    isActive?: boolean;
}