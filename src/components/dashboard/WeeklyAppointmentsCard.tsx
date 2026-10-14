import { useMemo, useState } from 'react';
import {
    CalendarDays, Filter, Search,
} from 'lucide-react';
import { format, isToday, isTomorrow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface WeeklyAppointment {
    id: number;
    date: string;
    time: string;
    patientName: string;
    patientPhoto?: string | null;
    doctorName?: string | null;
    treatment: string;
    duration: number;
    status: string;
}

interface WeeklyAppointmentsCardProps {
    appointments: WeeklyAppointment[];
    onAppointmentClick: (id: number) => void;
    onImageError: (e: React.SyntheticEvent<HTMLImageElement, Event>) => void;
    getInitials: (name?: string) => string;
}

type DateFilter = 'all' | 'today' | 'tomorrow';

const STATUS_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
    CONFIRMED: { bg: 'bg-green-100', text: 'text-green-700', label: 'Confirmada' },
    SCHEDULED: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Agendada' },
    COMPLETED: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Completada' },
    CANCELLED: { bg: 'bg-red-100', text: 'text-red-700', label: 'Cancelada' },
    NO_SHOW: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'No asistió' },
    IN_PROGRESS: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'En curso' },
};

const getImageUrl = (path?: string | null) => {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const cleanBaseUrl = baseUrl.replace(/\/api$/, '');
    if (path.startsWith('/')) return `${cleanBaseUrl}${path}`;
    return `${cleanBaseUrl}/${path}`;
};

const getDayLabel = (dateStr: string): string => {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    if (isToday(date)) return 'HOY';
    if (isTomorrow(date)) return 'MAÑANA';
    return format(date, 'EEE d', { locale: es }).toUpperCase();
};

const getFullDayLabel = (dateStr: string): string => {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    if (isToday(date)) return 'Hoy';
    if (isTomorrow(date)) return 'Mañana';
    return format(date, "EEEE d 'de' MMMM", { locale: es });
};

