import { useEffect, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCreateSession, useUpdateSession } from '@/hooks/useClinicalHistory';
import { TreatmentSession } from '@/types/clinicalHistory';
import { toast } from 'sonner';
import { useUploadMedia, useMediaByTreatment, useDeleteMedia } from '@/hooks/useMedia';
import {
    Image, X, ClipboardList, CalendarDays, FileText, StickyNote, CheckCircle2,
    UploadCloud, Trash2, ChevronDown, ChevronUp, ZoomIn, ZoomOut, RotateCw, Download, Lock,
    Plus, Loader2, Eye,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { VisuallyHidden } from '@/components/ui/visually-hidden';

const sessionSchema = z.object({
    sessionNumber: z.number().min(1, 'Número de sesión requerido'),
    description: z.string().min(3, 'Descripción requerida'),
    notes: z.string().optional(),
    procedures: z.string().optional(),
    sessionDate: z.string().min(1, 'Fecha de la sesión requerida'),
});

type SessionFormData = z.infer<typeof sessionSchema>;

interface SessionFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    treatmentId: number;
    nextSessionNumber?: number;
    sessionToEdit?: TreatmentSession | null;
    onSuccess: () => void;
    viewOnly?: boolean;
}

interface GalleryItem {
    key: string;
    url: string;
    isPending: boolean;
    mediaId?: number;
    fileIndex?: number;
}

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
    return path;
};

