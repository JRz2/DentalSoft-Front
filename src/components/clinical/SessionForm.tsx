import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCreateSession, useUpdateSession } from '@/hooks/useClinicalHistory';
import { TreatmentSession } from '@/types/clinicalHistory';
import { toast } from 'sonner';
import { useUploadMedia } from '@/hooks/useMedia';
import { Image, Plus, X } from 'lucide-react';

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
}

export function SessionForm({
    open,
    onOpenChange,
    treatmentId,
    nextSessionNumber = 1,
    sessionToEdit,
    onSuccess
}: SessionFormProps) {
    const createSession = useCreateSession();
    const updateSession = useUpdateSession();
    const uploadMedia = useUploadMedia(treatmentId);

    const isEditing = !!sessionToEdit;
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);
    const [isUploading, setIsUploading] = useState(false);

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
    }, [open, isEditing, nextSessionNumber, reset]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

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

    const removeFile = (index: number) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
        setPreviewUrls(prev => {
            const newPreviews = prev.filter((_, i) => i !== index);
            return newPreviews;
        });
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
            //toast.success(`${selectedFiles.length} imagen(es) subidas correctamente`);
        } catch (error) {
            console.error('Error al subir imágenes:', error);
            toast.error('Error al subir algunas imágenes');
        } finally {
            setIsUploading(false);
        }
    };

    const onSubmit = async (data: SessionFormData) => {
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

            reset();
            setSelectedFiles([]);
            setPreviewUrls([]);
            onSuccess();
        } catch (error) {
            console.error('Error al guardar sesión:', error);
            toast.error('Error al guardar la sesión');
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {isEditing ? `Editar Sesión #${sessionToEdit?.sessionNumber}` : `Registrar Sesión #${nextSessionNumber}`}
                    </DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? 'Modifique los detalles de la sesión realizada.'
                            : 'Registre los detalles de la sesión realizada.'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="sessionDate">Fecha de la sesión *</Label>
                        <Input
                            id="sessionDate"
                            type="date"
                            {...register('sessionDate')}
                        />
                        {errors.sessionDate && (
                            <p className="text-sm text-red-500">{errors.sessionDate.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="sessionNumber">Número de sesión *</Label>
                        <Input
                            id="sessionNumber"
                            type="number"
                            value={isEditing ? sessionToEdit?.sessionNumber : nextSessionNumber}
                            disabled
                            className="bg-gray-100"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Descripción de la sesión *</Label>
                        <Textarea
                            id="description"
                            {...register('description')}
                            placeholder="Describa los procedimientos realizados..."
                            rows={3}
                        />
                        {errors.description && (
                            <p className="text-sm text-red-500">{errors.description.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="procedures">Procedimientos realizados</Label>
                        <Textarea
                            id="procedures"
                            {...register('procedures')}
                            placeholder="Ej: Anestesia local, Apertura coronaria, Limpieza de conductos..."
                            rows={2}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="notes">Notas adicionales</Label>
                        <Textarea
                            id="notes"
                            {...register('notes')}
                            placeholder="Observaciones, recomendaciones..."
                            rows={2}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                            <Image className="h-4 w-4" />
                            Imágenes de la sesión
                            <span className="text-xs text-gray-400">(opcional, hasta 5MB por imagen)</span>
                        </Label>

                        {/* Botón para seleccionar archivos */}
                        <div className="flex items-center gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                className="gap-2"
                                onClick={() => document.getElementById('session-images')?.click()}
                                disabled={isEditing}
                            >
                                <Plus className="h-4 w-4" />
                                {selectedFiles.length > 0 ? 'Agregar más imágenes' : 'Seleccionar imágenes'}
                            </Button>
                            <Input
                                id="session-images"
                                type="file"
                                accept="image/*"
                                multiple
                                className="hidden"
                                onChange={handleFileSelect}
                                disabled={isEditing}
                            />
                            {isEditing && (
                                <span className="text-sm text-gray-400">
                                    No se pueden agregar imágenes en edición
                                </span>
                            )}
                        </div>

                        {/* Previews de imágenes */}
                        {previewUrls.length > 0 && (
                            <div className="grid grid-cols-3 gap-2 mt-2">
                                {previewUrls.map((url, index) => (
                                    <div key={index} className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200">
                                        <img
                                            src={url}
                                            alt={`Preview ${index + 1}`}
                                            className="w-full h-full object-cover"
                                        />
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="icon"
                                            className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => removeFile(index)}
                                            disabled={isEditing}
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {selectedFiles.length > 0 && (
                            <p className="text-xs text-gray-500">
                                {selectedFiles.length} imagen(es) seleccionada(s)
                            </p>
                        )}
                    </div>

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
                            disabled={isSubmitting || isUploading}
                            className="gap-2"
                        >
                            {isSubmitting || isUploading ? (
                                <>
                                    <span className="animate-spin">⏳</span>
                                    {isUploading ? 'Subiendo imágenes...' : 'Guardando...'}
                                </>
                            ) : (
                                isEditing ? 'Actualizar Sesión' : 'Registrar Sesión'
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}