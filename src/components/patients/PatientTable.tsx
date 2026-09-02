import { ColumnDef } from '@tanstack/react-table';
import { Pencil, Trash2, Eye, CalendarPlus, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTableShadcn } from '@/components/shared/DataTableShadcn';
import { Patient } from '@/types/patient';
import { useAuth } from '@/contexts/AuthContext';

interface PatientTableProps {
    data: Patient[];
    isLoading?: boolean;
    onEdit: (patient: Patient) => void;
    onDelete: (patient: Patient) => void;
    onViewHistory: (patient: Patient) => void;
    onRestore?: (patient: Patient) => void;
    onQuickAppointment?: (patient: Patient) => void;
    pagination?: {
        currentPage: number;
        totalPages: number;
        totalItems: number;
        itemsPerPage: number;
        onPageChange: (page: number) => void;
    };
}

// Función para obtener iniciales
const getInitials = (name: string) => {
    return name
        .split(' ')
        .map(word => word[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
};

// Función para obtener URL completa de la imagen
const getImageUrl = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) {
        return path;
    }
    if (path.startsWith('/')) {
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        const cleanBaseUrl = baseUrl.replace(/\/api$/, '');
        return `${cleanBaseUrl}${path}`;
    }
    return path;
};

export function PatientTable({
    data,
    isLoading,
    onEdit,
    onDelete,
    onViewHistory,
    onRestore,
    onQuickAppointment,
    pagination,
}: PatientTableProps) {
    const { user } = useAuth();
    const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

    // Definir las columnas para TanStack Table
    const columns: ColumnDef<Patient>[] = [
        {
            accessorKey: 'photoUrl',
            header: 'Foto',
            size: 80,
            cell: ({ row }) => {
                const photoUrl = row.getValue('photoUrl') as string;
                const fullName = row.getValue('fullName') as string;
                const fullImageUrl = photoUrl ? getImageUrl(photoUrl) : '';

                return (
                    <div className="h-14 w-14 rounded-full overflow-hidden bg-gray-100 border border-gray-200 flex-shrink-0 flex items-center justify-center">
                        {fullImageUrl ? (
                            <img
                                src={fullImageUrl}
                                alt={fullName}
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <span className="text-xs font-medium text-primary-700">
                                {getInitials(fullName)}
                            </span>
                        )}
                    </div>
                );
            },
        },
        {
            accessorKey: 'fullName',
            header: 'Nombre',
            size: 200,
            cell: ({ row }) => (
                <div className="font-medium text-gray-900">{row.getValue('fullName')}</div>
            ),
        },
        {
            accessorKey: 'phoneNumber',
            header: 'Teléfono',
            size: 150,
            cell: ({ row }) => <div className="text-gray-600">{row.getValue('phoneNumber')}</div>,
        },
        {
            accessorKey: 'medicalRecordNum',
            header: 'Historia #',
            size: 120,
            cell: ({ row }) => {
                const recordNum = row.getValue('medicalRecordNum') as string;
                return <div className="text-gray-600 text-sm">{recordNum || '-'}</div>;
            },
        },
        {
            id: 'deletedStatus',
            header: 'Estado',
            size: 100,
            cell: ({ row }) => {
                const isDeleted = !!row.original.deletedAt;
                return isDeleted ? (
                    <Badge variant="destructive" className="bg-red-100 text-red-700">
                        Eliminado
                    </Badge>
                ) : (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Activo
                    </Badge>
                );
            },
        },
        {
            id: 'actions',
            header: 'Acciones',
            size: 160,
            cell: ({ row }) => {
                const patient = row.original;
                const isDeleted = !!patient.deletedAt;

                return (
                    <div className="flex gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                                e.stopPropagation();
                                onViewHistory(patient);
                            }}
                            className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 h-8 w-8"
                            title="Ver historial"
                        >
                            <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                                e.stopPropagation();
                                onEdit(patient);
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
                                onQuickAppointment?.(patient);
                            }}
                            className="text-primary-600 hover:text-primary-800 h-8 w-8"
                            title="Agendar cita"
                        >
                            <CalendarPlus className="h-4 w-4" />
                        </Button>
                        {isAdmin && isDeleted && onRestore && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onRestore(patient);
                                }}
                                className="text-green-600 hover:text-green-800 hover:bg-green-50 h-8 w-8"
                                title="Restaurar paciente"
                            >
                                <RotateCcw className="h-4 w-4" />
                            </Button>
                        )}
                        {!isDeleted && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete(patient);
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
            onRowClick={onViewHistory}
            pagination={pagination}
        />
    );
}