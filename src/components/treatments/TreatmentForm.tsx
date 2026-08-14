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
import { useCreateTreatment } from '@/hooks/useTreatments';
import { Search, User } from 'lucide-react';
import { useState, useEffect } from 'react';
import { usePatients } from '@/hooks/usePatients';
import { clinicalHistoryService } from '@/services/clinicalHistory.service';
import { toast } from 'sonner';

const treatmentSchema = z.object({
    name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
    description: z.string().optional(),
    type: z.enum(['DIAGNOSIS', 'PREVENTIVE', 'RESTORATIVE', 'ENDODONTIC', 'PERIODONTAL', 'ORTHODONTIC', 'SURGICAL', 'PROSTHETIC', 'AESTHETIC', 'MAINTENANCE']),
    estimatedSessions: z.number().min(1, 'Mínimo 1 sesión').max(20, 'Máximo 20 sesiones'),
    patientId: z.number().min(1, 'Debes seleccionar un paciente'),
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
    onSuccess: () => void;
}

export function TreatmentForm({ open, onOpenChange, onSuccess }: TreatmentFormProps) {
    const createTreatment = useCreateTreatment();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedClinicalHistoryId, setSelectedClinicalHistoryId] = useState<number | null>(null);
    const [isLoadingClinicalHistory, setIsLoadingClinicalHistory] = useState(false);
    const { data: patients, isLoading: patientsLoading } = usePatients({
        search: searchTerm || undefined,
        limit: 20,
    });

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
        reset,
    } = useForm<TreatmentFormData>({
        resolver: zodResolver(treatmentSchema),
        defaultValues: {
            name: '',
            description: '',
            type: 'DIAGNOSIS',
            estimatedSessions: 1,
            patientId: undefined,
        },
    });

    const selectedPatientId = watch('patientId');
    const selectedPatient = patients?.data?.find(p => p.id === selectedPatientId);

    // ✅ Cuando se selecciona un paciente, obtener su historia clínica
    useEffect(() => {
        const fetchClinicalHistory = async () => {
            if (selectedPatientId) {
                setIsLoadingClinicalHistory(true);
                try {
                    const clinicalHistory = await clinicalHistoryService.getByPatientId(selectedPatientId);
                    setSelectedClinicalHistoryId(clinicalHistory.id);
                    console.log('✅ Historia clínica encontrada:', clinicalHistory.id);
                } catch (error) {
                    console.error('Error al obtener historia clínica:', error);
                    toast.error('El paciente no tiene historia clínica asociada');
                    setSelectedClinicalHistoryId(null);
                } finally {
                    setIsLoadingClinicalHistory(false);
                }
            } else {
                setSelectedClinicalHistoryId(null);
            }
        };

        fetchClinicalHistory();
    }, [selectedPatientId]);

    const onSubmit = async (data: TreatmentFormData) => {
        try {
            if (!selectedClinicalHistoryId) {
                toast.error('No se encontró la historia clínica del paciente');
                return;
            }

            await createTreatment.mutateAsync({
                clinicalHistoryId: selectedClinicalHistoryId,
                data: {
                    name: data.name,
                    description: data.description,
                    type: data.type,
                    estimatedSessions: Number(data.estimatedSessions),
                },
            });
            reset();
            setSelectedClinicalHistoryId(null);
            onSuccess();
        } catch (error) {
            console.error('Error al crear tratamiento:', error);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Nuevo Tratamiento</DialogTitle>
                    <DialogDescription>
                        Complete los datos para crear un nuevo tratamiento odontológico.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {/* Selección de paciente */}
                    <div className="space-y-2">
                        <Label>Paciente *</Label>
                        <Select
                            onValueChange={(value) => setValue('patientId', parseInt(value))}
                            value={selectedPatientId?.toString() || ''}
                        >
                            <SelectTrigger className={errors.patientId ? 'border-red-500' : ''}>
                                <SelectValue placeholder="Buscar y seleccionar paciente" />
                            </SelectTrigger>
                            <SelectContent>
                                <div className="flex items-center gap-2 px-3 py-2">
                                    <Search className="h-4 w-4 text-gray-400" />
                                    <Input
                                        placeholder="Buscar paciente..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="h-8 border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                </div>
                                {patientsLoading ? (
                                    <div className="px-3 py-2 text-sm text-gray-500">Cargando...</div>
                                ) : patients?.data?.length === 0 ? (
                                    <div className="px-3 py-2 text-sm text-gray-500">No se encontraron pacientes</div>
                                ) : (
                                    patients?.data?.map((patient) => (
                                        <SelectItem key={patient.id} value={patient.id.toString()}>
                                            <div className="flex items-center gap-2">
                                                <User className="h-4 w-4 text-gray-400" />
                                                <span>{patient.fullName}</span>
                                                <span className="text-xs text-gray-400">#{patient.medicalRecordNum}</span>
                                            </div>
                                        </SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>
                        {selectedPatient && (
                            <div className="flex items-center gap-2 text-sm">
                                <span className="text-gray-500">Paciente:</span>
                                <span className="font-medium">{selectedPatient.fullName}</span>
                                {isLoadingClinicalHistory ? (
                                    <span className="text-gray-400 text-xs">(Verificando historia clínica...)</span>
                                ) : selectedClinicalHistoryId ? (
                                    <span className="text-green-600 text-xs">✅ Historia clínica encontrada</span>
                                ) : selectedPatientId ? (
                                    <span className="text-red-500 text-xs">❌ Sin historia clínica</span>
                                ) : null}
                            </div>
                        )}
                        {errors.patientId && (
                            <p className="text-sm text-red-500">{errors.patientId.message}</p>
                        )}
                    </div>

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
                        <Button
                            type="submit"
                            disabled={createTreatment.isPending || !selectedClinicalHistoryId || isLoadingClinicalHistory}
                        >
                            {createTreatment.isPending ? 'Creando...' : 'Crear Tratamiento'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}