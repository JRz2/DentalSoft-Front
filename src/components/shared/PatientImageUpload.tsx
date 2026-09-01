import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Camera, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/services/api';
import { Input } from '@/components/ui/input';

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

interface PatientImageUploadProps {
    onImageUploaded: (url: string) => void;
    currentImage?: string;
    patientId?: number;
    isNewPatient?: boolean;
    onFileSelected?: (file: File) => void;
    onPhotoUploaded?: () => void;
    patientName?: string;
}

export function PatientImageUpload({
    onImageUploaded,
    currentImage,
    patientId,
    isNewPatient = false,
    onFileSelected,
    onPhotoUploaded,
    patientName,
}: PatientImageUploadProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [preview, setPreview] = useState<string | null>(null);
    const [imageError, setImageError] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const getInitials = (name?: string) => {
        if (!name) return 'Foto';
        return name
            .split(' ')
            .map(word => word[0])
            .slice(0, 2)
            .join('')
            .toUpperCase();
    };

    // Cargar la imagen actual cuando cambia
    useEffect(() => {
        if (currentImage && currentImage !== '' && !isNewPatient) {
            const fullUrl = getImageUrl(currentImage);
            setPreview(fullUrl);
            setImageError(false);
        } else if (!currentImage || currentImage === '') {
            if (preview && !preview.startsWith('blob:')) {
                setPreview(null);
            }
        }
    }, [currentImage, isNewPatient]);

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

        // Si es un paciente nuevo, no subir al servidor todavía
        if (isNewPatient) {
            if (onFileSelected) {
                onFileSelected(file);
            }
            toast.success('Foto seleccionada, se guardará al crear el paciente');
            return;
        }

        // Para edición: subir inmediatamente
        if (!patientId) {
            toast.error('Error: No se encontró el ID del paciente');
            return;
        }

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const url = `/patient/${patientId}/photo`;
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
            toast.error(error.response?.data?.message || 'Error al subir la foto');
            setPreview(currentImage ? getImageUrl(currentImage) : null);
        } finally {
            setIsUploading(false);
        }
    };

    const handleRemove = async () => {
        if (preview && preview.startsWith('blob:')) {
            URL.revokeObjectURL(preview);
        }
        setPreview(null);
        setImageError(false);
        onImageUploaded('');

        // Si es un paciente existente, eliminar del servidor
        if (!isNewPatient && patientId) {
            try {
                setIsUploading(true);
                await api.delete(`/patient/${patientId}/photo`);
                toast.success('Foto eliminada correctamente');
                if (onPhotoUploaded) {
                    onPhotoUploaded();
                }
            } catch (error: any) {
                console.error('Error al eliminar foto:', error);
                toast.error(error.response?.data?.message || 'Error al eliminar la foto');
            } finally {
                setIsUploading(false);
            }
        }

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
        <div className="space-y-3">
            <Label className="text-sm font-medium text-gray-700">Foto del paciente</Label>

            {/* Avatar con overlay */}
            <div
                className="relative w-32 h-32 mx-auto"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                {/* Avatar circular */}
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden flex items-center justify-center border-4 border-primary-100 shadow-lg">
                    {showPreview ? (
                        <img
                            src={preview}
                            alt="Foto del paciente"
                            className="w-full h-full object-cover"
                            onError={handleImageError}
                            key={preview}
                        />
                    ) : (
                        <span className="text-4xl font-medium text-gray-400">
                            {getInitials(patientName)}
                        </span>
                    )}
                </div>

                {/* Overlay al hacer hover */}
                {isHovered && !isUploading && (
                    <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center transition-opacity">
                        <div className="flex gap-3">
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10 rounded-full bg-white/20 hover:bg-white/30 text-white transition-all hover:scale-110"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <Camera className="h-5 w-5" />
                            </Button>
                            {showPreview && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-10 w-10 rounded-full bg-white/20 hover:bg-white/30 text-white transition-all hover:scale-110"
                                    onClick={handleRemove}
                                >
                                    <X className="h-5 w-5" />
                                </Button>
                            )}
                        </div>
                    </div>
                )}

                {/* Spinner de carga */}
                {isUploading && (
                    <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                        <Loader2 className="h-8 w-8 text-white animate-spin" />
                    </div>
                )}

                {/* Input oculto */}
                <Input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                />
            </div>

            {/* Texto de ayuda */}
            <p className="text-xs text-gray-400 text-center">
                {showPreview ? (
                    <span>Pasa el mouse para cambiar o eliminar la foto</span>
                ) : (
                    <span>Pasa el mouse sobre el avatar para agregar una foto</span>
                )}
            </p>
        </div>
    );
}