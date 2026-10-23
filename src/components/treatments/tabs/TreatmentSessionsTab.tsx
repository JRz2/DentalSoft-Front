import { useState, useEffect } from 'react';
import { Plus, ListChecks, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SessionTable } from '@/components/clinical/SessionTable';
import { SearchBar } from '@/components/shared/SearchBar';
import { Treatment, TreatmentSession } from '@/types/clinicalHistory';

interface TreatmentSessionsTabProps {
    treatment: Treatment;
    sessions: TreatmentSession[];
    isLoading: boolean;
    onRefresh: () => Promise<void>;
    onOpenCreateSession: () => void;
    onCompleteSession: (session: TreatmentSession) => Promise<void>;
    onNoShowSession: (session: TreatmentSession, reason?: string) => Promise<void>;
    isFinished: boolean;
    isCompleted: boolean;
}

export function TreatmentSessionsTab({
    treatment,
    sessions,
    isLoading,
    onRefresh,
    onOpenCreateSession,
    onCompleteSession,
    onNoShowSession,
    isFinished,
    isCompleted,
}: TreatmentSessionsTabProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    const filteredSessions = sessions.filter((s) => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (
            s.description?.toLowerCase().includes(term) ||
            s.notes?.toLowerCase().includes(term) ||
            String(s.sessionNumber).includes(term)
        );
    });

    const totalPages = Math.ceil(filteredSessions.length / itemsPerPage);
    const paginatedSessions = filteredSessions.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Lógica de deshabilitado (podría venir por props también)
    const isPlanned = treatment.status === 'PLANNED';
    const sessionsDisabled = isPlanned || isFinished;
    const sessionsDisabledReason = isPlanned
        ? 'Iniciá el tratamiento para registrar sesiones'
        : isFinished
            ? `El tratamiento está ${isCompleted ? 'completado' : 'cancelado'}, no se pueden registrar más sesiones`
            : undefined;

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-100 px-3 md:px-6 py-2.5 md:py-4 rounded-t-2xl">
                <div className="flex flex-col gap-2.5 md:gap-3">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-3">
                        <div className="min-w-0">
                            <h2 className="text-base md:text-lg font-semibold text-gray-900 flex items-center gap-2">
                                <ListChecks className="h-5 w-5 text-primary-600 shrink-0" />
                                Sesiones realizadas
                            </h2>
                            <p className="text-xs md:text-sm text-gray-500 mt-0.5">
                                {filteredSessions.length}{' '}
                                {filteredSessions.length === 1 ? 'sesión' : 'sesiones'}
                                {searchTerm && ` · filtradas de ${sessions.length}`}
                            </p>
                        </div>
                        <div className="flex flex-col items-stretch sm:items-end gap-1.5">
                            <Button
                                onClick={onOpenCreateSession}
                                disabled={sessionsDisabled}
                                size="sm"
                                className="gap-2 rounded-lg w-full sm:w-auto hidden sm:flex"
                                title={sessionsDisabledReason}
                            >
                                <Plus className="h-4 w-4" />
                                Nueva Sesión
                            </Button>
                            {sessionsDisabledReason && (
                                <span className="text-xs text-gray-500 flex items-center gap-1 sm:justify-end">
                                    <Lock className="h-3 w-3 shrink-0" />
                                    {sessionsDisabledReason}
                                </span>
                            )}
                        </div>
                    </div>

                    {sessions.length > 0 && (
                        <SearchBar
                            onSearch={setSearchTerm}
                            placeholder="Buscar por descripción, notas o #..."
                            delay={400}
                        />
                    )}
                </div>
            </div>

            <div className="p-3 md:p-6 rounded-b-2xl">
                <SessionTable
                    data={paginatedSessions}
                    isLoading={isLoading}
                    treatmentId={treatment.id}
                    onComplete={onCompleteSession}
                    onNoShow={onNoShowSession}
                    onSessionUpdated={onRefresh}
                    actionsDisabled={isFinished}
                    actionsDisabledReason={
                        isFinished
                            ? `El tratamiento está ${isCompleted ? 'completado' : 'cancelado'}`
                            : undefined
                    }
                    pagination={{
                        currentPage,
                        totalPages,
                        totalItems: filteredSessions.length,
                        itemsPerPage,
                        onPageChange: setCurrentPage,
                    }}
                />
            </div>
        </div>
    );
}