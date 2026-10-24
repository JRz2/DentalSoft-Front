import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Receipt, CalendarDays, Hash, User as UserIcon, FileText, Ban, CheckCircle2,
    AlertTriangle, XCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface Payment {
    id: number;
    amount: number | string;
    paymentMethod: string;
    paymentDate: string;
    reference?: string | null;
    notes?: string | null;
    registeredBy: number | string;
    user?: { name: string } | null;
    status?: string;
    voidedAt?: string | null;
    voidedBy?: number | null;
    voidReason?: string | null;
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

const paymentMethodColors: Record<string, string> = {
    CASH: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    CARD: 'bg-blue-50 text-blue-700 border-blue-200',
    TRANSFER: 'bg-purple-50 text-purple-700 border-purple-200',
    CHECK: 'bg-amber-50 text-amber-700 border-amber-200',
    OTHER: 'bg-gray-50 text-gray-700 border-gray-200',
};

const toNumber = (v: unknown): number => {
    if (typeof v === 'number') return isNaN(v) ? 0 : v;
    if (typeof v === 'string') {
        const n = parseFloat(v);
        return isNaN(n) ? 0 : n;
    }
    return 0;
};

const formatDate = (d?: string | null) => {
    if (!d) return '—';
    try {
        const date = new Date(d);
        if (isNaN(date.getTime())) return '—';
        return format(date, "dd 'de' MMMM 'de' yyyy, HH:mm", { locale: es });
    } catch {
        return '—';
    }
};

export function PaymentDetailDialog({ open, onOpenChange, payment }: PaymentDetailDialogProps) {
    if (!payment) return null;

    const voided = payment.status === 'VOIDED';
    const methodClass =
        paymentMethodColors[payment.paymentMethod] || paymentMethodColors.OTHER;
    const methodLabel =
        paymentMethodLabels[payment.paymentMethod] || payment.paymentMethod;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-full max-w-[95vw] sm:max-w-md md:max-w-lg max-h-[90vh] overflow-y-auto overflow-x-hidden p-0 gap-0">
                {/* Header con gradiente — consistente con RegisterPaymentModal */}
                <div
                    className={cn(
                        'border-b px-4 sm:px-6 py-4 rounded-t-2xl',
                        voided
                            ? 'bg-gradient-to-r from-red-50 to-white'
                            : 'bg-gradient-to-r from-primary-50 to-white'
                    )}
                >
                    <DialogHeader>
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                                <div
                                    className={cn(
                                        'p-2 rounded-xl shrink-0',
                                        voided ? 'bg-red-100' : 'bg-primary-100'
                                    )}
                                >
                                    <Receipt
                                        className={cn(
                                            'h-5 w-5',
                                            voided ? 'text-red-600' : 'text-primary-600'
                                        )}
                                    />
                                </div>
                                <div className="min-w-0">
                                    <DialogTitle className="text-lg sm:text-xl font-bold text-gray-900">
                                        Detalle del Pago
                                    </DialogTitle>
                                    <DialogDescription className="text-xs sm:text-sm text-gray-500">
                                        Pago #{payment.id}
                                    </DialogDescription>
                                </div>
                            </div>
                            <Badge
                                variant="outline"
                                className={cn(
                                    'text-xs shrink-0 gap-1',
                                    voided
                                        ? 'bg-red-50 text-red-700 border-red-200'
                                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                )}
                            >
                                {voided ? (
                                    <>
                                        <XCircle className="h-3 w-3" />
                                        Anulado
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="h-3 w-3" />
                                        Activo
                                    </>
                                )}
                            </Badge>
                        </div>
                    </DialogHeader>
                </div>

                {/* Contenido */}
                <div className="px-4 sm:px-6 py-4 sm:py-6 space-y-5 sm:space-y-6">
                    {/* Monto destacado */}
                    <div
                        className={cn(
                            'rounded-lg p-4 text-center border',
                            voided
                                ? 'bg-red-50 border-red-200'
                                : 'bg-emerald-50 border-emerald-200'
                        )}
                    >
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                            Monto del pago
                        </p>
                        <p
                            className={cn(
                                'text-3xl font-bold',
                                voided ? 'line-through text-red-400' : 'text-emerald-600'
                            )}
                        >
                            Bs {toNumber(payment.amount).toFixed(2)}
                        </p>
                        <Badge
                            variant="outline"
                            className={cn('mt-2 text-[11px]', methodClass)}
                        >
                            {methodLabel}
                        </Badge>
                    </div>

                    {/* Aviso de anulación */}
                    {voided && (
                        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
                            <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                            <div className="min-w-0">
                                <p className="text-xs sm:text-sm font-medium text-amber-800">
                                    Este pago fue anulado
                                </p>
                                <p className="text-xs text-amber-700 mt-0.5">
                                    Ya no cuenta en los totales del tratamiento.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Información del pago */}
                    <div className="space-y-1">
                        <div className="flex items-start gap-3 py-2.5 border-b border-gray-100">
                            <CalendarDays className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                            <div className="min-w-0 flex-1">
                                <p className="text-xs text-gray-500 uppercase tracking-wide">
                                    Fecha de pago
                                </p>
                                <p className="text-sm text-gray-800 mt-0.5">
                                    {formatDate(payment.paymentDate)}
                                </p>
                            </div>
                        </div>

                        {payment.reference && (
                            <div className="flex items-start gap-3 py-2.5 border-b border-gray-100">
                                <Hash className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs text-gray-500 uppercase tracking-wide">
                                        Referencia
                                    </p>
                                    <p className="text-sm text-gray-800 mt-0.5 break-words">
                                        {payment.reference}
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="flex items-start gap-3 py-2.5 border-b border-gray-100">
                            <UserIcon className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                            <div className="min-w-0 flex-1">
                                <p className="text-xs text-gray-500 uppercase tracking-wide">
                                    Registrado por
                                </p>
                                <p className="text-sm text-gray-800 mt-0.5">
                                    {payment.user?.name || payment.registeredBy || '—'}
                                </p>
                            </div>
                        </div>

                        {payment.notes && (
                            <div className="flex items-start gap-3 py-2.5 border-b border-gray-100">
                                <FileText className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs text-gray-500 uppercase tracking-wide">
                                        Notas
                                    </p>
                                    <p className="text-sm text-gray-800 mt-0.5 whitespace-pre-wrap break-words">
                                        {payment.notes}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sección de anulación */}
                    {voided && (
                        <div className="space-y-2 pt-1">
                            <div className="flex items-center gap-2 pb-1">
                                <Ban className="h-4 w-4 text-red-600 shrink-0" />
                                <h3 className="text-sm font-semibold text-red-800">
                                    Información de anulación
                                </h3>
                            </div>

                            <div className="bg-red-50/60 border border-red-100 rounded-lg p-3 space-y-3">
                                {payment.voidedAt && (
                                    <div className="flex items-start gap-3">
                                        <CalendarDays className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                                        <div className="min-w-0 flex-1">
                                            <p className="text-xs text-red-700/80 uppercase tracking-wide">
                                                Fecha de anulación
                                            </p>
                                            <p className="text-sm text-red-900 mt-0.5">
                                                {formatDate(payment.voidedAt)}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {payment.voidReason && (
                                    <div className="flex items-start gap-3">
                                        <FileText className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                                        <div className="min-w-0 flex-1">
                                            <p className="text-xs text-red-700/80 uppercase tracking-wide">
                                                Motivo de anulación
                                            </p>
                                            <p className="text-sm text-red-900 mt-0.5 whitespace-pre-wrap break-words">
                                                {payment.voidReason}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Botón cerrar */}
                    <div className="flex justify-end pt-4 border-t">
                        <Button
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className="w-full sm:w-auto px-6"
                        >
                            Cerrar
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}