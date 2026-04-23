import { ColumnDef } from '@tanstack/react-table';
import { Pencil, Trash2, Building2, Mail, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTableShadcn } from '@/components/shared/DataTableShadcn';
import { Clinic } from '@/types/clinic';

interface ClinicTableProps {
    data: Clinic[];
    isLoading?: boolean;
    onEdit: (clinic: Clinic) => void;
    onDelete: (clinic: Clinic) => void;
    pagination?: {
        currentPage: number;
        totalPages: number;
        totalItems: number;
        itemsPerPage: number;
        onPageChange: (page: number) => void;
    };
}

export function ClinicTable({
    data,
    isLoading,
    onEdit,
    onDelete,
    pagination,
}: ClinicTableProps) {
    const columns: ColumnDef<Clinic>[] = [
        {
            accessorKey: 'name',
            header: 'Nombre',
            size: 200,
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-gray-400" />
                    <span className="font-medium text-gray-900">{row.getValue('name')}</span>
                </div>
            ),
        },
        {
            accessorKey: 'commercialName',
            header: 'Nombre Comercial',
            size: 180,
            cell: ({ row }) => (
                <div className="text-gray-600">{row.getValue('commercialName') || '-'}</div>
            ),
        },
        {
            accessorKey: 'phone',
            header: 'Teléfono',
            size: 120,
            cell: ({ row }) => {
                const phone = row.getValue('phone') as string;
                return phone ? (
                    <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">{phone}</span>
                    </div>
                ) : (
                    <span className="text-gray-400">-</span>
                );
            },
        },
        {
            accessorKey: 'email',
            header: 'Email',
            size: 200,
            cell: ({ row }) => {
                const email = row.getValue('email') as string;
                return email ? (
                    <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">{email}</span>
                    </div>
                ) : (
                    <span className="text-gray-400">-</span>
                );
            },
        },
        {
            accessorKey: 'isActive',
            header: 'Estado',
            size: 100,
            cell: ({ row }) => {
                const isActive = row.getValue('isActive') as boolean;
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
            size: 100,
            cell: ({ row }) => {
                const clinic = row.original;
                return (
                    <div className="flex gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                                e.stopPropagation();
                                onEdit(clinic);
                            }}
                            className="text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50"
                            title="Editar clínica"
                        >
                            <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete(clinic);
                            }}
                            className="text-red-600 hover:text-red-800 hover:bg-red-50"
                            title="Eliminar clínica"
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