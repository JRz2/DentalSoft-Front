import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, CalendarDays, CalendarRange, List } from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isSameMonth, isToday, addMonths, subMonths, addWeeks, subWeeks, startOfWeek as startOfWeekDate, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Appointment } from '@/types/appointment';
import { Badge } from '@/components/ui/badge';

type ViewType = 'day' | 'week' | 'month';

interface AppointmentCalendarProps {
    appointments: Appointment[];
    selectedDate: Date;
    onDateSelect: (date: Date) => void;
    onViewChange?: (view: ViewType) => void;
    defaultView?: ViewType;
}

const statusColors: Record<string, string> = {
    SCHEDULED: 'bg-blue-500',
    CONFIRMED: 'bg-green-500',
    IN_PROGRESS: 'bg-yellow-500',
    COMPLETED: 'bg-gray-500',
    CANCELLED: 'bg-red-500',
    NO_SHOW: 'bg-red-500',
};

export function AppointmentCalendar({
    appointments,
    selectedDate,
    onDateSelect,
    onViewChange,
    defaultView = 'month',
}: AppointmentCalendarProps) {
    const [view, setView] = useState<ViewType>(defaultView);
    const [currentMonth, setCurrentMonth] = useState(selectedDate);

    const handleViewChange = (newView: ViewType) => {
        setView(newView);
        onViewChange?.(newView);
    };

    const handlePrev = () => {
        if (view === 'month') {
            setCurrentMonth(subMonths(currentMonth, 1));
        } else if (view === 'week') {
            setCurrentMonth(subWeeks(currentMonth, 1));
        } else {
            setCurrentMonth(addDays(currentMonth, -1));
        }
    };

    const handleNext = () => {
        if (view === 'month') {
            setCurrentMonth(addMonths(currentMonth, 1));
        } else if (view === 'week') {
            setCurrentMonth(addWeeks(currentMonth, 1));
        } else {
            setCurrentMonth(addDays(currentMonth, 1));
        }
    };

    const handleToday = () => {
        const today = new Date();
        setCurrentMonth(today);
        onDateSelect(today);
    };

    const getAppointmentsForDay = (day: Date) => {
        return appointments.filter(appointment =>
            isSameDay(new Date(appointment.appointmentDate), day)
        );
    };

    const renderMonthView = () => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(monthStart);
        const startDate = startOfWeek(monthStart, { locale: es });
        const endDate = endOfWeek(monthEnd, { locale: es });

        const days = eachDayOfInterval({ start: startDate, end: endDate });

        return (
            <div className="grid grid-cols-7 gap-1">
                {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day) => (
                    <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
                        {day}
                    </div>
                ))}
                {days.map((day) => {
                    const dayAppointments = getAppointmentsForDay(day);
                    const isSelected = isSameDay(day, selectedDate);
                    const isCurrentMonth = isSameMonth(day, currentMonth);
                    const isTodayDate = isToday(day);

                    return (
                        <button
                            key={day.toString()}
                            onClick={() => {
                                onDateSelect(day);
                                setCurrentMonth(day);
                            }}
                            className={cn(
                                "relative p-1 min-h-[80px] rounded-lg border-2 transition-all",
                                !isCurrentMonth && "opacity-40",
                                isSelected && "border-primary-500 bg-primary-50",
                                !isSelected && "border-transparent hover:border-gray-200 hover:bg-gray-50",
                                isTodayDate && "border-blue-300 bg-blue-50/50"
                            )}
                        >
                            <div className="flex justify-between items-start">
                                <span className={cn(
                                    "text-sm font-medium",
                                    isTodayDate && "text-blue-600",
                                    !isCurrentMonth && "text-gray-400"
                                )}>
                                    {format(day, 'd')}
                                </span>
                                {dayAppointments.length > 0 && (
                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                                        {dayAppointments.length}
                                    </Badge>
                                )}
                            </div>
                            <div className="mt-1 space-y-0.5">
                                {dayAppointments.slice(0, 3).map((appointment) => (
                                    <div
                                        key={appointment.id}
                                        className={cn(
                                            "h-1.5 rounded-full",
                                            statusColors[appointment.status] || 'bg-gray-400'
                                        )}
                                    />
                                ))}
                                {dayAppointments.length > 3 && (
                                    <div className="text-[10px] text-gray-400">+{dayAppointments.length - 3}</div>
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>
        );
    };

    const renderWeekView = () => {
        const weekStart = startOfWeekDate(currentMonth, { locale: es });
        const days = eachDayOfInterval({ start: weekStart, end: addDays(weekStart, 6) });

        return (
            <div className="grid grid-cols-7 gap-1">
                {days.map((day) => {
                    const dayAppointments = getAppointmentsForDay(day);
                    const isSelected = isSameDay(day, selectedDate);
                    const isTodayDate = isToday(day);

                    return (
                        <button
                            key={day.toString()}
                            onClick={() => {
                                onDateSelect(day);
                                setCurrentMonth(day);
                            }}
                            className={cn(
                                "p-2 min-h-[120px] rounded-lg border-2 transition-all",
                                isSelected && "border-primary-500 bg-primary-50",
                                !isSelected && "border-transparent hover:border-gray-200 hover:bg-gray-50",
                                isTodayDate && "border-blue-300 bg-blue-50/50"
                            )}
                        >
                            <div className="text-center">
                                <span className={cn(
                                    "text-sm font-medium",
                                    isTodayDate && "text-blue-600"
                                )}>
                                    {format(day, 'EEE d', { locale: es })}
                                </span>
                            </div>
                            <div className="mt-2 space-y-1">
                                {dayAppointments.map((appointment) => (
                                    <div
                                        key={appointment.id}
                                        className="text-xs p-1 rounded bg-gray-50 truncate"
                                    >
                                        {format(new Date(appointment.appointmentDate), 'HH:mm')} - {appointment.patient?.fullName}
                                    </div>
                                ))}
                            </div>
                        </button>
                    );
                })}
            </div>
        );
    };

    const renderDayView = () => {
        const dayAppointments = getAppointmentsForDay(selectedDate);

        return (
            <div className="space-y-2">
                <div className="text-center py-2">
                    <span className="text-lg font-medium">
                        {format(selectedDate, "EEEE d 'de' MMMM 'de' yyyy", { locale: es })}
                    </span>
                </div>
                {dayAppointments.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <p>No hay citas para este día</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {dayAppointments
                            .sort((a, b) => new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime())
                            .map((appointment) => (
                                <div
                                    key={appointment.id}
                                    className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                >
                                    <div className="w-16 text-sm font-medium text-gray-700">
                                        {format(new Date(appointment.appointmentDate), 'HH:mm')}
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-medium text-gray-900">
                                            {appointment.patient?.fullName}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            {appointment.doctor?.name} • {appointment.duration} min
                                        </div>
                                    </div>
                                    <Badge className={cn(
                                        "text-xs",
                                        appointment.status === 'SCHEDULED' && "bg-blue-100 text-blue-700",
                                        appointment.status === 'CONFIRMED' && "bg-green-100 text-green-700",
                                        appointment.status === 'IN_PROGRESS' && "bg-yellow-100 text-yellow-700",
                                        appointment.status === 'COMPLETED' && "bg-gray-100 text-gray-700",
                                        (appointment.status === 'CANCELLED' || appointment.status === 'NO_SHOW') && "bg-red-100 text-red-700"
                                    )}>
                                        {appointment.status}
                                    </Badge>
                                </div>
                            ))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <Card>
            <CardContent className="pt-6">
                {/* Controles */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={handlePrev}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleToday}>
                            Hoy
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleNext}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                        <span className="text-lg font-semibold ml-2">
                            {format(currentMonth, view === 'day' ? "MMMM yyyy" : "MMMM yyyy", { locale: es })}
                        </span>
                    </div>

                    <div className="flex items-center gap-1">
                        <Button
                            variant={view === 'day' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => handleViewChange('day')}
                        >
                            <List className="h-4 w-4 mr-1" />
                            Día
                        </Button>
                        <Button
                            variant={view === 'week' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => handleViewChange('week')}
                        >
                            <CalendarDays className="h-4 w-4 mr-1" />
                            Semana
                        </Button>
                        <Button
                            variant={view === 'month' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => handleViewChange('month')}
                        >
                            <CalendarRange className="h-4 w-4 mr-1" />
                            Mes
                        </Button>
                    </div>
                </div>

                {/* Vista */}
                <div className="mt-2">
                    {view === 'month' && renderMonthView()}
                    {view === 'week' && renderWeekView()}
                    {view === 'day' && renderDayView()}
                </div>
            </CardContent>
        </Card>
    );
}