import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AppointmentCalendar } from '@/components/appointments/AppointmentCalendar';
import { AppointmentList } from '@/components/appointments/AppointmentList';
import { AppointmentFilters } from '@/components/appointments/AppointmentFilters';
import { AppointmentFromPatient } from '@/components/appointments/AppointmentFormModal';
import { AppointmentDetailDialog } from '@/components/appointments/AppointmentDetailDialog';
import { useAppointments } from '@/hooks/useAppointments';
import { Appointment, AppointmentStatus } from '@/types/appointment';
import {
    Plus, CalendarClock, XCircle, CalendarDays, CheckCircle2
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, isSameDay, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { usePageHeader } from '@/contexts/PageHeaderContext';
import { useScrollDirection } from '@/hooks/useScrollDirection';
import { cn } from '@/lib/utils';

export function AppointmentsPage() {
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [filters, setFilters] = useState<{
        doctorId?: number;
        status?: AppointmentStatus;
    }>({});
    const [showForm, setShowForm] = useState(false);
    const [showDetail, setShowDetail] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
    const [appointmentToEdit, setAppointmentToEdit] = useState<Appointment | null>(null);
    const [refreshKey, setRefreshKey] = useState(0);

    const scrollDirection = useScrollDirection();

    const { data: appointmentsData, isLoading, refetch } = useAppointments({
        page: 1,
        limit: 100,
        startDate: format(startOfMonth(selectedDate), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"),
        endDate: format(endOfMonth(selectedDate), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"),
        doctorId: filters.doctorId,
        status: filters.status,
    });

    const appointments = appointmentsData?.data || [];

    // Citas del día seleccionado
    const dayAppointments = appointments.filter(appointment =>
        isSameDay(new Date(appointment.appointmentDate), selectedDate)
    );

    usePageHeader(
        'Citas',
        'Gestiona la agenda de la clínica.'
    );

    const handleDateSelect = (date: Date) => {
        setSelectedDate(date);
    };

    const handleRefresh = () => {
        refetch();
        setRefreshKey(prev => prev + 1);
    };

    const handleViewAppointment = (appointment: Appointment) => {
        setSelectedAppointment(appointment);
        setShowDetail(true);
    };

    const handleEditAppointment = (appointment: Appointment) => {
        setAppointmentToEdit(appointment);
        setShowForm(true);
    };

    const todayCount = appointments.filter(a => isToday(new Date(a.appointmentDate))).length;
    const scheduledCount = appointments.filter(a => a.status === 'SCHEDULED').length;
    const completedCount = appointments.filter(a => a.status === 'COMPLETED').length;
    const cancelledCount = appointments.filter(a => a.status === 'CANCELLED' || a.status === 'NO_SHOW').length;

    return (
        <div className="space-y-4 md:space-y-6">
            {/* ═══════════ TARJETAS DE ESTADÍSTICAS ═══════════ */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                {/* 1. Citas para Hoy */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-5 hover:shadow-md transition-shadow relative overflow-hidden">
                    <div>
                        <p className="text-xs md:text-sm font-medium text-gray-500">Citas para Hoy</p>
                        <p className="text-2xl md:text-3xl font-bold text-teal-600 mt-0.5 md:mt-1">{todayCount}</p>
                    </div>
                    <div className="absolute bottom-0 right-0 p-2 md:p-3">
                        <CalendarClock className="w-8 h-8 md:w-12 md:h-12 text-teal-500 opacity-20" />
                    </div>
                </div>

                {/* 2. Agendadas */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-5 hover:shadow-md transition-shadow relative overflow-hidden">
                    <div>
                        <p className="text-xs md:text-sm font-medium text-gray-500">Agendadas (Mes)</p>
                        <p className="text-2xl md:text-3xl font-bold text-blue-600 mt-0.5 md:mt-1">{scheduledCount}</p>
                    </div>
                    <div className="absolute bottom-0 right-0 p-2 md:p-3">
                        <CalendarDays className="w-8 h-8 md:w-12 md:h-12 text-blue-500 opacity-20" />
                    </div>
                </div>

                {/* 3. Completadas */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-5 hover:shadow-md transition-shadow relative overflow-hidden">
                    <div>
                        <p className="text-xs md:text-sm font-medium text-gray-500">Completadas (Mes)</p>
                        <p className="text-2xl md:text-3xl font-bold text-green-600 mt-0.5 md:mt-1">{completedCount}</p>
                    </div>
                    <div className="absolute bottom-0 right-0 p-2 md:p-3">
                        <CheckCircle2 className="w-8 h-8 md:w-12 md:h-12 text-green-500 opacity-20" />
                    </div>
                </div>

                {/* 4. Canceladas / No Asistió */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-5 hover:shadow-md transition-shadow relative overflow-hidden">
                    <div>
                        <p className="text-xs md:text-sm font-medium text-gray-500">Canceladas / No Asistió</p>
                        <p className="text-2xl md:text-3xl font-bold text-red-600 mt-0.5 md:mt-1">{cancelledCount}</p>
                    </div>
                    <div className="absolute bottom-0 right-0 p-2 md:p-3">
                        <XCircle className="w-8 h-8 md:w-12 md:h-12 text-red-500 opacity-20" />
                    </div>
                </div>
            </div>

            {/* ═══════════ HEADER: ACCIONES Y FILTROS ═══════════ */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white p-3 md:p-4 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex-1">
                    <AppointmentFilters
                        onFilterChange={setFilters}
                        onClearFilters={() => setFilters({})}
                        hasFilters={!!(filters.doctorId || filters.status)}
                    />
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <Button
                        onClick={() => { setAppointmentToEdit(null); setShowForm(true); }}
                        className="gap-2 h-9 text-white shadow-sm hidden lg:flex"
                    >
                        <Plus className="h-4 w-4" />
                        Nueva Cita
                    </Button>
                </div>
            </div>

            {/* ═══════════ VISTA DIVIDIDA: CALENDARIO + LISTA ═══════════ */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 items-start">
                <div className="lg:col-span-7 xl:col-span-8">
                    <AppointmentCalendar
                        key={refreshKey}
                        appointments={appointments}
                        selectedDate={selectedDate}
                        onDateSelect={handleDateSelect}
                        defaultView="month"
                        onAppointmentClick={handleViewAppointment}
                    />
                </div>

                <div className="lg:col-span-5 xl:col-span-4 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col h-full max-h-[800px]">
                    <div className="p-4 border-b border-gray-100">
                        <h2 className="text-base font-semibold text-gray-900 capitalize flex items-center gap-2">
                            <CalendarClock className="h-4 w-4 text-teal-600" />
                            {format(selectedDate, "EEEE d 'de' MMMM", { locale: es })}
                        </h2>
                        <p className="text-xs text-gray-500 mt-0.5">
                            {dayAppointments.length} {dayAppointments.length === 1 ? 'cita agendada' : 'citas agendadas'}
                        </p>
                    </div>

                    <div className="p-4 overflow-y-auto flex-1">
                        <AppointmentList
                            appointments={dayAppointments}
                            isLoading={isLoading}
                            onViewAppointment={handleViewAppointment}
                            onEditAppointment={handleEditAppointment}
                            onRefresh={handleRefresh}
                        />
                    </div>
                </div>
            </div>

            {/* FAB Móvil */}
            <button
                type="button"
                onClick={() => { setAppointmentToEdit(null); setShowForm(true); }}
                aria-label="Nueva Cita"
                className={cn(
                    "fixed right-5 z-50 lg:hidden",
                    "h-14 w-14 rounded-full",
                    "bg-blue-600 hover:bg-blue-700 text-white",
                    "flex items-center justify-center",
                    "shadow-xl shadow-teal-600/30",
                    "hover:shadow-2xl hover:shadow-teal-600/40",
                    "active:scale-95 transition-all duration-300 ease-out",
                    scrollDirection === 'down'
                        ? "translate-y-24 opacity-0 pointer-events-none"
                        : "translate-y-0 opacity-100"
                )}
                style={{
                    bottom: 'calc(5rem + env(safe-area-inset-bottom))',
                }}
            >
                <Plus className="h-6 w-6" strokeWidth={2.5} />
            </button>

            {/* Modales */}
            <AppointmentFromPatient
                open={showForm}
                onOpenChange={setShowForm}
                appointmentToEdit={appointmentToEdit}
                onSuccess={() => {
                    setShowForm(false);
                    setAppointmentToEdit(null);
                    handleRefresh();
                }}
                defaultDate={format(selectedDate, 'yyyy-MM-dd')}
            />

            <AppointmentDetailDialog
                open={showDetail}
                onOpenChange={setShowDetail}
                appointment={selectedAppointment}
                showClinicalHistoryButton={true}
            />
        </div>
    );
}