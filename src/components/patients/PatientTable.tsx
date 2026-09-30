import { ColumnDef } from '@tanstack/react-table';
import { Pencil, Trash2, Eye, CalendarPlus, RotateCcw, Phone, IdCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTableShadcn } from '@/components/shared/DataTableShadcn';
import { Patient } from '@/types/patient';
import { useAuth } from '@/contexts/AuthContext';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { cn } from '@/lib/utils';

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

/* MOBILE CARD - Se muestra en pantallas < md */
interface MobileCardProps {
    patient: Patient;
    isAdmin: boolean;
    onEdit: (patient: Patient) => void;
    onDelete: (patient: Patient) => void;
    onViewHistory: (patient: Patient) => void;
    onRestore?: (patient: Patient) => void;
    onQuickAppointment?: (patient: Patient) => void;
}

function PatientMobileCard({
    patient,
    isAdmin,
    onEdit,
    onDelete,
    onViewHistory,
    onRestore,
    onQuickAppointment,
}: MobileCardProps) {
    const isDeleted = !!patient.deletedAt;
    const imageUrl = patient.photoUrl ? getImageUrl(patient.photoUrl) : '';

    return (
        <div
            onClick={() => onViewHistory(patient)}
            className={cn(
                "bg-white rounded-xl border border-gray-100 p-4 transition-all",
                "hover:shadow-md active:scale-[0.99] cursor-pointer",
                isDeleted && "opacity-70"
            )}
        >
            {/* Header: Foto + Info + Estado */}
            <div className="flex items-start gap-3">
                {/* Foto */}
                <div className="h-12 w-12 rounded-full overflow-hidden bg-gray-100 border border-gray-200 flex-shrink-0 flex items-center justify-center">
                    {imageUrl ? (
                        <img
                            src={imageUrl}
                            alt={patient.fullName}
                            className="h-full w-full object-cover"
                        />
                    ) : (
                        <span className="text-xs font-medium text-primary-700">
                            {getInitials(patient.fullName)}
                        </span>
                    )}
                </div>

                {/* Info principal */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                            <h3 className="font-semibold text-gray-900 text-sm truncate">
                                {patient.fullName}
                            </h3>
                            {patient.medicalRecordNum && (
                                <p className="text-xs text-gray-500 mt-0.5">
                                    Historia #{patient.medicalRecordNum}
                                </p>
                            )}
                        </div>
                        <Badge
                            variant={isDeleted ? "destructive" : "outline"}
                            className={cn(
                                "shrink-0 text-[10px] px-2 py-0.5",
                                isDeleted
                                    ? "bg-red-100 text-red-700"
                                    : "bg-green-50 text-green-700 border-green-200"
                            )}
                        >
                            {isDeleted ? 'Eliminado' : 'Activo'}
                        </Badge>
                    </div>

                    {/* Info secundaria */}
                    <div className="mt-2 space-y-1">
                        {patient.phoneNumber && (
                            <div className="flex items-center gap-1.5 text-xs text-gray-600">
                                <Phone className="h-3 w-3 text-gray-400 shrink-0" />
                                <span className="truncate">{patient.phoneNumber}</span>
                            </div>
                        )}
                        {patient.email && (
                            <div className="flex items-center gap-1.5 text-xs text-gray-600">
                                <IdCard className="h-3 w-3 text-gray-400 shrink-0" />
                                <span className="truncate">{patient.email}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Acciones */}
            <div className="flex items-center justify-end gap-1 mt-3 pt-3 border-t border-gray-100">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                        e.stopPropagation();
                        onViewHistory(patient);
                    }}
                    className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 h-9 w-9"
                    title="Ver historial"
                >
                    <Eye className="h-4 w-4" />
                </Button>

                {!isDeleted && (
                    <>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                                e.stopPropagation();
                                onEdit(patient);
                            }}
                            className="text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50 h-9 w-9"
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
                            className="text-primary-600 hover:text-primary-800 hover:bg-primary-50 h-9 w-9"
                            title="Agendar cita"
                        >
                            <CalendarPlus className="h-4 w-4" />
                        </Button>

                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete(patient);
                            }}
                            className="text-red-600 hover:text-red-800 hover:bg-red-50 h-9 w-9"
                            title="Eliminar"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </>
                )}

                {isAdmin && isDeleted && onRestore && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                            e.stopPropagation();
                            onRestore(patient);
                        }}
                        className="text-green-600 hover:text-green-800 hover:bg-green-50 h-9 w-9"
                        title="Restaurar paciente"
                    >
                        <RotateCcw className="h-4 w-4" />
                    </Button>
                )}
            </div>
        </div>
    );
}

/* MAIN COMPONENT */
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
    const isMobile = useMediaQuery('(max-width: 767px)');

    /* COLUMNAS PARA DESKTOP */
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

    /* LOADING STATE (mobile + desktop) */
    if (isLoading) {
        if (isMobile) {
            return (
                <div className="space-y-3">
                    {[1, 2, 3, 4].map((i) => (
                        <div
                            key={i}
                            className="bg-white rounded-xl border border-gray-100 p-4 animate-pulse"
                        >
                            <div className="flex items-start gap-3">
                                <div className="h-12 w-12 rounded-full bg-gray-200" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            );
        }
    }

    /* EMPTY STATE */
    if (!data.length && !isLoading) {
        if (isMobile) {
            return (
                <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
                    <p className="text-sm text-gray-500">No hay pacientes registrados</p>
                </div>
            );
        }
    }

    /* RENDER */
    // En móvil: cards
    if (isMobile) {
        return (
            <div className="space-y-3">
                {data.map((patient) => (
                    <PatientMobileCard
                        key={patient.id}
                        patient={patient}
                        isAdmin={isAdmin}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        onViewHistory={onViewHistory}
                        onRestore={onRestore}
                        onQuickAppointment={onQuickAppointment}
                    />
                ))}

                {/* Paginación en móvil (simple) */}
                {pagination && pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between bg-white rounded-xl border border-gray-100 p-3 mt-3">
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

    // En desktop: tabla normal
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