import {
    CalendarClock, Stethoscope, CheckCircle2, MessageCircle, ArrowRight,
} from 'lucide-react';
import { format, isToday, isTomorrow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface NextAppointment {
    id: number;
    date: string;
    time: string;
    patientName: string;
    patientPhoto?: string | null;
    patientPhone?: string | null;
    doctorName?: string | null;
    treatment: string;
    duration: number;
    status: string;
}

interface NextAppointmentCardProps {
    nextAppointments: NextAppointment[];
    currentTime: Date;
    onClick?: (id: number) => void;
}

const getInitials = (name?: string) => {
    if (!name || !name.trim()) return '?';
    return name
        .trim()
        .split(' ')
        .map((w) => w[0])
        .filter(Boolean)
        .slice(0, 2)
        .join('')
        .toUpperCase();
};

const getImageUrl = (path?: string | null) => {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const cleanBaseUrl = baseUrl.replace(/\/api$/, '');
    if (path.startsWith('/')) return `${cleanBaseUrl}${path}`;
    return `${cleanBaseUrl}/${path}`;
};

const parseAppointmentDate = (date: string, time: string): Date | null => {
    try {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
        const [y, m, d] = date.split('-').map(Number);
        const [h, min] = time.split(':').map(Number);
        const result = new Date(y, m - 1, d, h || 0, min || 0);
        return isNaN(result.getTime()) ? null : result;
    } catch {
        return null;
    }
};

const normalizePhoneForWhatsApp = (phone: string): string => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 8) return `591${digits}`;
    if (digits.length === 11 && digits.startsWith('591')) return digits;
    return digits;
};

// ============================================================
// URGENCY CONFIG
// ============================================================
type UrgencyKey = 'normal' | 'soon' | 'urgent' | 'critical' | 'past';

const URGENCY_CONFIG: Record<
    UrgencyKey,
    {
        border: string;
        gradient: string;
        iconBg: string;
        iconColor: string;
        timeColor: string;
        countdownColor: string;
        divider: string;
        badge: string | null;
        badgeClass: string;
        pulse: boolean;
    }
> = {
    normal: {
        border: 'border-gray-100',
        gradient: 'from-indigo-50/50 via-white to-white',
        iconBg: 'bg-indigo-100',
        iconColor: 'text-indigo-600',
        timeColor: 'text-indigo-900',
        countdownColor: 'text-indigo-500',
        divider: 'bg-gradient-to-r from-indigo-200 via-indigo-100 to-transparent',
        badge: null,
        badgeClass: '',
        pulse: false,
    },
    soon: {
        border: 'border-primary-100',
        gradient: 'from-primary-50/60 via-white to-white',
        iconBg: 'bg-primary-100',
        iconColor: 'text-primary-600',
        timeColor: 'text-primary-700',
        countdownColor: 'text-primary-600',
        divider: 'bg-gradient-to-r from-primary-300 via-primary-200 to-transparent',
        badge: 'Próxima',
        badgeClass: 'bg-primary-100 text-primary-700 ring-1 ring-primary-200',
        pulse: false,
    },
    urgent: {
        border: 'border-amber-200',
        gradient: 'from-amber-50/70 via-white to-white',
        iconBg: 'bg-amber-100',
        iconColor: 'text-amber-600',
        timeColor: 'text-amber-700',
        countdownColor: 'text-amber-600',
        divider: 'bg-gradient-to-r from-amber-300 via-amber-200 to-transparent',
        badge: 'En breve',
        badgeClass: 'bg-amber-100 text-amber-700 ring-1 ring-amber-200',
        pulse: false,
    },
    critical: {
        border: 'border-red-200',
        gradient: 'from-red-50/70 via-white to-white',
        iconBg: 'bg-red-100',
        iconColor: 'text-red-600',
        timeColor: 'text-red-700',
        countdownColor: 'text-red-600',
        divider: 'bg-gradient-to-r from-red-300 via-red-200 to-transparent',
        badge: '¡Ahora!',
        badgeClass: 'bg-red-100 text-red-700 ring-1 ring-red-200',
        pulse: true,
    },
    past: {
        border: 'border-gray-200',
        gradient: 'from-gray-50 via-white to-white',
        iconBg: 'bg-gray-100',
        iconColor: 'text-gray-500',
        timeColor: 'text-gray-500',
        countdownColor: 'text-gray-500',
        divider: 'bg-gradient-to-r from-gray-200 via-gray-100 to-transparent',
        badge: 'En curso',
        badgeClass: 'bg-gray-100 text-gray-600 ring-1 ring-gray-200',
        pulse: false,
    },
};

