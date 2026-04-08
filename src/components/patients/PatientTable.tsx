import { ColumnDef } from '@tanstack/react-table';
import { Pencil, Trash2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTableShadcn } from '@/components/shared/DataTableShadcn';
import { Patient } from '@/types/patient';

interface PatientTableProps {
    data: Patient[];
    isLoading?: boolean;
    onEdit: (patient: Patient) => void;
    onDelete: (patient: Patient) => void;
    onViewHistory: (patient: Patient) => void;
    onRestore?: (patient: Patient) => void;
    pagination?: {
        currentPage: number;
        totalPages: number;
        totalItems: number;
        itemsPerPage: number;
        onPageChange: (page: number) => void;
    };
}

export function PatientTable({
    data,
    isLoading,
    onEdit,
    onDelete,
    onViewHistory,
    pagination,
}: PatientTableProps) {
    // Definir las columnas para TanStack Table
    const columns: ColumnDef<Patient>[] = [
        {
            accessorKey: 'fullName',
            header: 'Nombre',
            size: 200,
            cell: ({ row }) => (
                <div className="font-medium text-gray-900">{row.getValue('fullName')}</div>
            ),
        },
        {
            accessorKey: 'email',
            header: 'Email',
            size: 250,
            cell: ({ row }) => <div className="text-gray-600">{row.getValue('email')}</div>,
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
            accessorKey: 'birthDate',
            header: 'Fecha Nac.',
            size: 120,
            cell: ({ row }) => {
                const date = row.getValue('birthDate') as string;
                if (!date) return '-';
                const isoDate = date.split('T')[0]; 
                const [year, month, day] = isoDate.split('-');
                return <div className="text-gray-600">{`${day}/${month}/${year}`}</div>;
            },
        },
     {
            id: 'deletedStatus',  // ← Cambiar a id en lugar de accessorKey
            header: 'Eliminado',
            size: 100,
            cell: ({ row }) => {
                // ✅ Acceder directamente a row.original.deletedAt
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
            accessorKey: 'IsActive',
            header: 'Estado',
            size: 100,
            cell: ({ row }) => {
                const isActive = row.getValue('IsActive') as boolean;
                return (
                    <Badge variant={isActive !== false ? 'default' : 'secondary'}>
                        {isActive !== false ? 'Activo' : 'Inactivo'}
                    </Badge>
                );
            },
        },
        {
            id: 'actions',
            header: 'Acciones',
            size: 120,
            cell: ({ row }) => {
                const patient = row.original;
                return (
                    <div className="flex gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                                e.stopPropagation();
                                onViewHistory(patient);
                            }}
                            className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
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
                            className="text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50"
                            title="Editar"
                        >
                            <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete(patient);
                            }}
                            className="text-red-600 hover:text-red-800 hover:bg-red-50"
                            title="Eliminar"
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
            onRowClick={onViewHistory}
            pagination={pagination}
        />
    );
}