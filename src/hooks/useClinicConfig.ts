import { useQuery } from '@tanstack/react-query';
import { clinicConfigService } from '@/services/clinicConfig.service';

export const useClinicConfig = () => {
    return useQuery({
        queryKey: ['clinic-config'],
        queryFn: () => clinicConfigService.getConfig(),
        staleTime: 1000 * 60 * 60, 
    });
};