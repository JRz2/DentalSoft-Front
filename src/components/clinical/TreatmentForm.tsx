import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    Dialog, DialogDescription, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useCreateTreatment, useUpdateTreatment } from '@/hooks/useClinicalHistory';
import { Coins, CreditCard, AlertCircle, CalendarDays, Stethoscope, Lock, Percent } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Treatment } from '@/types/clinicalHistory';
import { useEffect } from 'react';
import { toast } from 'sonner';

const treatmentSchema = z.object({
    name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
    description: z.string().optional(),
    type: z.enum(['DIAGNOSIS', 'PREVENTIVE', 'RESTORATIVE', 'ENDODONTIC', 'PERIODONTAL', 'ORTHODONTIC', 'SURGICAL', 'PROSTHETIC', 'AESTHETIC', 'MAINTENANCE']),
    estimatedSessions: z.number()
        .min(0, 'Mínimo 0 sesiones')
        .max(20, 'Máximo 20 sesiones'),
    totalCost: z.number()
        .min(1, 'El costo total debe ser mayor a 0')
        .max(999999999, 'El costo es demasiado alto'),
    discount: z.number()
        .min(0, 'El descuento no puede ser negativo')
        .max(999999999, 'El descuento es demasiado alto')
        .default(0),
    paymentAmount: z.number()
        .min(0, 'El monto pagado no puede ser negativo')
        .default(0),
    paymentMethod: z.enum(['CASH', 'TRANSFER']).optional(),
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
    { value: 'TRANSFER', label: 'Transferencia' },
];

interface TreatmentFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    clinicalHistoryId?: number;
    treatmentToEdit?: Treatment | null;
    onSuccess: () => void;
}

