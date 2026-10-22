import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, CalendarDays, CalendarRange, Clock } from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isSameMonth, isToday, addMonths, subMonths, addWeeks, subWeeks, isPast } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Appointment, AppointmentStatus } from '@/types/appointment';

type ViewType = 'week' | 'month';

interface AppointmentCalendarProps {
    appointments: Appointment[];
    selectedDate: Date;
    onDateSelect: (date: Date) => void;
    onViewChange?: (view: ViewType) => void;
    defaultView?: ViewType;
    onAppointmentClick?: (appointment: Appointment) => void;
}

// Colores estandarizados por estado
const statusPillStyles: Record<AppointmentStatus, string> = {
    SCHEDULED: 'bg-blue-50 text-blue-700 border-blue-200',
    CONFIRMED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    IN_PROGRESS: 'bg-amber-50 text-amber-700 border-amber-200',
    COMPLETED: 'bg-green-50 text-green-700 border-green-200',
    CANCELLED: 'bg-red-50 text-red-600 border-red-200 opacity-80',
    NO_SHOW: 'bg-red-50 text-red-600 border-red-200 opacity-80',
};

const OVERDUE_PILL_STYLE = 'bg-amber-50 text-amber-700 border-amber-300 ring-1 ring-amber-200';
const OVERDUE_DOT_COLOR = 'bg-amber-500';

const statusDotColors: Record<AppointmentStatus, string> = {
    SCHEDULED: 'bg-blue-500',
    CONFIRMED: 'bg-emerald-500',
    IN_PROGRESS: 'bg-amber-500',
    COMPLETED: 'bg-green-500',
    CANCELLED: 'bg-red-500',
    NO_SHOW: 'bg-red-500',
};

