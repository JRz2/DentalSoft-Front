import { useEffect, useState } from 'react';
import api from '@/services/api';

export interface MyClinic {
    id: number;
    name: string;
    subdomain: string;
    phone: string | null;
    email: string | null;
    address: string | null;
    logoUrl: string | null;
    faviconUrl: string | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

interface UseMyClinicReturn {
    clinic: MyClinic | null;
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

/**
 * Carga la clínica del usuario autenticado usando el clinicId del JWT.
 * No requiere pasar ID — el backend lo toma del token.
 */
export function useMyClinic(): UseMyClinicReturn {
    const [clinic, setClinic] = useState<MyClinic | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchClinic = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await api.get<MyClinic>('/clinic/me');
            setClinic(res.data);
        } catch (err: any) {
            console.error('Error al cargar datos de la clínica:', err);
            setError(err.response?.data?.message || 'Error al cargar la clínica');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClinic();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return { clinic, loading, error, refetch: fetchClinic };
}