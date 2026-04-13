import api from './api';

export interface ClinicConfig {
    id: number;
    businessName?: string;
    commercialName?: string;
    nit?: string;
    address?: string;
    mobile?: string;
    email?: string;
    website?: string;
    legalRepresentative?: string;
    footerText?: string;
    logoUrl?: string;
    faviconUrl?: string;
    headerImageUrl?: string;
    socialMedia?: any;
}

export const clinicConfigService = {
    getConfig: async (): Promise<ClinicConfig> => {
        const response = await api.get('/clinic-config');
        return response.data;
    },
};