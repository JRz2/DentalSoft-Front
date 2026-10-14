import { useEffect, useState } from 'react';
import api from '@/services/api';

export interface ClinicConfig {
    id: number;
    businessName: string;
    commercialName: string;
    nit: string | null;
    address: string | null;
    mobile: string | null;
    email: string | null;
    website: string | null;
    legalRepresentative: string | null;
    legalRepresentativeId: string | null;
    contactName: string | null;
    contactPhone: string | null;
    logoUrl: string | null;
    faviconUrl: string | null;
    headerImageUrl: string | null;
    footerText: string | null;
    registrationNumber: string | null;
    licenseNumber: string | null;
    socialMedia: Record<string, string> | null;
    createdAt: string;
    updatedAt: string;
}

interface UseClinicConfigReturn {
    config: ClinicConfig | null;
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

/**
 * Carga la configuración de la clínica del usuario autenticado.
 * Para SUPER_ADMIN requiere pasar `clinicId` explícito.
 */
export function useClinicConfig(clinicId?: number): UseClinicConfigReturn {
    const [config, setConfig] = useState<ClinicConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchConfig = async () => {
        setLoading(true);
        setError(null);
        try {
            const params = clinicId ? { clinicId } : {};
            const res = await api.get<ClinicConfig>('/clinic-config', { params });
            setConfig(res.data);
        } catch (err: any) {
            console.error('Error al cargar config de clínica:', err);
            setError(err.response?.data?.message || 'Error al cargar la configuración');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchConfig();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [clinicId]);

    return { config, loading, error, refetch: fetchConfig };
}