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
import { useCreateSession } from '@/hooks/useClinicalHistory';

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
    nextSessionNumber: number;
    onSuccess: () => void;
}

export function SessionForm({ 
    open, 
    onOpenChange, 
    treatmentId, 
    nextSessionNumber, 
    onSuccess 
}: SessionFormProps) {
    const createSession = useCreateSession();

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset,
    } = useForm<SessionFormData>({
        resolver: zodResolver(sessionSchema),
        defaultValues: {
            sessionNumber: nextSessionNumber,
            description: '',
            notes: '',
            procedures: '',
            sessionDate: new Date().toISOString().split('T')[0],
        },
    });

    const onSubmit = async (data: SessionFormData) => {
        try {
            const sessionData = {
                treatmentId: treatmentId,
                sessionNumber: data.sessionNumber,
                description: data.description,
                notes: data.notes || '',
                procedures: data.procedures ? { text: data.procedures } : undefined,
                sessionDate: new Date(data.sessionDate).toISOString(),
            };
            
            if (data.notes && data.notes.trim() !== '') {
                sessionData.notes = data.notes;
            }
                
            if (data.procedures && data.procedures.trim() !== '') {
                sessionData.procedures = { text: data.procedures };
            }

            console.log('📦 Creando sesión:', sessionData);
            await createSession.mutateAsync(sessionData);
            
            reset();
            onSuccess();
        } catch (error) {
            console.error('Error al crear sesión:', error);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Registrar Sesión #{nextSessionNumber}</DialogTitle>
                    <DialogDescription>
                        Registre los detalles de la sesión realizada.
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
                            {...register('sessionNumber', { valueAsNumber: true })}
                            disabled
                            className="bg-gray-100"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Descripción de la sesión *</Label>
                        <Textarea
                            id="description"
                            {...register('description')}
                            placeholder="Describa los procedimientos realizados en esta sesión..."
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
                            placeholder="Ej: Apertura coronaria, limpieza de conductos, medicación..."
                            rows={2}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="notes">Notas adicionales</Label>
                        <Textarea
                            id="notes"
                            {...register('notes')}
                            placeholder="Observaciones, recomendaciones para la próxima sesión..."
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
                            {isSubmitting ? 'Registrando...' : 'Registrar Sesión'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}