const getUrgency = (totalMin: number): UrgencyKey => {
    if (totalMin < 0) return 'past';
    if (totalMin <= 5) return 'critical';
    if (totalMin <= 15) return 'urgent';
    if (totalMin <= 60) return 'soon';
    return 'normal';
};

const getCountdown = (fullDate: Date, totalMin: number) => {
    if (totalMin < 0) return 'En curso';
    if (totalMin < 1) return 'Ahora';
    if (totalMin < 60) return `En ${totalMin} min`;

    const hours = Math.floor(totalMin / 60);
    const min = totalMin % 60;

    if (isToday(fullDate)) {
        return min > 0 ? `En ${hours}h ${min}min` : `En ${hours}h`;
    }
    if (isTomorrow(fullDate)) {
        return `Mañana ${format(fullDate, 'HH:mm')}`;
    }
    return `${format(fullDate, "EEE d 'de' MMM", { locale: es })} · ${format(fullDate, 'HH:mm')}`;
};

const getSubtitle = (fullDate: Date) => {
    if (isToday(fullDate)) return 'Hoy';
    if (isTomorrow(fullDate)) return 'Mañana';
    return format(fullDate, "EEEE d 'de' MMMM", { locale: es });
};

/* ============================================================
   PATIENT AVATAR
   ============================================================ */
function PatientAvatar({
    photoUrl,
    fullName,
    status,
    size = 'md',
}: {
    photoUrl?: string | null;
    fullName: string;
    status: string;
    size?: 'sm' | 'md';
}) {
    const url = getImageUrl(photoUrl);
    const hasPhoto = !!url;

    const sizeClass = size === 'md' ? 'h-11 w-11' : 'h-8 w-8';
    const textClass = size === 'md' ? 'text-xs' : 'text-[10px]';
    const ringClass = size === 'md' ? 'ring-2' : 'ring-1';
    const dotClass =
        size === 'md'
            ? 'h-3 w-3 -bottom-0.5 -right-0.5'
            : 'h-2.5 w-2.5 -bottom-0.5 -right-0.5';

    return (
        <div className="relative shrink-0">
            {hasPhoto ? (
                <img
                    src={url}
                    alt={fullName}
                    className={cn(
                        sizeClass,
                        'rounded-full object-cover ring-white shadow-sm',
                        ringClass,
                    )}
                    onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const sibling = e.currentTarget.nextElementSibling as HTMLElement | null;
                        if (sibling) sibling.classList.remove('hidden');
                    }}
                />
            ) : null}
            <div
                className={cn(
                    sizeClass,
                    'rounded-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center ring-white shadow-sm',
                    ringClass,
                    hasPhoto && 'hidden',
                )}
            >
                <span className={cn(textClass, 'font-bold text-primary-700')}>
                    {getInitials(fullName)}
                </span>
            </div>

            <span
                className={cn(
                    'absolute rounded-full ring-2 ring-white',
                    dotClass,
                    status === 'CONFIRMED'
                        ? 'bg-emerald-500'
                        : status === 'SCHEDULED'
                            ? 'bg-blue-500'
                            : 'bg-gray-400',
                )}
            />
        </div>
    );
}

/* ============================================================
   PHONE ACTION — WhatsApp
   ============================================================ */
