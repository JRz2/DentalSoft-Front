import { ColumnDef } from '@tanstack/react-table';
import { Pencil, Trash2, Eye, Pause, CheckCircle, XCircle, PlayCircle, CalendarDays, ListChecks, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTableShadcn } from '@/components/shared/DataTableShadcn';
import { Treatment } from '@/types/clinicalHistory';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

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

const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    try {
        return format(new Date(dateString), 'dd/MM/yyyy', { locale: es });
    } catch {
        return '-';
    }
};

/* TARJETA */
interface CardProps {
    treatment: Treatment;
    isAdmin: boolean;
    onGoToDetail: (treatment: Treatment) => void;
    onEdit?: (treatment: Treatment) => void;
    onDelete?: (treatment: Treatment) => void;
    onStart?: (treatment: Treatment) => void;
    onComplete?: (treatment: Treatment) => void;
    onCancel?: (treatment: Treatment) => void;
}

function TreatmentCard({
    treatment,
    isAdmin,
    onGoToDetail,
    onEdit,
    onDelete,
    onStart,
    onComplete,
    onCancel,
}: CardProps) {
    const status = treatment.status;
    const config = statusConfig[status];
    const StatusIcon = config?.icon;

    const isCompleted = status === 'COMPLETED';
    const isCancelled = status === 'CANCELLED';
    const canStart = status === 'PLANNED';
    const canComplete = status === 'IN_PROGRESS';

    return (
        <div
            onClick={() => onGoToDetail(treatment)}
            className="bg-white rounded-xl border border-gray-100 p-4 transition-all hover:shadow-md active:scale-[0.99] cursor-pointer h-full flex flex-col"
        >
            {/* Header: nombre completo + estado */}
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-gray-900 text-sm leading-snug" title={treatment.name}>
                        {treatment.name}
                    </h3>
                    {treatment.description && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2" title={treatment.description}>
                            {treatment.description}
                        </p>
                    )}
                </div>
                <Badge className={cn("shrink-0 text-[10px] px-2 py-0.5 whitespace-nowrap", config?.className)}>
                    {StatusIcon && <StatusIcon className="h-3 w-3 mr-1" />}
                    {config?.label}
                </Badge>
            </div>

            {/* Info secundaria */}
            <div className="mt-2.5 space-y-1.5 flex-1">
                <Badge variant="outline" className="bg-gray-50 text-[10px] px-1.5 py-0">
                    {typeLabels[treatment.type] || treatment.type}
                </Badge>
                <div className="flex items-center gap-3 text-xs text-gray-600 flex-wrap">
                    <div className="flex items-center gap-1">
                        <ListChecks className="h-3 w-3 text-gray-400 shrink-0" />
                        <span>{treatment.estimatedSessions} sesiones</span>
                    </div>
                    {treatment.createdAt && (
                        <div className="flex items-center gap-1">
                            <CalendarDays className="h-3 w-3 text-gray-400 shrink-0" />
                            <span>{formatDate(treatment.createdAt)}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Acciones */}
            <div className="flex items-center justify-end gap-1 mt-3 pt-3 border-t border-gray-100 flex-wrap">
                {canStart && onStart && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => { e.stopPropagation(); onStart(treatment); }}
                        className="text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 h-9 w-9"
                        title="Iniciar tratamiento"
                    >
                        <PlayCircle className="h-4 w-4" />
                    </Button>
                )}

                <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => { e.stopPropagation(); onGoToDetail(treatment); }}
                    className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 h-9 w-9"
                    title="Ver sesiones"
                >
                    <Eye className="h-4 w-4" />
                </Button>

                {onEdit && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => { e.stopPropagation(); onEdit(treatment); }}
                        className="text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50 h-9 w-9"
                        title="Editar"
                    >
                        <Pencil className="h-4 w-4" />
                    </Button>
                )}

                {canComplete && onComplete && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => { e.stopPropagation(); onComplete(treatment); }}
                        className="text-green-600 hover:text-green-800 hover:bg-green-50 h-9 w-9"
                        title="Completar tratamiento"
                    >
                        <CheckCircle className="h-4 w-4" />
                    </Button>
                )}

                {!isCompleted && !isCancelled && onCancel && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => { e.stopPropagation(); onCancel(treatment); }}
                        className="text-red-600 hover:text-red-800 hover:bg-red-50 h-9 w-9"
                        title="Cancelar tratamiento"
                    >
                        <XCircle className="h-4 w-4" />
                    </Button>
                )}

                {/* Solo ADMIN puede eliminar */}
                {isAdmin && onDelete && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => { e.stopPropagation(); onDelete(treatment); }}
                        className="text-red-600 hover:text-red-800 hover:bg-red-50 h-9 w-9"
                        title="Eliminar"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                )}
            </div>
        </div>
    );
}

