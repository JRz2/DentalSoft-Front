import { useForm, FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogDescription, DialogContent, DialogHeader, DialogTitle, } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useCreateTreatment, useUpdateTreatment } from '@/hooks/useTreatments';
import {
    User, Coins, CreditCard, AlertCircle, CalendarDays, Stethoscope,
    Plus, CheckCircle2, Hash, FileText, Percent, Lock, Loader2,
    Search, Shield, Wrench, Activity, Droplet, AlignCenter, Scissors, Award, Sparkles, Settings,
    AlertTriangle
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { usePatients } from '@/hooks/usePatients';
import { clinicalHistoryService } from '@/services/clinicalHistory.service';
import { toast } from 'sonner';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandInput } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Treatment } from '@/types/treatment';
import { ZeroCostConfirmDialog } from '@/components/treatments/ZeroCostConfirmDialog';

const treatmentSchema = z.object({
    name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
    description: z.string().optional(),
    type: z.enum(['DIAGNOSIS', 'PREVENTIVE', 'RESTORATIVE', 'ENDODONTIC', 'PERIODONTAL', 'ORTHODONTIC', 'SURGICAL', 'PROSTHETIC', 'AESTHETIC', 'MAINTENANCE']),
    estimatedSessions: z.number().min(0, 'Mínimo 0 sesión').max(20, 'Máximo 20 sesiones'),
    patientId: z
        .number({
            error: (issue) =>
                issue.input === undefined
                    ? 'Debes seleccionar un paciente'
                    : 'Paciente inválido',
        })
        .min(1, 'Debes seleccionar un paciente'),
    totalCost: z.number()
        .min(0, 'El costo no puede ser negativo')
        .max(999999999, 'El costo es demasiado alto'),
    discount: z.preprocess(
        (val) => {
            if (val === '' || val === null || val === undefined) return 0;
            const num = Number(val);
            return isNaN(num) ? 0 : num;
        },
        z.number()
            .min(0, 'El descuento no puede ser negativo')
            .max(999999999, 'El descuento es demasiado alto')
            .default(0)
    ),
    paymentAmount: z.preprocess(
        (val) => {
            if (val === '' || val === null || val === undefined) return 0;
            const num = Number(val);
            return isNaN(num) ? 0 : num;
        },
        z.number()
            .min(0, 'El monto pagado no puede ser negativo')
            .default(0)
    ),
    paymentMethod: z.enum(['CASH', 'TRANSFER']).optional(),
    paymentReference: z.string().optional(),
});

type TreatmentFormData = z.infer<typeof treatmentSchema>;

const treatmentTypes = [
    { value: 'DIAGNOSIS', label: 'Diagnóstico', icon: Search },
    { value: 'PREVENTIVE', label: 'Preventivo', icon: Shield },
    { value: 'RESTORATIVE', label: 'Restaurador', icon: Wrench },
    { value: 'ENDODONTIC', label: 'Endodoncia', icon: Activity },
    { value: 'PERIODONTAL', label: 'Periodoncia', icon: Droplet },
    { value: 'ORTHODONTIC', label: 'Ortodoncia', icon: AlignCenter },
    { value: 'SURGICAL', label: 'Quirúrgico', icon: Scissors },
    { value: 'PROSTHETIC', label: 'Prótesis', icon: Award },
    { value: 'AESTHETIC', label: 'Estética', icon: Sparkles },
    { value: 'MAINTENANCE', label: 'Mantenimiento', icon: Settings },
];

const paymentMethods = [
    { value: 'CASH', label: 'Efectivo' },
    { value: 'TRANSFER', label: 'Transferencia' },
];

const paymentMethodLabels: Record<string, string> = {
    CASH: 'Efectivo',
    TRANSFER: 'Transferencia',
};

const defaultFormValues: TreatmentFormData = {
    name: '',
    description: '',
    type: 'DIAGNOSIS',
    estimatedSessions: 0,
    patientId: undefined as any,
    totalCost: 0,
    discount: 0,
    paymentAmount: 0,
    paymentMethod: undefined,
    paymentReference: '',
};

