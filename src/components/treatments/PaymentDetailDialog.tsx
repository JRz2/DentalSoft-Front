import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
    Receipt, CalendarDays, Hash, User as UserIcon,
    CreditCard, FileText, Coins, Ban,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface Payment {
    id: number;
    amount: number | string;
    paymentMethod: string;
    paymentDate: string;
    reference?: string;
    notes?: string;
    registeredBy?: string;
    status?: string;
}

interface PaymentDetailDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    payment: Payment | null;
}

const paymentMethodLabels: Record<string, string> = {
    CASH: 'Efectivo',
    CARD: 'Tarjeta',
    TRANSFER: 'Transferencia',
    CHECK: 'Cheque',
    OTHER: 'Otro',
};

const toNumber = (v: unknown): number => {
    if (typeof v === 'number') return isNaN(v) ? 0 : v;
    if (typeof v === 'string') {
        const n = parseFloat(v);
        return isNaN(n) ? 0 : n;
    }
    return 0;
};

const formatDate = (d?: string) => {
    if (!d) return '-';
    try {
        const date = new Date(d);
        if (isNaN(date.getTime())) return '-';
        return format(date, "dd 'de' MMMM 'de' yyyy, HH:mm", { locale: es });
    } catch {
        return '-';
    }
};

export function PaymentDetailDialog({ open, onOpenChange, payment }: PaymentDetailDialogProps) {
    if (!payment) return null;

    const voided = payment.status === 'VOIDED';

    const rows = [
        {
            icon: Coins,
            label: 'Monto',
            value: (
                <span className={cn('font-semibold text-base', voided && 'line-through text-gray-400')}>
                    Bs {toNumber(payment.amount).toFixed(2)}
                </span>
            ),
        },
        {
            icon: CreditCard,
            label: 'Método de pago',
            value: paymentMethodLabels[payment.paymentMethod] || payment.paymentMethod,
        },
        {
            icon: CalendarDays,
            label: 'Fecha de pago',
            value: formatDate(payment.paymentDate),
        },
        {
            icon: Hash,
            label: 'Referencia',
            value: payment.reference || '—',
        },
        {
            icon: UserIcon,
            label: 'Registrado por',
            value: payment.registeredBy || '—',
        },
        {
            icon: FileText,
            label: 'Notas',
            value: payment.notes || '—',
        },
    ];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-full max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary-100 rounded-xl shrink-0">
                            <Receipt className="h-5 w-5 text-primary-600" />
                        </div>
                        <div className="min-w-0">
                            <DialogTitle className="text-lg font-bold text-gray-900">
                                Detalle del Pago
                            </DialogTitle>
                            <DialogDescription className="text-xs sm:text-sm text-gray-500">
                                Pago #{payment.id}
                            </DialogDescription>
                        </div>
                    </div>

                    {voided && (
                        <div className="mt-3 flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg p-2.5">
                            <Ban className="h-4 w-4 text-red-600 shrink-0" />
                            <span className="text-xs text-red-700 font-medium">
                                Este pago fue anulado
                            </span>
                        </div>
                    )}
                </DialogHeader>

                <div className="space-y-1 mt-2">
                    {rows.map((row, i) => {
                        const Icon = row.icon;
                        return (
                            <div
                                key={i}
                                className="flex items-start gap-3 py-2.5 border-b border-gray-100 last:border-0"
                            >
                                <Icon className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs text-gray-500 uppercase tracking-wide">
                                        {row.label}
                                    </p>
                                    <div className="text-sm text-gray-800 mt-0.5 break-words">
                                        {row.value}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="flex justify-end pt-2">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        className="w-full sm:w-auto"
                    >
                        Cerrar
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}