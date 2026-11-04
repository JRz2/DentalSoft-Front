import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { X, Loader2, Image as ImageIcon, Camera } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/services/api';
import { PrivateImage } from '@/components/shared/PrivateImage';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface ImageUploadProps {
    onImageUploaded: (url: string, file?: File) => void;
    currentImage?: string;
    label?: string;
    clinicId?: number;
    isNewClinic?: boolean;
    type?: 'logo' | 'favicon';
}

export function ImageUpload({
    onImageUploaded,
    currentImage,
    label = 'Imagen',
    clinicId,
    isNewClinic = false,
    type = 'logo',
}: ImageUploadProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [preview, setPreview] = useState<string | null>(null);
    const [isHovered, setIsHovered] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setPreview(currentImage || null);
    }, [currentImage]);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) return toast.error('Solo se permiten imágenes');
        if (file.size > 5 * 1024 * 1024) return toast.error('La imagen no puede superar los 5MB');

        const localPreview = URL.createObjectURL(file);
        setPreview(localPreview);
        onImageUploaded('', file);

        if (isNewClinic) {
            toast.success('Imagen seleccionada, se guardará al crear la clínica');
            return;
        }

        if (!clinicId) return toast.error('Error: No se encontró el ID de la clínica');

        setIsUploading(true);

        try {
            const { data } = await api.post('/storage/upload-url', {
                folder: `clinicas/${clinicId}/${type}s`,
                contentType: file.type,
            });

            let newKey = '';

            if (data.mode === 'local') {
                const formData = new FormData();
                formData.append('file', file);
                if (clinicId) formData.append('clinicId', clinicId.toString());

                const response = await api.post('/uploads/logo', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                newKey = response.data.fileUrl;
            } else {
                const response = await fetch(data.uploadUrl, {
                    method: 'PUT',
                    body: file,
                    headers: { 'Content-Type': file.type },
                });
                if (!response.ok) throw new Error('Error a B2');
                newKey = data.key;
            }

            await api.patch(`/clinics/${clinicId}`, {
                [`${type}Url`]: newKey
            });

            onImageUploaded(newKey);
            setPreview(newKey);
            toast.success(`${type === 'logo' ? 'Logo' : 'Favicon'} actualizado exitosamente`);
        } catch (error) {
            console.error(error);
            toast.error('Error al subir la imagen');
            setPreview(currentImage || null);
        } finally {
            setIsUploading(false);
        }
    };

    const handleRemove = async () => {
        if (preview && preview.startsWith('blob:')) URL.revokeObjectURL(preview);
        setPreview(null);
        onImageUploaded('');

        if (!isNewClinic && clinicId) {
            try {
                setIsUploading(true);
                await api.patch(`/clinics/${clinicId}`, { [`${type}Url`]: null });
                toast.success('Imagen eliminada');
            } catch (error) {
                toast.error('Error al eliminar la imagen');
            } finally {
                setIsUploading(false);
            }
        }

        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <div className="space-y-3 flex flex-col items-center">
            <Label className="text-sm font-medium text-gray-700">{label}</Label>
            <div
                className="relative w-32 h-32"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                <div className={cn(
                    "w-32 h-32 overflow-hidden flex items-center justify-center border-4 border-primary-100 shadow-lg",
                    type === 'logo' ? "rounded-2xl bg-white" : "rounded-full bg-gray-50"
                )}>
                    {preview ? (
                        <PrivateImage imageKey={preview} alt={label} className="w-full h-full object-cover" />
                    ) : (
                        <ImageIcon className="h-10 w-10 text-gray-300" />
                    )}
                </div>

                {isHovered && !isUploading && (
                    <div className={cn(
                        "absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity",
                        type === 'logo' ? "rounded-2xl" : "rounded-full"
                    )}>
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
                            {preview && (
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
                    <div className={cn(
                        "absolute inset-0 bg-black/50 flex items-center justify-center",
                        type === 'logo' ? "rounded-2xl" : "rounded-full"
                    )}>
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
                {preview ? 'Pasa el mouse para cambiar o eliminar' : 'Haz clic para agregar imagen'}
            </p>
        </div>
    );
}