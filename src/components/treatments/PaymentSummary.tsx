import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Wallet, Pencil, TrendingUp, TrendingDown, CalendarDays, User as UserIcon,
} from 'lucide-react';
import { useState } from 'react';
import { UpdateCostModal } from './UpdateCostModal';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface PaymentSummaryProps {
    paymentStatus: {
        treatmentId: number;
        treatmentName: string;
        totalCost: number;
        discount: number;
        finalAmount: number;
        amountPaid: number;
        remainingBalance: number;
        paymentStatus: string;
        lastCostUpdate?: {
            updatedAt: string;
            updatedBy: string | null;
            reason: string | null;
            oldFinalAmount: number;
            newFinalAmount: number;
        } | null;
        summary: {
            totalPayments: number;
            activePayments: number;
            totalAmountPaid: number;
            remaining?: number;
        };
    };
    treatmentId: number;
    isCompleted?: boolean;
    canEditCost?: boolean;
    onCostUpdated?: () => void;
}

const statusConfig: Record<string, { label: string; className: string }> = {
    PAID: { label: 'Pagado', className: 'bg-green-100 text-green-700 border-green-200' },
    PARTIAL: { label: 'Parcial', className: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
    UNPAID: { label: 'Pendiente', className: 'bg-red-100 text-red-700 border-red-200' },
    CANCELLED: { label: 'Cancelado', className: 'bg-gray-100 text-gray-700 border-gray-200' },
};

const formatDate = (d?: string) => {
    if (!d) return '—';
    try {
        const date = new Date(d);
        if (isNaN(date.getTime())) return '—';
        return format(date, "dd/MM/yyyy 'a las' HH:mm", { locale: es });
    } catch {
        return '—';
    }
};

export function PaymentSummary({
    paymentStatus,
    treatmentId,
    isCompleted = false,
    canEditCost = false,
    onCostUpdated,
}: PaymentSummaryProps) {
    const [showUpdateCost, setShowUpdateCost] = useState(false);

    const {
        totalCost,
        discount,
        amountPaid,
        remainingBalance,
        paymentStatus: status,
        lastCostUpdate,
        summary,
    } = paymentStatus;

    const progress = totalCost > 0 ? (amountPaid / totalCost) * 100 : 0;
    const statusInfo = statusConfig[status] || {
        label: status,
        className: 'bg-gray-100 text-gray-700 border-gray-200',
    };
    const hasDiscount = discount > 0;
    const finalAmount = totalCost - discount;
    const costIncreased =
        lastCostUpdate && lastCostUpdate.newFinalAmount > lastCostUpdate.oldFinalAmount;

    return (
        <>
            <Card className="border-l-4 border-l-primary-500">
                <CardHeader className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                            <div className="p-2 bg-primary-100 rounded-lg shrink-0">
                                <Wallet className="h-5 w-5 text-primary-600" />
                            </div>
                            <div className="min-w-0">
                                <CardTitle className="text-lg">Resumen de Pagos</CardTitle>
                                <div className="flex flex-wrap items-center gap-2 mt-1">
                                    <p className="text-sm text-gray-500">
                                        {summary.totalPayments}{' '}
                                        {summary.totalPayments === 1
                                            ? 'pago registrado'
                                            : 'pagos registrados'}
                                    </p>
                                    <span className="text-gray-300">·</span>
                                    <Badge
                                        variant="outline"
                                        className={cn('text-[11px] px-2 py-0', statusInfo.className)}
                                    >
                                        {statusInfo.label}
                                    </Badge>
                                </div>
                            </div>
                        </div>

                        {canEditCost && (
                            <Button
                                size="sm"
                                onClick={() => setShowUpdateCost(true)}
                                className="gap-2 rounded-lg w-full sm:w-auto bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-lg shadow-amber-200/50 hover:shadow-amber-300/50 transition-all duration-200"
                                title="Editar costo del tratamiento"
                            >
                                <Pencil className="h-4 w-4" />
                                Editar Costo
                            </Button>
                        )}
                    </div>
                </CardHeader>

                <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
                    {/* ============================================================
                        MOBILE (< sm): Lista compacta
                       ============================================================ */}
                    <div className="sm:hidden rounded-lg border border-gray-100 overflow-hidden">
                        <div className="flex items-center justify-between px-4 py-3 bg-gray-50/60">
                            <span className="text-sm text-gray-600">Costo Total</span>
                            <span className="text-base font-semibold text-gray-900">
                                Bs {totalCost.toFixed(2)}
                            </span>
                        </div>

                        {hasDiscount && (
                            <>
                                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                                    <span className="text-sm text-gray-600">Descuento</span>
                                    <span className="text-base font-semibold text-emerald-600">
                                        - Bs {discount.toFixed(2)}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                                    <span className="text-sm text-gray-600">Monto final</span>
                                    <span className="text-base font-semibold text-gray-900">
                                        Bs {finalAmount.toFixed(2)}
                                    </span>
                                </div>
                            </>
                        )}

                        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                            <span className="text-sm text-gray-600">Pagado</span>
                            <div className="text-right">
                                <span className="text-base font-semibold text-green-600">
                                    Bs {amountPaid.toFixed(2)}
                                </span>
                                <p className="text-[11px] text-gray-400 leading-none mt-0.5">
                                    {summary.totalPayments}{' '}
                                    {summary.totalPayments === 1 ? 'pago' : 'pagos'}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50/60">
                            <span className="text-sm font-medium text-gray-700">
                                Saldo Pendiente
                            </span>
                            <div className="text-right">
                                <span
                                    className={cn(
                                        'text-base font-bold',
                                        remainingBalance > 0 ? 'text-red-600' : 'text-green-600'
                                    )}
                                >
                                    Bs {remainingBalance.toFixed(2)}
                                </span>
                                <p className="text-[11px] text-gray-400 leading-none mt-0.5">
                                    {remainingBalance > 0 ? 'Pendiente de pago' : 'Completamente pagado'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* ============================================================
                        TABLET / DESKTOP (>= sm): Grid de cards
                       ============================================================ */}
                    <div
                        className={cn(
                            'hidden sm:grid gap-3 sm:gap-4',
                            hasDiscount
                                ? 'sm:grid-cols-2 md:grid-cols-4'
                                : 'sm:grid-cols-3'
                        )}
                    >
                        {/* Costo total */}
                        <div className="bg-gray-50 rounded-lg p-4 text-center">
                            <p className="text-xs text-gray-500 uppercase tracking-wider">
                                Costo Total
                            </p>
                            <p className="text-xl lg:text-2xl font-bold text-gray-900 mt-1">
                                Bs {totalCost.toFixed(2)}
                            </p>
                        </div>

                        {/* Descuento — solo si aplica */}
                        {hasDiscount && (
                            <div className="bg-emerald-50 rounded-lg p-4 text-center border border-emerald-100">
                                <p className="text-xs text-emerald-600 uppercase tracking-wider">
                                    Descuento
                                </p>
                                <p className="text-xl lg:text-2xl font-bold text-emerald-700 mt-1">
                                    - Bs {discount.toFixed(2)}
                                </p>
                                <p className="text-xs text-emerald-600 mt-0.5">
                                    Monto final: Bs {finalAmount.toFixed(2)}
                                </p>
                            </div>
                        )}

                        {/* Monto pagado */}
                        <div className="bg-gray-50 rounded-lg p-4 text-center">
                            <p className="text-xs text-gray-500 uppercase tracking-wider">
                                Pagado
                            </p>
                            <p className="text-xl lg:text-2xl font-bold text-green-600 mt-1">
                                Bs {amountPaid.toFixed(2)}
                            </p>
                            <p className="text-xs text-gray-500">
                                {summary.totalPayments}{' '}
                                {summary.totalPayments === 1 ? 'pago' : 'pagos'}
                            </p>
                        </div>

                        {/* Saldo pendiente */}
                        <div className="bg-gray-50 rounded-lg p-4 text-center">
                            <p className="text-xs text-gray-500 uppercase tracking-wider">
                                Saldo Pendiente
                            </p>
                            <p
                                className={cn(
                                    'text-xl lg:text-2xl font-bold mt-1',
                                    remainingBalance > 0 ? 'text-red-600' : 'text-green-600'
                                )}
                            >
                                Bs {remainingBalance.toFixed(2)}
                            </p>
                            <p className="text-xs text-gray-500">
                                {remainingBalance > 0
                                    ? 'Pendiente de pago'
                                    : 'Completamente pagado'}
                            </p>
                        </div>
                    </div>

                    {/* ============================================================
                        Barra de progreso — común a todas las vistas
                       ============================================================ */}
                    <div className="mt-4 sm:mt-5">
                        <div className="flex justify-between items-center text-xs text-gray-500 mb-1.5">
                            <span>Progreso de pago</span>
                            <span className="font-medium text-gray-700">
                                {Math.min(Math.round(progress), 100)}%
                            </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                            <div
                                className="bg-primary-600 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${Math.min(progress, 100)}%` }}
                            />
                        </div>
                    </div>

                    {/* ============================================================
                        Banner de última edición de costo
                       ============================================================ */}
                    {lastCostUpdate && (
                        <div
                            className={cn(
                                'mt-4 sm:mt-5 flex items-start gap-3 rounded-lg p-3 border',
                                costIncreased
                                    ? 'bg-blue-50 border-blue-200'
                                    : 'bg-amber-50 border-amber-200'
                            )}
                        >
                            <div
                                className={cn(
                                    'p-1.5 rounded-lg shrink-0',
                                    costIncreased ? 'bg-blue-100' : 'bg-amber-100'
                                )}
                            >
                                {costIncreased ? (
                                    <TrendingUp className="h-3.5 w-3.5 text-blue-600" />
                                ) : (
                                    <TrendingDown className="h-3.5 w-3.5 text-amber-600" />
                                )}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p
                                    className={cn(
                                        'text-xs font-semibold',
                                        costIncreased ? 'text-blue-800' : 'text-amber-800'
                                    )}
                                >
                                    {costIncreased
                                        ? 'Se ajustó el costo del tratamiento'
                                        : 'Se redujo el costo del tratamiento'}
                                </p>
                                <p
                                    className={cn(
                                        'text-xs mt-0.5',
                                        costIncreased ? 'text-blue-700' : 'text-amber-700'
                                    )}
                                >
                                    Bs {lastCostUpdate.oldFinalAmount.toFixed(2)} →{' '}
                                    <strong>
                                        Bs {lastCostUpdate.newFinalAmount.toFixed(2)}
                                    </strong>
                                </p>
                                {lastCostUpdate.reason && (
                                    <p
                                        className={cn(
                                            'text-xs mt-1 italic',
                                            costIncreased
                                                ? 'text-blue-700/90'
                                                : 'text-amber-700/90'
                                        )}
                                    >
                                        "{lastCostUpdate.reason}"
                                    </p>
                                )}
                                <div
                                    className={cn(
                                        'flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-[11px]',
                                        costIncreased ? 'text-blue-600/80' : 'text-amber-600/80'
                                    )}
                                >
                                    <span className="flex items-center gap-1">
                                        <CalendarDays className="h-3 w-3" />
                                        {formatDate(lastCostUpdate.updatedAt)}
                                    </span>
                                    {lastCostUpdate.updatedBy && (
                                        <span className="flex items-center gap-1">
                                            <UserIcon className="h-3 w-3" />
                                            {lastCostUpdate.updatedBy}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Modal de edición de costo */}
            <UpdateCostModal
                open={showUpdateCost}
                onOpenChange={setShowUpdateCost}
                treatmentId={treatmentId}
                currentTotalCost={totalCost}
                currentDiscount={discount}
                amountPaid={amountPaid}
                isCompleted={isCompleted}
                onSuccess={() => {
                    setShowUpdateCost(false);
                    onCostUpdated?.();
                }}
            />
        </>
    );
}