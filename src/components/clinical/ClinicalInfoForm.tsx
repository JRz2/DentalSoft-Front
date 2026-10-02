import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogDescription, DialogContent, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { clinicalHistoryService } from '@/services/clinicalHistory.service';
import { toast } from 'sonner';
import { ClinicalHistory } from '@/types/clinicalHistory';
import { Stethoscope, AlertTriangle, FileText, CheckCircle2, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

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
    patientId: number;
    onSuccess: () => void;
}

export function ClinicalInfoForm({
    open,
    onOpenChange,
    clinicalHistory,
    patientId,
    onSuccess,
}: ClinicalInfoFormProps) {
    const queryClient = useQueryClient();

    const updateMutation = useMutation({
        mutationFn: (data: ClinicalInfoFormData) =>
            clinicalHistoryService.update(patientId, data),
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
            <DialogContent className="w-full max-w-[90vw] md:max-w-[80vw] lg:max-w-2xl max-h-[90vh] overflow-y-auto p-0 gap-0">
                {/* Header con gradiente */}
                <div className="bg-gradient-to-r from-primary-50 to-white border-b px-6 py-4 rounded-t-2xl">
                    <DialogHeader>
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="p-2 bg-primary-100 rounded-xl shrink-0">
                                    <Stethoscope className="h-5 w-5 text-primary-600" />
                                </div>
                                <div className="min-w-0">
                                    <DialogTitle className="text-xl font-bold text-gray-900">
                                        Información Clínica
                                    </DialogTitle>
                                    <DialogDescription className="text-sm text-gray-500">
                                        Actualiza los antecedentes médicos del paciente.
                                    </DialogDescription>
                                </div>
                            </div>
                            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200 hidden sm:flex shrink-0">
                                Edición
                            </Badge>
                        </div>
                    </DialogHeader>
                </div>

                {/* Contenido con padding */}
                <div className="px-6 py-6">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="medicalHistory" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                <Stethoscope className="h-4 w-4 text-gray-400" />
                                Antecedentes Médicos
                            </Label>
                            <Textarea
                                id="medicalHistory"
                                {...register('medicalHistory')}
                                placeholder="Hipertensión, diabetes, cirugías previas..."
                                rows={3}
                                className="w-full resize-none"
                            />
                            <p className="text-xs text-gray-500">Historial médico relevante del paciente</p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="allergies" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                <AlertTriangle className="h-4 w-4 text-gray-400" />
                                Alergias
                            </Label>
                            <Textarea
                                id="allergies"
                                {...register('allergies')}
                                placeholder="Penicilina, látex, anestesia, etc..."
                                rows={2}
                                className="w-full resize-none"
                            />
                            <p className="text-xs text-gray-500">Medicamentos o sustancias a las que es alérgico</p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="observations" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                <FileText className="h-4 w-4 text-gray-400" />
                                Observaciones Generales
                            </Label>
                            <Textarea
                                id="observations"
                                {...register('observations')}
                                placeholder="Notas adicionales sobre el paciente..."
                                rows={3}
                                className="w-full resize-none"
                            />
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="px-6">
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                disabled={!isDirty || updateMutation.isPending}
                                className="px-8 gap-2 bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-700 hover:to-green-800 text-white shadow-lg shadow-emerald-200/50 hover:shadow-emerald-300/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {updateMutation.isPending ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Guardando...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="h-4 w-4" />
                                        Guardar Cambios
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