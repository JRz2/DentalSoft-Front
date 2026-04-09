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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useCreateTreatment } from '@/hooks/useClinicalHistory';

const treatmentSchema = z.object({
    name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
    description: z.string().optional(),
    type: z.enum(['DIAGNOSIS', 'PREVENTIVE', 'RESTORATIVE', 'ENDODONTIC', 'PERIODONTAL', 'ORTHODONTIC', 'SURGICAL', 'PROSTHETIC', 'AESTHETIC', 'MAINTENANCE']),
    estimatedSessions: z.number().min(1, 'Mínimo 1 sesión').max(20, 'Máximo 20 sesiones'),
});

type TreatmentFormData = z.infer<typeof treatmentSchema>;

const treatmentTypes = [
    { value: 'DIAGNOSIS', label: 'Diagnóstico' },
    { value: 'PREVENTIVE', label: 'Preventivo' },
    { value: 'RESTORATIVE', label: 'Restaurador' },
    { value: 'ENDODONTIC', label: 'Endodoncia' },
    { value: 'PERIODONTAL', label: 'Periodoncia' },
    { value: 'ORTHODONTIC', label: 'Ortodoncia' },
    { value: 'SURGICAL', label: 'Quirúrgico' },
    { value: 'PROSTHETIC', label: 'Prótesis' },
    { value: 'AESTHETIC', label: 'Estética' },
    { value: 'MAINTENANCE', label: 'Mantenimiento' },
];

interface TreatmentFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    clinicalHistoryId: number;
    onSuccess: () => void;
}

export function TreatmentForm({ open, onOpenChange, clinicalHistoryId, onSuccess }: TreatmentFormProps) {
    const createTreatment = useCreateTreatment();

    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors },
        reset,
    } = useForm<TreatmentFormData>({
        resolver: zodResolver(treatmentSchema),
        defaultValues: {
            name: '',
            description: '',
            type: 'DIAGNOSIS',
            estimatedSessions: 1,
        },
    });

    const onSubmit = async (data: TreatmentFormData) => {
        try {
            await createTreatment.mutateAsync({
                clinicalHistoryId,
                data: {
                    ...data,
                    estimatedSessions: Number(data.estimatedSessions),
                },
            });
            reset();
            onSuccess();
        } catch (error) {
            console.error('Error al crear tratamiento:', error);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Nuevo Tratamiento</DialogTitle>
                    <DialogDescription>
                        Complete los datos para crear un nuevo tratamiento odontológico.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Nombre del tratamiento *</Label>
                        <Input
                            id="name"
                            {...register('name')}
                            placeholder="Ej: Endodoncia Molar 36"
                        />
                        {errors.name && (
                            <p className="text-sm text-red-500">{errors.name.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="type">Tipo de tratamiento *</Label>
                        <Select
                            onValueChange={(value) => setValue('type', value as any)}
                            defaultValue="DIAGNOSIS"
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccionar tipo" />
                            </SelectTrigger>
                            <SelectContent>
                                {treatmentTypes.map((type) => (
                                    <SelectItem key={type.value} value={type.value}>
                                        {type.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.type && (
                            <p className="text-sm text-red-500">{errors.type.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="estimatedSessions">Sesiones estimadas *</Label>
                        <Input
                            id="estimatedSessions"
                            type="number"
                            {...register('estimatedSessions', { valueAsNumber: true })}
                            placeholder="Número de sesiones"
                        />
                        {errors.estimatedSessions && (
                            <p className="text-sm text-red-500">{errors.estimatedSessions.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Descripción</Label>
                        <Textarea
                            id="description"
                            {...register('description')}
                            placeholder="Detalles del tratamiento..."
                            rows={3}
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
                        <Button type="submit" disabled={createTreatment.isPending}>
                            {createTreatment.isPending ? 'Creando...' : 'Crear Tratamiento'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}