import { ColumnDef } from '@tanstack/react-table';
import { Pencil, Trash2, Building2, Phone, MapPin, Globe, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTableShadcn } from '@/components/shared/DataTableShadcn';
import { Clinic } from '@/types/clinic';

interface ClinicTableProps {
    data: Clinic[];
    isLoading?: boolean;
    onEdit: (clinic: Clinic) => void;
    onDelete: (clinic: Clinic) => void;
    onReactivate?: (clinic: Clinic) => void;
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
    onReactivate,
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
            accessorKey: 'subdomain',
            header: 'Subdominio',
            size: 150,
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">{row.getValue('subdomain')}</span>
                </div>
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
            accessorKey: 'address',
            header: 'Dirección',
            size: 250,
            cell: ({ row }) => {
                const address = row.getValue('address') as string;
                return address ? (
                    <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">{address}</span>
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
                return isActive ? (
                    <Badge className="bg-green-100 text-green-700 border border-green-200 rounded-full">
                        Activo
                    </Badge>
                ) : (
                    <Badge className="bg-red-100 text-red-700 border border-red-200 rounded-full">
                        Inactivo
                    </Badge>
                );
            },
        },
        {
            id: 'actions',
            header: 'Acciones',
            size: 120,
            cell: ({ row }) => {
                const clinic = row.original;
                const isActive = clinic.isActive !== false;

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

                        {/* Botón Reactivar - solo si está inactiva */}
                        {!isActive && onReactivate && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onReactivate(clinic);
                                }}
                                className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                                title="Reactivar clínica"
                            >
                                <RotateCcw className="h-4 w-4" />
                            </Button>
                        )}

                        {/* Botón Eliminar - solo si está activa */}
                        {isActive && (
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
            pagination={pagination}
        />
    );
}