/* MAIN COMPONENT */
export function TreatmentTable({
    data,
    isLoading,
    onViewDetail,
    onEdit,
    onDelete,
    onStart,
    onComplete,
    onCancel,
    patientId,
    pagination,
}: TreatmentTableProps) {
    const navigate = useNavigate();
    // Tarjetas hasta 1024px (celular + tablet/iPad mini), tabla completa recién en laptop/desktop
    const useCardView = useMediaQuery('(max-width: 1024px)');
    const { user } = useAuth();
    const isAdmin = user?.role === 'ADMIN';

    const goToDetail = (treatment: Treatment) => {
        if (patientId) {
            navigate(`/treatment-sessions/${treatment.id}/patient/${patientId}`);
        } else if (onViewDetail) {
            onViewDetail(treatment);
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
            size: 260,
            cell: ({ row }) => {
                const treatment = row.original;
                const isCompleted = treatment.status === 'COMPLETED';
                const isCancelled = treatment.status === 'CANCELLED';
                const canStart = treatment.status === 'PLANNED';
                const canComplete = treatment.status === 'IN_PROGRESS';

                return (
                    <div className="flex gap-1">
                        {canStart && onStart && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => { e.stopPropagation(); onStart(treatment); }}
                                className="text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 h-8 w-8"
                                title="Iniciar tratamiento"
                            >
                                <PlayCircle className="h-4 w-4" />
                            </Button>
                        )}

                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => { e.stopPropagation(); goToDetail(treatment); }}
                            className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 h-8 w-8"
                            title="Ver sesiones"
                        >
                            <Eye className="h-4 w-4" />
                        </Button>

                        {onEdit && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => { e.stopPropagation(); onEdit(treatment); }}
                                className="text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50 h-8 w-8"
                                title="Editar"
                            >
                                <Pencil className="h-4 w-4" />
                            </Button>
                        )}

                        {canComplete && onComplete && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => { e.stopPropagation(); onComplete(treatment); }}
                                className="text-green-600 hover:text-green-800 hover:bg-green-50 h-8 w-8"
                                title="Completar tratamiento"
                            >
                                <CheckCircle className="h-4 w-4" />
                            </Button>
                        )}

                        {!isCompleted && !isCancelled && onCancel && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => { e.stopPropagation(); onCancel(treatment); }}
                                className="text-red-600 hover:text-red-800 hover:bg-red-50 h-8 w-8"
                                title="Cancelar tratamiento"
                            >
                                <XCircle className="h-4 w-4" />
                            </Button>
                        )}

                        {/* Solo ADMIN puede eliminar */}
                        {isAdmin && onDelete && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => { e.stopPropagation(); onDelete(treatment); }}
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

    /* LOADING STATE */
    if (isLoading && useCardView) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 animate-pulse">
                        <div className="space-y-2">
                            <div className="h-4 bg-gray-200 rounded w-3/4" />
                            <div className="h-3 bg-gray-100 rounded w-1/2" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    /* EMPTY STATE */
    if (!data.length && !isLoading && useCardView) {
        return (
            <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
                <p className="text-sm text-gray-500">No hay tratamientos registrados</p>
            </div>
        );
    }

    /* RENDER MOBILE/TABLET */
    if (useCardView) {
        return (
            <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {data.map((treatment) => (
                        <TreatmentCard
                            key={treatment.id}
                            treatment={treatment}
                            isAdmin={isAdmin}
                            onGoToDetail={goToDetail}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            onStart={onStart}
                            onComplete={onComplete}
                            onCancel={onCancel}
                        />
                    ))}
                </div>

                {pagination && pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between bg-white rounded-xl border border-gray-100 p-3">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
                            disabled={pagination.currentPage <= 1}
                        >
                            Anterior
                        </Button>
                        <span className="text-xs text-gray-600">
                            {pagination.currentPage} / {pagination.totalPages}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
                            disabled={pagination.currentPage >= pagination.totalPages}
                        >
                            Siguiente
                        </Button>
                    </div>
                )}
            </div>
        );
    }

    /* RENDER DESKTOP */
    return (
        <DataTableShadcn
            columns={columns}
            data={data}
            isLoading={isLoading}
            onRowClick={goToDetail}
            pagination={pagination}
        />
    );
}