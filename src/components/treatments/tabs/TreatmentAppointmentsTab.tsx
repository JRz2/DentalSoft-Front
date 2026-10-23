import { useState, useEffect } from 'react';
import { Plus, CalendarPlus, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TreatmentAppointmentsList } from '@/components/treatments/TreatmentAppointmentsList';
import { SearchBar } from '@/components/shared/SearchBar';
import { Treatment } from '@/types/clinicalHistory';
import { Appointment } from '@/types/appointment';
import { appointmentStatusLabels } from '@/lib/treatmentUtils';
import { format } from 'date-fns';

interface TreatmentAppointmentsTabProps {
    treatment: Treatment;
    appointments: Appointment[];
    isLoading: boolean;
    onRefresh: () => Promise<void>;
    onOpenCreateAppointment: () => void;
    onEditAppointment: (appointment: Appointment) => void;
    onViewAppointment: (appointment: Appointment) => void;
    onCompleteAppointment: (appointment: Appointment) => Promise<void>;
    onNoShowAppointment: (appointment: Appointment, reason?: string) => Promise<void>;
    onCancelAppointment: (appointment: Appointment, reason: string) => Promise<void>;
    isFinished: boolean;
    isCompleted: boolean;
}

export function TreatmentAppointmentsTab({
    appointments,
    isLoading,
    onOpenCreateAppointment,
    onEditAppointment,
    onViewAppointment,
    onCompleteAppointment,
    onNoShowAppointment,
    onCancelAppointment,
    isFinished,
    isCompleted,
}: TreatmentAppointmentsTabProps) {
    // Lógica de búsqueda y paginación local
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    // Filtrado
    const filteredAppointments = appointments.filter((a) => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        const dateStr = format(new Date(a.appointmentDate), 'dd/MM/yyyy');
        return (
            a.doctor?.name?.toLowerCase().includes(term) ||
            dateStr.includes(term) ||
            appointmentStatusLabels[a.status]?.toLowerCase().includes(term) ||
            a.status.toLowerCase().includes(term)
        );
    });

    // Paginación y ordenamiento descendente (más recientes primero)
    const totalPages = Math.ceil(filteredAppointments.length / itemsPerPage);
    const paginatedAppointments = filteredAppointments.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const sortedPaginatedAppointments = [...paginatedAppointments].sort(
        (a, b) => new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime()
    );

    const appointmentsDisabled = isFinished;
    const appointmentsDisabledReason = isFinished
        ? `El tratamiento está ${isCompleted ? 'completado' : 'cancelado'}, no se pueden agendar más citas`
        : undefined;

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-100 px-3 md:px-6 py-2.5 md:py-4 rounded-t-2xl">
                <div className="flex flex-col gap-2.5 md:gap-3">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-3">
                        <div className="min-w-0">
                            <h2 className="text-base md:text-lg font-semibold text-gray-900 flex items-center gap-2">
                                <CalendarPlus className="h-5 w-5 text-primary-600 shrink-0" />
                                Citas del Tratamiento
                            </h2>
                            <p className="text-xs md:text-sm text-gray-500 mt-0.5">
                                {filteredAppointments.length}{' '}
                                {filteredAppointments.length === 1 ? 'cita' : 'citas'}
                                {searchTerm && ` · filtradas de ${appointments.length}`}
                            </p>
                        </div>
                        <div className="flex flex-col items-stretch sm:items-end gap-1.5">
                            <Button
                                onClick={onOpenCreateAppointment}
                                disabled={appointmentsDisabled}
                                size="sm"
                                className="gap-2 rounded-lg w-full sm:w-auto hidden sm:flex"
                                title={appointmentsDisabledReason}
                            >
                                <Plus className="h-4 w-4" />
                                Agendar Cita
                            </Button>
                            {appointmentsDisabledReason && (
                                <span className="text-xs text-gray-500 flex items-center gap-1 sm:justify-end">
                                    <Lock className="h-3 w-3 shrink-0" />
                                    {appointmentsDisabledReason}
                                </span>
                            )}
                        </div>
                    </div>

                    {appointments.length > 0 && (
                        <SearchBar
                            onSearch={setSearchTerm}
                            placeholder="Buscar por doctor, fecha o estado..."
                            delay={400}
                        />
                    )}
                </div>
            </div>

            <div className="p-3 md:p-6 rounded-b-2xl">
                <TreatmentAppointmentsList
                    appointments={sortedPaginatedAppointments}
                    isLoading={isLoading}
                    onViewAppointment={onViewAppointment}
                    onEdit={onEditAppointment}
                    onComplete={onCompleteAppointment}
                    onNoShow={onNoShowAppointment}
                    onCancel={onCancelAppointment}
                    actionsDisabled={appointmentsDisabled}
                    actionsDisabledReason={appointmentsDisabledReason}
                    pagination={{
                        currentPage,
                        totalPages,
                        totalItems: filteredAppointments.length,
                        itemsPerPage,
                        onPageChange: setCurrentPage,
                    }}
                />
            </div>
        </div>
    );
}