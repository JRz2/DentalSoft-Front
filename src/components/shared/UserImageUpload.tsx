import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, X, User, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/services/api';

interface UserImageUploadProps {
    onImageUploaded: (url: string) => void;
    currentImage?: string;
    userId?: number;
    isNewUser?: boolean;
    onFileSelected?: (file: File) => void;
    onPhotoUploaded?: () => void;
}

export function UserImageUpload({
    onImageUploaded,
    currentImage,
    userId,
    isNewUser = false,
    onFileSelected,
    onPhotoUploaded
}: UserImageUploadProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [preview, setPreview] = useState<string | null>(null);
    const [imageError, setImageError] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Cargar la imagen actual
    useEffect(() => {
        const fetchInitial = async () => {
            if (currentImage && currentImage !== '' && !isNewUser) {
                if (currentImage.startsWith('http') || currentImage.startsWith('/uploads')) {
                    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
                    const cleanBaseUrl = baseUrl.replace(/\/api$/, '');
                    setPreview(currentImage.startsWith('http') ? currentImage : `${cleanBaseUrl}${currentImage}`);
                } else {
                    try {
                        const { data } = await api.get(`/storage/view-url?key=${currentImage}`);
                        setPreview(data.url);
                    } catch (error) {
                        console.error('Error obteniendo URL firmada:', error);
                        setImageError(true);
                    }
                }
                setImageError(false);
            } else if (!currentImage || currentImage === '') {
                if (preview && !preview.startsWith('blob:')) setPreview(null);
            }
        };
        fetchInitial();
    }, [currentImage, isNewUser]);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) return toast.error('Solo se permiten imágenes');
        if (file.size > 5 * 1024 * 1024) return toast.error('La imagen no puede superar los 5MB');

        const localPreview = URL.createObjectURL(file);
        setPreview(localPreview);
        setImageError(false);

        if (isNewUser) {
            if (onFileSelected) onFileSelected(file);
            toast.success('Foto seleccionada, se guardará al crear el usuario');
            return;
        }

        if (!userId) return toast.error('Error: No se encontró el ID del usuario');

        setIsUploading(true);

        try {
            const { data } = await api.post('/storage/upload-url', {
                folder: `usuarios/${userId}`,
                contentType: file.type,
            });

            if (data.mode === 'local') {
                const formData = new FormData();
                formData.append('file', file);
                const response = await api.post(`/users/${userId}/photo`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                const savedUrl = response.data.fileUrl;
                await api.patch(`/users/${userId}`, { photoUrl: savedUrl });
                onImageUploaded(savedUrl);
            } else {
                const uploadResponse = await fetch(data.uploadUrl, {
                    method: 'PUT',
                    body: file,
                    headers: { 'Content-Type': file.type },
                });
                if (!uploadResponse.ok) throw new Error('Error subiendo a Backblaze');
                await api.patch(`/users/${userId}`, { photoUrl: data.key });
                onImageUploaded(data.key);
            }

            toast.success('Foto actualizada exitosamente');
            if (onPhotoUploaded) onPhotoUploaded();
        } catch (error: any) {
            console.error('Error al subir foto:', error);
            toast.error(error.response?.data?.message || 'Error al subir la foto');
            setPreview(null);
        } finally {
            setIsUploading(false);
        }
    };

    const handleRemove = () => {
        if (preview && preview.startsWith('blob:')) URL.revokeObjectURL(preview);
        setPreview(null);
        setImageError(false);
        onImageUploaded('');
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const showPreview = preview && !imageError;

    return (
        <div className="space-y-2">
            <Label>Foto del usuario</Label>
            <div className="flex items-start gap-4">
                <div className="w-24 h-24 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center border-2 border-gray-200">
                    {showPreview ? (
                        <img src={preview} alt="Foto" className="w-full h-full object-cover" onError={() => setImageError(true)} />
                    ) : (
                        <User className="h-12 w-12 text-gray-400" />
                    )}
                </div>
                <div className="flex-1 space-y-2">
                    <div className="flex gap-2">
                        <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="gap-2">
                            {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                            {isUploading ? 'Subiendo...' : 'Seleccionar foto'}
                        </Button>
                        {preview && (
                            <Button type="button" variant="ghost" onClick={handleRemove} className="text-red-600 gap-1">
                                <X className="h-4 w-4" /> Eliminar
                            </Button>
                        )}
                    </div>
                    <Input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                    <p className="text-xs text-gray-500">Formatos: JPG, PNG, GIF, WEBP. Máximo 5MB.</p>
                </div>
            </div>
        </div>
    );
}