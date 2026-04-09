import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    Dialog,
    DialogDescription,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { clinicalHistoryService } from '@/services/clinicalHistory.service';
import { toast } from 'sonner';
import { ClinicalHistory } from '@/types/clinicalHistory';

const clinicalInfoSchema = z.object({
    medicalHistory: z.string().optional(),
    allergies: z.string().optional(),
    observations: z.string().optional(),
});

type ClinicalInfoFormData = z.infer<typeof clinicalInfoSchema>;

interface ClinicalInfoFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    clinicalHistory: ClinicalHistory;
    onSuccess: () => void;
}

export function ClinicalInfoForm({ open, onOpenChange, clinicalHistory, onSuccess }: ClinicalInfoFormProps) {
    const queryClient = useQueryClient();

    const updateMutation = useMutation({
        mutationFn: (data: ClinicalInfoFormData) =>
            clinicalHistoryService.update(clinicalHistory.id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clinicalHistory'] });
            toast.success('Información clínica actualizada');
            onSuccess();
        },
        onError: () => {
            toast.error('Error al actualizar información clínica');
        },
    });

    const {
        register,
        handleSubmit,
        formState: { isDirty },
    } = useForm<ClinicalInfoFormData>({
        resolver: zodResolver(clinicalInfoSchema),
        defaultValues: {
            medicalHistory: clinicalHistory.medicalHistory || '',
            allergies: clinicalHistory.allergies || '',
            observations: clinicalHistory.observations || '',
        },
    });

    const onSubmit = (data: ClinicalInfoFormData) => {
        updateMutation.mutate(data);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Actualizar Información Clínica</DialogTitle>
                        <DialogDescription>
                            Complete los datos para actualizar la Información Clínica
                        </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="medicalHistory">Antecedentes Médicos</Label>
                        <Textarea
                            id="medicalHistory"
                            {...register('medicalHistory')}
                            placeholder="Hipertensión, diabetes, cirugías previas..."
                            rows={3}
                        />
                        <p className="text-xs text-gray-500">Historial médico relevante del paciente</p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="allergies">Alergias</Label>
                        <Textarea
                            id="allergies"
                            {...register('allergies')}
                            placeholder="Penicilina, látex, anestesia, etc..."
                            rows={2}
                        />
                        <p className="text-xs text-gray-500">Medicamentos o sustancias a las que es alérgico</p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="observations">Observaciones Generales</Label>
                        <Textarea
                            id="observations"
                            {...register('observations')}
                            placeholder="Notas adicionales sobre el paciente..."
                            rows={3}
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={!isDirty || updateMutation.isPending}>
                            {updateMutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}