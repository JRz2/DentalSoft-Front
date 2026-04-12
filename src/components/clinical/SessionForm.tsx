import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCreateSession, useUpdateSession } from '@/hooks/useClinicalHistory';
import { TreatmentSession } from '@/types/clinicalHistory';
import { toast } from 'sonner';

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

    const isEditing = !!sessionToEdit;

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
        }
    }, [open, isEditing, nextSessionNumber, reset]);

    const onSubmit = async (data: SessionFormData) => {
        try {
            if (isEditing && sessionToEdit) {
                const updateData = {
                    description: data.description,
                    notes: data.notes || '',
                    procedures: data.procedures ? { text: data.procedures } : undefined,
                    sessionDate: new Date(data.sessionDate).toISOString(),
                };
                await updateSession.mutateAsync({ id: sessionToEdit.id, data: updateData });
            } else {
                const sessionData = {
                    treatmentId: treatmentId,
                    sessionNumber: data.sessionNumber,
                    description: data.description,
                    notes: data.notes || '',
                    procedures: data.procedures ? { text: data.procedures } : undefined,
                    sessionDate: new Date(data.sessionDate).toISOString(),
                };
                await createSession.mutateAsync(sessionData);
            }

            reset();
            onSuccess();
        } catch (error) {
            console.error('Error al guardar sesión:', error);
            toast.error('Error al guardar la sesión');
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
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

                    <div className="flex justify-end gap-2 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Guardando...' : (isEditing ? 'Actualizar Sesión' : 'Registrar Sesión')}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}