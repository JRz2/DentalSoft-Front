import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Camera, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/services/api';
import { Input } from '@/components/ui/input';

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
        return name.split(' ').map(word => word[0]).slice(0, 2).join('').toUpperCase();
    };

    // Cargar la imagen actual (pidiendo la URL firmada a Backblaze)
    useEffect(() => {
        const fetchSignedUrl = async () => {
            if (currentImage && currentImage !== '' && !isNewPatient) {
                // Si currentImage ya es una URL completa (http), la usamos. 
                // Si es un "key" de Backblaze, pedimos la URL firmada.
                if (currentImage.startsWith('http')) {
                    setPreview(currentImage);
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
                if (preview && !preview.startsWith('blob:')) {
                    setPreview(null);
                }
            }
        };

        fetchSignedUrl();
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

        // Si es un paciente nuevo, no subir a B2 todavía
        if (isNewPatient) {
            if (onFileSelected) {
                onFileSelected(file);
            }
            toast.success('Foto seleccionada, se guardará al crear el paciente');
            return;
        }

        if (!patientId) {
            toast.error('Error: No se encontró el ID del paciente');
            return;
        }

        setIsUploading(true);

        try {
            const { data } = await api.post('/storage/upload-url', {
                folder: `pacientes/${patientId}`,
                contentType: file.type,
            });

            if (data.mode === 'local') {
                // MODO LOCAL
                const formData = new FormData();
                formData.append('file', file);
                // Hacemos la subida clásica a tu backend
                const response = await api.post(`/patient/${patientId}/photo`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });

                // El backend viejo nos devuelve { fileUrl: '/uploads/...' }
                const savedUrl = response.data.fileUrl;

                // Actualizamos la base de datos con esa URL
                await api.patch(`/patient/${patientId}`, { photoUrl: savedUrl });
                onImageUploaded(savedUrl);
            } else {
                // MODO B2 (Backblaze)
                const uploadResponse = await fetch(data.uploadUrl, {
                    method: 'PUT',
                    body: file,
                    headers: { 'Content-Type': file.type },
                });
                if (!uploadResponse.ok) throw new Error('Error al subir a Backblaze');

                // Actualizamos la base de datos con el key de B2
                await api.patch(`/patient/${patientId}`, { photoUrl: data.key });
                onImageUploaded(data.key);
            }

            toast.success('Foto actualizada exitosamente');
            if (onPhotoUploaded) onPhotoUploaded();

        } catch (error: any) {
            console.error('Error al subir foto:', error);
            toast.error(error.response?.data?.message || 'Error al subir la foto');
            setPreview(currentImage || null); 
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

        // Si es un paciente existente, quitamos la foto en la base de datos
        if (!isNewPatient && patientId) {
            try {
                setIsUploading(true);
                // Actualizamos el paciente con photoUrl nulo o vacío
                await api.patch(`/patient/${patientId}`, { photoUrl: null });
                toast.success('Foto eliminada correctamente');
                if (onPhotoUploaded) onPhotoUploaded();
            } catch (error: any) {
                console.error('Error al eliminar foto:', error);
                toast.error(error.response?.data?.message || 'Error al eliminar la foto');
            } finally {
                setIsUploading(false);
            }
        }

        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleImageError = () => {
        setImageError(true);
    };

    const showPreview = preview && !imageError;

    return (
        <div className="space-y-3">
            <Label className="text-sm font-medium text-gray-700">Foto del paciente</Label>

            <div
                className="relative w-32 h-32 mx-auto"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
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

                {isUploading && (
                    <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                        <Loader2 className="h-8 w-8 text-white animate-spin" />
                    </div>
                )}

                <Input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                />
            </div>

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