function PhoneAction({ phone }: { phone?: string | null }) {
    if (!phone) return null;

    const waNumber = normalizePhoneForWhatsApp(phone);

    return (
        <a
            href={`https://wa.me/${waNumber}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className={cn(
                'inline-flex items-center gap-1.5 text-[11px] font-medium',
                'text-emerald-700 hover:text-emerald-800',
                'bg-emerald-50 hover:bg-emerald-100',
                'px-2 py-1 rounded-md transition-colors',
            )}
            title={`Abrir WhatsApp de ${phone}`}
        >
            <MessageCircle className="h-3 w-3" />
            <span className="tabular-nums">{phone}</span>
        </a>
    );
}

/* ============================================================
   MAIN
   ============================================================ */
export function NextAppointmentCard({
    nextAppointments,
    currentTime,
    onClick,
}: NextAppointmentCardProps) {
    const navigate = useNavigate();

    /* ---------- Estado vacío ---------- */
    if (!nextAppointments || nextAppointments.length === 0) {
        return (
            <div className="relative bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden h-full flex flex-col">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/40 via-white to-white pointer-events-none" />
                <div className="relative p-4 md:p-5 flex-1 flex flex-col">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="p-2 bg-emerald-100 rounded-xl shrink-0">
                            <CalendarClock className="h-4 w-4 text-emerald-600" />
                        </div>
                        <h3 className="text-sm font-semibold text-gray-900">Próximas Citas</h3>
                    </div>
                    <div className="flex-1 flex flex-col items-center justify-center py-6 text-center">
                        <div className="relative mb-3">
                            <div className="absolute inset-0 bg-emerald-200 rounded-full blur-xl opacity-50" />
                            <div className="relative p-3 bg-emerald-50 rounded-full ring-4 ring-emerald-100/50">
                                <CheckCircle2 className="h-7 w-7 text-emerald-500" />
                            </div>
                        </div>
                        <p className="text-sm font-semibold text-gray-700">Todo al día</p>
                        <p className="text-xs text-gray-400 mt-1 max-w-[200px]">
                            No hay citas próximas agendadas
                        </p>
                    </div>
                </div>

                {/* Footer CTA */}
                <button
                    type="button"
                    onClick={() => navigate('/appointments')}
                    className={cn(
                        'group/footer relative w-full px-4 md:px-5 py-3',
                        'flex items-center justify-between gap-2',
                        'border-t border-gray-100 bg-white/80 hover:bg-gray-50',
                        'transition-colors',
                        'focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-400',
                    )}
                >
                    <span className="text-xs font-medium text-gray-600 group-hover/footer:text-gray-900">
                        Ver todas las citas
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 text-gray-400 group-hover/footer:text-primary-600 group-hover/footer:translate-x-0.5 transition-all" />
                </button>
            </div>
        );
    }

    const [primary, ...rest] = nextAppointments;
    const secondary = rest[0] || null;

    const primaryDate = parseAppointmentDate(primary.date, primary.time);
    if (!primaryDate) return null;

    const primaryTotalMin = Math.floor(
        (primaryDate.getTime() - currentTime.getTime()) / 60000,
    );
    const cfg = URGENCY_CONFIG[getUrgency(primaryTotalMin)];
    const countdown = getCountdown(primaryDate, primaryTotalMin);
    const subtitle = getSubtitle(primaryDate);

    /* ---------- Datos de la siguiente ---------- */
    let secondaryDate: Date | null = null;
    let secondaryCfg = URGENCY_CONFIG.normal;

    if (secondary) {
        secondaryDate = parseAppointmentDate(secondary.date, secondary.time);
        if (secondaryDate) {
            const secondaryTotalMin = Math.floor(
                (secondaryDate.getTime() - currentTime.getTime()) / 60000,
            );
            secondaryCfg = URGENCY_CONFIG[getUrgency(secondaryTotalMin)];
        }
    }

    return (
        <div
            className={cn(
                'group relative bg-white rounded-2xl border shadow-sm overflow-hidden',
                'transition-all duration-300 hover:shadow-lg',
                'h-full flex flex-col',
                cfg.border,
            )}
        >
            {/* Fondo con gradiente */}
            <div
                className={cn(
                    'absolute inset-0 bg-gradient-to-br pointer-events-none',
                    cfg.gradient,
                )}
            />

            {/* Barra superior */}
            <div className={cn('absolute top-0 left-0 right-0 h-0.5', cfg.divider)} />

            <div className="relative flex flex-col flex-1">
                {/* ============================================ */}
                {/* HERO — Próxima cita                          */}
                {/* ============================================ */}
                <button
                    type="button"
                    onClick={() => onClick?.(primary.id)}
                    className={cn(
                        'w-full text-left p-4 md:p-5',
                        'transition-transform duration-200 active:scale-[0.995]',
                        'focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-400',
                    )}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between gap-2 mb-4">
                        <div className="flex items-center gap-2 min-w-0">
                            <div className={cn('p-2 rounded-xl shrink-0', cfg.iconBg)}>
                                <CalendarClock className={cn('h-4 w-4', cfg.iconColor)} />
                            </div>
                            <h3 className="text-sm font-semibold text-gray-900 truncate">
                                Próxima Cita
                            </h3>
                        </div>

                        {cfg.badge && (
                            <span
                                className={cn(
                                    'text-[10px] font-bold uppercase tracking-wider',
                                    'px-2 py-1 rounded-full shrink-0 flex items-center gap-1.5',
                                    cfg.badgeClass,
                                )}
                            >
                                {cfg.pulse && (
                                    <span className="relative flex h-1.5 w-1.5">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75" />
                                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-current" />
                                    </span>
                                )}
                                {cfg.badge}
                            </span>
                        )}
                    </div>

                    {/* Hero: hora + countdown */}
                    <div className="flex items-end justify-between gap-3 mb-4">
                        <span
                            className={cn(
                                'text-4xl font-bold tracking-tight tabular-nums leading-none',
                                cfg.timeColor,
                            )}
                        >
                            {primary.time}
                        </span>

                        <div className="flex flex-col items-end shrink-0 pb-0.5">
                            <span className={cn('text-sm font-bold', cfg.countdownColor)}>
                                {countdown}
                            </span>
                            <span className="text-[11px] text-gray-400 capitalize mt-0.5">
                                {subtitle} · {primary.duration} min
                            </span>
                        </div>
                    </div>

                    <div className={cn('h-px mb-3.5', cfg.divider)} />

                    {/* Paciente */}
                    <div className="flex items-center gap-3">
                        <PatientAvatar
                            photoUrl={primary.patientPhoto}
                            fullName={primary.patientName}
                            status={primary.status}
                            size="md"
                        />

                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-gray-900 truncate">
                                {primary.patientName}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                                {primary.treatment}
                            </p>
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
                                {primary.doctorName && (
                                    <span className="text-[11px] text-gray-400 flex items-center gap-1">
                                        <Stethoscope className="h-3 w-3 shrink-0" />
                                        <span className="truncate">{primary.doctorName}</span>
                                    </span>
                                )}
                                <PhoneAction phone={primary.patientPhone} />
                            </div>
                        </div>
                    </div>
                </button>

                {/* ============================================ */}
                {/* SEPARADOR VISUAL con label                    */}
                {/* ============================================ */}
                {secondary && secondaryDate && (
                    <div className="relative">
                        <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
                        <div className="flex items-center gap-2 px-4 md:px-5 -mt-2.5 mb-1">
                            <span className="bg-white px-2 py-0.5 rounded-full border border-gray-200 text-[9px] font-bold uppercase tracking-wider text-black-400 leading-none flex items-center gap-1">
                                <span className="w-1 h-1 rounded-full bg-gray-300" />
                                Siguiente
                            </span>
                            <div className="flex-1 h-px bg-gray-100" />
                        </div>
                    </div>
                )}

                {/* ============================================ */}
                {/* SIGUIENTE — Fila compacta                     */}
                {/* ============================================ */}
                {secondary && secondaryDate && (
                    <button
                        type="button"
                        onClick={() => onClick?.(secondary.id)}
                        className={cn(
                            'w-full text-left px-4 md:px-5 pt-2 pb-3',
                            'bg-gray-50/60 hover:bg-gray-100/80 transition-colors',
                            'focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-400',
                        )}
                    >
                        <div className="flex items-center gap-3">
                            <PatientAvatar
                                photoUrl={secondary.patientPhoto}
                                fullName={secondary.patientName}
                                status={secondary.status}
                                size="sm"
                            />

                            <div className="min-w-0 flex-1">
                                <p className="text-xs font-semibold text-gray-800 truncate">
                                    {secondary.patientName}
                                </p>
                                <p className="text-[10px] text-gray-500 truncate">
                                    {secondary.treatment}
                                </p>
                            </div>

                            <PhoneAction phone={secondary.patientPhone} />

                            <div className="flex flex-col items-end shrink-0 pl-2 border-l border-gray-200">
                                <span
                                    className={cn(
                                        'text-sm font-bold tabular-nums leading-none',
                                        secondaryCfg.countdownColor,
                                    )}
                                >
                                    {secondary.time}
                                </span>
                                <span className="text-[9px] text-gray-400 mt-0.5 capitalize">
                                    {isToday(secondaryDate)
                                        ? 'Hoy'
                                        : isTomorrow(secondaryDate)
                                            ? 'Mañana'
                                            : format(secondaryDate, 'EEE d', { locale: es })}
                                </span>
                            </div>
                        </div>
                    </button>
                )}

                {/* ============================================ */}
                {/* FOOTER CTA — empuja hacia abajo                */}
                {/* ============================================ */}
                <div className="flex-1" />

                <button
                    type="button"
                    onClick={() => navigate('/appointments')}
                    className={cn(
                        'group/footer relative w-full px-4 md:px-5 py-3',
                        'flex items-center justify-between gap-2',
                        'border-t border-gray-100 bg-white/80 hover:bg-gray-50',
                        'transition-colors',
                        'focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-400',
                    )}
                >
                    <span className="text-xs font-medium text-gray-600 group-hover/footer:text-gray-900">
                        Ver todas las citas
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 text-gray-400 group-hover/footer:text-primary-600 group-hover/footer:translate-x-0.5 transition-all" />
                </button>
            </div>
        </div>
    );
}