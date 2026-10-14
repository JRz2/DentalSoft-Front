import { useState, useEffect, useCallback, useRef } from 'react';
import { dashboardService } from '@/services/dashboard.service';
import { DashboardData, initialDashboardData } from '@/types/dashboard';

interface UseDashboardReturn {
  data: DashboardData;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useDashboard = (): UseDashboardReturn => {
  const [data, setData] = useState<DashboardData>(initialDashboardData);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  const fetchDashboardData = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setError(null);

      const dashboardData = await dashboardService.getDashboardData();
      if (isMountedRef.current) {
        setData(dashboardData);
      }
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      if (isMountedRef.current) {
        setError(err.message || 'Error al cargar los datos del dashboard');
        setData(initialDashboardData);
      }
    } finally {
      if (isMountedRef.current && !silent) {
        setLoading(false);
      }
    }
  }, []);

  // Fetch inicial
  useEffect(() => {
    isMountedRef.current = true;
    fetchDashboardData();

    return () => {
      isMountedRef.current = false;
    };
  }, [fetchDashboardData]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchDashboardData(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleVisibility);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleVisibility);
    };
  }, [fetchDashboardData]);

  return {
    data,
    loading,
    error,
    refetch: () => fetchDashboardData(false),
  };
};