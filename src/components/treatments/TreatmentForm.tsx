import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogDescription, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateTreatment } from '@/hooks/useTreatments';
import { User, Coins, CreditCard, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { usePatients } from '@/hooks/usePatients';
import { clinicalHistoryService } from '@/services/clinicalHistory.service';
import { toast } from 'sonner';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandInput } from '@/components/ui/command';
import { cn } from '@/lib/utils';

const treatmentSchema = z.object({
    name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
    description: z.string().optional(),
    type: z.enum(['DIAGNOSIS', 'PREVENTIVE', 'RESTORATIVE', 'ENDODONTIC', 'PERIODONTAL', 'ORTHODONTIC', 'SURGICAL', 'PROSTHETIC', 'AESTHETIC', 'MAINTENANCE']),
    estimatedSessions: z.number().min(1, 'Mínimo 1 sesión').max(20, 'Máximo 20 sesiones'),
    patientId: z.number().min(1, 'Debes seleccionar un paciente'),
    totalCost: z.number()
        .min(1, 'El costo total debe ser mayor a 0')
        .max(999999999, 'El costo es demasiado alto'),
    paymentAmount: z.number()
        .min(0, 'El monto pagado no puede ser negativo')
        .default(0),
    paymentMethod: z.enum(['CASH', 'CARD', 'TRANSFER', 'CHECK', 'OTHER']).optional(),
    paymentReference: z.string().optional(),
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

const paymentMethods = [
    { value: 'CASH', label: 'Efectivo' },
    { value: 'CARD', label: 'Tarjeta' },
    { value: 'TRANSFER', label: 'Transferencia' },
    { value: 'CHECK', label: 'Cheque' },
    { value: 'OTHER', label: 'Otro' },
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
    const [popoverOpen, setPopoverOpen] = useState(false);
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
        resolver: zodResolver(treatmentSchema) as any,
        defaultValues: {
            name: '',
            description: '',
            type: 'DIAGNOSIS',
            estimatedSessions: 1,
            patientId: undefined,
            totalCost: 0,
            paymentAmount: 0,
            paymentMethod: undefined,
            paymentReference: '',
        },
    });

    const selectedPatientId = watch('patientId');
    const selectedPatient = patients?.data?.find(p => p.id === selectedPatientId);
    const totalCost = watch('totalCost') || 0;
    const paymentAmount = watch('paymentAmount') || 0;
    const paymentMethod = watch('paymentMethod');

    const showPaymentFields = paymentAmount > 0 && paymentMethod;
    const remainingBalance = totalCost - paymentAmount;

    useEffect(() => {
        const fetchClinicalHistory = async () => {
            if (selectedPatientId) {
                setIsLoadingClinicalHistory(true);
                try {
                    const clinicalHistory = await clinicalHistoryService.getByPatientId(selectedPatientId);
                    setSelectedClinicalHistoryId(clinicalHistory.id);
                } catch (error) {
                    console.error('Error al obtener historia clínica:', error);
                    toast.error('Error al obtener la historia clínica del paciente');
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

            const treatmentData: any = {
                name: data.name,
                description: data.description,
                type: data.type,
                estimatedSessions: Number(data.estimatedSessions),
                totalCost: Number(data.totalCost),
            };

            if (data.paymentAmount && data.paymentAmount > 0 && data.paymentMethod) {
                treatmentData.paymentAmount = Number(data.paymentAmount);
                treatmentData.paymentMethod = data.paymentMethod;
                if (data.paymentReference) {
                    treatmentData.paymentReference = data.paymentReference;
                }
            }

            await createTreatment.mutateAsync({
                clinicalHistoryId: selectedClinicalHistoryId,
                data: treatmentData,
            });
            reset();
            setSelectedClinicalHistoryId(null);
            onSuccess();
        } catch (error) {
            console.error('Error al crear tratamiento:', error);
        }
    };

    // Función para seleccionar paciente
    const handleSelectPatient = (patientId: number) => {
        setValue('patientId', patientId);
        setPopoverOpen(false); 
        setSearchTerm(''); 
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
                        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    className={cn(
                                        "w-full justify-between",
                                        !selectedPatientId && "text-muted-foreground",
                                        errors.patientId && "border-red-500"
                                    )}
                                >
                                    {selectedPatientId && selectedPatient ? (
                                        <div className="flex items-center gap-2">
                                            <User className="h-4 w-4" />
                                            <span>{selectedPatient.fullName}</span>
                                            <span className="text-xs text-gray-400">#{selectedPatient.medicalRecordNum}</span>
                                        </div>
                                    ) : (
                                        "Buscar paciente..."
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="p-0 w-[400px] max-w-[90vw]" align="start">
                                <Command>
                                    <CommandInput
                                        placeholder="Buscar paciente..."
                                        value={searchTerm}
                                        onValueChange={setSearchTerm}
                                        className="h-10 !border-0 !ring-0 !outline-none focus:!ring-0 focus:!outline-none focus-visible:!ring-0 focus-visible:!outline-none"
                                    />
                                    <div className="py-2">
                                        {patientsLoading ? (
                                            <div className="px-3 py-2 text-sm text-gray-500">Cargando...</div>
                                        ) : patients?.data?.length === 0 ? (
                                            <div className="px-3 py-2 text-sm text-gray-500">No se encontraron pacientes</div>
                                        ) : (
                                            patients?.data?.map((patient) => (
                                                <div
                                                    key={patient.id}
                                                    className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gray-100"
                                                    onClick={() => handleSelectPatient(patient.id)}
                                                >
                                                    <User className="h-4 w-4 text-gray-400" />
                                                    <span>{patient.fullName}</span>
                                                    <span className="text-xs text-gray-400">#{patient.medicalRecordNum}</span>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </Command>
                            </PopoverContent>
                        </Popover>
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

                    {/* Costo total */}
                    <div className="space-y-2">
                        <Label htmlFor="totalCost" className="flex items-center gap-2">
                            <Coins className="h-4 w-4" />
                            Costo total (Bs) *
                        </Label>
                        <Input
                            id="totalCost"
                            type="number"
                            step="0.01"
                            {...register('totalCost', { valueAsNumber: true })}
                            placeholder="0.00"
                            className={errors.totalCost ? 'border-red-500' : ''}
                        />
                        {errors.totalCost && (
                            <p className="text-sm text-red-500">{errors.totalCost.message}</p>
                        )}
                    </div>

                    {/* Pago inicial */}
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4" />
                            Pago inicial
                        </Label>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Input
                                    type="number"
                                    step="0.1"
                                    placeholder="0.00"
                                    value={paymentAmount || ''}
                                    onChange={(e) => {
                                        const rawValue = e.target.value;
                                        if (rawValue === '' || /^\d*\.?\d*$/.test(rawValue)) {
                                            const numValue = parseFloat(rawValue);
                                            if (totalCost > 0 && numValue > totalCost) {
                                                setValue('paymentAmount', totalCost);
                                            } else if (!isNaN(numValue) && numValue >= 0) {
                                                setValue('paymentAmount', numValue);
                                            } else if (rawValue === '' || rawValue === '.') {
                                                setValue('paymentAmount', 0);
                                            }
                                        }
                                    }}
                                    onBlur={() => {
                                        if (paymentAmount > 0) {
                                            setValue('paymentAmount', parseFloat(paymentAmount.toFixed(2)));
                                        }
                                    }}
                                    className={cn(
                                        errors.paymentAmount && "border-red-500 focus-visible:ring-red-500",
                                        paymentAmount > totalCost && totalCost > 0 && "border-red-500 focus-visible:ring-red-500"
                                    )}
                                />
                                {errors.paymentAmount && (
                                    <div className="flex items-center gap-1.5 mt-1.5 text-sm text-red-600">
                                        <AlertCircle className="h-3.5 w-3.5" />
                                        <span>{errors.paymentAmount.message}</span>
                                    </div>
                                )}
                            </div>
                            <div>
                                <Select
                                    onValueChange={(value) => setValue('paymentMethod', value as any)}
                                    value={paymentMethod || ''}
                                >
                                    <SelectTrigger className={errors.paymentMethod ? 'border-red-500' : ''}>
                                        <SelectValue placeholder="Método" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {paymentMethods.map((method) => (
                                            <SelectItem key={method.value} value={method.value}>
                                                {method.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.paymentMethod && (
                                    <p className="text-sm text-red-500">{errors.paymentMethod.message}</p>
                                )}
                            </div>
                        </div>
                        {totalCost > 0 && (
                            <div className="flex justify-between text-xs">
                                <span className="text-gray-500">Máximo permitido: Bs {totalCost.toFixed(2)}</span>
                                {paymentAmount > 0 && paymentAmount <= totalCost && (
                                    <span className="text-green-600">✅ Válido</span>
                                )}
                                {paymentAmount > totalCost && (
                                    <span className="text-red-600">❌ Excede el límite</span>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Referencia de pago */}
                    {showPaymentFields && (
                        <div className="space-y-2">
                            <Label htmlFor="paymentReference">Referencia (voucher, comprobante)</Label>
                            <Input
                                id="paymentReference"
                                {...register('paymentReference')}
                                placeholder="Número de voucher o referencia"
                            />
                        </div>
                    )}

                    {/* Resumen de costos */}
                    {totalCost > 0 && (
                        <div className="bg-gray-50 rounded-lg p-3 space-y-1 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Costo total:</span>
                                <span className="font-medium">Bs {totalCost.toFixed(2)}</span>
                            </div>
                            {paymentAmount > 0 && (
                                <>
                                    <div className="flex justify-between text-blue-600">
                                        <span>Pago inicial:</span>
                                        <span>- Bs {paymentAmount.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between font-semibold">
                                        <span>Saldo pendiente:</span>
                                        <span className={remainingBalance > 0 ? 'text-orange-600' : 'text-green-600'}>
                                            Bs {remainingBalance.toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-gray-500">Estado:</span>
                                        <span className={`
                                            font-medium
                                            ${remainingBalance <= 0 ? 'text-green-600' : ''}
                                            ${remainingBalance > 0 && paymentAmount > 0 ? 'text-yellow-600' : ''}
                                            ${paymentAmount === 0 ? 'text-red-600' : ''}
                                        `}>
                                            {remainingBalance <= 0 ? 'Pagado' : paymentAmount > 0 ? 'Parcial' : 'Pendiente'}
                                        </span>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

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