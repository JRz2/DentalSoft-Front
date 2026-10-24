import { ColumnDef } from '@tanstack/react-table';
import { Eye, PlusCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTableShadcn } from '@/components/shared/DataTableShadcn';
import { PendingBalance } from '@/types/payment';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { cn } from '@/lib/utils';

interface PendingBalancesTableProps {
    data: PendingBalance[];
    isLoading?: boolean;
    onRegisterPayment: (treatmentId: number, patientId: number) => void;
    onViewTreatment: (treatmentId: number, patientId: number) => void;
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

function PaymentProgress({ paid, total }: { paid: number; total: number }) {
    const percentage = Math.min(100, Math.max(0, (paid / total) * 100));
    let colorClass = 'bg-red-500';
    if (percentage >= 100) colorClass = 'bg-green-500';
    else if (percentage >= 50) colorClass = 'bg-teal-500';
    else if (percentage > 0) colorClass = 'bg-amber-500';

    return (
        <div className="w-full max-w-[120px] space-y-1">
            <div className="flex justify-between text-[10px] font-medium text-gray-500">
                <span>{percentage.toFixed(0)}%</span>
                <span>{formatCurrency(paid)} / {formatCurrency(total)}</span>
            </div>
            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                <div className={cn("h-full rounded-full transition-all duration-500", colorClass)} style={{ width: `${percentage}%` }} />
            </div>
        </div>
    );
}

function PendingBalanceCard({ balance, onRegisterPayment, onViewTreatment }: { balance: PendingBalance, onRegisterPayment: any, onViewTreatment: any }) {
    const isUnpaid = balance.amountPaid === 0;

    return (
        <div className="bg-white rounded-xl border border-gray-100 p-4 transition-all hover:shadow-md border-l-4 border-l-amber-500 flex flex-col gap-3">
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                    <h3 className="font-semibold text-gray-900 text-sm truncate">{balance.patientName}</h3>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">{balance.treatmentName}</p>
                </div>
                <Badge className={cn("shrink-0 text-[10px] px-2 py-0.5", isUnpaid ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-800")}>
                    {isUnpaid ? 'Sin pagos' : 'Abono parcial'}
                </Badge>
            </div>

            <div className="flex items-end justify-between">
                <div>
                    <p className="text-xs text-gray-500 mb-0.5">Saldo pendiente</p>
                    <p className="text-xl font-bold text-amber-600">{formatCurrency(balance.remainingBalance)}</p>
                </div>
                <div className="text-right">
                    <p className="text-xs text-gray-500 mb-0.5">Costo Total</p>
                    <p className="text-sm font-medium text-gray-700 line-through decoration-gray-300">{formatCurrency(balance.finalAmount)}</p>
                </div>
            </div>

            <PaymentProgress paid={balance.amountPaid} total={balance.finalAmount} />

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                <Button variant="ghost" size="sm" onClick={() => onViewTreatment(balance.treatmentId, balance.patientId)} className="h-8 text-xs text-gray-600 hover:text-gray-900">
                    <Eye className="h-3.5 w-3.5 mr-1" /> Ver Tratamiento
                </Button>
                <Button size="sm" onClick={() => onRegisterPayment(balance.treatmentId, balance.patientId)} className="h-8 text-xs gap-1.5 bg-teal-600 hover:bg-teal-700 text-white">
                    <PlusCircle className="h-3.5 w-3.5" /> Registrar Pago
                </Button>
            </div>
        </div>
    );
}

export function PendingBalancesTable({ data, isLoading, onRegisterPayment, onViewTreatment, pagination }: PendingBalancesTableProps) {
    const useCardView = useMediaQuery('(max-width: 1024px)');

    const columns: ColumnDef<PendingBalance>[] = [
        {
            id: 'patient',
            header: 'Paciente / Tratamiento',
            size: 250,
            cell: ({ row }) => (
                <div>
                    <div className="font-medium text-gray-900 truncate">{row.original.patientName}</div>
                    <div className="text-xs text-gray-500 truncate mt-0.5">{row.original.treatmentName}</div>
                </div>
            ),
        },
        {
            accessorKey: 'remainingBalance',
            header: 'Saldo Pendiente',
            size: 150,
            cell: ({ row }) => <div className="font-bold text-amber-600">{formatCurrency(row.original.remainingBalance)}</div>,
        },
        {
            accessorKey: 'finalAmount',
            header: 'Costo Total',
            size: 120,
            cell: ({ row }) => <div className="text-gray-500 text-sm">{formatCurrency(row.original.finalAmount)}</div>,
        },
        {
            id: 'progress',
            header: 'Progreso',
            size: 180,
            cell: ({ row }) => <PaymentProgress paid={row.original.amountPaid} total={row.original.finalAmount} />,
        },
        {
            id: 'actions',
            header: 'Acciones',
            size: 180,
            cell: ({ row }) => (
                <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onViewTreatment(row.original.treatmentId, row.original.patientId); }} className="text-gray-600 hover:text-gray-900 h-8 w-8">
                        <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); onRegisterPayment(row.original.treatmentId, row.original.patientId); }} className="h-8 text-xs gap-1.5 border-teal-200 text-teal-700 hover:bg-teal-50">
                        <PlusCircle className="h-3.5 w-3.5" /> Registrar Pago
                    </Button>
                </div>
            ),
        },
    ];

    if (isLoading && useCardView) return <div className="animate-pulse h-40 bg-gray-100 rounded-xl" />;
    if (!data.length && !isLoading && useCardView) {
        return (
            <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
                <CheckCircle2 className="h-12 w-12 mx-auto text-green-300 mb-3" />
                <p className="text-sm font-medium text-gray-700">¡Todo al día!</p>
                <p className="text-xs text-gray-500 mt-1">No hay tratamientos con saldo pendiente.</p>
            </div>
        );
    }

    if (useCardView) {
        return (
            <div className="space-y-3">
                {data.map((balance) => (
                    <PendingBalanceCard key={balance.treatmentId} balance={balance} onRegisterPayment={onRegisterPayment} onViewTreatment={onViewTreatment} />
                ))}
                {pagination && pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between bg-white rounded-xl border border-gray-100 p-3 mt-3">
                        <Button variant="outline" size="sm" onClick={() => pagination.onPageChange(pagination.currentPage - 1)} disabled={pagination.currentPage <= 1}>Anterior</Button>
                        <span className="text-xs text-gray-600">{pagination.currentPage} / {pagination.totalPages}</span>
                        <Button variant="outline" size="sm" onClick={() => pagination.onPageChange(pagination.currentPage + 1)} disabled={pagination.currentPage >= pagination.totalPages}>Siguiente</Button>
                    </div>
                )}
            </div>
        );
    }

    return <DataTableShadcn columns={columns} data={data} isLoading={isLoading} onRowClick={(row) => onViewTreatment(row.treatmentId, row.patientId)} pagination={pagination} />;
}