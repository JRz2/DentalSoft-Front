import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useUploadMedia } from '@/hooks/useMedia';
import { CreateMediaDto } from '@/services/media.service';
import {
    Upload, Image as ImageIcon, FileText, Tag, CalendarDays, Loader2, Plus, Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const uploadSchema = z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    mediaType: z.enum(['IMAGE', 'XRAY', 'SCAN']),
    category: z.enum([
        'TREATMENT', 'SESSION', 'PRE_OPERATIVE', 'POST_OPERATIVE',
        'INTRAOPERATIVE', 'DIAGNOSTIC', 'FOLLOW_UP',
    ]).optional(),
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

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_FILES = 20;
const VALID_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

export function UploadImageModal({
    open,
    onOpenChange,
    treatmentId,
    sessions = [],
    onSuccess,
}: UploadImageModalProps) {
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
    const fileInputRef = useRef<HTMLInputElement>(null);
    const uploadMutation = useUploadMedia(treatmentId);

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors },
        reset,
    } = useForm<UploadFormData>({
        resolver: zodResolver(uploadSchema),
        defaultValues: {
            mediaType: 'IMAGE',
        },
    });

    const validateAndAddFiles = (files: FileList | File[]) => {
        const newFiles = Array.from(files);

        if (selectedFiles.length + newFiles.length > MAX_FILES) {
            toast.error(`Podés subir hasta ${MAX_FILES} imágenes a la vez`);
            return;
        }

        const validFiles = newFiles.filter((file) => {
            const isValidType = VALID_IMAGE_TYPES.includes(file.type);
            const isValidSize = file.size <= MAX_IMAGE_SIZE;
            if (!isValidType) {
                toast.error(`"${file.name}" no es un formato válido (JPG, PNG, GIF, WEBP)`);
            }
            if (!isValidSize) {
                toast.error(`"${file.name}" excede el tamaño máximo (5MB)`);
            }
            return isValidType && isValidSize;
        });

        if (validFiles.length === 0) return;

        const newPreviews = validFiles.map((file) => URL.createObjectURL(file));
        setSelectedFiles((prev) => [...prev, ...validFiles]);
        setPreviewUrls((prev) => [...prev, ...newPreviews]);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;
        validateAndAddFiles(files);
        e.target.value = '';
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files?.length) {
            validateAndAddFiles(e.dataTransfer.files);
        }
    };

    const removeFile = (index: number) => {
        setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
        setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
    };

    const clearAll = () => {
        previewUrls.forEach((url) => URL.revokeObjectURL(url));
        setSelectedFiles([]);
        setPreviewUrls([]);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const onSubmit = async (data: UploadFormData) => {
        if (selectedFiles.length === 0) {
            toast.error('Seleccioná al menos una imagen');
            return;
        }

        const baseData: Omit<CreateMediaDto, 'title'> = {
            treatmentId,
            mediaType: data.mediaType,
            description: data.description || undefined,
            category: data.category || undefined,
            sessionId:
                data.sessionId && data.sessionId !== 'none'
                    ? parseInt(data.sessionId)
                    : undefined,
        };

        setIsUploading(true);
        setUploadProgress({ current: 0, total: selectedFiles.length });

        try {
            // Subida secuencial con progreso (más confiable que paralelo)
            for (let i = 0; i < selectedFiles.length; i++) {
                await uploadMutation.mutateAsync({
                    file: selectedFiles[i],
                    data: {
                        ...baseData,
                        title: data.title || undefined,
                    },
                });
                setUploadProgress({ current: i + 1, total: selectedFiles.length });
            }

            toast.success(
                selectedFiles.length === 1
                    ? 'Imagen subida correctamente'
                    : `${selectedFiles.length} imágenes subidas correctamente`
            );

            reset();
            clearAll();
            onOpenChange(false);
            onSuccess?.();
        } catch (error) {
            // El error ya es manejado en el hook
        } finally {
            setIsUploading(false);
            setUploadProgress({ current: 0, total: 0 });
        }
    };

    const handleDialogClose = (openValue: boolean) => {
        if (isUploading) return;
        if (!openValue) {
            reset();
            clearAll();
        }
        onOpenChange(openValue);
    };

    const totalSize = selectedFiles.reduce((sum, f) => sum + f.size, 0);
    const hasFiles = selectedFiles.length > 0;

    return (
        <Dialog open={open} onOpenChange={handleDialogClose}>
            <DialogContent className="w-full max-w-[95vw] sm:max-w-lg md:max-w-2xl lg:max-w-4xl max-h-[90vh] overflow-y-auto overflow-x-hidden p-0 gap-0">
                {/* Header con gradiente */}
                <div className="bg-gradient-to-r from-primary-50 to-white border-b px-4 sm:px-6 py-4 rounded-t-2xl">
                    <DialogHeader>
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="p-2 bg-primary-100 rounded-xl shrink-0">
                                    <ImageIcon className="h-5 w-5 text-primary-600" />
                                </div>
                                <div className="min-w-0">
                                    <DialogTitle className="text-lg sm:text-xl font-bold text-gray-900">
                                        Subir imágenes
                                    </DialogTitle>
                                    <DialogDescription className="text-xs sm:text-sm text-gray-500">
                                        Sube imágenes del tratamiento o sesiones · hasta {MAX_FILES} a la vez
                                    </DialogDescription>
                                </div>
                            </div>
                            <Badge
                                variant="outline"
                                className="text-xs bg-blue-50 text-blue-700 border-blue-200 hidden sm:flex shrink-0"
                            >
                                {hasFiles ? `${selectedFiles.length} seleccionada${selectedFiles.length === 1 ? '' : 's'}` : 'Nuevo archivo'}
                            </Badge>
                        </div>
                    </DialogHeader>
                </div>

                {/* Contenido */}
                <div className="px-4 sm:px-6 py-4 sm:py-6">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 sm:space-y-6">
                        {/* Dropzone / Grid de thumbnails */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 flex-wrap">
                                <Label className="text-sm font-medium text-gray-700">
                                    Archivos <span className="text-red-500">*</span>
                                </Label>
                                {hasFiles && (
                                    <>
                                        <Badge variant="secondary" className="text-[10px] h-4 px-1.5 font-medium">
                                            {selectedFiles.length}/{MAX_FILES}
                                        </Badge>
                                        <span className="text-xs text-gray-400">
                                            {(totalSize / 1024 / 1024).toFixed(2)} MB
                                        </span>
                                        <button
                                            type="button"
                                            onClick={clearAll}
                                            disabled={isUploading}
                                            className="text-xs text-red-600 hover:text-red-800 ml-auto disabled:opacity-50"
                                        >
                                            Limpiar todo
                                        </button>
                                    </>
                                )}
                            </div>

                            {/* Input oculto compartido */}
                            <input
                                ref={fileInputRef}
                                id="upload-images"
                                type="file"
                                className="hidden"
                                accept="image/jpeg,image/png,image/gif,image/webp"
                                multiple
                                onChange={handleFileSelect}
                            />

                            {/* ESTADO VACÍO: dropzone grande */}
                            {!hasFiles && (
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                                    onDragLeave={() => setIsDragging(false)}
                                    onDrop={handleDrop}
                                    className={cn(
                                        'border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer',
                                        isDragging
                                            ? 'border-primary-500 bg-primary-50'
                                            : 'border-gray-300 hover:border-primary-400 hover:bg-primary-50/40'
                                    )}
                                >
                                    <div className="flex flex-col items-center gap-1.5">
                                        <div
                                            className={cn(
                                                'p-3 rounded-full transition-colors',
                                                isDragging ? 'bg-primary-100' : 'bg-gray-100'
                                            )}
                                        >
                                            <Upload
                                                className={cn(
                                                    'h-7 w-7 transition-colors',
                                                    isDragging ? 'text-primary-600' : 'text-gray-500'
                                                )}
                                            />
                                        </div>
                                        <p className="text-sm font-medium text-gray-700">
                                            {isDragging
                                                ? 'Soltá las imágenes aquí'
                                                : 'Hacé clic o arrastrá imágenes aquí'}
                                        </p>
                                        <p className="text-xs text-gray-400">
                                            JPG, PNG, GIF o WEBP · máx. 5MB por imagen · hasta {MAX_FILES} imágenes
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* ESTADO CON IMÁGENES: grid de thumbnails + tile añadir */}
                            {hasFiles && (
                                <div
                                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                                    onDragLeave={() => setIsDragging(false)}
                                    onDrop={handleDrop}
                                    className={cn(
                                        'relative rounded-xl transition-colors',
                                        isDragging && 'ring-2 ring-primary-400 ring-offset-2'
                                    )}
                                >
                                    {isDragging && (
                                        <div className="absolute inset-0 z-20 bg-primary-100/90 border-2 border-dashed border-primary-400 rounded-xl flex items-center justify-center pointer-events-none">
                                            <div className="flex flex-col items-center gap-1.5 text-primary-700 font-medium">
                                                <Upload className="h-6 w-6" />
                                                <span className="text-sm">Suelta aquí para agregar más</span>
                                            </div>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                        {/* Tile "Agregar" */}
                                        {selectedFiles.length < MAX_FILES && (
                                            <button
                                                type="button"
                                                onClick={() => fileInputRef.current?.click()}
                                                disabled={isUploading}
                                                className={cn(
                                                    'group relative aspect-square rounded-xl',
                                                    'border-2 border-dashed border-gray-300',
                                                    'hover:border-primary-500 hover:bg-primary-50/60',
                                                    'transition-all duration-200',
                                                    'flex flex-col items-center justify-center gap-1.5',
                                                    'text-gray-500 hover:text-primary-600',
                                                    'disabled:opacity-60 disabled:cursor-not-allowed'
                                                )}
                                                aria-label="Agregar más imágenes"
                                            >
                                                <div className="h-12 w-12 rounded-full bg-gray-100 group-hover:bg-primary-100 flex items-center justify-center transition-colors">
                                                    <Plus className="h-6 w-6" strokeWidth={2.5} />
                                                </div>
                                                <span className="text-xs font-semibold">Agregar</span>
                                                <span className="text-[10px] text-gray-400 group-hover:text-primary-500">
                                                    o arrastrá aquí
                                                </span>
                                            </button>
                                        )}

                                        {/* Thumbnails */}
                                        {selectedFiles.map((file, index) => (
                                            <div
                                                key={`${file.name}-${index}`}
                                                className={cn(
                                                    'group relative aspect-square rounded-xl overflow-hidden',
                                                    'border border-gray-200',
                                                    'ring-1 ring-black/5 hover:ring-2 hover:ring-primary-400',
                                                    'transition-all duration-200'
                                                )}
                                            >
                                                <img
                                                    src={previewUrls[index]}
                                                    alt={file.name}
                                                    className="w-full h-full object-cover"
                                                />

                                                {/* Eliminar — siempre visible en mobile */}
                                                <button
                                                    type="button"
                                                    onClick={() => removeFile(index)}
                                                    disabled={isUploading}
                                                    className={cn(
                                                        'absolute top-2 right-2 h-8 w-8 rounded-full',
                                                        'bg-red-600/95 hover:bg-red-600 text-white',
                                                        'flex items-center justify-center',
                                                        'shadow-lg ring-2 ring-white/90 hover:ring-white',
                                                        'transition-all duration-200 hover:scale-110',
                                                        'opacity-90 sm:opacity-0 sm:group-hover:opacity-100',
                                                        'disabled:opacity-50 disabled:cursor-not-allowed'
                                                    )}
                                                    aria-label="Eliminar"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </button>

                                                {/* Índice */}
                                                <div className="absolute bottom-2 left-2 h-5 min-w-5 px-1.5 rounded-full bg-black/70 backdrop-blur-sm text-white text-[10px] font-medium flex items-center justify-center">
                                                    {index + 1}
                                                </div>

                                                {/* Nombre */}
                                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-2 pt-6 pb-2">
                                                    <p className="text-white text-[10px] truncate">
                                                        {file.name}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Título y Descripción */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="title" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                    <FileText className="h-4 w-4 text-gray-400" />
                                    <span>Título</span>
                                    <span className="text-xs text-gray-400 font-normal">
                                        (aplica a todas)
                                    </span>
                                </Label>
                                <Input
                                    id="title"
                                    {...register('title')}
                                    placeholder="Ej: Radiografía Molar 36"
                                    className={cn('w-full', errors.title && 'border-red-500 focus-visible:ring-red-500')}
                                />
                                {errors.title && (
                                    <p className="text-xs text-red-500">{errors.title.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                                    Descripción
                                </Label>
                                <Textarea
                                    id="description"
                                    {...register('description')}
                                    placeholder="Describe las imágenes..."
                                    rows={2}
                                    className={cn('w-full resize-none', errors.description && 'border-red-500 focus-visible:ring-red-500')}
                                />
                                {errors.description && (
                                    <p className="text-xs text-red-500">{errors.description.message}</p>
                                )}
                            </div>
                        </div>

                        {/* Separador */}
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-background px-2 text-muted-foreground">
                                    Clasificación
                                </span>
                            </div>
                        </div>

                        {/* Tipo y Categoría */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="mediaType" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                    <Tag className="h-4 w-4 text-gray-400" />
                                    <span>Tipo</span>
                                </Label>
                                <Select
                                    onValueChange={(value) => setValue('mediaType', value as any)}
                                    value={watch('mediaType') || 'IMAGE'}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Tipo" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="IMAGE">Imagen</SelectItem>
                                        <SelectItem value="XRAY">Radiografía</SelectItem>
                                        <SelectItem value="SCAN">Escáner</SelectItem>
                                    </SelectContent>
                                </Select>
                                {errors.mediaType && (
                                    <p className="text-xs text-red-500">{errors.mediaType.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="category" className="text-sm font-medium text-gray-700">
                                    Categoría
                                </Label>
                                <Select
                                    onValueChange={(value) => setValue('category', value as any)}
                                    value={watch('category') || undefined}
                                >
                                    <SelectTrigger className="w-full">
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
                                {errors.category && (
                                    <p className="text-xs text-red-500">{errors.category.message}</p>
                                )}
                            </div>
                        </div>

                        {/* Sesión (opcional) */}
                        {sessions.length > 0 && (
                            <div className="space-y-2">
                                <Label htmlFor="sessionId" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                    <CalendarDays className="h-4 w-4 text-gray-400" />
                                    <span>Sesión</span>
                                    <span className="text-xs text-gray-400 font-normal">(opcional)</span>
                                </Label>
                                <Select
                                    onValueChange={(value) => setValue('sessionId', value)}
                                    value={watch('sessionId') || undefined}
                                >
                                    <SelectTrigger className="w-full">
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
                                    Selecciona una sesión si las imágenes pertenecen a una sesión específica
                                </p>
                            </div>
                        )}

                        {/* Botones */}
                        <div className="flex flex-row justify-end gap-3 pt-4 border-t">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => handleDialogClose(false)}
                                disabled={isUploading}
                                className="flex-1 sm:flex-initial min-w-0"
                            >
                                <span className="truncate min-w-0">Cancelar</span>
                            </Button>
                            <Button
                                type="submit"
                                disabled={!hasFiles || isUploading}
                                className={cn(
                                    'flex-1 sm:flex-initial min-w-0 gap-2 text-white',
                                    'bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-700 hover:to-green-800',
                                    'shadow-lg shadow-emerald-200/50 hover:shadow-emerald-300/50',
                                    'transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed'
                                )}
                            >
                                {isUploading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                                        <span className="truncate min-w-0">
                                            {uploadProgress.total > 1
                                                ? `${uploadProgress.current}/${uploadProgress.total}...`
                                                : 'Subiendo...'}
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        <Upload className="h-4 w-4 shrink-0" />
                                        <span className="truncate min-w-0">
                                            {selectedFiles.length > 1
                                                ? `Subir ${selectedFiles.length} imágenes`
                                                : 'Subir imagen'}
                                        </span>
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    );
}