export function SessionForm({
    open,
    onOpenChange,
    treatmentId,
    nextSessionNumber = 1,
    sessionToEdit,
    onSuccess,
    viewOnly = false,
}: SessionFormProps) {
    const createSession = useCreateSession();
    const updateSession = useUpdateSession();
    const uploadMedia = useUploadMedia(treatmentId);
    const deleteMedia = useDeleteMedia(treatmentId);

    const isEditing = !!sessionToEdit;
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [showAllImages, setShowAllImages] = useState(false);

    const { data: treatmentMedia } = useMediaByTreatment(isEditing ? treatmentId : 0);
    const existingImages = isEditing && sessionToEdit
        ? (treatmentMedia || []).filter((m: any) => m.sessionId === sessionToEdit.id)
        : [];

    const [selectedPreview, setSelectedPreview] = useState<GalleryItem | null>(null);
    const [isViewerOpen, setIsViewerOpen] = useState(false);
    const [zoomLevel, setZoomLevel] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const [panStart, setPanStart] = useState({ x: 0, y: 0 });
    const viewerContainerRef = useRef<HTMLDivElement>(null);

    const MIN_ZOOM = 1;
    const MAX_ZOOM = 3;
    const ZOOM_STEP = 0.25;

    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors, isSubmitting },
        reset,
    } = useForm<SessionFormData>({
        resolver: zodResolver(sessionSchema),
        defaultValues: {
            sessionNumber: isEditing ? sessionToEdit?.sessionNumber || 1 : nextSessionNumber,
            description: isEditing ? sessionToEdit?.description || '' : '',
            notes: isEditing ? sessionToEdit?.notes || '' : '',
            procedures: isEditing ? (() => {
                const proc = sessionToEdit?.procedures;
                if (!proc) return '';
                if (typeof proc === 'string') return proc;
                if (proc.text) return proc.text;
                return '';
            })() : '',
            sessionDate: isEditing && sessionToEdit?.sessionDate
                ? new Date(sessionToEdit.sessionDate).toISOString().split('T')[0]
                : new Date().toISOString().split('T')[0],
        },
    });

    useEffect(() => {
        if (isEditing && sessionToEdit) {
            setValue('sessionNumber', sessionToEdit.sessionNumber);
            setValue('description', sessionToEdit.description);
            setValue('notes', sessionToEdit.notes || '');
            const proc = sessionToEdit.procedures;
            if (proc) {
                if (typeof proc === 'string') {
                    setValue('procedures', proc);
                } else if (proc.text) {
                    setValue('procedures', proc.text);
                }
            }
            if (sessionToEdit.sessionDate) {
                setValue('sessionDate', new Date(sessionToEdit.sessionDate).toISOString().split('T')[0]);
            }
        }
    }, [sessionToEdit, isEditing, setValue]);

    useEffect(() => {
        if (open && !isEditing) {
            reset({
                sessionNumber: nextSessionNumber,
                description: '',
                notes: '',
                procedures: '',
                sessionDate: new Date().toISOString().split('T')[0],
            });
            setSelectedFiles([]);
            setPreviewUrls([]);
        }
        if (!open) {
            setShowAllImages(false);
        }
    }, [open, isEditing, nextSessionNumber, reset]);

    const validateAndAddFiles = (files: FileList | File[]) => {
        if (viewOnly) return;
        const newFiles = Array.from(files);
        const validFiles = newFiles.filter(file => {
            const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
            const isValidType = validTypes.includes(file.type);
            const isValidSize = file.size <= 5 * 1024 * 1024;
            if (!isValidType) toast.error(`"${file.name}" no es un formato válido (JPG, PNG, GIF, WEBP)`);
            if (!isValidSize) toast.error(`"${file.name}" excede el tamaño máximo (5MB)`);
            return isValidType && isValidSize;
        });

        if (validFiles.length === 0) return;

        const newPreviews = validFiles.map(file => URL.createObjectURL(file));
        setSelectedFiles(prev => [...prev, ...validFiles]);
        setPreviewUrls(prev => [...prev, ...newPreviews]);
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
        if (viewOnly) return;
        if (e.dataTransfer.files?.length) {
            validateAndAddFiles(e.dataTransfer.files);
        }
    };

    const removePendingFile = (fileIndex: number) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== fileIndex));
        setPreviewUrls(prev => prev.filter((_, i) => i !== fileIndex));
    };

    const removeExistingImage = async (mediaId: number) => {
        if (!confirm('¿Estás seguro de eliminar esta imagen?')) return;
        try {
            await deleteMedia.mutateAsync(mediaId);
        } catch (error) {
            console.error('Error al eliminar imagen:', error);
            toast.error('Error al eliminar la imagen');
        }
    };

    const uploadImages = async (sessionId: number) => {
        if (selectedFiles.length === 0) return;

        setIsUploading(true);
        const uploadPromises = selectedFiles.map(file => {
            return uploadMedia.mutateAsync({
                file,
                data: {
                    treatmentId,
                    sessionId,
                    mediaType: 'IMAGE',
                    category: 'SESSION',
                    title: `Sesión ${isEditing ? sessionToEdit?.sessionNumber : nextSessionNumber}`,
                }
            });
        });

        try {
            await Promise.all(uploadPromises);
            setSelectedFiles([]);
            setPreviewUrls([]);
        } catch (error) {
            console.error('Error al subir imágenes:', error);
            toast.error('Error al subir algunas imágenes');
        } finally {
            setIsUploading(false);
        }
    };

    const onSubmit = async (data: SessionFormData) => {
        if (viewOnly) return;
        try {
            let sessionId: number;

            if (isEditing && sessionToEdit) {
                const updateData = {
                    description: data.description,
                    notes: data.notes || '',
                    procedures: data.procedures ? { text: data.procedures } : undefined,
                    sessionDate: new Date(data.sessionDate).toISOString(),
                };
                await updateSession.mutateAsync({ id: sessionToEdit.id, data: updateData });
                sessionId = sessionToEdit.id;
            } else {
                const sessionData = {
                    treatmentId: treatmentId,
                    sessionNumber: data.sessionNumber,
                    description: data.description,
                    notes: data.notes || '',
                    procedures: data.procedures ? { text: data.procedures } : undefined,
                    sessionDate: new Date(data.sessionDate).toISOString(),
                };
                const result = await createSession.mutateAsync(sessionData);
                sessionId = result.id;
            }

            if (selectedFiles.length > 0) {
                await uploadImages(sessionId);
            }

            if (!isEditing) {
                reset();
            }
            onSuccess();
        } catch (error) {
            console.error('Error al guardar sesión:', error);
            toast.error('Error al guardar la sesión');
        }
    };

    const galleryItems: GalleryItem[] = [
        ...existingImages.map((img: any) => ({
            key: `existing-${img.id}`,
            url: getImageUrl(img.filePath),
            isPending: false,
            mediaId: img.id,
        })),
        ...previewUrls.map((url, index) => ({
            key: `pending-${index}`,
            url,
            isPending: true,
            fileIndex: index,
        })),
    ];

    const MAX_VISIBLE = 4;
    const visibleItems = showAllImages ? galleryItems : galleryItems.slice(0, MAX_VISIBLE);
    const hasMoreImages = galleryItems.length > MAX_VISIBLE;

    const getDragBounds = () => {
        if (!viewerContainerRef.current) return { minX: -Infinity, maxX: Infinity, minY: -Infinity, maxY: Infinity };
        const w = viewerContainerRef.current.clientWidth;
        const h = viewerContainerRef.current.clientHeight;
        const maxX = Math.max(0, (w * zoomLevel - w) / 2);
        const maxY = Math.max(0, (h * zoomLevel - h) / 2);
        return { minX: -maxX, maxX, minY: -maxY, maxY };
    };

    const clampPosition = (x: number, y: number) => {
        const b = getDragBounds();
        return { x: Math.max(b.minX, Math.min(b.maxX, x)), y: Math.max(b.minY, Math.min(b.maxY, y)) };
    };

    const openViewer = (item: GalleryItem) => {
        setSelectedPreview(item);
        setIsViewerOpen(true);
        setZoomLevel(1);
        setPosition({ x: 0, y: 0 });
    };

    const handleViewerOpenChange = (openValue: boolean) => {
        setIsViewerOpen(openValue);
        if (!openValue) {
            setZoomLevel(1);
            setPosition({ x: 0, y: 0 });
        }
    };

    const zoomIn = () => setZoomLevel(prev => Math.min(prev + ZOOM_STEP, MAX_ZOOM));
    const zoomOut = () => setZoomLevel(prev => {
        const next = Math.max(prev - ZOOM_STEP, MIN_ZOOM);
        if (next === 1) setPosition({ x: 0, y: 0 });
        return next;
    });
    const resetZoom = () => { setZoomLevel(1); setPosition({ x: 0, y: 0 }); };

    const handlePanStart = (e: React.MouseEvent) => {
        if (zoomLevel > 1) {
            setIsPanning(true);
            setPanStart({ x: e.clientX - position.x, y: e.clientY - position.y });
        }
    };
    const handlePanMove = (e: React.MouseEvent) => {
        if (isPanning && zoomLevel > 1) {
            setPosition(clampPosition(e.clientX - panStart.x, e.clientY - panStart.y));
        }
    };
    const handlePanEnd = () => setIsPanning(false);

    useEffect(() => {
        const el = viewerContainerRef.current;
        if (!el || !isViewerOpen) return;
        const onWheel = (e: WheelEvent) => {
            e.preventDefault();
            if (e.deltaY < 0) zoomIn(); else zoomOut();
        };
        el.addEventListener('wheel', onWheel, { passive: false });
        return () => el.removeEventListener('wheel', onWheel);
    }, [zoomLevel, isViewerOpen]);

    const dialogTitle = viewOnly
        ? `Ver Sesión #${sessionToEdit?.sessionNumber}`
        : isEditing
            ? `Editar Sesión #${sessionToEdit?.sessionNumber}`
            : `Registrar Sesión #${nextSessionNumber}`;

    const dialogDescription = viewOnly
        ? 'Consultá los detalles registrados de esta sesión.'
        : isEditing
            ? 'Modificá los detalles de la sesión.'
            : 'Registre los detalles de la sesión realizada.';

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent
                    className="w-full max-w-[90vw] md:max-w-[80vw] lg:max-w-4xl max-h-[90vh] overflow-y-auto p-0 gap-0"
                    onInteractOutside={(e) => {
                        if (isViewerOpen) {
                            e.preventDefault();
                        }
                    }}
                    onPointerDownOutside={(e) => {
                        if (isViewerOpen) {
                            e.preventDefault();
                            e.stopPropagation();
                        }
                    }}
                    onEscapeKeyDown={(e) => {
                        if (isViewerOpen) {
                            e.preventDefault();
                        }
                    }}
                >
                    {/* Header con gradiente */}
                    <div className="bg-gradient-to-r from-primary-50 to-white border-b px-6 py-4 rounded-t-2xl">
                        <DialogHeader>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary-100 rounded-xl">
                                        <ClipboardList className="h-5 w-5 text-primary-600" />
                                    </div>
                                    <div>
                                        <DialogTitle className="text-xl font-bold text-gray-900">
                                            {dialogTitle}
                                        </DialogTitle>
                                        <DialogDescription className="text-sm text-gray-500">
                                            {dialogDescription}
                                        </DialogDescription>
                                    </div>
                                </div>
                                <Badge variant="outline" className={cn(
                                    "text-xs hidden sm:flex",
                                    viewOnly
                                        ? "bg-gray-50 text-gray-600 border-gray-200"
                                        : "bg-blue-50 text-blue-700 border-blue-200"
                                )}>
                                    {viewOnly ? 'Solo lectura' : isEditing ? 'Edición' : `Sesión ${nextSessionNumber}`}
                                </Badge>
                            </div>
                        </DialogHeader>
                    </div>

                    {/* Contenido con padding */}
                    <div className="px-6 py-6">
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            {/* Fecha y Número de sesión */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="sessionDate" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                        <CalendarDays className="h-4 w-4 text-gray-400" />
                                        <span>Fecha de la sesión</span>
                                        {!viewOnly && <span className="text-red-500">*</span>}
                                    </Label>
                                    <Input
                                        id="sessionDate"
                                        type="date"
                                        {...register('sessionDate')}
                                        disabled={viewOnly}
                                        className={cn(
                                            errors.sessionDate ? 'border-red-500 focus-visible:ring-red-500' : '',
                                            viewOnly && 'bg-gray-50 opacity-80 cursor-not-allowed'
                                        )}
                                    />
                                    {errors.sessionDate && (
                                        <p className="text-sm text-red-500">{errors.sessionDate.message}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="sessionNumber" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                        <span>Número de sesión</span>
                                    </Label>
                                    <Input
                                        id="sessionNumber"
                                        type="number"
                                        value={isEditing ? sessionToEdit?.sessionNumber : nextSessionNumber}
                                        disabled
                                        className="bg-gray-100"
                                    />
                                </div>
                            </div>

                            {/* Descripción */}
                            <div className="space-y-2">
                                <Label htmlFor="description" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                    <FileText className="h-4 w-4 text-gray-400" />
                                    <span>Descripción de la sesión</span>
                                    {!viewOnly && <span className="text-red-500">*</span>}
                                </Label>
                                <Textarea
                                    id="description"
                                    {...register('description')}
                                    placeholder="Describa los procedimientos realizados..."
                                    rows={3}
                                    disabled={viewOnly}
                                    className={cn(
                                        "w-full resize-none",
                                        viewOnly && 'bg-gray-50 opacity-80 cursor-not-allowed'
                                    )}
                                />
                                {errors.description && (
                                    <p className="text-sm text-red-500">{errors.description.message}</p>
                                )}
                            </div>

                            {/* Procedimientos y Notas */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="procedures" className="text-sm font-medium text-gray-700">
                                        Procedimientos realizados
                                    </Label>
                                    <Textarea
                                        id="procedures"
                                        {...register('procedures')}
                                        placeholder="Ej: Anestesia local, Apertura coronaria..."
                                        rows={3}
                                        disabled={viewOnly}
                                        className={cn(
                                            "w-full resize-none",
                                            viewOnly && 'bg-gray-50 opacity-80 cursor-not-allowed'
                                        )}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="notes" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                        <StickyNote className="h-4 w-4 text-gray-400" />
                                        <span>Notas adicionales</span>
                                    </Label>
                                    <Textarea
                                        id="notes"
                                        {...register('notes')}
                                        placeholder="Observaciones, recomendaciones..."
                                        rows={3}
                                        disabled={viewOnly}
                                        className={cn(
                                            "w-full resize-none",
                                            viewOnly && 'bg-gray-50 opacity-80 cursor-not-allowed'
                                        )}
                                    />
                                </div>
                            </div>

                            {/* Separador */}
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-background px-2 text-muted-foreground">
                                        Documentación visual
                                    </span>
                                </div>
                            </div>

                            {/* Imágenes de la sesión */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                        <Image className="h-4 w-4 text-gray-400" />
                                        Imágenes de la sesión
                                    </Label>
                                    {galleryItems.length > 0 && (
                                        <Badge variant="secondary" className="text-[10px] h-4 px-1.5 font-medium">
                                            {galleryItems.length}
                                        </Badge>
                                    )}
                                    {!viewOnly && galleryItems.length === 0 && (
                                        <span className="text-xs text-gray-400 font-normal">
                                            (opcional, hasta 5MB por imagen)
                                        </span>
                                    )}
                                </div>

                                <input
                                    id="session-images"
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    className="hidden"
                                    onChange={handleFileSelect}
                                />

                                {galleryItems.length === 0 && (
                                    <>
                                        {viewOnly ? (
                                            <div className="border-2 border-dashed rounded-xl p-6 text-center border-gray-200 bg-gray-50">
                                                <div className="flex flex-col items-center gap-1.5 text-gray-400">
                                                    <Lock className="h-8 w-8" />
                                                    <p className="text-sm font-medium">
                                                        Esta sesión no tiene imágenes registradas
                                                    </p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div
                                                onClick={() => document.getElementById('session-images')?.click()}
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
                                                        <UploadCloud
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
                                                        JPG, PNG, GIF o WEBP · máx. 5MB por imagen
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}

                                {galleryItems.length > 0 && (
                                    <div
                                        onDragOver={(e) => {
                                            e.preventDefault();
                                            if (!viewOnly) setIsDragging(true);
                                        }}
                                        onDragLeave={() => setIsDragging(false)}
                                        onDrop={handleDrop}
                                        className={cn(
                                            'relative rounded-xl transition-colors',
                                            isDragging && !viewOnly && 'ring-2 ring-primary-400 ring-offset-2'
                                        )}
                                    >
                                        {isDragging && !viewOnly && (
                                            <div className="absolute inset-0 z-20 bg-primary-100/90 border-2 border-dashed border-primary-400 rounded-xl flex items-center justify-center pointer-events-none">
                                                <div className="flex flex-col items-center gap-1.5 text-primary-700 font-medium">
                                                    <UploadCloud className="h-6 w-6" />
                                                    <span className="text-sm">Suelta aquí para agregar</span>
                                                </div>
                                            </div>
                                        )}

                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                            {!viewOnly && (
                                                <button
                                                    type="button"
                                                    onClick={() => document.getElementById('session-images')?.click()}
                                                    disabled={isUploading}
                                                    className={cn(
                                                        'group relative aspect-square rounded-xl',
                                                        'border-2 border-dashed border-gray-300',
                                                        'hover:border-primary-500 hover:bg-primary-50/60',
                                                        'transition-all duration-200',
                                                        'flex flex-col items-center justify-center gap-1.5',
                                                        'text-gray-500 hover:text-primary-600',
                                                        'disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:border-gray-300 disabled:hover:bg-transparent'
                                                    )}
                                                    aria-label="Agregar imagen"
                                                >
                                                    <div className="h-12 w-12 rounded-full bg-gray-100 group-hover:bg-primary-100 flex items-center justify-center transition-colors">
                                                        {isUploading ? (
                                                            <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
                                                        ) : (
                                                            <Plus className="h-6 w-6" strokeWidth={2.5} />
                                                        )}
                                                    </div>
                                                    <span className="text-xs font-semibold">
                                                        {isUploading ? 'Subiendo...' : 'Agregar'}
                                                    </span>
                                                    {!isUploading && (
                                                        <span className="text-[10px] text-gray-400 group-hover:text-primary-500">
                                                            o arrastrá aquí
                                                        </span>
                                                    )}
                                                </button>
                                            )}

                                            {visibleItems.map((item) => (
                                                <div
                                                    key={item.key}
                                                    className={cn(
                                                        'group relative aspect-square rounded-xl overflow-hidden',
                                                        'border border-gray-200 cursor-pointer',
                                                        'ring-1 ring-black/5 hover:ring-2 hover:ring-primary-400',
                                                        'transition-all duration-200'
                                                    )}
                                                    onClick={() => openViewer(item)}
                                                >
                                                    <img
                                                        src={item.url}
                                                        alt=""
                                                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                                    />

                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hidden sm:flex items-center justify-center">
                                                        <div className="h-10 w-10 rounded-full bg-white/95 backdrop-blur flex items-center justify-center shadow-lg">
                                                            <Eye className="h-5 w-5 text-gray-800" />
                                                        </div>
                                                    </div>

                                                    {item.isPending && (
                                                        <Badge className="absolute top-2 left-2 text-[10px] bg-blue-600 hover:bg-blue-600 text-white border-0 shadow-md">
                                                            Nueva
                                                        </Badge>
                                                    )}

                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (item.isPending) {
                                                                removePendingFile(item.fileIndex!);
                                                            } else {
                                                                removeExistingImage(item.mediaId!);
                                                            }
                                                        }}
                                                        className={cn(
                                                            'absolute bottom-2 right-2 h-8 w-8 rounded-full',
                                                            'bg-red-600/95 hover:bg-red-600 text-white',
                                                            'flex items-center justify-center',
                                                            'shadow-lg ring-2 ring-white/90 hover:ring-white',
                                                            'transition-all duration-200 hover:scale-110',
                                                            'opacity-90 sm:opacity-0 sm:group-hover:opacity-100'
                                                        )}
                                                        aria-label="Eliminar imagen"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>

                                        {hasMoreImages && (
                                            <div className="flex justify-center mt-4">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setShowAllImages(!showAllImages)}
                                                    className="gap-2"
                                                >
                                                    {showAllImages ? (
                                                        <>
                                                            <ChevronUp className="h-4 w-4" />
                                                            Mostrar menos
                                                        </>
                                                    ) : (
                                                        <>
                                                            <ChevronDown className="h-4 w-4" />
                                                            Mostrar todas ({galleryItems.length})
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Botones */}
                            <div className="flex justify-end gap-3 pt-4 border-t">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => onOpenChange(false)}
                                    className="px-6"
                                >
                                    {viewOnly ? 'Cerrar' : 'Cancelar'}
                                </Button>
                                {!viewOnly && (
                                    <Button
                                        type="submit"
                                        disabled={isSubmitting || isUploading}
                                        className="px-8 gap-2 bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-700 hover:to-green-800 text-white shadow-lg shadow-emerald-200/50 hover:shadow-emerald-300/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isSubmitting || isUploading ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                {isUploading ? 'Subiendo imágenes...' : 'Guardando...'}
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle2 className="h-4 w-4" />

                                                <span className="hidden sm:inline">
                                                    {isEditing ? 'Guardar Cambios' : 'Registrar Sesión'}
                                                </span>

                                                <span className="sm:hidden">
                                                    {isEditing ? 'Guardar' : 'Registrar'}
                                                </span>
                                            </>
                                        )}
                                    </Button>
                                )}
                            </div>
                        </form>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Visor de imagen a pantalla completa con zoom */}
            <Dialog open={isViewerOpen} onOpenChange={handleViewerOpenChange}>
                <DialogContent
                    className="p-0 m-0 bg-transparent border-0 rounded-none shadow-none [&>button]:hidden"
                    onInteractOutside={(e) => {
                        e.preventDefault();
                        handleViewerOpenChange(false);
                    }}
                    onEscapeKeyDown={(e) => {
                        e.preventDefault();
                        handleViewerOpenChange(false);
                    }}
                    onPointerDownOutside={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                    }}
                >
                    <VisuallyHidden>
                        <DialogTitle>Visor de imagen</DialogTitle>
                    </VisuallyHidden>
                    <VisuallyHidden>
                        <DialogDescription>Vista ampliada de la imagen de la sesión</DialogDescription>
                    </VisuallyHidden>

                    <div
                        ref={viewerContainerRef}
                        className="relative w-full h-full flex items-center justify-center bg-black/90 overflow-hidden"
                        onMouseDown={handlePanStart}
                        onMouseMove={handlePanMove}
                        onMouseUp={handlePanEnd}
                        onMouseLeave={handlePanEnd}
                    >
                        <img
                            src={selectedPreview?.url || ''}
                            alt=""
                            className={cn(
                                "object-contain transition-transform duration-200 ease-out select-none",
                                isPanning && "cursor-grabbing",
                                zoomLevel > 1 && "cursor-grab"
                            )}
                            style={{
                                width: '100%',
                                height: '100%',
                                transform: `scale(${zoomLevel}) translate(${position.x / zoomLevel}px, ${position.y / zoomLevel}px)`,
                            }}
                            draggable={false}
                        />

                        {/* Cerrar — FIX mobile: stopPropagation en pointerdown + click */}
                        <button
                            type="button"
                            className={cn(
                                'absolute top-4 right-4 sm:top-6 sm:right-6',
                                'h-10 w-10 rounded-full',
                                'bg-black/60 backdrop-blur-md text-white',
                                'hover:!bg-black/90 hover:!text-white',
                                'active:!bg-black',
                                'flex items-center justify-center',
                                'shadow-xl ring-1 ring-white/20 hover:ring-white/40',
                                'transition-all duration-200',
                                'z-30'
                            )}
                            onPointerDown={(e) => {
                                e.stopPropagation();
                            }}
                            onClick={(e) => {
                                e.stopPropagation();
                                handleViewerOpenChange(false);
                            }}
                            aria-label="Cerrar visor"
                        >
                            <X className="h-5 w-5" />
                        </button>

                        {/* Controles de zoom */}
                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-black/60 backdrop-blur-md rounded-xl p-1.5 shadow-xl ring-1 ring-white/10 z-20">
                            <button
                                type="button"
                                className={cn(
                                    'h-8 w-8 rounded-md flex items-center justify-center',
                                    'text-white hover:!bg-white/20 hover:!text-white',
                                    'disabled:opacity-40 disabled:cursor-not-allowed',
                                    'transition-colors'
                                )}
                                onClick={zoomOut}
                                disabled={zoomLevel <= MIN_ZOOM}
                                aria-label="Reducir zoom"
                            >
                                <ZoomOut className="h-4 w-4" />
                            </button>
                            <span className="text-xs font-medium text-white/90 min-w-[40px] text-center">
                                {Math.round(zoomLevel * 100)}%
                            </span>
                            <button
                                type="button"
                                className={cn(
                                    'h-8 w-8 rounded-md flex items-center justify-center',
                                    'text-white hover:!bg-white/20 hover:!text-white',
                                    'disabled:opacity-40 disabled:cursor-not-allowed',
                                    'transition-colors'
                                )}
                                onClick={zoomIn}
                                disabled={zoomLevel >= MAX_ZOOM}
                                aria-label="Aumentar zoom"
                            >
                                <ZoomIn className="h-4 w-4" />
                            </button>
                            {zoomLevel > 1 && (
                                <button
                                    type="button"
                                    className={cn(
                                        'h-8 w-8 rounded-md flex items-center justify-center',
                                        'text-white hover:!bg-white/20 hover:!text-white',
                                        'transition-colors'
                                    )}
                                    onClick={resetZoom}
                                    aria-label="Resetear zoom"
                                >
                                    <RotateCw className="h-4 w-4" />
                                </button>
                            )}
                        </div>

                        {/* Descargar */}
                        <div className="absolute bottom-6 right-6 z-20">
                            <button
                                type="button"
                                className={cn(
                                    'h-9 px-3 rounded-md',
                                    'bg-black/60 backdrop-blur-md text-white',
                                    'hover:!bg-black/90 hover:!text-white',
                                    'active:!bg-black',
                                    'flex items-center justify-center',
                                    'shadow-xl ring-1 ring-white/20 hover:ring-white/40',
                                    'transition-all duration-200',
                                    'gap-2'
                                )}
                                onPointerDown={(e) => {
                                    e.stopPropagation();
                                }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    window.open(selectedPreview?.url || '', '_blank');
                                }}
                                aria-label="Descargar imagen"
                            >
                                <Download className="h-4 w-4" />
                            </button>
                        </div>

                        {zoomLevel > 1 && (
                            <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white text-xs bg-black/60 backdrop-blur-md px-3 py-1 rounded-full ring-1 ring-white/10 z-20">
                                {Math.round(zoomLevel * 100)}% • Arrastra para mover
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}