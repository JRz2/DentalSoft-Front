import { useState, useEffect, useMemo } from 'react';
import {
    CalendarDays, PlusCircle, User, ChevronRight,
    Plus, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { usePatientAppointments } from '@/hooks/useAppointments';
import { Appointment } from '@/types/appointment';
import { format, startOfDay, isBefore, isToday, isTomorrow } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { AppointmentDetailDialog } from '@/components/appointments/AppointmentDetailDialog';
import { AppointmentFromPatient } from '@/components/appointments/AppointmentFormModal';
import { usePatient } from '@/hooks/usePatients';
import { useNavigate } from 'react-router-dom';

// Paginamos por CITAS
const APPOINTMENTS_PER_PAGE = 5;

const STATUS_STYLES: Record<
    string,
    { bg: string; border: string; text: string; badgeBg: string; badgeText: string; label: string }
> = {
    SCHEDULED: {
        bg: 'bg-blue-50', border: 'border-l-4 border-blue-500', text: 'text-blue-700',
        badgeBg: 'bg-blue-100', badgeText: 'text-blue-700', label: 'Agendada',
    },
    CONFIRMED: {
        bg: 'bg-emerald-50', border: 'border-l-4 border-emerald-500', text: 'text-emerald-700',
        badgeBg: 'bg-emerald-100', badgeText: 'text-emerald-700', label: 'Confirmada',
    },
    IN_PROGRESS: {
        bg: 'bg-amber-50', border: 'border-l-4 border-amber-500', text: 'text-amber-700',
        badgeBg: 'bg-amber-100', badgeText: 'text-amber-700', label: 'En curso',
    },
    COMPLETED: {
        bg: 'bg-green-50', border: 'border-l-4 border-green-500', text: 'text-green-700',
        badgeBg: 'bg-green-100', badgeText: 'text-green-700', label: 'Completada',
    },
    CANCELLED: {
        bg: 'bg-red-50', border: 'border-l-4 border-red-500', text: 'text-red-700',
        badgeBg: 'bg-red-100', badgeText: 'text-red-700', label: 'Cancelada',
    },
    NO_SHOW: {
        bg: 'bg-red-50', border: 'border-l-4 border-red-500', text: 'text-red-700',
        badgeBg: 'bg-red-100', badgeText: 'text-red-700', label: 'No asistió',
    },
};

const OVERDUE_STYLE = {
    bg: 'bg-amber-50/60', border: 'border-l-4 border-amber-500', text: 'text-amber-700',
    badgeBg: 'bg-amber-100', badgeText: 'text-amber-800', label: 'Vencida',
};

const DEFAULT_STYLE = {
    bg: 'bg-gray-50', border: 'border-l-4 border-gray-300', text: 'text-gray-700',
    badgeBg: 'bg-gray-100', badgeText: 'text-gray-700', label: '',
};

type FilterTab = 'upcoming' | 'all';

interface PatientAppointmentsCardProps {
    patientId: number;
    className?: string;
}

const getDayLabel = (date: Date): string => {
    if (isToday(date)) return 'HOY';
    if (isTomorrow(date)) return 'MAÑANA';
    return format(date, 'EEE d MMM', { locale: es }).toUpperCase();
};

const getFullDayLabel = (date: Date): string => {
    if (isToday(date)) return 'Hoy';
    if (isTomorrow(date)) return 'Mañana';
    return format(date, "EEEE d 'de' MMMM", { locale: es });
};

const resolveStyle = (apt: Appointment, today: Date) => {
    const aptDate = new Date(apt.appointmentDate);
    const isPast = isBefore(aptDate, today) && !isToday(aptDate);
    const isTerminal = ['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(apt.status);

    if (isPast && !isTerminal) return OVERDUE_STYLE;
    return STATUS_STYLES[apt.status] || { ...DEFAULT_STYLE, label: apt.status };
};

export function PatientAppointmentsCard({ patientId, className }: PatientAppointmentsCardProps) {
    const [filter, setFilter] = useState<FilterTab>('upcoming');
    const [page, setPage] = useState(1);
    const { data: patient } = usePatient(patientId);
    const navigate = useNavigate();

    // Estados de modales
    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
    const [detailOpen, setDetailOpen] = useState(false);
    const [createOpen, setCreateOpen] = useState(false);

    const { data: appointments = [], isLoading } = usePatientAppointments(patientId);

    useEffect(() => {
        setPage(1);
    }, [filter]);

    const today = useMemo(() => startOfDay(new Date()), []);

    const filtered = useMemo(() => {
        return appointments
            .filter((apt) => {
                const d = new Date(apt.appointmentDate);
                if (filter === 'upcoming') return d.getTime() >= today.getTime();
                return true;
            })
            .sort((a, b) => {
                const diff =
                    new Date(a.appointmentDate).getTime() -
                    new Date(b.appointmentDate).getTime();
                return filter === 'upcoming' ? diff : -diff;
            });
    }, [appointments, filter, today]);

    const { paginatedGroups, totalPages, dayTotals } = useMemo(() => {
        const total = Math.ceil(filtered.length / APPOINTMENTS_PER_PAGE);
        const pageItems = filtered.slice(
            (page - 1) * APPOINTMENTS_PER_PAGE,
            page * APPOINTMENTS_PER_PAGE
        );

        const map = new Map<string, Appointment[]>();
        pageItems.forEach((apt) => {
            const key = format(new Date(apt.appointmentDate), 'yyyy-MM-dd');
            if (!map.has(key)) map.set(key, []);
            map.get(key)!.push(apt);
        });

        const totals = new Map<string, number>();
        filtered.forEach((apt) => {
            const key = format(new Date(apt.appointmentDate), 'yyyy-MM-dd');
            totals.set(key, (totals.get(key) ?? 0) + 1);
        });

        return { paginatedGroups: Array.from(map.entries()), totalPages: total, dayTotals: totals };
    }, [filtered, page]);

    const hasActiveFilters = filter !== 'upcoming';

    const handleAppointmentClick = (apt: Appointment) => {
        setSelectedAppointment(apt);
        setDetailOpen(true);
    };

    return (
        <>
            <div className={cn('bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col w-full', className)}>
                {/* ═══════════ HEADER ═══════════ */}
                <div className="bg-white border-b border-gray-100 px-4 md:px-6 py-3 md:py-4 rounded-t-2xl">
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-2 md:gap-3 min-w-0">
                                <CalendarDays className="h-4 w-4 md:h-5 md:w-5 text-teal-600 shrink-0" />
                                <h3 className="text-sm md:text-base font-semibold text-gray-900 truncate">
                                    Citas del Paciente
                                </h3>
                                <span className="text-[10px] md:text-xs bg-teal-50 text-teal-600 px-1.5 md:px-2.5 py-0.5 md:py-1 rounded-full shrink-0">
                                    {filtered.length} {filtered.length === 1 ? 'cita' : 'citas'}
                                    {hasActiveFilters && appointments.length !== filtered.length && (
                                        <span className="text-teal-400"> / {appointments.length}</span>
                                    )}
                                </span>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => navigate('/appointments')}
                                    className="h-7 text-[11px] md:text-xs gap-1 text-gray-600 hover:text-teal-700 hover:bg-teal-50"
                                >
                                    <CalendarDays className="h-3.5 w-3.5" />
                                    <span className="hidden sm:inline">Ver agenda</span>
                                </Button>
                                <Button
                                    onClick={() => setCreateOpen(true)}
                                    className="gap-2 shadow-sm hover:shadow-md transition-shadow shrink-0 hidden lg:flex"
                                >
                                    <Plus className="h-4 w-4" />
                                    Nueva Cita
                                </Button>
                            </div>
                        </div>

                        {/* Solo 2 tabs */}
                        <div className="flex flex-wrap items-center gap-2">
                            <div className="inline-flex items-center bg-gray-100/80 rounded-lg p-0.5 gap-0.5">
                                <button
                                    onClick={() => setFilter('upcoming')}
                                    className={cn(
                                        'px-2.5 py-1 text-[11px] font-medium rounded-md transition-all',
                                        filter === 'upcoming'
                                            ? 'bg-white text-teal-700 shadow-sm'
                                            : 'text-gray-500 hover:text-gray-700',
                                    )}
                                >
                                    Próximas
                                </button>
                                <button
                                    onClick={() => setFilter('all')}
                                    className={cn(
                                        'px-2.5 py-1 text-[11px] font-medium rounded-md transition-all',
                                        filter === 'all'
                                            ? 'bg-white text-primary-700 shadow-sm'
                                            : 'text-gray-500 hover:text-gray-700',
                                    )}
                                >
                                    Todas
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ═══════════ LISTA ═══════════ */}
                <div className="px-4 md:px-6 py-4">
                    {isLoading ? (
                        <div className="space-y-2">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <Skeleton key={i} className="h-16 w-full" />
                            ))}
                        </div>
                    ) : paginatedGroups.length === 0 ? (
                        /* EMPTY STATE COMPACTO Y HORIZONTAL */
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-5 px-5 bg-gray-50/60 border border-dashed border-gray-200 rounded-xl">
                            <div className="flex items-center gap-3.5 text-center sm:text-left">
                                <div className="p-2.5 bg-gray-100/80 rounded-full shrink-0">
                                    <CalendarDays className="h-5 w-5 text-gray-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-800">
                                        {filter === 'upcoming' ? 'No hay citas próximas' : 'No hay citas registradas'}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        {filter === 'upcoming' ? 'Agenda una nueva cita para este paciente.' : 'El historial de citas está vacío.'}
                                    </p>
                                </div>
                            </div>
                            {filter === 'upcoming' && (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setCreateOpen(true)}
                                    className="shrink-0 h-8 gap-1.5 text-xs bg-white border-teal-200 text-teal-700 hover:bg-teal-50 w-full sm:w-auto"
                                >
                                    <PlusCircle className="h-3.5 w-3.5" />
                                    Agendar cita
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {paginatedGroups.map(([dateKey, items]) => {
                                const date = new Date(`${dateKey}T00:00:00`);
                                const totalForDay = dayTotals.get(dateKey) ?? items.length;
                                const isPartial = items.length < totalForDay;

                                return (
                                    <div key={dateKey}>
                                        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm -mx-1 px-1 pb-2 pt-1 flex items-center gap-2">
                                            <span className="text-[11px] md:text-xs font-bold uppercase tracking-wider text-gray-900">
                                                {getDayLabel(date)}
                                            </span>
                                            <span className="text-[10px] text-gray-400 capitalize hidden sm:inline">
                                                {getFullDayLabel(date)}
                                            </span>
                                            <div className="flex-1 h-px bg-gray-200" />
                                            <span className="text-[10px] text-gray-500 shrink-0">
                                                {isPartial
                                                    ? `${items.length} de ${totalForDay} ${totalForDay === 1 ? 'cita' : 'citas'}`
                                                    : `${items.length} ${items.length === 1 ? 'cita' : 'citas'}`}
                                            </span>
                                        </div>

                                        <div className="space-y-2">
                                            {items.map((apt) => {
                                                const aptDate = new Date(apt.appointmentDate);
                                                const style = resolveStyle(apt, today);
                                                const isOverdue = style.label === 'Vencida';

                                                return (
                                                    <button
                                                        type="button"
                                                        key={apt.id}
                                                        onClick={() => handleAppointmentClick(apt)}
                                                        className={cn(
                                                            'w-full text-left flex items-center gap-2 md:gap-3 p-2 md:p-3 rounded-xl transition-colors cursor-pointer',
                                                            style.bg,
                                                            style.border,
                                                            'hover:brightness-95',
                                                            'focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-teal-400',
                                                        )}
                                                    >
                                                        <div className="flex-shrink-0 text-center min-w-[44px] md:min-w-[50px]">
                                                            <p className={cn('text-xs sm:text-sm font-bold tabular-nums', style.text)}>
                                                                {format(aptDate, 'HH:mm')}
                                                            </p>
                                                            <p className="text-[10px] text-gray-500 capitalize">
                                                                {format(aptDate, 'EEE', { locale: es })}
                                                            </p>
                                                        </div>

                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-xs sm:text-sm font-medium text-gray-900 truncate capitalize">
                                                                {format(aptDate, "EEEE d 'de' MMMM", { locale: es })}
                                                            </p>

                                                            {isOverdue && (
                                                                <div className="flex items-center gap-1 mt-1 text-[10px] sm:text-xs font-medium text-amber-700 bg-amber-100/60 w-fit px-1.5 py-0.5 rounded-md">
                                                                    <AlertCircle className="h-3 w-3 shrink-0" />
                                                                    <span>La hora de la cita ya pasó</span>
                                                                </div>
                                                            )}

                                                            <div className="flex items-center gap-2 mt-0.5 text-[10px] sm:text-xs text-gray-600 flex-wrap">
                                                                {apt.doctor?.name && (
                                                                    <>
                                                                        <span className="text-gray-300">·</span>
                                                                        <span className="flex items-center gap-1 truncate">
                                                                            <User className="h-2.5 w-2.5 shrink-0" />
                                                                            Dr. {apt.doctor.name}
                                                                            {apt.doctor.specialty && (
                                                                                <span className="text-gray-500 hidden md:inline">
                                                                                    ({apt.doctor.specialty})
                                                                                </span>
                                                                            )}
                                                                        </span>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div className="flex-shrink-0 hidden sm:block">
                                                            <span
                                                                className={cn(
                                                                    'text-[10px] sm:text-xs px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full whitespace-nowrap font-medium',
                                                                    style.badgeBg,
                                                                    style.badgeText,
                                                                )}
                                                            >
                                                                {style.label}
                                                            </span>
                                                        </div>

                                                        <ChevronRight className={cn('h-3.5 w-3.5 shrink-0 hidden sm:block', style.text)} />
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {totalPages > 1 && (
                        <div className="flex items-center justify-between pt-4 mt-2 border-t border-gray-100">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page <= 1}
                                className="h-7 text-xs"
                            >
                                Anterior
                            </Button>
                            <span className="text-xs text-gray-600">
                                Página {page} de {totalPages}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={page >= totalPages}
                                className="h-7 text-xs"
                            >
                                Siguiente
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal: Detalle de la cita */}
            <AppointmentDetailDialog
                open={detailOpen}
                onOpenChange={setDetailOpen}
                appointment={selectedAppointment}
                patient={patient}
                showClinicalHistoryButton={false}
            />

            {/* Modal: Crear cita desde Historia Clínica */}
            <AppointmentFromPatient
                open={createOpen}
                onOpenChange={setCreateOpen}
                patientId={patientId}
                patientName={patient?.fullName || 'Paciente'}
                onSuccess={() => {
                    setCreateOpen(false);
                }}
            />
        </>
    );
}