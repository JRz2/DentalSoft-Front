import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Receipt, Eye, AlertTriangle, Pencil, Ban,
    CalendarDays, Hash, User as UserIcon, CheckCircle2,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useMemo } from 'react';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { cn } from '@/lib/utils';

interface Payment {
    id: number;
    amount: number | string;
    paymentMethod: string;
    paymentDate: string;
    reference?: string;
    notes?: string;
    registeredBy?: string;
    status?: 'ACTIVE' | 'VOIDED';
    voidedAt?: string;
    voidedBy?: number;
    voidReason?: string;
}

interface PaymentHistoryProps {
    payments: Payment[];
    amountPaid: number | string;
    remainingBalance: number | string;
    paymentStatus: string;
    isLoading?: boolean;
    onViewPayment?: (payment: Payment) => void;
    onEditPayment?: (payment: Payment) => void;
    onVoidPayment?: (payment: Payment) => void;
    isCancelled?: boolean;
    canEdit?: boolean;
    canVoid?: boolean;
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

const toNumber = (value: unknown): number => {
    if (typeof value === 'number') return isNaN(value) ? 0 : value;
    if (typeof value === 'string') {
        const parsed = parseFloat(value);
        return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
};

const formatCurrency = (value: unknown) => `Bs ${toNumber(value).toFixed(2)}`;

const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '-';
        return format(date, 'dd/MM/yyyy HH:mm', { locale: es });
    } catch {
        return '-';
    }
};

const isVoided = (payment: Payment) => payment.status === 'VOIDED';

/* ============================================================
   MOBILE / TABLET CARD
   ============================================================ */
interface PaymentCardProps {
    payment: Payment;
    onView?: (p: Payment) => void;
    onEdit?: (p: Payment) => void;
    onVoid?: (p: Payment) => void;
    canEdit?: boolean;
    canVoid?: boolean;
}

function PaymentCard({ payment, onView, onEdit, onVoid, canEdit, canVoid }: PaymentCardProps) {
    const voided = isVoided(payment);
    const methodClass = paymentMethodColors[payment.paymentMethod] || paymentMethodColors.OTHER;
    const methodLabel = paymentMethodLabels[payment.paymentMethod] || payment.paymentMethod;

    return (
        <div
            className={cn(
                'bg-white rounded-xl border border-gray-100 p-4 transition-all h-full flex flex-col',
                voided && 'opacity-60 bg-gray-50'
            )}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2 flex-wrap">
                        <span
                            className={cn(
                                'text-xl font-bold text-gray-900',
                                voided && 'line-through text-gray-400'
                            )}
                        >
                            {formatCurrency(payment.amount)}
                        </span>
                        {voided && (
                            <Badge className="bg-red-100 text-red-700 border-red-200 text-[10px]">
                                Anulado
                            </Badge>
                        )}
                    </div>
                    <Badge variant="outline" className={cn('mt-1.5 text-[10px]', methodClass)}>
                        {methodLabel}
                    </Badge>
                </div>
            </div>

            <div className="mt-3 space-y-1.5 flex-1 text-xs text-gray-600">
                <div className="flex items-center gap-1.5 min-w-0">
                    <CalendarDays className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                    <span className="truncate">{formatDate(payment.paymentDate)}</span>
                </div>
                {payment.reference && (
                    <div className="flex items-center gap-1.5 min-w-0">
                        <Hash className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                        <span className="truncate" title={payment.reference}>
                            {payment.reference}
                        </span>
                    </div>
                )}
                {payment.registeredBy && (
                    <div className="flex items-center gap-1.5 min-w-0">
                        <UserIcon className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                        <span className="truncate" title={payment.registeredBy}>
                            {payment.registeredBy}
                        </span>
                    </div>
                )}
                {voided && payment.voidReason && (
                    <p className="text-red-500 text-[11px] pt-1">
                        Motivo: {payment.voidReason}
                    </p>
                )}
                {payment.notes && (
                    <p className="text-gray-500 text-[11px] line-clamp-2 pt-1">{payment.notes}</p>
                )}
            </div>

            <div className="flex items-center justify-end gap-1 mt-3 pt-3 border-t border-gray-100">
                {onView && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onView(payment)}
                        className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 h-9 w-9"
                        title="Ver detalle"
                        aria-label="Ver detalle del pago"
                    >
                        <Eye className="h-4 w-4" />
                    </Button>
                )}
                {onEdit && canEdit && !voided && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(payment)}
                        className="text-amber-600 hover:text-amber-800 hover:bg-amber-50 h-9 w-9"
                        title="Editar pago"
                        aria-label="Editar pago"
                    >
                        <Pencil className="h-4 w-4" />
                    </Button>
                )}
                {onVoid && canVoid && !voided && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onVoid(payment)}
                        className="text-red-600 hover:text-red-800 hover:bg-red-50 h-9 w-9"
                        title="Anular pago"
                        aria-label="Anular pago"
                    >
                        <Ban className="h-4 w-4" />
                    </Button>
                )}
            </div>
        </div>
    );
}

/* ============================================================
   MAIN COMPONENT
   ============================================================ */