export function WeeklyAppointmentsCard({
    appointments,
    onAppointmentClick,
    onImageError,
    getInitials,
}: WeeklyAppointmentsCardProps) {
    const [dateFilter, setDateFilter] = useState<DateFilter>('today');
    const [doctorFilter, setDoctorFilter] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');

    const todayStr = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);
    const tomorrowStr = useMemo(() => {
        const t = new Date();
        t.setDate(t.getDate() + 1);
        return format(t, 'yyyy-MM-dd');
    }, []);

    const doctors = useMemo(() => {
        const set = new Set<string>();
        appointments.forEach((a) => {
            if (a.doctorName && a.doctorName.trim()) set.add(a.doctorName);
        });
        return Array.from(set).sort();
    }, [appointments]);

    // Si hay búsqueda, ignora filtros de fecha/doctor (busca en todo)
    const filtered = useMemo(() => {
        const hasSearch = searchTerm.trim().length > 0;

        return appointments.filter((a) => {
            if (hasSearch) {
                const term = searchTerm.toLowerCase().trim();
                return (
                    a.patientName.toLowerCase().includes(term) ||
                    a.treatment?.toLowerCase().includes(term) ||
                    a.doctorName?.toLowerCase().includes(term)
                );
            }

            if (dateFilter === 'today' && a.date !== todayStr) return false;
            if (dateFilter === 'tomorrow' && a.date !== tomorrowStr) return false;
            if (doctorFilter !== 'all' && a.doctorName !== doctorFilter) return false;

            return true;
        });
    }, [appointments, dateFilter, doctorFilter, searchTerm, todayStr, tomorrowStr]);

    const grouped = useMemo(() => {
        const map = new Map<string, WeeklyAppointment[]>();
        filtered.forEach((apt) => {
            if (!map.has(apt.date)) map.set(apt.date, []);
            map.get(apt.date)!.push(apt);
        });
        return Array.from(map.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([date, items]) => ({
                date,
                items: items.sort((a, b) => a.time.localeCompare(b.time)),
                total: items.length,
                confirmed: items.filter((i) => i.status === 'CONFIRMED').length,
            }));
    }, [filtered]);

    const totalVisible = filtered.length;
    const hasActiveFilters =
        dateFilter !== 'all' || doctorFilter !== 'all' || searchTerm.trim() !== '';

    const clearFilters = () => {
        setDateFilter('all');
        setDoctorFilter('all');
        setSearchTerm('');
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col w-full">
            {/* HEADER con título + filtros */}
            <div className="bg-white border-b border-gray-100 px-4 md:px-6 py-3 md:py-4 rounded-t-2xl">
                <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 md:gap-3 min-w-0">
                            <CalendarDays className="h-4 w-4 md:h-5 md:w-5 text-primary-600 shrink-0" />
                            <h3 className="text-sm md:text-base font-semibold text-gray-900 truncate">
                                Citas de la Semana
                            </h3>
                            <span className="text-[10px] md:text-xs bg-primary-50 text-primary-600 px-1.5 md:px-2.5 py-0.5 md:py-1 rounded-full shrink-0">
                                {totalVisible} {totalVisible === 1 ? 'cita' : 'citas'}
                                {hasActiveFilters && appointments.length !== totalVisible && (
                                    <span className="text-primary-400"> / {appointments.length}</span>
                                )}
                            </span>
                        </div>

                        {hasActiveFilters && (
                            <button
                                onClick={clearFilters}
                                className="text-[10px] md:text-xs text-gray-500 hover:text-gray-700 underline underline-offset-2 shrink-0"
                            >
                                Limpiar
                            </button>
                        )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <div className="inline-flex items-center bg-gray-100/80 rounded-lg p-0.5 gap-0.5">
                            <button
                                onClick={() => setDateFilter('all')}
                                className={cn(
                                    'px-2.5 py-1 text-[11px] font-medium rounded-md transition-all',
                                    dateFilter === 'all'
                                        ? 'bg-white text-primary-700 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700',
                                )}
                            >
                                Todas
                            </button>
                            <button
                                onClick={() => setDateFilter('today')}
                                className={cn(
                                    'px-2.5 py-1 text-[11px] font-medium rounded-md transition-all',
                                    dateFilter === 'today'
                                        ? 'bg-white text-blue-700 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700',
                                )}
                            >
                                Hoy
                            </button>
                            <button
                                onClick={() => setDateFilter('tomorrow')}
                                className={cn(
                                    'px-2.5 py-1 text-[11px] font-medium rounded-md transition-all',
                                    dateFilter === 'tomorrow'
                                        ? 'bg-white text-purple-700 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700',
                                )}
                            >
                                Mañana
                            </button>
                        </div>

                        {doctors.length > 1 && (
                            <div className="flex items-center gap-1">
                                <Filter className="h-3 w-3 text-gray-400 shrink-0" />
                                <select
                                    value={doctorFilter}
                                    onChange={(e) => setDoctorFilter(e.target.value)}
                                    className="text-[11px] border border-gray-200 rounded-md px-2 py-1 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent max-w-[140px] truncate"
                                >
                                    <option value="all">Todos los doctores</option>
                                    {doctors.map((doc) => (
                                        <option key={doc} value={doc}>
                                            {doc}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="relative flex-1 min-w-[140px]">
                            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400 pointer-events-none" />
                            <Input
                                type="text"
                                placeholder="Buscar paciente, tratamiento..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="h-7 pl-7 pr-2 text-[11px] rounded-md border-gray-200"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* LISTA agrupada — sin scroll propio, el contenedor del tab scrollea */}
            <div className="px-4 md:px-6 py-4">
                {grouped.length === 0 ? (
                    <div className="flex flex-col items-center justify-center text-center text-gray-400 py-16">
                        <CalendarDays className="h-10 w-10 mb-3 opacity-40" />
                        <p className="text-sm font-medium text-gray-500">
                            {searchTerm.trim()
                                ? `No hay resultados para "${searchTerm}"`
                                : hasActiveFilters
                                    ? 'No hay citas con los filtros aplicados'
                                    : 'No hay citas para esta semana'}
                        </p>
                        {hasActiveFilters && (
                            <button
                                onClick={clearFilters}
                                className="mt-2 text-xs text-primary-600 hover:text-primary-700 underline underline-offset-2"
                            >
                                Limpiar filtros
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {grouped.map((group) => (
                            <div key={group.date}>
                                {/* Day Header — sticky contra el contenedor del tab */}
                                <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm -mx-1 px-1 pb-2 pt-1 flex items-center gap-2">
                                    <span className="text-[11px] md:text-xs font-bold text-gray-900 uppercase tracking-wider">
                                        {getDayLabel(group.date)}
                                    </span>
                                    <span className="text-[10px] text-gray-400 capitalize">
                                        {getFullDayLabel(group.date)}
                                    </span>
                                    <div className="flex-1 h-px bg-gray-200" />
                                    <span className="text-[10px] text-gray-500 shrink-0">
                                        {group.total} {group.total === 1 ? 'cita' : 'citas'}
                                        {group.confirmed > 0 && (
                                            <span className="text-emerald-600 ml-1.5">
                                                · {group.confirmed} confirmada{group.confirmed > 1 ? 's' : ''}
                                            </span>
                                        )}
                                    </span>
                                </div>

                                {/* Items del día */}
                                <div className="space-y-2 md:space-y-3">
                                    {group.items.map((appointment) => {
                                        const isTodayDate = appointment.date === todayStr;
                                        const photoUrl = getImageUrl(appointment.patientPhoto);
                                        const status = STATUS_CONFIG[appointment.status] || {
                                            bg: 'bg-gray-100',
                                            text: 'text-gray-700',
                                            label: appointment.status,
                                        };

                                        return (
                                            <button
                                                type="button"
                                                key={appointment.id}
                                                onClick={() => onAppointmentClick(appointment.id)}
                                                className={cn(
                                                    'w-full text-left flex items-center gap-2 md:gap-4 p-2 md:p-3 rounded-xl transition-colors cursor-pointer',
                                                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-400',
                                                    isTodayDate
                                                        ? 'bg-blue-50 hover:bg-blue-100 border-l-4 border-blue-500'
                                                        : 'bg-gray-50 hover:bg-gray-100',
                                                )}
                                            >
                                                <div className="flex-shrink-0 text-center min-w-[40px] md:min-w-[50px]">
                                                    <p
                                                        className={cn(
                                                            'text-xs sm:text-sm font-bold tabular-nums',
                                                            isTodayDate ? 'text-blue-600' : 'text-gray-900',
                                                        )}
                                                    >
                                                        {appointment.time}
                                                    </p>
                                                    <p className="text-[10px] sm:text-xs text-gray-400">
                                                        {appointment.duration} min
                                                    </p>
                                                </div>

                                                <div className="flex-shrink-0">
                                                    {photoUrl ? (
                                                        <img
                                                            src={photoUrl}
                                                            alt={appointment.patientName}
                                                            className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 rounded-full object-cover border-2 border-white shadow-sm"
                                                            onError={onImageError}
                                                        />
                                                    ) : null}
                                                    <div
                                                        className={cn(
                                                            'h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center border-2 border-white shadow-sm',
                                                            photoUrl && 'fallback-avatar hidden',
                                                        )}
                                                    >
                                                        <span className="text-[10px] sm:text-xs md:text-sm font-semibold text-primary-700">
                                                            {getInitials(appointment.patientName)}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                                                        {appointment.patientName}
                                                    </p>
                                                    <p className="text-[10px] sm:text-xs text-gray-500 truncate">
                                                        {appointment.treatment}
                                                    </p>
                                                    {appointment.doctorName && (
                                                        <p className="text-[10px] text-gray-400 truncate">
                                                            Dr. {appointment.doctorName}
                                                        </p>
                                                    )}
                                                </div>

                                                <div className="flex-shrink-0 hidden sm:block">
                                                    <span
                                                        className={cn(
                                                            'text-[10px] sm:text-xs px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full whitespace-nowrap',
                                                            status.bg,
                                                            status.text,
                                                        )}
                                                    >
                                                        {status.label}
                                                    </span>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}