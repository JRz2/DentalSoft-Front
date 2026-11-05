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

    upload: async (file: File, data: CreateMediaDto): Promise<Media> => {
        // 1. Pedir URL prefirmada
        const { data: uploadData } = await api.post('/storage/upload-url', {
            folder: `media/${data.treatmentId}`,
            contentType: file.type,
        });

        if (uploadData.mode === 'local') {
            // MODO LOCAL: Subimos con FormData clásico
            const formData = new FormData();
            formData.append('file', file);
            formData.append('treatmentId', data.treatmentId.toString());
            if (data.sessionId) formData.append('sessionId', data.sessionId.toString());
            formData.append('mediaType', data.mediaType);
            if (data.category) formData.append('category', data.category);
            if (data.title) formData.append('title', data.title);
            if (data.description) formData.append('description', data.description);

            const response = await api.post('/media/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            return response.data;
        } else {
            // MODO B2: Subimos directo a Backblaze con PUT
            const uploadResponse = await fetch(uploadData.uploadUrl, {
                method: 'PUT',
                body: file,
                headers: { 'Content-Type': file.type },
            });
            if (!uploadResponse.ok) throw new Error('Error al subir a Backblaze');

            // 2. Guardamos la información en la Base de Datos
            // (Enviamos el key de B2 en lugar del archivo físico)
            const response = await api.post('/media', {
                ...data,
                filePath: uploadData.key,
                fileName: file.name,
                fileSize: file.size,
                mimeType: file.type,
            });
            return response.data;
        }
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