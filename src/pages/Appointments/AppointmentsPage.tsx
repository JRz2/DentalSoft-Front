import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AppointmentCalendar } from '@/components/appointments/AppointmentCalendar';
import { AppointmentList } from '@/components/appointments/AppointmentList';
import { AppointmentFilters } from '@/components/appointments/AppointmentFilters';
import { AppointmentForm } from '@/components/appointments/AppointmentForm';
import { AppointmentDetail } from '@/components/appointments/AppointmentDetail';
import { useAppointments } from '@/hooks/useAppointments';
import { useDoctors } from '@/hooks/useDoctors';
import { Appointment, AppointmentStatus } from '@/types/appointment';
import { CalendarIcon, Plus, RefreshCw } from 'lucide-react';
import { format, startOfDay, endOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

export function AppointmentsPage() {
    const navigate = useNavigate();
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [filters, setFilters] = useState<{
        doctorId?: number;
        status?: AppointmentStatus;
        date?: string;
    }>({});
    const [showForm, setShowForm] = useState(false);
    const [showDetail, setShowDetail] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
    const [appointmentToEdit, setAppointmentToEdit] = useState<Appointment | null>(null);
    const [refreshKey, setRefreshKey] = useState(0);

    const { data: doctorsData } = useDoctors();
    const doctors = doctorsData || [];

    const { data: appointmentsData, isLoading, refetch } = useAppointments({
        page: 1,
        limit: 50,
        startDate: format(startOfDay(selectedDate), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"),
        endDate: format(endOfDay(selectedDate), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"),
        doctorId: filters.doctorId,
        status: filters.status,
    });

    const appointments = appointmentsData?.data || [];

    const handleDateSelect = (date: Date) => {
        setSelectedDate(date);
        setFilters(prev => ({ ...prev, date: format(date, 'yyyy-MM-dd') }));
    };

    const handleFilterChange = (newFilters: { doctorId?: number; status?: AppointmentStatus; date?: string }) => {
        setFilters(newFilters);
        if (newFilters.date) {
            setSelectedDate(new Date(newFilters.date));
        }
    };

    const handleClearFilters = () => {
        setFilters({});
        setSelectedDate(new Date());
    };

    const handleRefresh = () => {
        refetch();
        setRefreshKey(prev => prev + 1);
        toast.info('Actualizando citas...');
    };

    const handleViewAppointment = (appointment: Appointment) => {
        setSelectedAppointment(appointment);
        setShowDetail(true);
    };

    const handleEditAppointment = (appointment: Appointment) => {
        setAppointmentToEdit(appointment);
        setShowForm(true);
    };

    const handleFormSuccess = () => {
        setShowForm(false);
        setAppointmentToEdit(null);
        handleRefresh();
    };

    const handleDetailClose = () => {
        setShowDetail(false);
        setSelectedAppointment(null);
    };

    const hasFilters = !!(filters.doctorId || filters.status || filters.date);

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto p-4 lg:p-6 space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary-100 rounded-xl">
                            <CalendarIcon className="h-6 w-6 text-primary-600" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Citas</h1>
                            <p className="text-sm text-gray-500">
                                Gestiona la agenda de la clínica
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleRefresh}
                            className="gap-2"
                        >
                            <RefreshCw className="h-4 w-4" />
                            Actualizar
                        </Button>
                        <Button
                            onClick={() => setShowForm(true)}
                            className="gap-2"
                        >
                            <Plus className="h-4 w-4" />
                            Nueva Cita
                        </Button>
                    </div>
                </div>

                {/* Filtros */}
                <AppointmentFilters
                    onFilterChange={handleFilterChange}
                    doctors={doctors}
                    onClearFilters={handleClearFilters}
                    hasFilters={hasFilters}
                />

                {/* Calendario */}
                <AppointmentCalendar
                    key={refreshKey}
                    appointments={appointments}
                    selectedDate={selectedDate}
                    onDateSelect={handleDateSelect}
                    defaultView="month"
                />

                {/* Lista de citas */}
                <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-3">
                        Citas del {format(selectedDate, "EEEE d 'de' MMMM 'de' yyyy", { locale: es })}
                    </h2>
                    <AppointmentList
                        appointments={appointments}
                        isLoading={isLoading}
                        onViewAppointment={handleViewAppointment}
                        onEditAppointment={handleEditAppointment}
                        onRefresh={handleRefresh}
                    />
                </div>
            </div>

            {/* Modal de creación/edición */}
            <AppointmentForm
                open={showForm}
                onOpenChange={setShowForm}
                appointmentToEdit={appointmentToEdit}
                onSuccess={handleFormSuccess}
                defaultDate={format(selectedDate, 'yyyy-MM-dd')}
            />

            {/* Modal de detalle */}
            {selectedAppointment && (
                <AppointmentDetail
                    open={showDetail}
                    onOpenChange={setShowDetail}
                    appointment={selectedAppointment}
                    onEdit={() => {
                        setShowDetail(false);
                        handleEditAppointment(selectedAppointment);
                    }}
                    onRefresh={handleRefresh}
                />
            )}
        </div>
    );
}