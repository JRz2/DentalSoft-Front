import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

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

interface ImageUploadProps {
    onImageUploaded: (url: string, file?: File) => void;
    currentImage?: string;
    label?: string;
    clinicId?: number;
    isNewClinic?: boolean;
}

export function ImageUpload({
    onImageUploaded,
    currentImage,
    label = 'Imagen',
    clinicId,
    isNewClinic = false
}: ImageUploadProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [preview, setPreview] = useState<string | null>(null);
    const [imageError, setImageError] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { user } = useAuth();

    // Cargar la imagen actual cuando cambia (solo para edición)
    useEffect(() => {
        if (currentImage && currentImage !== '' && !isNewClinic) {
            const fullUrl = getImageUrl(currentImage);
            setPreview(fullUrl);
            setImageError(false);
        } else if (!currentImage || currentImage === '') {
            if (preview && !preview.startsWith('blob:')) {
                setPreview(null);
            }
        }
    }, [currentImage, isNewClinic]);

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

        // Previsualización local inmediata (siempre funciona)
        const localPreview = URL.createObjectURL(file);
        setPreview(localPreview);
        setImageError(false);

        // Notificar al padre que hay una imagen seleccionada
        onImageUploaded('', file);

        // Si es una nueva clínica, mantener preview local y no subir
        if (isNewClinic) {
            toast.success('Imagen seleccionada, se guardará al crear la clínica');
            return;
        }

        // Para edición: subir inmediatamente
        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        if (user?.role === 'SUPER_ADMIN' && clinicId) {
            formData.append('clinicId', clinicId.toString());
        }

        try {
            const response = await api.post('/uploads/logo', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            const serverUrl = response.data.fileUrl;
            setPreview(getImageUrl(serverUrl));
            setImageError(false);
            onImageUploaded(serverUrl);
            toast.success('Imagen subida exitosamente');
        } catch (error) {
            toast.error('Error al subir la imagen');
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
        setImageError(true);
    };

    const showPreview = preview && !imageError;

    return (
        <div className="space-y-2">
            <Label>{label}</Label>
            <div className="flex items-start gap-4">
                {/* Preview */}
                <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center border">
                    {showPreview ? (
                        <img
                            src={preview}
                            alt="Preview"
                            className="w-full h-full object-cover"
                            onError={handleImageError}
                            key={preview}
                        />
                    ) : (
                        <ImageIcon className="h-8 w-8 text-gray-400" />
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
                            {isUploading ? 'Subiendo...' : 'Seleccionar imagen'}
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