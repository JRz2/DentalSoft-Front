import { ColumnDef } from '@tanstack/react-table';
import { Pencil, Trash2, Eye, Play, Pause, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTableShadcn } from '@/components/shared/DataTableShadcn';
import { Treatment } from '@/types/clinicalHistory';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

interface TreatmentTableProps {
    data: Treatment[];
    isLoading?: boolean;
    onViewDetail?: (treatment: Treatment) => void;
    onEdit?: (treatment: Treatment) => void;
    onDelete?: (treatment: Treatment) => void;
    onStart?: (treatment: Treatment) => void;
    onPause?: (treatment: Treatment) => void;
    onComplete?: (treatment: Treatment) => void;
    onCancel?: (treatment: Treatment) => void;
    patientId?: number;
    pagination?: {
        currentPage: number;
        totalPages: number;
        totalItems: number;
        itemsPerPage: number;
        onPageChange: (page: number) => void;
    };
}

const statusConfig: Record<string, { label: string; className: string; icon: any }> = {
    PLANNED: { label: 'Planificado', className: 'bg-blue-100 text-blue-700', icon: Play },
    IN_PROGRESS: { label: 'En Progreso', className: 'bg-yellow-100 text-yellow-700', icon: Play },
    ON_HOLD: { label: 'En Espera', className: 'bg-orange-100 text-orange-700', icon: Pause },
    COMPLETED: { label: 'Completado', className: 'bg-green-100 text-green-700', icon: CheckCircle },
    CANCELLED: { label: 'Cancelado', className: 'bg-red-100 text-red-700', icon: XCircle },
};

const typeLabels: Record<string, string> = {
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
    onEdit,
    onDelete,
    onStart,
    onPause,
    onComplete,
    onCancel,
    patientId,
    pagination,
}: TreatmentTableProps) {
    const navigate = useNavigate(); // ← Agregar useNavigate

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
            size: 250,
            cell: ({ row }) => {
                const treatment = row.original;
                const description = treatment.description;
                const hasDescription = description && description.trim().length > 0;
                
                return (
                    <div>
                        <div className="font-medium text-gray-900 truncate max-w-[200px]" title={treatment.name}>
                            {treatment.name}
                        </div>
                        {hasDescription && (
                            <div className="text-sm text-gray-500 truncate max-w-[200px]" title={description}>
                                {description.length > 50 ? `${description.substring(0, 50)}...` : description}
                            </div>
                        )}
                    </div>
                );
            },
        },
        {
            accessorKey: 'type',
            header: 'Tipo',
            size: 100,
            cell: ({ row }) => (
                <Badge variant="outline" className="bg-gray-50">
                    {typeLabels[row.original.type] || row.original.type}
                </Badge>
            ),
        },
        {
            accessorKey: 'status',
            header: 'Estado',
            size: 110,
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
            size: 80,
            cell: ({ row }) => (
                <div className="text-center">
                    <span className="font-medium">{row.original.estimatedSessions}</span>
                </div>
            ),
        },
        {
            accessorKey: 'createdAt',
            header: 'Inicio',
            size: 100,
            cell: ({ row }) => (
                <div className="text-gray-600 text-sm">
                    {formatDate(row.original.createdAt || '')}
                </div>
            ),
        },
        {
            id: 'actions',
            header: 'Acciones',
            size: 150,
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
                                if (patientId) {
                                    navigate(`/treatment-sessions/${treatment.id}/patient/${patientId}`);
                                } else if (onViewDetail) {
                                    onViewDetail(treatment);
                                }
                            }}
                            className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 h-8 w-8"
                            title="Ver sesiones"
                        >
                            <Eye className="h-4 w-4" />
                        </Button>

                        {onEdit && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onEdit(treatment);
                                }}
                                className="text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50 h-8 w-8"
                                title="Editar"
                            >
                                <Pencil className="h-4 w-4" />
                            </Button>
                        )}

                        {status === 'PLANNED' && onStart && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onStart(treatment);
                                }}
                                className="text-green-600 hover:text-green-800 hover:bg-green-50 h-8 w-8"
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
                                className="text-orange-600 hover:text-orange-800 hover:bg-orange-50 h-8 w-8"
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
                                className="text-green-600 hover:text-green-800 hover:bg-green-50 h-8 w-8"
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
                                className="text-red-600 hover:text-red-800 hover:bg-red-50 h-8 w-8"
                                title="Cancelar tratamiento"
                            >
                                <XCircle className="h-4 w-4" />
                            </Button>
                        )}

                        {onDelete && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete(treatment);
                                }}
                                className="text-red-600 hover:text-red-800 hover:bg-red-50 h-8 w-8"
                                title="Eliminar"
                            >
                                <Trash2 className="h-4 w-4" />
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
            onRowClick={(treatment) => {
                if (patientId) {
                    navigate(`/treatment-sessions/${treatment.id}/patient/${patientId}`);
                } else if (onViewDetail) {
                    onViewDetail(treatment);
                }
            }}
            pagination={pagination}
        />
    );
}