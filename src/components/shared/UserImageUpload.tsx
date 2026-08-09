import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, X, User, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/services/api';

const getImageUrl = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) {
        return path;
    }
    if (path.startsWith('/')) {
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        const cleanBaseUrl = baseUrl.replace(/\/api$/, '');
        return `${cleanBaseUrl}${path}`;
    }
    return `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/${path}`;
};

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

    // Cargar la imagen actual cuando cambia
    useEffect(() => {
        if (currentImage && currentImage !== '' && !isNewUser) {
            const fullUrl = getImageUrl(currentImage);
            console.log('🖼️ Cargando foto del usuario:', fullUrl);
            setPreview(fullUrl);
            setImageError(false);
        } else if (!currentImage || currentImage === '') {
            if (preview && !preview.startsWith('blob:')) {
                setPreview(null);
            }
        }
    }, [currentImage, isNewUser]);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast.error('Solo se permiten imágenes');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            toast.error('La imagen no puede superar los 5MB');
            return;
        }

        // Previsualización local inmediata
        const localPreview = URL.createObjectURL(file);
        setPreview(localPreview);
        setImageError(false);

        // Si es un usuario nuevo, no subir al servidor todavía
        if (isNewUser) {
            if (onFileSelected) {
                onFileSelected(file);
            }
            toast.success('Foto seleccionada, se guardará al crear el usuario');
            return;
        }

        // Para edición: subir inmediatamente
        if (!userId) {
            toast.error('Error: No se encontró el ID del usuario');
            return;
        }

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const url = `/users/${userId}/photo`;
            console.log('📤 Subiendo foto a:', url);

            const response = await api.post(url, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            const serverUrl = response.data.fileUrl;
            setPreview(getImageUrl(serverUrl));
            setImageError(false);
            onImageUploaded(serverUrl);

            if (onPhotoUploaded) {
                onPhotoUploaded();
            }

            toast.success('Foto actualizada exitosamente');
        } catch (error: any) {
            console.error('Error al subir foto:', error);
            console.error('Respuesta:', error.response?.data);
            toast.error(error.response?.data?.message || 'Error al subir la foto');
            setPreview(currentImage ? getImageUrl(currentImage) : null);
        } finally {
            setIsUploading(false);
        }
    };

    const handleRemove = () => {
        if (preview && preview.startsWith('blob:')) {
            URL.revokeObjectURL(preview);
        }
        setPreview(null);
        setImageError(false);
        onImageUploaded('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleImageError = () => {
        console.error('Error al cargar imagen:', preview);
        setImageError(true);
    };

    const showPreview = preview && !imageError;

    return (
        <div className="space-y-2">
            <Label>Foto del usuario</Label>
            <div className="flex items-start gap-4">
                {/* Preview - Avatar circular */}
                <div className="w-24 h-24 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center border-2 border-gray-200">
                    {showPreview ? (
                        <img
                            src={preview}
                            alt="Foto del usuario"
                            className="w-full h-full object-cover"
                            onError={handleImageError}
                            key={preview}
                        />
                    ) : (
                        <User className="h-12 w-12 text-gray-400" />
                    )}
                </div>

                {/* Botones */}
                <div className="flex-1 space-y-2">
                    <div className="flex gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                            className="gap-2"
                        >
                            {isUploading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Upload className="h-4 w-4" />
                            )}
                            {isUploading ? 'Subiendo...' : 'Seleccionar foto'}
                        </Button>
                        {preview && (
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={handleRemove}
                                className="text-red-600 gap-1"
                            >
                                <X className="h-4 w-4" />
                                Eliminar
                            </Button>
                        )}
                    </div>
                    <Input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                    />
                    <p className="text-xs text-gray-500">
                        Formatos: JPG, PNG, GIF, WEBP. Máximo 5MB.
                    </p>
                </div>
            </div>
        </div>
    );
}