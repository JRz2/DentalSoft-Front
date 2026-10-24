import { ColumnDef } from '@tanstack/react-table';
import { Eye, Banknote, CreditCard, Ban, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTableShadcn } from '@/components/shared/DataTableShadcn';
import { Payment } from '@/types/payment';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface PaymentsHistoryTableProps {
    data: Payment[];
    isLoading?: boolean;
    onViewPayment: (payment: Payment) => void;
    onVoidPayment: (payment: Payment) => void;
    pagination?: {
        currentPage: number;
        totalPages: number;
        totalItems: number;
        itemsPerPage: number;
        onPageChange: (page: number) => void;
    };
}

const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'BOB' }).format(amount);

function PaymentHistoryCard({ payment, onViewPayment, onVoidPayment }: { payment: Payment, onViewPayment: any, onVoidPayment: any }) {
    const isVoided = payment.status === 'VOIDED';
    const isTransfer = payment.paymentMethod === 'TRANSFER';

    return (
        <div className={cn(
            "bg-white rounded-xl border border-gray-100 p-4 transition-all hover:shadow-md border-l-4 flex flex-col gap-3",
            isVoided ? "border-l-red-500 opacity-70" : "border-l-teal-500"
        )}>
            <div className="flex items-start justify-between gap-2">
                <div>
                    <p className="text-xs text-gray-500 font-medium">
                        {format(new Date(payment.paymentDate), "dd MMM, yyyy - HH:mm", { locale: es })}
                    </p>
                    <h3 className="font-semibold text-gray-900 text-sm mt-1 truncate">
                        {payment.treatment?.patient?.fullName || 'Paciente'}
                    </h3>
                    <p className="text-xs text-gray-500 truncate">{payment.treatment?.name}</p>
                </div>
                <div className="text-right">
                    <p className={cn("font-bold text-lg", isVoided ? "text-gray-400 line-through" : "text-teal-600")}>
                        + {formatCurrency(Number(payment.amount))}
                    </p>
                    <Badge variant="outline" className={cn("mt-1 text-[10px]", isVoided ? "bg-red-50 text-red-700 border-red-200" : "bg-green-50 text-green-700 border-green-200")}>
                        {isVoided ? 'Anulado' : 'Activo'}
                    </Badge>
                </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <Badge variant="outline" className={cn("text-[10px] gap-1", isTransfer ? "text-blue-700 bg-blue-50 border-blue-200" : "text-gray-700 bg-gray-50 border-gray-200")}>
                    {isTransfer ? <CreditCard className="h-3 w-3" /> : <Banknote className="h-3 w-3" />}
                    {isTransfer ? 'Transferencia' : 'Efectivo'}
                </Badge>

                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={() => onViewPayment(payment)} className="h-7 text-xs text-gray-600 hover:text-gray-900 px-2">
                        <Eye className="h-3.5 w-3.5 mr-1" /> Detalle
                    </Button>
                    {!isVoided && (
                        <Button variant="ghost" size="sm" onClick={() => onVoidPayment(payment)} className="h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 px-2">
                            <Ban className="h-3.5 w-3.5 mr-1" /> Anular
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}

export function PaymentsHistoryTable({ data, isLoading, onViewPayment, onVoidPayment, pagination }: PaymentsHistoryTableProps) {
    const useCardView = useMediaQuery('(max-width: 1024px)');

    const columns: ColumnDef<Payment>[] = [
        {
            accessorKey: 'paymentDate',
            header: 'Fecha',
            size: 140,
            cell: ({ row }) => (
                <div className="text-sm">
                    <div className="font-medium text-gray-900">{format(new Date(row.original.paymentDate), 'dd/MM/yyyy')}</div>
                    <div className="text-xs text-gray-500">{format(new Date(row.original.paymentDate), 'HH:mm')}</div>
                </div>
            ),
        },
        {
            id: 'patient',
            header: 'Paciente / Tratamiento',
            size: 250,
            cell: ({ row }) => (
                <div>
                    <div className="font-medium text-gray-900 truncate">{row.original.treatment?.patient?.fullName}</div>
                    <div className="text-xs text-gray-500 truncate mt-0.5">{row.original.treatment?.name}</div>
                </div>
            ),
        },
        {
            accessorKey: 'paymentMethod',
            header: 'Método',
            size: 140,
            cell: ({ row }) => {
                const isTransfer = row.original.paymentMethod === 'TRANSFER';
                return (
                    <Badge variant="outline" className={cn("text-xs gap-1.5", isTransfer ? "text-blue-700 bg-blue-50 border-blue-200" : "text-gray-700 bg-gray-50 border-gray-200")}>
                        {isTransfer ? <CreditCard className="h-3.5 w-3.5" /> : <Banknote className="h-3.5 w-3.5" />}
                        {isTransfer ? 'Transferencia' : 'Efectivo'}
                    </Badge>
                );
            },
        },
        {
            accessorKey: 'amount',
            header: 'Monto',
            size: 120,
            cell: ({ row }) => {
                const isVoided = row.original.status === 'VOIDED';
                return (
                    <div className={cn("font-bold", isVoided ? "text-gray-400 line-through" : "text-teal-600")}>
                        + {formatCurrency(Number(row.original.amount))}
                    </div>
                );
            },
        },
        {
            accessorKey: 'status',
            header: 'Estado',
            size: 100,
            cell: ({ row }) => {
                const isVoided = row.original.status === 'VOIDED';
                return (
                    <Badge variant="outline" className={cn(isVoided ? "bg-red-50 text-red-700 border-red-200" : "bg-green-50 text-green-700 border-green-200")}>
                        {isVoided ? <><Ban className="h-3 w-3 mr-1" /> Anulado</> : <><CheckCircle2 className="h-3 w-3 mr-1" /> Activo</>}
                    </Badge>
                );
            },
        },
        {
            id: 'actions',
            header: 'Acciones',
            size: 120,
            cell: ({ row }) => {
                const isVoided = row.original.status === 'VOIDED';
                return (
                    <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onViewPayment(row.original); }} className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 h-8 w-8" title="Ver Detalle">
                            <Eye className="h-4 w-4" />
                        </Button>
                        {!isVoided && (
                            <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onVoidPayment(row.original); }} className="text-red-600 hover:text-red-800 hover:bg-red-50 h-8 w-8" title="Anular Pago">
                                <Ban className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                );
            },
        },
    ];

    if (useCardView) {
        return (
            <div className="space-y-3">
                {data.map((payment) => (
                    <PaymentHistoryCard key={payment.id} payment={payment} onViewPayment={onViewPayment} onVoidPayment={onVoidPayment} />
                ))}
            </div>
        );
    }

    return <DataTableShadcn columns={columns} data={data} isLoading={isLoading} onRowClick={onViewPayment} pagination={pagination} />;
}