export function TreatmentForm({
    open,
    onOpenChange,
    clinicalHistoryId,
    treatmentToEdit,
    onSuccess
}: TreatmentFormProps) {
    const createTreatment = useCreateTreatment();
    const updateTreatment = useUpdateTreatment();

    const isEditing = !!treatmentToEdit;

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
            name: treatmentToEdit?.name || '',
            description: treatmentToEdit?.description || '',
            type: treatmentToEdit?.type || 'DIAGNOSIS',
            estimatedSessions: treatmentToEdit?.estimatedSessions || 0,
            totalCost: treatmentToEdit?.totalCost ? Number(treatmentToEdit.totalCost) : 0,
            discount: treatmentToEdit?.discount ? Number(treatmentToEdit.discount) : 0,
            paymentAmount: treatmentToEdit?.amountPaid ? Number(treatmentToEdit.amountPaid) : 0,
            paymentMethod: undefined,
        },
    });

    // Cargar datos cuando se edita
    useEffect(() => {
        if (treatmentToEdit) {
            setValue('name', treatmentToEdit.name);
            setValue('description', treatmentToEdit.description || '');
            setValue('type', treatmentToEdit.type);
            setValue('estimatedSessions', treatmentToEdit.estimatedSessions || 0);
            setValue('totalCost', treatmentToEdit.totalCost ? Number(treatmentToEdit.totalCost) : 0);
            setValue('discount', treatmentToEdit.discount ? Number(treatmentToEdit.discount) : 0);
            setValue('paymentAmount', treatmentToEdit.amountPaid ? Number(treatmentToEdit.amountPaid) : 0);
        }
    }, [treatmentToEdit, setValue]);

    // Resetear cuando se cierra
    useEffect(() => {
        if (!open) {
            reset();
        }
    }, [open, reset]);

    const totalCost = watch('totalCost') || 0;
    const discount = watch('discount') || 0;
    const paymentAmount = watch('paymentAmount') || 0;
    const paymentMethod = watch('paymentMethod');

    // Calcular valores
    const finalAmount = totalCost - discount;
    const remainingBalance = finalAmount - paymentAmount;

    const onSubmit = async (data: TreatmentFormData) => {
        try {
            if (isEditing && treatmentToEdit) {
                // SOLO estos campos para edición
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

                reset();
                onSuccess();
                onOpenChange(false);
            } else {
                if (!clinicalHistoryId) {
                    toast.error('No se encontró la historia clínica');
                    return;
                }

                const createData = {
                    name: data.name,
                    description: data.description || '',
                    type: data.type,
                    estimatedSessions: Number(data.estimatedSessions),
                    totalCost: Number(data.totalCost),
                    discount: Number(data.discount || 0),
                    paymentAmount: Number(data.paymentAmount || 0),
                    paymentMethod: data.paymentMethod,
                };

                await createTreatment.mutateAsync({
                    clinicalHistoryId,
                    data: createData,
                });

                reset();
                onSuccess();
                onOpenChange(false);
            }
        } catch (error: any) {
            console.error('Error al guardar tratamiento:', error);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Stethoscope className="h-5 w-5 text-primary-600" />
                        {isEditing ? 'Editar Tratamiento' : 'Nuevo Tratamiento'}
                    </DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? 'Modifica los datos del tratamiento odontológico.'
                            : 'Complete los datos para crear un nuevo tratamiento odontológico.'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {/* Nombre */}
                    <div className="space-y-2">
                        <Label htmlFor="name" className="flex items-center gap-2">
                            <span>Nombre del tratamiento</span>
                            <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="name"
                            {...register('name')}
                            placeholder="Ej: Endodoncia Molar 36"
                            className={errors.name ? 'border-red-500 focus-visible:ring-red-500' : ''}
                        />
                        {errors.name && (
                            <div className="flex items-center gap-1.5 mt-1.5 text-sm text-red-600">
                                <AlertCircle className="h-3.5 w-3.5" />
                                <span>{errors.name.message}</span>
                            </div>
                        )}
                    </div>

                    {/* Tipo y Sesiones */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                            <Label htmlFor="type" className="flex items-center gap-2">
                                <span>Tipo</span>
                                <span className="text-red-500">*</span>
                            </Label>
                            <Select
                                onValueChange={(value) => setValue('type', value as any)}
                                value={watch('type') || 'DIAGNOSIS'}
                            >
                                <SelectTrigger className={errors.type ? 'border-red-500 focus-visible:ring-red-500' : ''}>
                                    <SelectValue placeholder="Tipo" />
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
                                <div className="flex items-center gap-1.5 mt-1.5 text-sm text-red-600">
                                    <AlertCircle className="h-3.5 w-3.5" />
                                    <span>{errors.type.message}</span>
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="estimatedSessions" className="flex items-center gap-2">
                                <CalendarDays className="h-4 w-4 text-gray-400" />
                                <span>Sesiones</span>
                                <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="estimatedSessions"
                                type="number"
                                {...register('estimatedSessions', { valueAsNumber: true })}
                                placeholder="0"
                                className={errors.estimatedSessions ? 'border-red-500 focus-visible:ring-red-500' : ''}
                            />
                            {errors.estimatedSessions && (
                                <div className="flex items-center gap-1.5 mt-1.5 text-sm text-red-600">
                                    <AlertCircle className="h-3.5 w-3.5" />
                                    <span>{errors.estimatedSessions.message}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Separador - Ocultar en edición si no hay datos financieros */}
                    {(!isEditing || (totalCost > 0 || discount > 0 || paymentAmount > 0)) && (
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-background px-2 text-muted-foreground">
                                    {isEditing ? 'Información financiera (Solo lectura)' : 'Información financiera'}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Costo total */}
                    <div className="space-y-2">
                        <Label htmlFor="totalCost" className="flex items-center gap-2">
                            <Coins className="h-4 w-4 text-gray-400" />
                            <span>Costo total (Bs)</span>
                            <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="totalCost"
                            type="number"
                            step="0.01"
                            {...register('totalCost', { valueAsNumber: true })}
                            placeholder="0.00"
                            disabled={isEditing}
                            className={cn(
                                errors.totalCost ? 'border-red-500 focus-visible:ring-red-500' : '',
                                isEditing && 'opacity-60 cursor-not-allowed bg-gray-50'
                            )}
                        />
                        {isEditing && (
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                                <Lock className="h-3 w-3" />
                                El costo no se puede modificar. Use el módulo de pagos.
                            </p>
                        )}
                        {errors.totalCost && (
                            <div className="flex items-center gap-1.5 mt-1.5 text-sm text-red-600">
                                <AlertCircle className="h-3.5 w-3.5" />
                                <span>{errors.totalCost.message}</span>
                            </div>
                        )}
                    </div>

                    {/* Descuento */}
                    <div className="space-y-2">
                        <Label htmlFor="discount" className="flex items-center gap-2">
                            <Percent className="h-4 w-4 text-gray-400" />
                            <span>Descuento (Bs)</span>
                        </Label>
                        <Input
                            id="discount"
                            type="number"
                            step="0.01"
                            {...register('discount', { valueAsNumber: true })}
                            placeholder="0.00"
                            disabled={isEditing}
                            className={cn(
                                errors.discount ? 'border-red-500 focus-visible:ring-red-500' : '',
                                isEditing && 'opacity-60 cursor-not-allowed bg-gray-50'
                            )}
                        />
                        {isEditing && (
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                                <Lock className="h-3 w-3" />
                                El descuento no se puede modificar.
                            </p>
                        )}
                        {errors.discount && (
                            <div className="flex items-center gap-1.5 mt-1.5 text-sm text-red-600">
                                <AlertCircle className="h-3.5 w-3.5" />
                                <span>{errors.discount.message}</span>
                            </div>
                        )}
                        {!isEditing && discount > 0 && totalCost > 0 && discount > totalCost && (
                            <div className="flex items-center gap-1.5 text-sm text-red-600">
                                <AlertCircle className="h-3.5 w-3.5" />
                                <span>El descuento no puede ser mayor al costo total</span>
                            </div>
                        )}
                    </div>

                    {/* Pago inicial */}
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4 text-gray-400" />
                            Pago inicial
                        </Label>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    disabled={isEditing}
                                    value={paymentAmount || ''}
                                    onChange={(e) => {
                                        if (isEditing) return;
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
                                        if (isEditing) return;
                                        if (paymentAmount > 0) {
                                            setValue('paymentAmount', parseFloat(paymentAmount.toFixed(2)));
                                        }
                                    }}
                                    className={cn(
                                        errors.paymentAmount && "border-red-500 focus-visible:ring-red-500",
                                        paymentAmount > finalAmount && finalAmount > 0 && "border-red-500 focus-visible:ring-red-500",
                                        isEditing && "opacity-60 cursor-not-allowed bg-gray-50"
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
                                    onValueChange={(value) => {
                                        if (isEditing) return;
                                        setValue('paymentMethod', value as any);
                                    }}
                                    value={paymentMethod || ''}
                                    disabled={isEditing}
                                >
                                    <SelectTrigger className={cn(
                                        errors.paymentMethod ? 'border-red-500 focus-visible:ring-red-500' : '',
                                        isEditing && 'opacity-60 cursor-not-allowed bg-gray-50'
                                    )}>
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
                                {isEditing && (
                                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                        <Lock className="h-3 w-3" />
                                        Método de pago bloqueado en edición
                                    </p>
                                )}
                            </div>
                        </div>
                        {!isEditing && finalAmount > 0 && (
                            <div className="flex justify-between text-xs">
                                <span className="text-gray-500">Máximo permitido: Bs {finalAmount.toFixed(2)}</span>
                                {paymentAmount > 0 && paymentAmount <= finalAmount && (
                                    <span className="text-green-600">✅ Válido</span>
                                )}
                                {paymentAmount > finalAmount && (
                                    <span className="text-red-600">❌ Excede el límite</span>
                                )}
                            </div>
                        )}
                        {isEditing && paymentAmount > 0 && (
                            <div className="text-xs text-gray-500">
                                Pago registrado: Bs {paymentAmount.toFixed(2)}
                            </div>
                        )}
                    </div>

                    {/* Resumen de costos */}
                    {totalCost > 0 && (
                        <div className="bg-gray-50 rounded-lg p-3 space-y-1 text-sm border border-gray-200">
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
                            {isEditing && (
                                <div className="mt-2 pt-2 border-t border-gray-200 text-xs text-gray-500 flex items-center gap-1">
                                    <Lock className="h-3 w-3" />
                                    Los datos financieros son de solo lectura
                                </div>
                            )}
                        </div>
                    )}

                    {/* Descripción */}
                    <div className="space-y-2">
                        <Label htmlFor="description">Descripción</Label>
                        <Textarea
                            id="description"
                            {...register('description')}
                            placeholder="Detalles del tratamiento..."
                            rows={3}
                        />
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
                            disabled={createTreatment.isPending || updateTreatment.isPending}
                            className="gap-2"
                        >
                            {createTreatment.isPending || updateTreatment.isPending
                                ? 'Guardando...'
                                : (isEditing ? 'Actualizar Tratamiento' : 'Crear Tratamiento')}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}