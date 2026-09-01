import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useUploadMedia } from '@/hooks/useMedia';
import { CreateMediaDto } from '@/services/media.service';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { useState, useRef } from 'react';
import { cn } from '@/lib/utils';

const uploadSchema = z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    mediaType: z.enum(['IMAGE', 'VIDEO', 'DOCUMENT', 'XRAY', 'SCAN', 'OTHER']),
    category: z.enum(['TREATMENT', 'SESSION', 'PRE_OPERATIVE', 'POST_OPERATIVE', 'INTRAOPERATIVE', 'DIAGNOSTIC', 'FOLLOW_UP']).optional(),
    sessionId: z.string().optional(),
});

type UploadFormData = z.infer<typeof uploadSchema>;

interface UploadImageModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    treatmentId: number;
    sessions?: { id: number; sessionNumber: number }[];
    onSuccess?: () => void;
}

export function UploadImageModal({
    open,
    onOpenChange,
    treatmentId,
    sessions = [],
    onSuccess
}: UploadImageModalProps) {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const uploadMutation = useUploadMedia(treatmentId);

    const { register, handleSubmit, watch, setValue, formState: { errors }, reset } = useForm<UploadFormData>({
        resolver: zodResolver(uploadSchema),
        defaultValues: {
            mediaType: 'IMAGE',
        }
    });

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validar tamaño (5MB)
            if (file.size > 5 * 1024 * 1024) {
                toast.error('El archivo no puede superar los 5MB');
                return;
            }

            // Validar tipo
            const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'video/mp4'];
            if (!validTypes.includes(file.type)) {
                toast.error('Formato no soportado. Use: JPG, PNG, GIF, WEBP, PDF o MP4');
                return;
            }

            setSelectedFile(file);
            const reader = new FileReader();
            reader.onload = (e) => {
                setPreviewUrl(e.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const removeFile = () => {
        setSelectedFile(null);
        setPreviewUrl(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const onSubmit = async (data: UploadFormData) => {
        if (!selectedFile) {
            toast.error('Por favor selecciona un archivo');
            return;
        }

        const uploadData: CreateMediaDto = {
            treatmentId,
            mediaType: data.mediaType,
            title: data.title || undefined,
            description: data.description || undefined,
            category: data.category || undefined,
            sessionId: data.sessionId ? parseInt(data.sessionId) : undefined,
        };

        try {
            await uploadMutation.mutateAsync({
                file: selectedFile,
                data: uploadData,
            });

            reset();
            removeFile();
            onOpenChange(false);
            onSuccess?.();
        } catch (error) {
            // El error ya es manejado en el hook
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <ImageIcon className="h-5 w-5 text-primary-600" />
                        Subir Imagen
                    </DialogTitle>
                    <DialogDescription>
                        Sube imágenes del tratamiento o sesiones para documentar el proceso
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {/* Área de subida de archivos */}
                    <div className="space-y-2">
                        <Label>Archivo <span className="text-red-500">*</span></Label>
                        <div
                            className={cn(
                                "border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer",
                                selectedFile ? "border-green-500 bg-green-50" : "border-gray-300 hover:border-primary-400 hover:bg-gray-50"
                            )}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                className="hidden"
                                accept="image/*,video/mp4,application/pdf"
                                onChange={handleFileSelect}
                            />

                            {previewUrl ? (
                                <div className="relative">
                                    <img
                                        src={previewUrl}
                                        alt="Vista previa"
                                        className="max-h-48 mx-auto rounded-lg object-contain"
                                    />
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        size="icon"
                                        className="absolute -top-2 -right-2 h-7 w-7 rounded-full"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            removeFile();
                                        }}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                    <p className="text-sm text-gray-500 mt-2">
                                        {selectedFile?.name} ({(selectedFile?.size || 0 / 1024).toFixed(0)} KB)
                                    </p>
                                </div>
                            ) : (
                                <div>
                                    <Upload className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                                    <p className="text-gray-600">Haz clic para seleccionar un archivo</p>
                                    <p className="text-xs text-gray-400 mt-1">
                                        Formatos: JPG, PNG, GIF, WEBP, PDF, MP4 (máx. 5MB)
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Título */}
                    <div className="space-y-2">
                        <Label htmlFor="title">Título</Label>
                        <Input
                            id="title"
                            {...register('title')}
                            placeholder="Ej: Radiografía Molar 36"
                        />
                    </div>

                    {/* Descripción */}
                    <div className="space-y-2">
                        <Label htmlFor="description">Descripción</Label>
                        <Textarea
                            id="description"
                            {...register('description')}
                            placeholder="Describe la imagen..."
                            rows={2}
                        />
                    </div>

                    {/* Tipo y Categoría */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                            <Label htmlFor="mediaType">Tipo</Label>
                            <Select
                                onValueChange={(value) => setValue('mediaType', value as any)}
                                value={watch('mediaType') || 'IMAGE'}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Tipo" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="IMAGE">Imagen</SelectItem>
                                    <SelectItem value="XRAY">Radiografía</SelectItem>
                                    <SelectItem value="SCAN">Escáner</SelectItem>
                                    <SelectItem value="VIDEO">Video</SelectItem>
                                    <SelectItem value="DOCUMENT">Documento</SelectItem>
                                    <SelectItem value="OTHER">Otro</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="category">Categoría</Label>
                            <Select
                                onValueChange={(value) => setValue('category', value as any)}
                                value={watch('category') || undefined}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Categoría" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="TREATMENT">Tratamiento</SelectItem>
                                    <SelectItem value="SESSION">Sesión</SelectItem>
                                    <SelectItem value="PRE_OPERATIVE">Pre-operatorio</SelectItem>
                                    <SelectItem value="POST_OPERATIVE">Post-operatorio</SelectItem>
                                    <SelectItem value="INTRAOPERATIVE">Intra-operatorio</SelectItem>
                                    <SelectItem value="DIAGNOSTIC">Diagnóstico</SelectItem>
                                    <SelectItem value="FOLLOW_UP">Seguimiento</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Sesión (opcional) */}
                    {sessions.length > 0 && (
                        <div className="space-y-2">
                            <Label htmlFor="sessionId">Sesión (opcional)</Label>
                            <Select
                                onValueChange={(value) => setValue('sessionId', value)}
                                value={watch('sessionId') || undefined}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Sin sesión" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Sin sesión</SelectItem>
                                    {sessions.map((session) => (
                                        <SelectItem key={session.id} value={session.id.toString()}>
                                            Sesión {session.sessionNumber}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-gray-500">
                                Selecciona una sesión si la imagen está asociada a una sesión específica
                            </p>
                        </div>
                    )}

                    <div className="flex justify-end gap-2 pt-4 border-t">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            disabled={!selectedFile || uploadMutation.isPending}
                            className="gap-2"
                        >
                            <Upload className="h-4 w-4" />
                            {uploadMutation.isPending ? 'Subiendo...' : 'Subir Imagen'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}