import { ColumnDef } from '@tanstack/react-table';
import { Eye, Play, Pause, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTableShadcn } from '@/components/shared/DataTableShadcn';
import { Treatment } from '@/types/clinicalHistory';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface TreatmentTableProps {
    data: Treatment[];
    isLoading?: boolean;
    onViewDetail: (treatment: Treatment) => void;
    onStart?: (treatment: Treatment) => void;
    onPause?: (treatment: Treatment) => void;
    onComplete?: (treatment: Treatment) => void;
    onCancel?: (treatment: Treatment) => void;
    pagination?: {
        currentPage: number;
        totalPages: number;
        totalItems: number;
        itemsPerPage: number;
        onPageChange: (page: number) => void;
    };
}

const statusConfig = {
    PLANNED: { label: 'Planificado', className: 'bg-blue-100 text-blue-700', icon: Play },
    IN_PROGRESS: { label: 'En Progreso', className: 'bg-yellow-100 text-yellow-700', icon: Play },
    ON_HOLD: { label: 'En Espera', className: 'bg-orange-100 text-orange-700', icon: Pause },
    COMPLETED: { label: 'Completado', className: 'bg-green-100 text-green-700', icon: CheckCircle },
    CANCELLED: { label: 'Cancelado', className: 'bg-red-100 text-red-700', icon: XCircle },
};

const typeLabels = {
    DIAGNOSIS: 'Diagnóstico',
    PREVENTIVE: 'Preventivo',
    RESTORATIVE: 'Restaurador',
    ENDODONTIC: 'Endodoncia',
    PERIODONTAL: 'Periodoncia',
    ORTHODONTIC: 'Ortodoncia',
    SURGICAL: 'Quirúrgico',
    PROSTHETIC: 'Prótesis',
    AESTHETIC: 'Estética',
    MAINTENANCE: 'Mantenimiento',
};

export function TreatmentTable({
    data,
    isLoading,
    onViewDetail,
    onStart,
    onPause,
    onComplete,
    onCancel,
    pagination,
}: TreatmentTableProps) {
    const formatDate = (dateString: string) => {
        if (!dateString) return '-';
        try {
            return format(new Date(dateString), 'dd/MM/yyyy', { locale: es });
        } catch {
            return '-';
        }
    };

    const columns: ColumnDef<Treatment>[] = [
        {
            accessorKey: 'name',
            header: 'Tratamiento',
            cell: ({ row }) => {
                const description = row.original.description;
                const hasDescription = description && description.trim().length > 0;
                const truncatedName = row.getValue('name') as string;
                const displayName = truncatedName.length > 35
                    ? `${truncatedName.substring(0, 35)}...`
                    : truncatedName;
                const truncatedDescription = hasDescription
                    ? (description.length > 40
                        ? `${description.substring(0, 40)}...`
                        : description)
                    : '';

                return (
                    <div className="min-w-[180px] max-w-[200px]">
                        <div className="font-medium text-gray-900 truncate" title={truncatedName}>
                            {displayName}
                        </div>
                        {hasDescription && (
                            <div className="text-sm text-gray-500 truncate" title={description}>
                                {truncatedDescription}
                            </div>
                        )}
                    </div>
                );
            },
        },
        {
            accessorKey: 'type',
            header: 'Tipo',
            size: 150,
            cell: ({ row }) => (
                <Badge variant="outline" className="bg-gray-50">
                    {typeLabels[row.original.type]}
                </Badge>
            ),
        },
        {
            accessorKey: 'status',
            header: 'Estado',
            size: 130,
            cell: ({ row }) => {
                const status = row.original.status;
                const StatusIcon = statusConfig[status]?.icon;
                return (
                    <Badge className={statusConfig[status]?.className}>
                        {StatusIcon && <StatusIcon className="h-3 w-3 mr-1" />}
                        {statusConfig[status]?.label}
                    </Badge>
                );
            },
        },
        {
            accessorKey: 'estimatedSessions',
            header: 'Sesiones',
            size: 100,
            cell: ({ row }) => (
                <div className="text-center">
                    <span className="font-medium">{row.original.estimatedSessions}</span>
                    <span className="text-gray-500 text-sm"> sesiones</span>
                </div>
            ),
        },
        {
            accessorKey: 'createdAt',
            header: 'Fecha inicio',
            size: 120,
            cell: ({ row }) => (
                <div className="text-gray-600">{formatDate(row.original.createdAt || '')}</div>
            ),
        },
        {
            id: 'actions',
            header: 'Acciones',
            size: 180,
            cell: ({ row }) => {
                const treatment = row.original;
                const status = treatment.status;

                return (
                    <div className="flex gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                                e.stopPropagation();
                                onViewDetail(treatment);
                            }}
                            className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                            title="Ver detalles"
                        >
                            <Eye className="h-4 w-4" />
                        </Button>

                        {status === 'PLANNED' && onStart && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onStart(treatment);
                                }}
                                className="text-green-600 hover:text-green-800 hover:bg-green-50"
                                title="Iniciar tratamiento"
                            >
                                <Play className="h-4 w-4" />
                            </Button>
                        )}

                        {status === 'IN_PROGRESS' && onPause && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onPause(treatment);
                                }}
                                className="text-orange-600 hover:text-orange-800 hover:bg-orange-50"
                                title="Pausar tratamiento"
                            >
                                <Pause className="h-4 w-4" />
                            </Button>
                        )}

                        {status === 'IN_PROGRESS' && onComplete && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onComplete(treatment);
                                }}
                                className="text-green-600 hover:text-green-800 hover:bg-green-50"
                                title="Completar tratamiento"
                            >
                                <CheckCircle className="h-4 w-4" />
                            </Button>
                        )}

                        {(status === 'PLANNED' || status === 'ON_HOLD') && onCancel && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onCancel(treatment);
                                }}
                                className="text-red-600 hover:text-red-800 hover:bg-red-50"
                                title="Cancelar tratamiento"
                            >
                                <XCircle className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                );
            },
        },
    ];

    return (
        <DataTableShadcn
            columns={columns}
            data={data}
            isLoading={isLoading}
            onRowClick={onViewDetail}
            pagination={pagination}
        />
    );
}