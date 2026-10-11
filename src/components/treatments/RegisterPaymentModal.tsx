import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { treatmentService } from '@/services/treatment.service';
import {
    Coins, CreditCard, AlertCircle, Loader2, CheckCircle2,
    Hash, FileText, Lock, Wallet,
} from 'lucide-react';
import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

const paymentSchema = z.object({
    amount: z.number()
        .min(0.01, 'El monto debe ser mayor a 0')
        .max(999999999, 'El monto es demasiado alto'),
    paymentMethod: z.enum(['CASH', 'TRANSFER']),
    reference: z.string().optional(),
    notes: z.string().optional(),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

interface RegisterPaymentModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    treatmentId: number;
    totalCost: number;
    totalPaid: number;
    remainingBalance: number;
    onSuccess: () => void;
}

const paymentMethodLabels: Record<string, string> = {
    CASH: 'Efectivo',
    TRANSFER: 'Transferencia',
};

const toNumber = (value: unknown): number => {
    if (typeof value === 'number') return isNaN(value) ? 0 : value;
    if (typeof value === 'string') {
        const parsed = parseFloat(value);
        return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
};

const generateIdempotencyKey = (): string => {
    // crypto.randomUUID está disponible en todos los navegadores modernos y HTTPS
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
        return crypto.randomUUID();
    }
    // Fallback por si acaso (navegadores antiguos)
    return `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
};

export function RegisterPaymentModal({
    open,
    onOpenChange,
    treatmentId,
    totalCost,
    totalPaid,
    remainingBalance,
    onSuccess,
}: RegisterPaymentModalProps) {
    const safeTotalCost = toNumber(totalCost);
    const safeTotalPaid = toNumber(totalPaid);
    const safeRemaining = toNumber(remainingBalance);

    // Idempotency-Key: uno por cada apertura del modal.
    // Mientras el modal esté abierto, todos los reintentos usan la MISMA key.
    const idempotencyKeyRef = useRef<string>(generateIdempotencyKey());

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors, isSubmitting },
        reset,
    } = useForm<PaymentFormData>({
        resolver: zodResolver(paymentSchema),
        defaultValues: {
            amount: safeRemaining > 0 ? Math.min(safeRemaining, safeTotalCost) : 0,
            paymentMethod: 'CASH',
            reference: '',
            notes: '',
        },
    });

    const amount = watch('amount') || 0;
    const paymentMethod = watch('paymentMethod');
    const showReferenceField = paymentMethod === 'TRANSFER';
    const isFullyPaid = safeRemaining <= 0.001;

    // Al abrir: regenerar key + resetear formulario
    useEffect(() => {
        if (open) {
            idempotencyKeyRef.current = generateIdempotencyKey();
            reset({
                amount: safeRemaining > 0 ? Math.min(safeRemaining, safeTotalCost) : 0,
                paymentMethod: 'CASH',
                reference: '',
                notes: '',
            });
        }
    }, [open, safeRemaining, safeTotalCost, reset]);

    const onSubmit = async (data: PaymentFormData) => {
        if (isFullyPaid) {
            toast.error('El tratamiento ya está completamente pagado');
            return;
        }

        if (data.amount > safeRemaining + 0.001) {
            toast.error(
                `El monto no puede exceder el saldo pendiente (Bs ${safeRemaining.toFixed(2)})`
            );
            return;
        }

        if (data.paymentMethod === 'TRANSFER' && !data.reference?.trim()) {
            toast.error('Debes ingresar la referencia de la transferencia');
            return;
        }

        try {
            await treatmentService.registerPayment(
                treatmentId,
                {
                    amount: Number(data.amount.toFixed(2)),
                    paymentMethod: data.paymentMethod,
                    reference: data.reference?.trim() || undefined,
                    notes: data.notes?.trim() || undefined,
                },
                idempotencyKeyRef.current,
            );
            toast.success('Pago registrado correctamente');
            reset();
            onSuccess();
        } catch (error: any) {
            const code = error.response?.data?.code;
            const message = error.response?.data?.message;

            // Bug del front o doble submit con distinto payload:
            // regeneramos la key y avisamos al usuario para que reintente.
            if (code === 'IDEMPOTENCY_KEY_REUSED') {
                idempotencyKeyRef.current = generateIdempotencyKey();
                toast.error(
                    'Se detectó un intento duplicado con datos distintos. Reintentá el pago.',
                );
                return;
            }

            // Otro request con la misma key está en curso
            if (code === 'REQUEST_IN_PROGRESS') {
                toast.warning('El pago ya está siendo procesado. Esperá unos segundos.');
                return;
            }

            // Tratamiento ya pagado (race con otro recepcionista)
            if (code === 'TREATMENT_ALREADY_PAID') {
                toast.warning('El tratamiento ya fue pagado por otro usuario.');
                onSuccess();
                return;
            }

            // Monto excede el saldo (race)
            if (code === 'AMOUNT_EXCEEDS_BALANCE') {
                toast.error(
                    message || 'El monto excede el saldo pendiente. Recargá la página.',
                );
                onSuccess();
                return;
            }

            console.error('Error al registrar pago:', error);
            toast.error(message || 'Error al registrar el pago');
        }
    };

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value;

        if (rawValue === '' || /^\d*\.?\d{0,2}$/.test(rawValue)) {
            const numValue = parseFloat(rawValue);

            if (isNaN(numValue) || numValue < 0) {
                setValue('amount', 0, { shouldValidate: false });
                return;
            }

            if (safeRemaining > 0 && numValue > safeRemaining) {
                setValue('amount', safeRemaining, { shouldValidate: true });
                toast.warning(`El monto no puede exceder Bs ${safeRemaining.toFixed(2)}`);
            } else {
                setValue('amount', numValue, { shouldValidate: false });
            }
        }
    };

    const handleAmountBlur = () => {
        if (amount > 0) {
            setValue('amount', parseFloat(amount.toFixed(2)), { shouldValidate: true });
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
                                    <CreditCard className="h-5 w-5 text-primary-600" />
                                </div>
                                <div className="min-w-0">
                                    <DialogTitle className="text-lg sm:text-xl font-bold text-gray-900">
                                        Registrar Pago
                                    </DialogTitle>
                                    <DialogDescription className="text-xs sm:text-sm text-gray-500">
                                        Registra un nuevo pago para este tratamiento
                                    </DialogDescription>
                                </div>
                            </div>
                            <Badge
                                variant="outline"
                                className="text-xs bg-blue-50 text-blue-700 border-blue-200 hidden sm:flex shrink-0"
                            >
                                <Wallet className="h-3 w-3 mr-1" />
                                Nuevo pago
                            </Badge>
                        </div>
                    </DialogHeader>
                </div>

                <div className="px-4 sm:px-6 py-4 sm:py-6">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 sm:space-y-6">
                        {isFullyPaid && (
                            <div className="flex items-start gap-2 bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                                <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                                <p className="text-xs sm:text-sm text-emerald-700">
                                    Este tratamiento está completamente pagado. No se pueden
                                    registrar más pagos.
                                </p>
                            </div>
                        )}

                        {/* Resumen financiero */}
                        <div className="bg-gray-50 rounded-lg p-3 sm:p-4 space-y-1.5 text-sm border border-gray-200">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Costo total:</span>
                                <span className="font-medium text-gray-900">
                                    Bs {safeTotalCost.toFixed(2)}
                                </span>
                            </div>
                            <div className="flex justify-between text-emerald-600">
                                <span>Pagado:</span>
                                <span className="font-medium">
                                    Bs {safeTotalPaid.toFixed(2)}
                                </span>
                            </div>
                            <div className="flex justify-between font-semibold border-t border-gray-200 pt-1.5">
                                <span>Saldo pendiente:</span>
                                <span
                                    className={cn(
                                        safeRemaining > 0
                                            ? 'text-amber-600'
                                            : 'text-emerald-600'
                                    )}
                                >
                                    Bs {Math.max(0, safeRemaining).toFixed(2)}
                                </span>
                            </div>
                        </div>

                        {/* Monto */}
                        <div className="space-y-2">
                            <Label
                                htmlFor="amount"
                                className="flex items-center gap-2 text-sm font-medium text-gray-700"
                            >
                                <Coins className="h-4 w-4 text-gray-400" />
                                <span>Monto a pagar</span>
                                <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="amount"
                                type="number"
                                step="0.01"
                                inputMode="decimal"
                                disabled={isFullyPaid}
                                value={amount || ''}
                                onChange={handleAmountChange}
                                onBlur={handleAmountBlur}
                                onWheel={(e) => e.currentTarget.blur()}
                                placeholder="0.00"
                                className={cn(
                                    'w-full',
                                    errors.amount &&
                                    'border-red-500 focus-visible:ring-red-500',
                                    amount > safeRemaining &&
                                    safeRemaining > 0 &&
                                    'border-red-500 focus-visible:ring-red-500'
                                )}
                            />
                            {errors.amount && (
                                <div className="flex items-center gap-1.5 mt-1.5 text-sm text-red-600">
                                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                                    <span>{errors.amount.message}</span>
                                </div>
                            )}

                            {!isFullyPaid && safeRemaining > 0 && (
                                <div className="flex flex-wrap justify-between gap-2 text-xs">
                                    <span className="text-gray-500">
                                        Máximo permitido: Bs {safeRemaining.toFixed(2)}
                                    </span>
                                    {amount > 0 && amount <= safeRemaining && (
                                        <span className="text-emerald-600 flex items-center gap-1">
                                            <CheckCircle2 className="h-3 w-3" />
                                            Válido
                                        </span>
                                    )}
                                    {amount > safeRemaining && (
                                        <span className="text-red-600 flex items-center gap-1">
                                            <AlertCircle className="h-3 w-3" />
                                            Excede el límite
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Método de pago */}
                        <div className="space-y-2">
                            <Label
                                htmlFor="paymentMethod"
                                className="flex items-center gap-2 text-sm font-medium text-gray-700"
                            >
                                <CreditCard className="h-4 w-4 text-gray-400" />
                                <span>Método de pago</span>
                                <span className="text-red-500">*</span>
                            </Label>
                            <Select
                                disabled={isFullyPaid}
                                onValueChange={(value) =>
                                    setValue('paymentMethod', value as any, {
                                        shouldValidate: true,
                                    })
                                }
                                value={paymentMethod || 'CASH'}
                            >
                                <SelectTrigger
                                    className={cn(
                                        'w-full',
                                        errors.paymentMethod &&
                                        'border-red-500 focus-visible:ring-red-500'
                                    )}
                                >
                                    <SelectValue placeholder="Seleccionar método" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="CASH">
                                        {paymentMethodLabels.CASH}
                                    </SelectItem>
                                    <SelectItem value="TRANSFER">
                                        {paymentMethodLabels.TRANSFER}
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.paymentMethod && (
                                <div className="flex items-center gap-1.5 mt-1.5 text-sm text-red-600">
                                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                                    <span>{errors.paymentMethod.message}</span>
                                </div>
                            )}
                        </div>

                        {/* Referencia */}
                        {showReferenceField && (
                            <div className="space-y-2">
                                <Label
                                    htmlFor="reference"
                                    className="flex items-center gap-2 text-sm font-medium text-gray-700"
                                >
                                    <Hash className="h-4 w-4 text-gray-400" />
                                    <span>Referencia (voucher, comprobante)</span>
                                    <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="reference"
                                    {...register('reference')}
                                    disabled={isFullyPaid}
                                    placeholder="Número de voucher o referencia"
                                    className={cn(
                                        'w-full',
                                        errors.reference &&
                                        'border-red-500 focus-visible:ring-red-500'
                                    )}
                                />
                                {errors.reference && (
                                    <div className="flex items-center gap-1.5 mt-1.5 text-sm text-red-600">
                                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                                        <span>{errors.reference.message}</span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Notas */}
                        <div className="space-y-2">
                            <Label
                                htmlFor="notes"
                                className="flex items-center gap-2 text-sm font-medium text-gray-700"
                            >
                                <FileText className="h-4 w-4 text-gray-400" />
                                <span>Notas</span>
                                <span className="text-xs text-gray-400 font-normal">
                                    (opcional)
                                </span>
                            </Label>
                            <Textarea
                                id="notes"
                                {...register('notes')}
                                disabled={isFullyPaid}
                                placeholder="Notas adicionales sobre el pago..."
                                rows={2}
                                className="w-full resize-none"
                            />
                        </div>

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
                                disabled={isFullyPaid || isSubmitting}
                                className="px-8 gap-2 bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-700 hover:to-green-800 text-white shadow-lg shadow-emerald-200/50 hover:shadow-emerald-300/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                title={
                                    isFullyPaid
                                        ? 'El tratamiento ya está completamente pagado'
                                        : undefined
                                }
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Registrando...
                                    </>
                                ) : (
                                    <>
                                        <CreditCard className="h-4 w-4" />
                                        Registrar Pago
                                    </>
                                )}
                            </Button>
                        </div>

                        {isFullyPaid && (
                            <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                <Lock className="h-3 w-3 shrink-0" />
                                <span>No se pueden registrar pagos sobre un tratamiento pagado.</span>
                            </div>
                        )}
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    );
}