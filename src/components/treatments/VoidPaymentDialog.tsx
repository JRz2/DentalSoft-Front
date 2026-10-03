import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle, Ban, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface VoidPaymentDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    paymentAmount: number | string;
    onConfirm: (reason: string) => Promise<void> | void;
    isLoading?: boolean;
}

const toNumber = (v: unknown): number => {
    if (typeof v === 'number') return isNaN(v) ? 0 : v;
    if (typeof v === 'string') {
        const n = parseFloat(v);
        return isNaN(n) ? 0 : n;
    }
    return 0;
};

export function VoidPaymentDialog({
    open,
    onOpenChange,
    paymentAmount,
    onConfirm,
    isLoading = false,
}: VoidPaymentDialogProps) {
    const [reason, setReason] = useState('');

    useEffect(() => {
        if (open) setReason('');
    }, [open]);

    const handleConfirm = async () => {
        const trimmed = reason.trim();
        if (trimmed.length < 5) {
            toast.error('El motivo debe tener al menos 5 caracteres');
            return;
        }
        await onConfirm(trimmed);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-full max-w-[95vw] sm:max-w-md">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 rounded-xl shrink-0">
                            <Ban className="h-5 w-5 text-red-600" />
                        </div>
                        <div>
                            <DialogTitle className="text-lg font-bold text-gray-900">
                                Anular Pago
                            </DialogTitle>
                            <DialogDescription className="text-xs sm:text-sm text-gray-500">
                                Esta acción quedará registrada en la auditoría
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                    <p className="text-xs text-amber-700">
                        Vas a anular el pago de{' '}
                        <strong>Bs {toNumber(paymentAmount).toFixed(2)}</strong>. El pago no se
                        eliminará, quedará marcado como anulado y no contará en los totales.
                    </p>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="void-reason" className="text-sm font-medium text-gray-700">
                        Motivo de anulación <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                        id="void-reason"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Ej: Pago duplicado, monto incorrecto, error de tipeo..."
                        rows={3}
                        className="w-full resize-none"
                        autoFocus
                    />
                    <p className="text-xs text-gray-500">
                        Mínimo 5 caracteres. Este motivo quedará en el historial.
                    </p>
                </div>

                <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isLoading}
                        className="w-full sm:w-auto"
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={isLoading || reason.trim().length < 5}
                        className="gap-2 bg-red-600 hover:bg-red-700 text-white w-full sm:w-auto"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Anulando...
                            </>
                        ) : (
                            <>
                                <Ban className="h-4 w-4" />
                                Anular Pago
                            </>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}