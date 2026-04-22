import { ColumnDef } from '@tanstack/react-table';
import { Pencil, Trash2, Building2, Stethoscope, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTableShadcn } from '@/components/shared/DataTableShadcn';
import { User } from '@/types/user';

interface UserTableProps {
    data: User[];
    isLoading?: boolean;
    onEdit: (user: User) => void;
    onDelete: (user: User) => void;
    currentUserId?: number;
    pagination?: {
        currentPage: number;
        totalPages: number;
        totalItems: number;
        itemsPerPage: number;
        onPageChange: (page: number) => void;
    };
}

const roleLabels: Record<string, { label: string; color: string }> = {
    SUPER_ADMIN: { label: 'Super Admin', color: 'bg-purple-100 text-purple-700' },
    ADMIN: { label: 'Admin', color: 'bg-blue-100 text-blue-700' },
    DOCTOR: { label: 'Doctor', color: 'bg-green-100 text-green-700' },
    RECEPTIONIST: { label: 'Recepcionista', color: 'bg-yellow-100 text-yellow-700' },
};

export function UserTable({
    data,
    isLoading,
    onEdit,
    onDelete,
    currentUserId,
    pagination,
}: UserTableProps) {
    const columns: ColumnDef<User>[] = [
        {
            accessorKey: 'name',
            header: 'Nombre',
            size: 200,
            cell: ({ row }) => (
                <div className="font-medium text-gray-900">{row.getValue('name')}</div>
            ),
        },
        {
            accessorKey: 'email',
            header: 'Email',
            size: 250,
            cell: ({ row }) => <div className="text-gray-600">{row.getValue('email')}</div>,
        },
        {
            accessorKey: 'role',
            header: 'Rol',
            size: 120,
            cell: ({ row }) => {
                const role = row.getValue('role') as string;
                const config = roleLabels[role] || { label: role, color: 'bg-gray-100 text-gray-700' };
                return (
                    <Badge className={config.color}>
                        {config.label}
                    </Badge>
                );
            },
        },
        {
            accessorKey: 'clinic',
            header: 'Clínica',
            size: 180,
            cell: ({ row }) => {
                const clinic = row.original.clinic;
                return (
                    <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">{clinic?.name || '-'}</span>
                    </div>
                );
            },
        },
        {
            accessorKey: 'specialty',
            header: 'Especialidad',
            size: 150,
            cell: ({ row }) => {
                const specialty = row.getValue('specialty') as string;
                return specialty ? (
                    <div className="flex items-center gap-2">
                        <Stethoscope className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">{specialty}</span>
                    </div>
                ) : (
                    <span className="text-gray-400">-</span>
                );
            },
        },
        {
            accessorKey: 'phoneNumber',
            header: 'Teléfono',
            size: 150,
            cell: ({ row }) => {
                const phone = row.getValue('phoneNumber') as string;
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
            accessorKey: 'isActive',
            header: 'Estado',
            size: 100,
            cell: ({ row }) => {
                const isActive = row.getValue('isActive') as boolean;
                return (
                    <Badge variant={isActive ? 'default' : 'secondary'}>
                        {isActive ? 'Activo' : 'Inactivo'}
                    </Badge>
                );
            },
        },
        {
            id: 'actions',
            header: 'Acciones',
            size: 100,
            cell: ({ row }) => {
                const user = row.original;
                const isCurrentUser = user.id === currentUserId;

                return (
                    <div className="flex gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                                e.stopPropagation();
                                onEdit(user);
                            }}
                            className="text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50"
                            title="Editar usuario"
                        >
                            <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete(user);
                            }}
                            className="text-red-600 hover:text-red-800 hover:bg-red-50"
                            title="Eliminar usuario"
                            disabled={isCurrentUser}
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