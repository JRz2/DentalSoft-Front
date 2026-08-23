import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mediaService, CreateMediaDto } from '@/services/media.service';
import { toast } from 'sonner';

// ✅ Obtener imágenes de un tratamiento
export const useMediaByTreatment = (treatmentId: number) => {
    return useQuery({
        queryKey: ['media', 'treatment', treatmentId],
        queryFn: () => mediaService.getByTreatment(treatmentId),
        enabled: !!treatmentId,
        staleTime: 1000 * 60 * 5,
    });
};

// ✅ Subir imagen
export const useUploadMedia = (treatmentId: number) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ file, data }: { file: File; data: CreateMediaDto }) =>
            mediaService.upload(file, data),
        onSuccess: () => {
            toast.success('Imagen subida correctamente');
            queryClient.invalidateQueries({ queryKey: ['media', 'treatment', treatmentId] });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Error al subir la imagen');
        },
    });
};

// ✅ Eliminar imagen
export const useDeleteMedia = (treatmentId: number) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => mediaService.delete(id),
        onSuccess: () => {
            toast.success('Imagen eliminada correctamente');
            queryClient.invalidateQueries({ queryKey: ['media', 'treatment', treatmentId] });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Error al eliminar la imagen');
        },
    });
};