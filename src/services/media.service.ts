import api from './api';

export interface Media {
    id: number;
    clinicId: number;
    treatmentId: number;
    sessionId?: number;
    fileName: string;
    filePath: string;
    fileSize: number;
    mimeType: string;
    mediaType: 'IMAGE' | 'VIDEO' | 'DOCUMENT' | 'XRAY' | 'SCAN' | 'OTHER';
    category?: 'TREATMENT' | 'SESSION' | 'PRE_OPERATIVE' | 'POST_OPERATIVE' | 'INTRAOPERATIVE' | 'DIAGNOSTIC' | 'FOLLOW_UP';
    title?: string;
    description?: string;
    uploadedBy?: string;
    uploadedAt: string;
    updatedAt: string;
}

export interface CreateMediaDto {
    treatmentId: number;
    sessionId?: number;
    mediaType: 'IMAGE' | 'VIDEO' | 'DOCUMENT' | 'XRAY' | 'SCAN' | 'OTHER';
    category?: 'TREATMENT' | 'SESSION' | 'PRE_OPERATIVE' | 'POST_OPERATIVE' | 'INTRAOPERATIVE' | 'DIAGNOSTIC' | 'FOLLOW_UP';
    title?: string;
    description?: string;
}

export const mediaService = {
    // Obtener todas las imágenes de un tratamiento
    getByTreatment: async (treatmentId: number): Promise<Media[]> => {
        const response = await api.get(`/media/treatment/${treatmentId}`);
        return response.data;
    },

    // Obtener imágenes de una sesión específica
    getBySession: async (sessionId: number): Promise<Media[]> => {
        const response = await api.get(`/media/session/${sessionId}`);
        return response.data;
    },

    // Subir una imagen
    upload: async (file: File, data: CreateMediaDto): Promise<Media> => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('treatmentId', data.treatmentId.toString());
        if (data.sessionId) formData.append('sessionId', data.sessionId.toString());
        formData.append('mediaType', data.mediaType);
        if (data.category) formData.append('category', data.category);
        if (data.title) formData.append('title', data.title);
        if (data.description) formData.append('description', data.description);

        const response = await api.post('/media/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    // Eliminar imagen
    delete: async (id: number): Promise<void> => {
        await api.delete(`/media/${id}`);
    },

    // Descargar imagen
    download: async (id: number): Promise<Blob> => {
        const response = await api.get(`/media/${id}/download`, {
            responseType: 'blob',
        });
        return response.data;
    },

    // Actualizar metadatos
    update: async (id: number, data: Partial<CreateMediaDto>): Promise<Media> => {
        const response = await api.patch(`/media/${id}`, data);
        return response.data;
    },
};