import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { treatmentService } from '@/services/treatment.service';
import { Coins, CreditCard, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const paymentSchema = z.object({
    amount: z.number()
        .min(1, 'El monto debe ser mayor a 0')
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

export function RegisterPaymentModal({
    open,
    onOpenChange,
    treatmentId,
    totalCost,
    totalPaid,
    remainingBalance,
    onSuccess
}: RegisterPaymentModalProps) {
    const { register, handleSubmit, watch, setValue, formState: { errors }, reset } = useForm<PaymentFormData>({
        resolver: zodResolver(paymentSchema),
        defaultValues: {
            amount: remainingBalance > 0 ? Math.min(remainingBalance, totalCost) : 0,
            paymentMethod: 'CASH',
        }
    });

    const amount = watch('amount') || 0;

    const onSubmit = async (data: PaymentFormData) => {
        try {
            if (data.amount > remainingBalance) {
                toast.error(`El monto no puede exceder el saldo pendiente (Bs ${remainingBalance.toFixed(2)})`);
                return;
            }

            // ✅ Usar treatmentService
            await treatmentService.registerPayment(treatmentId, data);
            toast.success('Pago registrado correctamente');
            reset();
            onSuccess();
        } catch (error: any) {
            console.error('Error al registrar pago:', error);
            toast.error(error.response?.data?.message || 'Error al registrar el pago');
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-primary-600" />
                        Registrar Pago
                    </DialogTitle>
                    <DialogDescription>
                        Registra un nuevo pago para este tratamiento
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {/* Resumen financiero */}
                    <div className="bg-gray-50 rounded-lg p-3 space-y-1 text-sm border border-gray-200">
                        <div className="flex justify-between">
                            <span className="text-gray-500">Costo total:</span>
                            <span className="font-medium">Bs {totalCost.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-green-600">
                            <span>Pagado:</span>
                            <span>Bs {totalPaid.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-semibold border-t border-gray-200 pt-1">
                            <span>Saldo pendiente:</span>
                            <span className="text-orange-600">Bs {remainingBalance.toFixed(2)}</span>
                        </div>
                    </div>

                    {/* Monto a pagar */}
                    <div className="space-y-2">
                        <Label htmlFor="amount" className="flex items-center gap-2">
                            <Coins className="h-4 w-4 text-gray-400" />
                            Monto a pagar
                            <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="amount"
                            type="number"
                            step="0.01"
                            {...register('amount', { valueAsNumber: true })}
                            placeholder="0.00"
                            onChange={(e) => {
                                const rawValue = e.target.value;

                                if (rawValue === '' || /^\d*\.?\d*$/.test(rawValue)) {
                                    let numValue = parseFloat(rawValue);

                                    if (isNaN(numValue) || numValue < 0) {
                                        setValue('amount', 0);
                                        return;
                                    }

                                    if (remainingBalance > 0 && numValue > remainingBalance) {
                                        setValue('amount', remainingBalance);
                                        toast.warning(`El monto no puede exceder Bs ${remainingBalance.toFixed(2)}`);
                                    } else {
                                        setValue('amount', numValue);
                                    }
                                }
                            }}
                            onBlur={() => {
                                if (amount > 0) {
                                    setValue('amount', parseFloat(amount.toFixed(2)));
                                }
                            }}
                            onWheel={(e) => e.currentTarget.blur()}
                            className={cn(
                                errors.amount && "border-red-500 focus-visible:ring-red-500",
                                amount > remainingBalance && remainingBalance > 0 && "border-red-500 focus-visible:ring-red-500"
                            )}
                        />
                        {errors.amount && (
                            <div className="flex items-center gap-1.5 mt-1.5 text-sm text-red-600">
                                <AlertCircle className="h-3.5 w-3.5" />
                                <span>{errors.amount.message}</span>
                            </div>
                        )}

                        {/* Validación del monto en tiempo real */}
                        {remainingBalance > 0 && (
                            <div className="flex justify-between text-xs">
                                <span className="text-gray-500">Máximo permitido: Bs {remainingBalance.toFixed(2)}</span>
                                {amount > 0 && amount <= remainingBalance && (
                                    <span className="text-green-600">✅ Válido</span>
                                )}
                                {amount > remainingBalance && (
                                    <span className="text-red-600">❌ Excede el límite</span>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Método de pago */}
                    <div className="space-y-2">
                        <Label htmlFor="paymentMethod">Método de pago</Label>
                        <Select
                            onValueChange={(value) => setValue('paymentMethod', value as any)}
                            value={watch('paymentMethod') || 'CASH'}
                        >
                            <SelectTrigger className={errors.paymentMethod ? 'border-red-500 focus-visible:ring-red-500' : ''}>
                                <SelectValue placeholder="Seleccionar método" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="CASH">Efectivo</SelectItem>
                                <SelectItem value="TRANSFER">Transferencia</SelectItem>
                            </SelectContent>
                        </Select>
                        {errors.paymentMethod && (
                            <div className="flex items-center gap-1.5 mt-1.5 text-sm text-red-600">
                                <AlertCircle className="h-3.5 w-3.5" />
                                <span>{errors.paymentMethod.message}</span>
                            </div>
                        )}
                    </div>

                    {/* Notas */}
                    <div className="space-y-2">
                        <Label htmlFor="notes">Notas</Label>
                        <Textarea
                            id="notes"
                            {...register('notes')}
                            placeholder="Notas adicionales sobre el pago..."
                            rows={2}
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
                            disabled={remainingBalance <= 0}
                            className="gap-2"
                        >
                            <CreditCard className="h-4 w-4" />
                            Registrar Pago
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}