const isOverdue = (appointment: Appointment): boolean => {
    const date = new Date(appointment.appointmentDate);
    const isTerminal = ['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(appointment.status);
    return isPast(date) && !isTerminal;
};

export function AppointmentCalendar({
    appointments,
    selectedDate,
    onDateSelect,
    onViewChange,
    defaultView = 'month',
    onAppointmentClick,
}: AppointmentCalendarProps) {
    const [view, setView] = useState<ViewType>(defaultView);
    const [currentMonth, setCurrentMonth] = useState(selectedDate);

    const handleViewChange = (newView: ViewType) => {
        setView(newView);
        onViewChange?.(newView);
    };

    const handlePrev = () => {
        setCurrentMonth(view === 'month' ? subMonths(currentMonth, 1) : subWeeks(currentMonth, 1));
    };

    const handleNext = () => {
        setCurrentMonth(view === 'month' ? addMonths(currentMonth, 1) : addWeeks(currentMonth, 1));
    };

    const handleToday = () => {
        const today = new Date();
        setCurrentMonth(today);
        onDateSelect(today);
    };

    const getAppointmentsForDay = (day: Date) => {
        return appointments
            .filter(appointment => isSameDay(new Date(appointment.appointmentDate), day))
            .sort((a, b) => new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime());
    };

    const handleAppointmentPillClick = (e: React.MouseEvent, appointment: Appointment) => {
        e.stopPropagation();
        onAppointmentClick?.(appointment);
    };

    // ===== VISTA MENSUAL =====
    const renderMonthView = () => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(monthStart);
        const startDate = startOfWeek(monthStart, { locale: es });
        const endDate = endOfWeek(monthEnd, { locale: es });
        const days = eachDayOfInterval({ start: startDate, end: endDate });
        const MAX_VISIBLE_DESKTOP = 3;

        return (
            <div className="w-full">
                <div className="grid grid-cols-7 gap-1 md:gap-1.5 mb-2">
                    {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day) => (
                        <div key={day} className="text-center text-[10px] md:text-xs font-semibold text-gray-400 uppercase tracking-wide py-1">
                            {day}
                        </div>
                    ))}
                </div>
                <div className="grid grid-cols-7 gap-1 md:gap-1.5">
                    {days.map((day) => {
                        const dayAppointments = getAppointmentsForDay(day);
                        const isSelected = isSameDay(day, selectedDate);
                        const isCurrentMonth = isSameMonth(day, currentMonth);
                        const isTodayDate = isToday(day);

                        return (
                            <div
                                key={day.toString()}
                                onClick={() => {
                                    onDateSelect(day);
                                    setCurrentMonth(day);
                                }}
                                className={cn(
                                    "relative p-1 md:p-1.5 min-h-[50px] md:min-h-[110px] rounded-lg md:rounded-xl border transition-all cursor-pointer flex flex-col gap-0.5 md:gap-1",
                                    !isCurrentMonth && "opacity-40 bg-gray-50/50",
                                    isSelected && "border-teal-500 bg-teal-50/30 shadow-sm",
                                    !isSelected && "border-transparent hover:border-gray-200 hover:bg-gray-50",
                                    isTodayDate && !isSelected && "border-blue-200 bg-blue-50/30"
                                )}
                            >
                                <div className="flex justify-between items-center px-0.5">
                                    <span className={cn(
                                        "text-xs md:text-sm font-semibold h-5 w-5 md:h-6 md:w-6 flex items-center justify-center rounded-full",
                                        isTodayDate && "bg-teal-600 text-white shadow-sm",
                                        !isTodayDate && !isCurrentMonth && "text-gray-400",
                                        !isTodayDate && isCurrentMonth && "text-gray-700"
                                    )}>
                                        {format(day, 'd')}
                                    </span>

                                    {dayAppointments.length > 0 && (
                                        <span className="hidden md:inline-block text-[10px] text-gray-400 font-medium bg-white/50 px-1.5 rounded-md">
                                            {dayAppointments.length}
                                        </span>
                                    )}
                                </div>

                                {/* ═══ DESKTOP: Píldoras visuales ═══ */}
                                <div className="hidden md:flex flex-col gap-1 overflow-hidden pointer-events-none">
                                    {dayAppointments.slice(0, MAX_VISIBLE_DESKTOP).map((appointment) => {
                                        const overdue = isOverdue(appointment);

                                        return (
                                            <div
                                                key={appointment.id}
                                                className={cn(
                                                    "w-full text-left px-1.5 py-0.5 rounded-md border text-[10px] leading-tight truncate",
                                                    overdue ? OVERDUE_PILL_STYLE : statusPillStyles[appointment.status]
                                                )}
                                                title={`${format(new Date(appointment.appointmentDate), 'HH:mm')} · ${appointment.patient?.fullName || 'Paciente'}`}
                                            >
                                                <span className="font-semibold mr-1">
                                                    {format(new Date(appointment.appointmentDate), 'HH:mm')}
                                                </span>
                                                {appointment.patient?.fullName?.split(' ')[0] || 'Paciente'}
                                            </div>
                                        );
                                    })}
                                    {dayAppointments.length > MAX_VISIBLE_DESKTOP && (
                                        <span className="text-[10px] text-gray-500 font-medium px-1.5">
                                            +{dayAppointments.length - MAX_VISIBLE_DESKTOP} más
                                        </span>
                                    )}
                                </div>

                                {/* ═══ MOBILE: Puntitos de colores ═══ */}
                                <div className="flex md:hidden flex-wrap gap-1 justify-center mt-auto pb-1 pointer-events-none">
                                    {dayAppointments.slice(0, 3).map(apt => {
                                        const overdue = isOverdue(apt);
                                        return (
                                            <div
                                                key={apt.id}
                                                className={cn(
                                                    "h-1.5 w-1.5 rounded-full",
                                                    overdue ? OVERDUE_DOT_COLOR : statusDotColors[apt.status]
                                                )}
                                            />
                                        );
                                    })}
                                    {dayAppointments.length > 3 && (
                                        <div className="h-1.5 w-1.5 rounded-full bg-gray-400" />
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    // ===== VISTA SEMANAL =====
    const renderWeekView = () => {
        const weekStart = startOfWeek(currentMonth, { locale: es });
        const days = eachDayOfInterval({ start: weekStart, end: new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000) });

        return (
            <div className="w-full overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0">
                <div className="min-w-[600px] lg:min-w-0">
                    <div className="grid grid-cols-7 gap-2">
                        {days.map((day) => {
                            const dayAppointments = getAppointmentsForDay(day);
                            const isSelected = isSameDay(day, selectedDate);
                            const isTodayDate = isToday(day);

                            return (
                                <div
                                    key={day.toString()}
                                    onClick={() => {
                                        onDateSelect(day);
                                        setCurrentMonth(day);
                                    }}
                                    className={cn(
                                        "p-2 min-h-[220px] rounded-xl border-2 transition-all text-left cursor-pointer flex flex-col",
                                        isSelected && "border-teal-500 bg-teal-50/20 shadow-sm",
                                        !isSelected && "border-transparent hover:border-gray-200 hover:bg-gray-50",
                                        isTodayDate && !isSelected && "border-blue-200 bg-blue-50/30"
                                    )}
                                >
                                    <div className="flex flex-col items-center justify-center border-b border-gray-100 pb-2 mb-2">
                                        <span className={cn("text-xs font-medium text-gray-500 uppercase", isTodayDate && "text-teal-600")}>
                                            {format(day, 'EEE', { locale: es })}
                                        </span>
                                        <span className={cn(
                                            "text-lg font-bold mt-0.5 h-8 w-8 flex items-center justify-center rounded-full",
                                            isTodayDate && "bg-teal-600 text-white shadow-sm",
                                            !isTodayDate && "text-gray-800"
                                        )}>
                                            {format(day, 'd')}
                                        </span>
                                    </div>

                                    <div className="space-y-1.5 flex-1 overflow-y-auto pr-1">
                                        {dayAppointments.length === 0 ? (
                                            <div className="text-[11px] text-gray-300 text-center py-4 italic">Sin citas</div>
                                        ) : (
                                            dayAppointments.map((appointment) => {
                                                const overdue = isOverdue(appointment);

                                                return (
                                                    <button
                                                        key={appointment.id}
                                                        onClick={(e) => handleAppointmentPillClick(e, appointment)}
                                                        className={cn(
                                                            "w-full text-left p-1.5 rounded-lg border text-[11px] leading-tight transition-colors flex flex-col gap-0.5",
                                                            overdue ? OVERDUE_PILL_STYLE : statusPillStyles[appointment.status],
                                                            "hover:brightness-95"
                                                        )}
                                                    >
                                                        <span className="font-bold flex items-center gap-1">
                                                            <Clock className="h-2.5 w-2.5 shrink-0" />
                                                            {format(new Date(appointment.appointmentDate), 'HH:mm')}
                                                        </span>
                                                        <span className="truncate opacity-90 font-medium">
                                                            {appointment.patient?.fullName || 'Paciente'}
                                                        </span>
                                                    </button>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <Card className="border-0 shadow-sm overflow-hidden">
            <CardContent className="p-3 md:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 md:mb-6">
                    <div className="flex items-center justify-between sm:justify-start gap-3 w-full sm:w-auto">
                        <span className="text-base md:text-xl font-bold capitalize text-gray-900 min-w-[120px] md:min-w-[140px]">
                            {format(currentMonth, "MMMM yyyy", { locale: es })}
                        </span>
                        <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg p-0.5 shadow-sm">
                            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md" onClick={handlePrev}>
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 px-2 md:px-3 text-xs font-medium" onClick={handleToday}>
                                Hoy
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md" onClick={handleNext}>
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    <div className="flex items-center gap-1 bg-gray-100/80 rounded-lg p-1 shrink-0 self-start sm:self-auto">
                        <Button
                            variant={view === 'week' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => handleViewChange('week')}
                            className={cn("h-7 text-xs px-2 md:px-3", view === 'week' && "bg-white text-teal-700 shadow-sm hover:bg-white")}
                        >
                            <CalendarDays className="h-3.5 w-3.5 mr-1.5 hidden sm:block" />
                            Semana
                        </Button>
                        <Button
                            variant={view === 'month' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => handleViewChange('month')}
                            className={cn("h-7 text-xs px-2 md:px-3", view === 'month' && "bg-white text-teal-700 shadow-sm hover:bg-white")}
                        >
                            <CalendarRange className="h-3.5 w-3.5 mr-1.5 hidden sm:block" />
                            Mes
                        </Button>
                    </div>
                </div>

                <div>
                    {view === 'month' && renderMonthView()}
                    {view === 'week' && renderWeekView()}
                </div>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 md:gap-5 mt-4 md:mt-6 pt-3 md:pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-1.5 text-xs text-gray-600 font-medium">
                        <div className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                        <span>Agendada</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-600 font-medium">
                        <div className="h-2.5 w-2.5 rounded-full bg-green-500" />
                        <span>Completada</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-600 font-medium">
                        <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
                        <span>Cancelada / No asistió</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-amber-700 font-medium bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                        <div className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                        <span>Vencida (Requiere atención)</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}