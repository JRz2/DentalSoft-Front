import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { treatmentService } from '@/services/treatment.service';
import {
    Coins, Pencil, AlertCircle, Loader2, CheckCircle2,
    FileText, TrendingUp, TrendingDown, Info,
} from 'lucide-react';
import { useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';

const costSchema = z.object({
    totalCost: z.number()
        .min(0.01, 'El costo debe ser mayor a 0')
        .max(999999999, 'El costo es demasiado alto'),
    discount: z.number()
        .min(0, 'El descuento no puede ser negativo')
        .max(999999999, 'El descuento es demasiado alto')
        .optional(),
    reason: z.string().max(500, 'Máximo 500 caracteres').optional(),
});

type CostFormData = z.infer<typeof costSchema>;

interface UpdateCostModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    treatmentId: number;
    currentTotalCost: number;
    currentDiscount: number;
    amountPaid: number;
    isCompleted?: boolean;
    onSuccess: () => void;
}

const toNumber = (v: unknown): number => {
    if (typeof v === 'number') return isNaN(v) ? 0 : v;
    if (typeof v === 'string') {
        const n = parseFloat(v);
        return isNaN(n) ? 0 : n;
    }
    return 0;
};

const paymentStatusLabels: Record<string, { label: string; className: string }> = {
    PAID: { label: 'Pagado', className: 'bg-green-100 text-green-700 border-green-200' },
    PARTIAL: { label: 'Parcial', className: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
    UNPAID: { label: 'Pendiente', className: 'bg-red-100 text-red-700 border-red-200' },
};

export function UpdateCostModal({
    open,
    onOpenChange,
    treatmentId,
    currentTotalCost,
    currentDiscount,
    amountPaid,
    isCompleted = false,
    onSuccess,
}: UpdateCostModalProps) {
    const safeCurrentTotal = toNumber(currentTotalCost);
    const safeCurrentDiscount = toNumber(currentDiscount);
    const safeAmountPaid = toNumber(amountPaid);
    const currentFinal = safeCurrentTotal - safeCurrentDiscount;

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors, isSubmitting },
        reset,
    } = useForm<CostFormData>({
        resolver: zodResolver(costSchema),
        defaultValues: {
            totalCost: safeCurrentTotal,
            discount: safeCurrentDiscount,
            reason: '',
        },
    });

    const newTotalCost = watch('totalCost') || 0;
    const newDiscount = watch('discount') || 0;
    const newFinalAmount = Math.max(0, newTotalCost - newDiscount);
    const newRemaining = Math.max(0, newFinalAmount - safeAmountPaid);

    // Preview del nuevo estado
    const newPaymentStatus = useMemo(() => {
        if (safeAmountPaid <= 0) return 'UNPAID';
        if (safeAmountPaid + 0.001 < newFinalAmount) return 'PARTIAL';
        return 'PAID';
    }, [safeAmountPaid, newFinalAmount]);

    const hasChanges =
        Math.abs(newTotalCost - safeCurrentTotal) > 0.001 ||
        Math.abs(newDiscount - safeCurrentDiscount) > 0.001;
    const isReducing = newFinalAmount < currentFinal;
    const isBelowAmountPaid = newFinalAmount + 0.001 < safeAmountPaid;
    const isDiscountExceedsCost = newDiscount > newTotalCost;

    // Resetear al abrir
    useEffect(() => {
        if (open) {
            reset({
                totalCost: safeCurrentTotal,
                discount: safeCurrentDiscount,
                reason: '',
            });
        }
    }, [open, safeCurrentTotal, safeCurrentDiscount, reset]);

    const onSubmit = async (data: CostFormData) => {
        if (isBelowAmountPaid) {
            toast.error(
                `El costo final no puede ser menor a lo ya pagado (Bs ${safeAmountPaid.toFixed(2)})`,
            );
            return;
        }
        if (isDiscountExceedsCost) {
            toast.error('El descuento no puede ser mayor al costo total');
            return;
        }
        if (!hasChanges) {
            toast.info('No hay cambios para guardar');
            return;
        }

        try {
            await treatmentService.updateCost(treatmentId, {
                totalCost: Number(data.totalCost.toFixed(2)),
                discount: Number((data.discount ?? 0).toFixed(2)),
                reason: data.reason?.trim() || undefined,
            });
            toast.success('Costo actualizado correctamente');
            reset();
            onSuccess();
        } catch (error: any) {
            const code = error.response?.data?.code;
            const message = error.response?.data?.message;

            if (code === 'COST_BELOW_AMOUNT_PAID') {
                toast.error(message || 'El costo no puede ser menor a lo ya pagado');
                return;
            }
            if (code === 'TREATMENT_CANCELLED') {
                toast.error('No se puede modificar el costo de un tratamiento cancelado');
                return;
            }
            if (code === 'DISCOUNT_EXCEEDS_COST') {
                toast.error('El descuento no puede ser mayor al costo total');
                return;
            }

            console.error('Error al actualizar costo:', error);
            toast.error(message || 'Error al actualizar el costo');
        }
    };

    const handleNumberChange = (
        field: 'totalCost' | 'discount',
        e: React.ChangeEvent<HTMLInputElement>,
    ) => {
        const rawValue = e.target.value;
        if (rawValue === '' || /^\d*\.?\d{0,2}$/.test(rawValue)) {
            const numValue = parseFloat(rawValue);
            if (isNaN(numValue) || numValue < 0) {
                setValue(field, 0, { shouldValidate: false });
                return;
            }
            setValue(field, numValue, { shouldValidate: false });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-full max-w-[95vw] sm:max-w-lg md:max-w-xl max-h-[90vh] overflow-y-auto overflow-x-hidden p-0 gap-0">
                {/* Header con gradiente */}
                <div className="bg-gradient-to-r from-primary-50 to-white border-b px-4 sm:px-6 py-4 rounded-t-2xl">
                    <DialogHeader>
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="p-2 bg-primary-100 rounded-xl shrink-0">
                                    <Pencil className="h-5 w-5 text-primary-600" />
                                </div>
                                <div className="min-w-0">
                                    <DialogTitle className="text-lg sm:text-xl font-bold text-gray-900">
                                        Editar Costo del Tratamiento
                                    </DialogTitle>
                                    <DialogDescription className="text-xs sm:text-sm text-gray-500">
                                        Modificá el costo total o el descuento aplicado
                                    </DialogDescription>
                                </div>
                            </div>
                            <Badge
                                variant="outline"
                                className="text-xs bg-blue-50 text-blue-700 border-blue-200 hidden sm:flex shrink-0"
                            >
                                <Coins className="h-3 w-3 mr-1" />
                                Ajuste de precio
                            </Badge>
                        </div>
                    </DialogHeader>
                </div>

                <div className="px-4 sm:px-6 py-4 sm:py-6">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 sm:space-y-6">
                        {/* Aviso si está completado */}
                        {isCompleted && (
                            <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
                                <Info className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                                <p className="text-xs sm:text-sm text-blue-700">
                                    Este tratamiento ya está <strong>completado</strong>. Podés ajustar
                                    el costo si realizaste procedimientos adicionales. Si el nuevo
                                    monto supera lo pagado, el estado de pago volverá a{' '}
                                    <strong>Parcial</strong>.
                                </p>
                            </div>
                        )}

                        {/* Estado actual */}
                        <div className="bg-gray-50 rounded-lg p-3 sm:p-4 space-y-1.5 text-sm border border-gray-200">
                            <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">
                                Estado actual
                            </p>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Costo total:</span>
                                <span className="font-medium text-gray-900">
                                    Bs {safeCurrentTotal.toFixed(2)}
                                </span>
                            </div>
                            {safeCurrentDiscount > 0 && (
                                <div className="flex justify-between text-emerald-600">
                                    <span>Descuento:</span>
                                    <span className="font-medium">
                                        - Bs {safeCurrentDiscount.toFixed(2)}
                                    </span>
                                </div>
                            )}
                            <div className="flex justify-between border-t border-gray-200 pt-1.5">
                                <span className="text-gray-500">Monto final:</span>
                                <span className="font-semibold text-gray-900">
                                    Bs {currentFinal.toFixed(2)}
                                </span>
                            </div>
                            <div className="flex justify-between text-emerald-600">
                                <span>Pagado:</span>
                                <span className="font-medium">
                                    Bs {safeAmountPaid.toFixed(2)}
                                </span>
                            </div>
                        </div>

                        {/* Nuevo costo total */}
                        <div className="space-y-2">
                            <Label
                                htmlFor="totalCost"
                                className="flex items-center gap-2 text-sm font-medium text-gray-700"
                            >
                                <Coins className="h-4 w-4 text-gray-400" />
                                <span>Nuevo costo total</span>
                                <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="totalCost"
                                type="number"
                                step="0.01"
                                inputMode="decimal"
                                value={newTotalCost || ''}
                                onChange={(e) => handleNumberChange('totalCost', e)}
                                onWheel={(e) => e.currentTarget.blur()}
                                placeholder="0.00"
                                className={cn(
                                    'w-full',
                                    errors.totalCost && 'border-red-500 focus-visible:ring-red-500',
                                )}
                            />
                            {errors.totalCost && (
                                <div className="flex items-center gap-1.5 text-sm text-red-600">
                                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                                    <span>{errors.totalCost.message}</span>
                                </div>
                            )}
                        </div>

                        {/* Descuento */}
                        <div className="space-y-2">
                            <Label
                                htmlFor="discount"
                                className="flex items-center gap-2 text-sm font-medium text-gray-700"
                            >
                                <TrendingDown className="h-4 w-4 text-gray-400" />
                                <span>Descuento</span>
                                <span className="text-xs text-gray-400 font-normal">
                                    (opcional)
                                </span>
                            </Label>
                            <Input
                                id="discount"
                                type="number"
                                step="0.01"
                                inputMode="decimal"
                                value={newDiscount || ''}
                                onChange={(e) => handleNumberChange('discount', e)}
                                onWheel={(e) => e.currentTarget.blur()}
                                placeholder="0.00"
                                className={cn(
                                    'w-full',
                                    isDiscountExceedsCost &&
                                    'border-red-500 focus-visible:ring-red-500',
                                )}
                            />
                            {isDiscountExceedsCost && (
                                <div className="flex items-center gap-1.5 text-sm text-red-600">
                                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                                    <span>El descuento no puede ser mayor al costo total</span>
                                </div>
                            )}
                        </div>

                        {/* Motivo */}
                        <div className="space-y-2">
                            <Label
                                htmlFor="reason"
                                className="flex items-center gap-2 text-sm font-medium text-gray-700"
                            >
                                <FileText className="h-4 w-4 text-gray-400" />
                                <span>Motivo del cambio</span>
                                <span className="text-xs text-gray-400 font-normal">
                                    (opcional)
                                </span>
                            </Label>
                            <Textarea
                                id="reason"
                                {...register('reason')}
                                placeholder="Ej: Se agregaron 2 sesiones adicionales de endodoncia..."
                                rows={2}
                                className="w-full resize-none"
                            />
                        </div>

                        {/* Preview del cambio */}
                        {hasChanges && (
                            <div
                                className={cn(
                                    'rounded-lg p-3 sm:p-4 border space-y-2 text-sm',
                                    isBelowAmountPaid
                                        ? 'bg-red-50 border-red-200'
                                        : 'bg-emerald-50 border-emerald-200',
                                )}
                            >
                                <p
                                    className={cn(
                                        'text-xs uppercase tracking-wider font-medium flex items-center gap-1.5',
                                        isBelowAmountPaid ? 'text-red-700' : 'text-emerald-700',
                                    )}
                                >
                                    {isReducing ? (
                                        <>
                                            <TrendingDown className="h-3.5 w-3.5" />
                                            Reducción de costo
                                        </>
                                    ) : (
                                        <>
                                            <TrendingUp className="h-3.5 w-3.5" />
                                            Aumento de costo
                                        </>
                                    )}
                                </p>

                                <div className="flex justify-between">
                                    <span className="text-gray-600">Nuevo monto final:</span>
                                    <span className="font-semibold text-gray-900">
                                        Bs {newFinalAmount.toFixed(2)}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Nuevo saldo pendiente:</span>
                                    <span
                                        className={cn(
                                            'font-semibold',
                                            newRemaining > 0 ? 'text-amber-600' : 'text-emerald-600',
                                        )}
                                    >
                                        Bs {newRemaining.toFixed(2)}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Nuevo estado de pago:</span>
                                    <Badge
                                        variant="outline"
                                        className={cn(
                                            'text-xs',
                                            paymentStatusLabels[newPaymentStatus]?.className,
                                        )}
                                    >
                                        {paymentStatusLabels[newPaymentStatus]?.label || newPaymentStatus}
                                    </Badge>
                                </div>

                                {isBelowAmountPaid && (
                                    <div className="flex items-start gap-1.5 pt-2 border-t border-red-200 text-xs text-red-700">
                                        <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                                        <span>
                                            El nuevo monto final es menor a lo ya pagado (Bs{' '}
                                            {safeAmountPaid.toFixed(2)}). No se puede guardar.
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Botones */}
                        <div className="flex flex-row justify-end gap-3 pt-4 border-t">
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
                                disabled={
                                    isSubmitting ||
                                    isBelowAmountPaid ||
                                    isDiscountExceedsCost ||
                                    !hasChanges
                                }
                                className="px-8 gap-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white shadow-lg shadow-primary-200/50 hover:shadow-primary-300/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? (
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