const FIELD_ID_MAP: Record<string, string> = {
    patientId: 'treatment-patient-trigger',
    name: 'treatment-name',
    type: 'treatment-type',
    estimatedSessions: 'treatment-estimatedSessions',
    totalCost: 'treatment-totalCost',
    discount: 'treatment-discount',
    paymentAmount: 'treatment-paymentAmount',
    paymentMethod: 'treatment-paymentMethod',
};

const FIELD_ORDER: (keyof TreatmentFormData)[] = [
    'patientId',
    'name',
    'type',
    'estimatedSessions',
    'totalCost',
    'discount',
    'paymentAmount',
    'paymentMethod',
];

interface TreatmentFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    treatmentToEdit?: Treatment | null;
    onSuccess: () => void;
}

export function TreatmentForm({ open, onOpenChange, treatmentToEdit, onSuccess }: TreatmentFormProps) {
    const createTreatment = useCreateTreatment();
    const updateTreatment = useUpdateTreatment();
    const isEditing = !!treatmentToEdit;

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedClinicalHistoryId, setSelectedClinicalHistoryId] = useState<number | null>(null);
    const [isLoadingClinicalHistory, setIsLoadingClinicalHistory] = useState(false);
    const [popoverOpen, setPopoverOpen] = useState(false);

    const [showZeroCostDialog, setShowZeroCostDialog] = useState(false);
    const [pendingFormData, setPendingFormData] = useState<TreatmentFormData | null>(null);

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
        defaultValues: defaultFormValues,
    });

    const selectedPatientId = watch('patientId');
    const selectedPatient = patients?.data?.find(p => p.id === selectedPatientId);
    const totalCost = watch('totalCost') || 0;
    const discount = watch('discount') || 0;
    const paymentAmount = watch('paymentAmount') || 0;
    const paymentMethod = watch('paymentMethod');

    const finalAmount = totalCost - discount;
    const showReferenceField = !isEditing && paymentAmount > 0 && paymentMethod === 'TRANSFER';
    const remainingBalance = finalAmount - paymentAmount;

    useEffect(() => {
        if (treatmentToEdit) {
            setValue('name', treatmentToEdit.name);
            setValue('description', treatmentToEdit.description || '');
            setValue('type', treatmentToEdit.type as any);
            setValue('estimatedSessions', treatmentToEdit.estimatedSessions || 0);
            setValue('patientId', treatmentToEdit.patient?.id as any);
            setValue('totalCost', treatmentToEdit.totalCost ? Number(treatmentToEdit.totalCost) : 0);
            setValue('discount', (treatmentToEdit as any).discount ? Number((treatmentToEdit as any).discount) : 0);
            setValue('paymentAmount', (treatmentToEdit as any).amountPaid ? Number((treatmentToEdit as any).amountPaid) : 0);
            setValue('paymentMethod', (treatmentToEdit as any).paymentMethod || undefined);
        }
    }, [treatmentToEdit, setValue]);

    useEffect(() => {
        if (!open) {
            reset(defaultFormValues);
            setSelectedClinicalHistoryId(null);
            setSearchTerm('');
            setPopoverOpen(false);
        }
    }, [open, reset]);

    useEffect(() => {
        if (isEditing) return;

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
    }, [selectedPatientId, isEditing]);

    const executeSubmit = async (data: TreatmentFormData) => {
        try {
            // ============ EDICIÓN ============
            if (isEditing && treatmentToEdit) {
                const payload = {
                    name: data.name.trim(),
                    description: data.description?.trim() || '',
                    type: data.type,
                    estimatedSessions: Number(data.estimatedSessions),
                };

                await updateTreatment.mutateAsync({
                    id: treatmentToEdit.id,
                    data: payload,
                });

                reset(defaultFormValues);
                onSuccess();
                onOpenChange(false);
                return;
            }

            // ============ CREACIÓN ============
            if (isLoadingClinicalHistory) {
                toast.warning('Esperá un momento', {
                    description: 'Estamos preparando la historia clínica del paciente. Reintentá en unos segundos.',
                    duration: 3000,
                });
                return;
            }

            if (!selectedClinicalHistoryId) {
                toast.error('No se encontró la historia clínica del paciente');
                return;
            }

            if (!data.patientId) {
                toast.error('Debes seleccionar un paciente');
                return;
            }

            // Si el costo final es 0, forzamos que no haya pago
            const isFree = Number(data.totalCost) === 0;

            const treatmentData: any = {
                name: data.name.trim(),
                description: data.description?.trim() || '',
                type: data.type,
                estimatedSessions: Number(data.estimatedSessions),
                totalCost: Number(data.totalCost),
                discount: Number(data.discount || 0),
                paymentAmount: isFree ? 0 : Number(data.paymentAmount || 0),
            };

            // Solo agregar paymentMethod y reference si hay pago
            if (!isFree && data.paymentAmount && data.paymentAmount > 0 && data.paymentMethod) {
                treatmentData.paymentMethod = data.paymentMethod;
                if (data.paymentReference) {
                    treatmentData.paymentReference = data.paymentReference;
                }
            }

            await createTreatment.mutateAsync({
                clinicalHistoryId: selectedClinicalHistoryId,
                data: treatmentData,
            });

            reset(defaultFormValues);
            setSelectedClinicalHistoryId(null);
            setSearchTerm('');
            onSuccess();
        } catch (error) {
            console.error('Error al guardar tratamiento:', error);
        }
    };

    const onSubmit = (data: TreatmentFormData) => {
        if (Number(data.totalCost) === 0) {
            setPendingFormData(data);
            setShowZeroCostDialog(true);
            return;
        }
        executeSubmit(data);
    };

    const handleConfirmZeroCost = async () => {
        if (!pendingFormData) return;
        const formData = pendingFormData;
        setShowZeroCostDialog(false);
        setPendingFormData(null);
        await executeSubmit(formData);
    };

    const onError = (formErrors: FieldErrors<TreatmentFormData>) => {
        const firstError = FIELD_ORDER.find((field) => formErrors[field]);
        if (!firstError) return;

        const elementId = FIELD_ID_MAP[firstError] || firstError;
        const el = document.getElementById(elementId);

        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            try {
                el.focus({ preventScroll: true });
            } catch { }

            el.classList.add('ring-2', 'ring-red-500', 'ring-offset-2', 'transition-all', 'duration-300');
            setTimeout(() => {
                el.classList.remove('ring-2', 'ring-red-500', 'ring-offset-2');
            }, 2500);
        }

        toast.error('Completa los campos requeridos', {
            description: 'Revisa los campos marcados en rojo.',
            duration: 4000,
        });
    };

    const handleSelectPatient = (patientId: number) => {
        if (isEditing) return;
        setValue('patientId', patientId, { shouldValidate: true, shouldDirty: true });
        setPopoverOpen(false);
        setSearchTerm('');
    };

    const isSubmitDisabled = isEditing
        ? updateTreatment.isPending
        : createTreatment.isPending;

    const isSaving = isEditing ? updateTreatment.isPending : createTreatment.isPending;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-full max-w-[90vw] md:max-w-[80vw] lg:max-w-4xl max-h-[90vh] overflow-y-auto overflow-x-hidden p-0 gap-0">
                {/* Header con gradiente teal */}
                <div className="bg-gradient-to-r from-teal-50 to-white border-b px-4 sm:px-6 py-4 rounded-t-2xl">
                    <DialogHeader>
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="p-2 bg-teal-100 rounded-xl shrink-0">
                                    <Stethoscope className="h-5 w-5 text-teal-600" />
                                </div>
                                <div className="min-w-0">
                                    <DialogTitle className="text-lg sm:text-xl font-bold text-gray-900">
                                        {isEditing ? 'Editar Tratamiento' : 'Nuevo Tratamiento'}
                                    </DialogTitle>
                                    <DialogDescription className="text-xs sm:text-sm text-gray-500">
                                        {isEditing
                                            ? 'Modifica los datos del tratamiento odontológico.'
                                            : 'Complete los datos para crear un nuevo tratamiento odontológico.'}
                                    </DialogDescription>
                                </div>
                            </div>
                            <Badge
                                variant="outline"
                                className="text-xs bg-teal-50 text-teal-700 border-teal-200 hidden sm:flex shrink-0"
                            >
                                <Plus className="h-3 w-3 mr-1" />
                                {isEditing ? 'Edición' : 'Nuevo'}
                            </Badge>
                        </div>
                    </DialogHeader>
                </div>

                {/* Contenido con padding */}
                <div className="px-6 py-6">
                    <form onSubmit={handleSubmit(onSubmit, onError)} className="space-y-6">
                        {/* Selección de paciente */}
                        <div className="space-y-2 min-w-0">
                            <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                <User className="h-4 w-4 text-gray-400" />
                                <span>Paciente</span>
                                <span className="text-red-500">*</span>
                            </Label>
                            <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        id="treatment-patient-trigger"
                                        type="button"
                                        variant="outline"
                                        role="combobox"
                                        disabled={isEditing}
                                        className={cn(
                                            "w-full min-w-0 justify-between font-normal",
                                            !selectedPatientId && "text-muted-foreground",
                                            errors.patientId && "border-red-500 focus-visible:ring-red-500",
                                            isEditing && "opacity-60 cursor-not-allowed bg-gray-50"
                                        )}
                                    >
                                        {selectedPatientId && selectedPatient ? (
                                            <div className="flex items-center gap-2 min-w-0 flex-1">
                                                <User className="h-4 w-4 shrink-0" />
                                                <span className="truncate">{selectedPatient.fullName}</span>
                                                <span className="text-xs text-gray-400 shrink-0">#{selectedPatient.medicalRecordNum}</span>
                                            </div>
                                        ) : isEditing && treatmentToEdit?.patient ? (
                                            <div className="flex items-center gap-2 min-w-0 flex-1">
                                                <User className="h-4 w-4 shrink-0" />
                                                <span className="truncate">{treatmentToEdit.patient.fullName}</span>
                                                <span className="text-xs text-gray-400 shrink-0">#{treatmentToEdit.patient.medicalRecordNum}</span>
                                            </div>
                                        ) : (
                                            <span className="truncate">Buscar paciente...</span>
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
                                                        className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gray-100 min-w-0"
                                                        onClick={() => handleSelectPatient(patient.id)}
                                                    >
                                                        <User className="h-4 w-4 text-gray-400 shrink-0" />
                                                        <span className="truncate">{patient.fullName}</span>
                                                        <span className="text-xs text-gray-400 shrink-0">#{patient.medicalRecordNum}</span>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                            {isEditing && (
                                <p className="text-xs text-gray-500 flex items-center gap-1">
                                    <Lock className="h-3 w-3" />
                                    El paciente no se puede modificar.
                                </p>
                            )}
                            {errors.patientId && (
                                <div className="flex items-center gap-1.5 mt-1.5 text-sm text-red-600">
                                    <AlertCircle className="h-3.5 w-3.5" />
                                    <span>{errors.patientId.message}</span>
                                </div>
                            )}
                            {isLoadingClinicalHistory && !errors.patientId && (
                                <p className="text-xs text-gray-500 flex items-center gap-1.5">
                                    <Loader2 className="h-3 w-3 animate-spin shrink-0" />
                                    Cargando historia clínica del paciente...
                                </p>
                            )}
                        </div>

                        {/* Nombre */}
                        <div className="space-y-2">
                            <Label htmlFor="name" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                <span>Nombre del tratamiento</span>
                                <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="treatment-name"
                                {...register('name')}
                                placeholder="Ej: Endodoncia Molar 36"
                                className={cn(
                                    "w-full",
                                    errors.name ? 'border-red-500 focus-visible:ring-red-500' : ''
                                )}
                            />
                            {errors.name && (
                                <div className="flex items-center gap-1.5 mt-1.5 text-sm text-red-600">
                                    <AlertCircle className="h-3.5 w-3.5" />
                                    <span>{errors.name.message}</span>
                                </div>
                            )}
                        </div>

                        {/* Tipo y Sesiones */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2 min-w-0">
                                <Label htmlFor="type" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                    <span>Tipo</span>
                                    <span className="text-red-500">*</span>
                                </Label>
                                <Select
                                    onValueChange={(value) =>
                                        setValue('type', value as any, {
                                            shouldValidate: true,
                                            shouldDirty: true,
                                        })
                                    }
                                    value={watch('type') || 'DIAGNOSIS'}
                                >
                                    <SelectTrigger
                                        id="treatment-type"
                                        className={cn(
                                            "w-full h-10",
                                            errors.type && 'border-red-500 focus-visible:ring-red-500'
                                        )}
                                    >
                                        <SelectValue placeholder="Seleccionar tipo" />
                                    </SelectTrigger>
                                    <SelectContent
                                        side="bottom"
                                        position="popper"
                                        align="start"
                                        sideOffset={4}
                                        className="max-h-[280px] w-[var(--radix-select-trigger-width)]"
                                    >
                                        {treatmentTypes.map((type) => {
                                            const Icon = type.icon;
                                            return (
                                                <SelectItem
                                                    key={type.value}
                                                    value={type.value}
                                                    className="py-2 cursor-pointer"
                                                >
                                                    <div className="flex items-center gap-2 min-w-0 w-full">
                                                        <Icon className="h-4 w-4 text-gray-500 shrink-0" />
                                                        <span className="text-sm font-medium truncate">
                                                            {type.label}
                                                        </span>
                                                    </div>
                                                </SelectItem>
                                            );
                                        })}
                                    </SelectContent>
                                </Select>
                                {errors.type && (
                                    <div className="flex items-center gap-1.5 mt-1.5 text-sm text-red-600">
                                        <AlertCircle className="h-3.5 w-3.5" />
                                        <span>{errors.type.message}</span>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2 min-w-0">
                                <Label htmlFor="estimatedSessions" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                    <CalendarDays className="h-4 w-4 text-gray-400" />
                                    <span>Sesiones</span>
                                </Label>
                                <Input
                                    id="treatment-estimatedSessions"
                                    type="number"
                                    {...register('estimatedSessions', { valueAsNumber: true })}
                                    placeholder="Número de sesiones"
                                    className={cn(
                                        "w-full",
                                        errors.estimatedSessions ? 'border-red-500 focus-visible:ring-red-500' : ''
                                    )}
                                />
                                {errors.estimatedSessions && (
                                    <div className="flex items-center gap-1.5 mt-1.5 text-sm text-red-600">
                                        <AlertCircle className="h-3.5 w-3.5" />
                                        <span>{errors.estimatedSessions.message}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* ===== INFORMACIÓN FINANCIERA ===== */}
                        {isEditing ? (
                            <>
                                <div className="relative">
                                    <div className="absolute inset-0 flex items-center">
                                        <span className="w-full border-t" />
                                    </div>
                                    <div className="relative flex justify-center text-xs uppercase">
                                        <span className="bg-background px-2 text-muted-foreground">
                                            Información financiera
                                        </span>
                                    </div>
                                </div>

                                <div className="bg-gray-50 rounded-lg p-4 space-y-1.5 text-sm border border-gray-200">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Costo total:</span>
                                        <span className="font-medium">Bs {totalCost.toFixed(2)}</span>
                                    </div>
                                    {discount > 0 && (
                                        <div className="flex justify-between text-green-600">
                                            <span>Descuento:</span>
                                            <span>- Bs {discount.toFixed(2)}</span>
                                        </div>
                                    )}
                                    {discount > 0 && (
                                        <div className="flex justify-between font-medium border-t border-gray-200 pt-1.5">
                                            <span>Monto final:</span>
                                            <span>Bs {finalAmount.toFixed(2)}</span>
                                        </div>
                                    )}
                                    {paymentAmount > 0 && (
                                        <>
                                            <div className="flex justify-between text-blue-600">
                                                <span>Pago inicial{paymentMethod ? ` (${paymentMethodLabels[paymentMethod]})` : ''}:</span>
                                                <span>- Bs {paymentAmount.toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between font-semibold">
                                                <span>Saldo pendiente:</span>
                                                <span className={remainingBalance > 0 ? 'text-orange-600' : 'text-green-600'}>
                                                    Bs {remainingBalance.toFixed(2)}
                                                </span>
                                            </div>
                                        </>
                                    )}
                                    <div className="mt-2 pt-2 border-t border-gray-200 text-xs text-gray-500 flex items-center gap-1.5">
                                        <Lock className="h-3 w-3 shrink-0" />
                                        <span>Los datos financieros no se pueden modificar desde edición.</span>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="relative">
                                    <div className="absolute inset-0 flex items-center">
                                        <span className="w-full border-t" />
                                    </div>
                                    <div className="relative flex justify-center text-xs uppercase">
                                        <span className="bg-background px-2 text-muted-foreground">
                                            Información financiera
                                        </span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2 min-w-0">
                                        <Label htmlFor="totalCost" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                            <Coins className="h-4 w-4 text-gray-400" />
                                            <span>Costo total (Bs)</span>
                                            <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            id="treatment-totalCost"
                                            type="number"
                                            step="0.01"
                                            {...register('totalCost', { valueAsNumber: true })}
                                            placeholder="0.00"
                                            className={cn(
                                                "w-full",
                                                errors.totalCost ? 'border-red-500 focus-visible:ring-red-500' : ''
                                            )}
                                        />
                                        {errors.totalCost && (
                                            <div className="flex items-center gap-1.5 mt-1.5 text-sm text-red-600">
                                                <AlertCircle className="h-3.5 w-3.5" />
                                                <span>{errors.totalCost.message}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-2 min-w-0">
                                        <Label htmlFor="discount" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                            <Percent className="h-4 w-4 text-gray-400" />
                                            <span>Descuento (Bs)</span>
                                        </Label>
                                        <Input
                                            id="treatment-discount"
                                            type="number"
                                            step="0.01"
                                            {...register('discount', { valueAsNumber: true })}
                                            placeholder="0.00"
                                            className={cn(
                                                "w-full",
                                                errors.discount ? 'border-red-500 focus-visible:ring-red-500' : ''
                                            )}
                                        />
                                        {errors.discount && (
                                            <div className="flex items-center gap-1.5 mt-1.5 text-sm text-red-600">
                                                <AlertCircle className="h-3.5 w-3.5" />
                                                <span>{errors.discount.message}</span>
                                            </div>
                                        )}
                                        {discount > 0 && totalCost > 0 && discount > totalCost && (
                                            <div className="flex items-center gap-1.5 text-sm text-red-600">
                                                <AlertCircle className="h-3.5 w-3.5" />
                                                <span>El descuento no puede ser mayor al costo total</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* ⭐ Aviso visual si el costo es 0 */}
                                {finalAmount === 0 && (
                                    <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                        <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                                        <div className="text-xs text-amber-800">
                                            <p className="font-medium">Este tratamiento será gratuito</p>
                                            <p className="text-amber-700 mt-0.5">
                                                Al registrar con costo Bs 0, no se generará un cobro inicial y el tratamiento aparecerá como "Pagado".
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* ⭐ Solo mostrar campos de pago si el costo es mayor a 0 */}
                                {finalAmount > 0 && (
                                    <div className="space-y-4">
                                        <div className="space-y-2 min-w-0">
                                            <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                                <CreditCard className="h-4 w-4 text-gray-400" />
                                                Pago inicial
                                            </Label>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                <div className="min-w-0">
                                                    <Input
                                                        id="treatment-paymentAmount"
                                                        type="number"
                                                        step="0.01"
                                                        placeholder="0.00"
                                                        value={paymentAmount || ''}
                                                        onChange={(e) => {
                                                            const rawValue = e.target.value;
                                                            if (rawValue === '' || /^\d*\.?\d*$/.test(rawValue)) {
                                                                const numValue = parseFloat(rawValue);
                                                                if (finalAmount > 0 && numValue > finalAmount) {
                                                                    setValue('paymentAmount', finalAmount);
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
                                                            "w-full",
                                                            errors.paymentAmount && "border-red-500 focus-visible:ring-red-500",
                                                            paymentAmount > finalAmount && finalAmount > 0 && "border-red-500 focus-visible:ring-red-500"
                                                        )}
                                                    />
                                                    {errors.paymentAmount && (
                                                        <div className="flex items-center gap-1.5 mt-1.5 text-sm text-red-600">
                                                            <AlertCircle className="h-3.5 w-3.5" />
                                                            <span>{errors.paymentAmount.message}</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <Select
                                                        onValueChange={(value) =>
                                                            setValue('paymentMethod', value as any, {
                                                                shouldValidate: true,
                                                                shouldDirty: true,
                                                            })
                                                        }
                                                        value={paymentMethod || ''}
                                                    >
                                                        <SelectTrigger
                                                            id="treatment-paymentMethod"
                                                            className={cn(
                                                                "w-full h-10",
                                                                errors.paymentMethod && 'border-red-500 focus-visible:ring-red-500'
                                                            )}
                                                        >
                                                            <SelectValue placeholder="Método" />
                                                        </SelectTrigger>
                                                        <SelectContent
                                                            side="bottom"
                                                            position="popper"
                                                            align="start"
                                                            sideOffset={4}
                                                            className="max-h-[280px] w-[var(--radix-select-trigger-width)]"
                                                        >
                                                            {paymentMethods.map((method) => {
                                                                const Icon = method.value === 'CASH' ? Coins : CreditCard;
                                                                return (
                                                                    <SelectItem
                                                                        key={method.value}
                                                                        value={method.value}
                                                                        className="py-2 cursor-pointer"
                                                                    >
                                                                        <div className="flex items-center gap-2 min-w-0 w-full">
                                                                            <Icon className="h-4 w-4 text-gray-500 shrink-0" />
                                                                            <span className="text-sm font-medium truncate">
                                                                                {method.label}
                                                                            </span>
                                                                        </div>
                                                                    </SelectItem>
                                                                );
                                                            })}
                                                        </SelectContent>
                                                    </Select>
                                                    {errors.paymentMethod && (
                                                        <p className="text-sm text-red-500 mt-1.5">{errors.paymentMethod.message}</p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex justify-between text-xs">
                                                <span className="text-gray-500">Máximo permitido: Bs {finalAmount.toFixed(2)}</span>
                                                {paymentAmount > 0 && paymentAmount <= finalAmount && (
                                                    <span className="text-green-600">✅ Válido</span>
                                                )}
                                                {paymentAmount > finalAmount && (
                                                    <span className="text-red-600">❌ Excede el límite</span>
                                                )}
                                            </div>
                                        </div>

                                        {showReferenceField && (
                                            <div className="space-y-2">
                                                <Label htmlFor="paymentReference" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                                    <Hash className="h-4 w-4 text-gray-400" />
                                                    <span>Referencia (voucher, comprobante)</span>
                                                </Label>
                                                <Input
                                                    id="paymentReference"
                                                    {...register('paymentReference')}
                                                    placeholder="Número de voucher o referencia"
                                                    className="w-full"
                                                />
                                            </div>
                                        )}

                                        <div className="bg-gray-50 rounded-lg p-4 space-y-1 text-sm border border-gray-200">
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">Costo total:</span>
                                                <span className="font-medium">Bs {totalCost.toFixed(2)}</span>
                                            </div>
                                            {discount > 0 && (
                                                <div className="flex justify-between text-green-600">
                                                    <span>Descuento:</span>
                                                    <span>- Bs {discount.toFixed(2)}</span>
                                                </div>
                                            )}
                                            {discount > 0 && (
                                                <div className="flex justify-between font-medium border-t border-gray-200 pt-1">
                                                    <span>Monto final:</span>
                                                    <span>Bs {finalAmount.toFixed(2)}</span>
                                                </div>
                                            )}
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
                                    </div>
                                )}
                            </>
                        )}

                        {/* Descripción */}
                        <div className="space-y-2">
                            <Label htmlFor="description" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                <FileText className="h-4 w-4 text-gray-400" />
                                <span>Descripción</span>
                            </Label>
                            <Textarea
                                id="description"
                                {...register('description')}
                                placeholder="Detalles del tratamiento..."
                                rows={3}
                                className="w-full resize-none"
                            />
                        </div>

                        {/* Botones */}
                        <div className="flex justify-end gap-3 pt-4 border-t">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                className="px-6"
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmitDisabled}
                                className="px-8 gap-2 bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-700 hover:to-green-800 text-white shadow-lg shadow-emerald-200/50 hover:shadow-emerald-300/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSaving ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Guardando...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="h-4 w-4" />
                                        {isEditing ? 'Actualizar' : 'Crear Tratamiento'}
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </div>
            </DialogContent>

            <ZeroCostConfirmDialog
                open={showZeroCostDialog}
                onOpenChange={(open) => {
                    setShowZeroCostDialog(open);
                    if (!open) setPendingFormData(null);
                }}
                onConfirm={handleConfirmZeroCost}
                treatmentName={pendingFormData?.name}
                isLoading={createTreatment.isPending}
            />
        </Dialog>
    );
}