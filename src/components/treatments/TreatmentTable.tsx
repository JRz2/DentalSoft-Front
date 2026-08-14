import { ColumnDef } from '@tanstack/react-table';
import { Eye, Pencil, Trash2, Play, Pause, CheckCircle, XCircle, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTableShadcn } from '@/components/shared/DataTableShadcn';
import { Treatment } from '@/types/treatment';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface TreatmentTableProps {
    data: Treatment[];
    isLoading?: boolean;
    onView: (treatment: Treatment) => void;
    onEdit: (treatment: Treatment) => void;
    onDelete: (treatment: Treatment) => void;
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

const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
        return format(new Date(dateString), 'dd/MM/yyyy', { locale: es });
    } catch {
        return '-';
    }
};

export function TreatmentTable({
    data,
    isLoading,
    onView,
    onEdit,
    onDelete,
    pagination,
}: TreatmentTableProps) {
    const columns: ColumnDef<Treatment>[] = [
        {
            accessorKey: 'name',
            header: 'Tratamiento',
            size: 200,
            cell: ({ row }) => (
                <div>
                    <div className="font-medium text-gray-900">{row.getValue('name')}</div>
                    {row.original.description && (
                        <div className="text-sm text-gray-500 truncate max-w-[200px]">
                            {row.original.description}
                        </div>
                    )}
                </div>
            ),
        },
        {
            accessorKey: 'patient',
            header: 'Paciente',
            size: 180,
            cell: ({ row }) => {
                const patient = row.original.patient;
                return patient ? (
                    <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">{patient.fullName}</span>
                        <span className="text-xs text-gray-400">#{patient.medicalRecordNum}</span>
                    </div>
                ) : (
                    <span className="text-gray-400">-</span>
                );
            },
        },
        {
            accessorKey: 'type',
            header: 'Tipo',
            size: 120,
            cell: ({ row }) => (
                <Badge variant="outline" className="bg-gray-50">
                    {typeLabels[row.original.type] || row.original.type}
                </Badge>
            ),
        },
        {
            accessorKey: 'status',
            header: 'Estado',
            size: 130,
            cell: ({ row }) => {
                const status = row.original.status;
                const config = statusConfig[status] || { label: status, className: 'bg-gray-100 text-gray-700', icon: null };
                const Icon = config.icon;
                return (
                    <Badge className={config.className}>
                        {Icon && <Icon className="h-3 w-3 mr-1" />}
                        {config.label}
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
            accessorKey: 'startDate',
            header: 'Inicio',
            size: 100,
            cell: ({ row }) => (
                <div className="text-gray-600 text-sm">{formatDate(row.original.startDate)}</div>
            ),
        },
        {
            id: 'actions',
            header: 'Acciones',
            size: 120,
            cell: ({ row }) => {
                const treatment = row.original;
                return (
                    <div className="flex gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                                e.stopPropagation();
                                onView(treatment);
                            }}
                            className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 h-8 w-8"
                            title="Ver detalles"
                        >
                            <Eye className="h-4 w-4" />
                        </Button>
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
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete(treatment);
                            }}
                            className="text-red-600 hover:text-red-800 hover:bg-red-50 h-8 w-8"
                            title="Eliminar/Cancelar"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
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
            pagination={pagination}
        />
    );
}