export function PaymentHistory({
    payments,
    remainingBalance,
    paymentStatus,
    isLoading,
    onViewPayment,
    onEditPayment,
    onVoidPayment,
    isCancelled = false,
    canEdit = false,
    canVoid = false,
}: PaymentHistoryProps) {
    const useCardView = useMediaQuery('(max-width: 1024px)');

    const normalizedPayments = useMemo(() => {
        return [...payments]
            .map((p) => ({ ...p, amount: toNumber(p.amount) }))
            .sort((a, b) => {
                const dateA = new Date(a.paymentDate).getTime() || 0;
                const dateB = new Date(b.paymentDate).getTime() || 0;
                return dateB - dateA;
            });
    }, [payments]);

    const safeRemaining = toNumber(remainingBalance);
    const hasPendingBalance = safeRemaining > 0.001;
    const isFullyPaid = paymentStatus === 'PAID';
    const activePayments = normalizedPayments.filter((p) => !isVoided(p));

    // ============ LOADING ============
    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-5 w-5 rounded" />
                        <Skeleton className="h-6 w-40" />
                        <Skeleton className="h-5 w-16" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                            <Skeleton key={i} className="h-20 w-full rounded-lg" />
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader className="px-4 md:px-6 py-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                        <Receipt className="h-5 w-5 text-primary-600 shrink-0" />
                        <CardTitle className="text-base md:text-lg">Historial de Pagos</CardTitle>
                        <Badge variant="outline" className="shrink-0">
                            {activePayments.length}{' '}
                            {activePayments.length === 1 ? 'pago' : 'pagos'}
                        </Badge>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        {isFullyPaid && (
                            <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200 gap-1">
                                <CheckCircle2 className="h-3 w-3" />
                                Tratamiento pagado
                            </Badge>
                        )}
                    </div>
                </div>

                {isCancelled && hasPendingBalance && (
                    <div className="mt-3 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
                        <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                        <p className="text-xs text-amber-700">
                            Este tratamiento fue cancelado y aún tiene un saldo pendiente de{' '}
                            <strong>{formatCurrency(safeRemaining)}</strong> por sesiones ya
                            realizadas.
                        </p>
                    </div>
                )}
            </CardHeader>

            <CardContent className="px-4 md:px-6 pb-4 md:pb-6">
                {activePayments.length === 0 ? (
                    <div className="py-8 text-center text-gray-500">
                        <Receipt className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                        <p className="font-medium text-gray-700">No hay pagos registrados</p>
                        <p className="text-sm mt-1">
                            Registra el primer pago para este tratamiento
                        </p>
                    </div>
                ) : useCardView ? (
                    /* MOBILE / TABLET: CARDS */
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {normalizedPayments.map((payment) => (
                            <PaymentCard
                                key={payment.id}
                                payment={payment}
                                onView={onViewPayment}
                                onEdit={onEditPayment}
                                onVoid={onVoidPayment}
                                canEdit={canEdit}
                                canVoid={canVoid}
                            />
                        ))}
                    </div>
                ) : (
                    /* DESKTOP: TABLA */
                    <div className="overflow-x-auto -mx-4 md:mx-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="min-w-[140px]">Fecha</TableHead>
                                    <TableHead className="min-w-[110px]">Monto</TableHead>
                                    <TableHead className="min-w-[120px]">Método</TableHead>
                                    <TableHead className="min-w-[140px]">Referencia</TableHead>
                                    <TableHead className="min-w-[140px]">Registrado por</TableHead>
                                    <TableHead className="text-right min-w-[120px]">
                                        Acciones
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {normalizedPayments.map((payment) => {
                                    const voided = isVoided(payment);
                                    const methodClass =
                                        paymentMethodColors[payment.paymentMethod] ||
                                        paymentMethodColors.OTHER;
                                    const methodLabel =
                                        paymentMethodLabels[payment.paymentMethod] ||
                                        payment.paymentMethod;

                                    return (
                                        <TableRow
                                            key={payment.id}
                                            className={cn(
                                                'hover:bg-gray-50',
                                                voided && 'opacity-60 bg-gray-50'
                                            )}
                                        >
                                            <TableCell className="whitespace-nowrap text-sm">
                                                {formatDate(payment.paymentDate)}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <span
                                                        className={cn(
                                                            'font-medium text-gray-900',
                                                            voided &&
                                                            'line-through text-gray-400'
                                                        )}
                                                    >
                                                        {formatCurrency(payment.amount)}
                                                    </span>
                                                    {voided && (
                                                        <Badge className="bg-red-100 text-red-700 border-red-200 text-[10px]">
                                                            Anulado
                                                        </Badge>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant="outline"
                                                    className={cn('text-xs', methodClass)}
                                                >
                                                    {methodLabel}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-sm text-gray-600">
                                                {payment.reference || (
                                                    <span className="text-gray-400">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-sm text-gray-600">
                                                {payment.registeredBy || (
                                                    <span className="text-gray-400">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-1">
                                                    {onViewPayment && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() =>
                                                                onViewPayment(payment)
                                                            }
                                                            className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 h-8 w-8"
                                                            title="Ver detalle"
                                                            aria-label="Ver detalle del pago"
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                    {onEditPayment &&
                                                        canEdit &&
                                                        !voided && (
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() =>
                                                                    onEditPayment(payment)
                                                                }
                                                                className="text-amber-600 hover:text-amber-800 hover:bg-amber-50 h-8 w-8"
                                                                title="Editar pago"
                                                                aria-label="Editar pago"
                                                            >
                                                                <Pencil className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                    {onVoidPayment &&
                                                        canVoid &&
                                                        !voided && (
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() =>
                                                                    onVoidPayment(payment)
                                                                }
                                                                className="text-red-600 hover:text-red-800 hover:bg-red-50 h-8 w-8"
                                                                title="Anular pago"
                                                                aria-label="Anular pago"
                                                            >
                                                                <Ban className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}