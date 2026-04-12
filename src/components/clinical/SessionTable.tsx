import { ColumnDef } from '@tanstack/react-table';
import { Eye, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTableShadcn } from '@/components/shared/DataTableShadcn';
import { TreatmentSession } from '@/types/clinicalHistory';
import { useState } from 'react';
import { SessionDetailModal } from './SessionDetailModal';
import { SessionForm } from './SessionForm';

interface SessionTableProps {
    data: TreatmentSession[];
    isLoading?: boolean;
    treatmentName?: string;
    onComplete?: (session: TreatmentSession) => void;
    onSessionUpdated?: () => void;
}

export function SessionTable({
    data,
    isLoading,
    treatmentName,
    onSessionUpdated,
}: SessionTableProps) {
    const [selectedSession, setSelectedSession] = useState<TreatmentSession | null>(null);
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [editingSession, setEditingSession] = useState<TreatmentSession | null>(null);
    const [editModalOpen, setEditModalOpen] = useState(false);

    const handleViewDetail = (session: TreatmentSession) => {
        setSelectedSession(session);
        setDetailModalOpen(true);
    };

    const handleEdit = (session: TreatmentSession) => {
        setEditingSession(session);
        setEditModalOpen(true);
    };
    const columns: ColumnDef<TreatmentSession>[] = [
        {
            accessorKey: 'sessionNumber',
            header: 'Sesión',
            size: 80,
            cell: ({ row }) => (
                <div className="font-medium text-gray-900 text-center">
                    #{row.getValue('sessionNumber')}
                </div>
            ),
        },
        {
            accessorKey: 'sessionDate',
            header: 'Fecha',
            size: 100,
            cell: ({ row }) => {
                const date = row.getValue('sessionDate') as string;
                if (!date) return '-';
                const isoDate = date.split('T')[0];
                const [year, month, day] = isoDate.split('-');
                return <div className="text-gray-600">{`${day}/${month}/${year}`}</div>;
            },
        },
        {
            accessorKey: 'description',
            header: 'Descripción',
            size: 400,
            cell: ({ row }) => {
                const description = row.getValue('description') as string;
                return (
                    <div className="text-gray-700 max-w-md" title={description}>
                        {description}
                    </div>
                );
            },
        },
        {
            id: 'actions',
            header: 'Acciones',
            size: 100,
            cell: ({ row }) => {
                const session = row.original;

                return (
                    <div className="flex gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleViewDetail(session);
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
                                handleEdit(session);
                            }}
                            className="text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50"
                            title="Editar sesión"
                        >
                            <Pencil className="h-4 w-4" />
                        </Button>
                    </div>
                );
            },
        },
    ];

    return (
        <>
            <DataTableShadcn
                columns={columns}
                data={data}
                isLoading={isLoading}
                onRowClick={handleViewDetail}
            />

            <SessionDetailModal
                open={detailModalOpen}
                onOpenChange={setDetailModalOpen}
                session={selectedSession}
                treatmentName={treatmentName}
            />

            <SessionForm
                key={editingSession?.id || 'new'}  
                open={editModalOpen}
                onOpenChange={(open) => {
                    setEditModalOpen(open);
                    if (!open) {
                        setTimeout(() => setEditingSession(null), 100);
                    }
                }}
                treatmentId={editingSession?.treatmentId || 0}
                sessionToEdit={editingSession}
                onSuccess={() => {
                    setEditModalOpen(false);
                    setEditingSession(null);
                    onSessionUpdated?.();
                }}
            />
        </>

    );
}