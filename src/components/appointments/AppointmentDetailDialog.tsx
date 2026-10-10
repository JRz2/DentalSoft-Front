import { useState } from 'react';
import {
    Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    CalendarClock, CheckCircle2, PlayCircle, CheckCheck, UserX,
    CalendarDays, Clock, User, Stethoscope, FileText, StickyNote,
    Ban, Circle, ChevronRight, ChevronLeft, History, Phone, Mail,
    ClipboardList, Hash, AlertTriangle,
} from 'lucide-react';
import { format, isToday, isTomorrow, isYesterday, isPast } from 'date-fns';
import { es } from 'date-fns/locale';
import { Appointment, AppointmentStatus } from '@/types/appointment';
import { cn } from '@/lib/utils';

interface AppointmentDetailDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    appointment: Appointment | null;
}

/* ============================================================
   CONFIG
   ============================================================ */
const statusLabels: Record<AppointmentStatus, string> = {
    SCHEDULED: 'Agendada',
    CONFIRMED: 'Confirmada',
    IN_PROGRESS: 'En curso',
    COMPLETED: 'Completada',
    CANCELLED: 'Cancelada',
    NO_SHOW: 'No asistió',
};

const statusColors: Record<AppointmentStatus, string> = {
    SCHEDULED: 'bg-blue-100 text-blue-700 hover:bg-blue-100',
    CONFIRMED: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100',
    IN_PROGRESS: 'bg-amber-100 text-amber-700 hover:bg-amber-100',
    COMPLETED: 'bg-green-100 text-green-800 hover:bg-green-100',
    CANCELLED: 'bg-gray-200 text-gray-600 hover:bg-gray-200',
    NO_SHOW: 'bg-orange-100 text-orange-700 hover:bg-orange-100',
};

const statusIcons: Record<AppointmentStatus, any> = {
    SCHEDULED: CalendarClock,
    CONFIRMED: CheckCircle2,
    IN_PROGRESS: PlayCircle,
    COMPLETED: CheckCheck,
    CANCELLED: Ban,
    NO_SHOW: UserX,
};

/* ============================================================
   HELPERS
   ============================================================ */
const getRelativeDateLabel = (date: Date): string | null => {
    if (isToday(date)) return 'Hoy';
    if (isTomorrow(date)) return 'Mañana';
    if (isYesterday(date)) return 'Ayer';
    return null;
};

const relativeDateConfig: Record<string, { className: string; Icon: any }> = {
    'Hoy': {
        className: 'bg-blue-600 text-white shadow-sm',
        Icon: Circle,
    },
    'Mañana': {
        className: 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200',
        Icon: ChevronRight,
    },
    'Ayer': {
        className: 'bg-gray-100 text-gray-500 ring-1 ring-inset ring-gray-200',
        Icon: ChevronLeft,
    },
};

function RelativeDateBadge({ label }: { label: string }) {
    const cfg = relativeDateConfig[label];
    if (!cfg) return null;
    const Icon = cfg.Icon;
    const isToday = label === 'Hoy';

    return (
        <span
            className={cn(
                'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5',
                'text-[10px] font-bold uppercase tracking-wider leading-none',
                cfg.className
            )}
        >
            <Icon
                className={cn('h-2.5 w-2.5 shrink-0', isToday && 'fill-current')}
                strokeWidth={isToday ? 0 : 3}
            />
            {label}
        </span>
    );
}

const isOverdue = (appointment: Appointment): boolean => {
    const date = new Date(appointment.appointmentDate);
    return (
        isPast(date) &&
        appointment.status !== 'COMPLETED' &&
        appointment.status !== 'CANCELLED' &&
        appointment.status !== 'NO_SHOW'
    );
};

const getInitials = (name?: string): string => {
    if (!name) return '?';
    return name
        .split(' ')
        .map((w) => w[0])
        .filter(Boolean)
        .slice(0, 2)
        .join('')
        .toUpperCase();
};

const getImageUrl = (path?: string) => {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) {
        return path;
    }
    if (path.startsWith('/')) {
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        const cleanBaseUrl = baseUrl.replace(/\/api$/, '');
        return `${cleanBaseUrl}${path}`;
    }
    return path;
};

/* ============================================================
   INFO ROW
   ============================================================ */
interface InfoRowProps {
    icon: any;
    label: string;
    children: React.ReactNode;
    className?: string;
}

function InfoRow({ icon: Icon, label, children, className }: InfoRowProps) {
    return (
        <div
            className={cn(
                'flex items-start gap-3 py-3 border-b border-gray-100 last:border-0 min-w-0',
                className
            )}
        >
            <div className="h-8 w-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                <Icon className="h-4 w-4 text-gray-500" />
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                    {label}
                </p>
                <div className="mt-0.5 text-sm text-gray-800 break-words">
                    {children}
                </div>
            </div>
        </div>
    );
}

/* ============================================================
   AVATAR DEL PACIENTE
   ============================================================ */
interface PatientAvatarProps {
    photoUrl?: string;
    fullName?: string;
    size?: 'sm' | 'md' | 'lg';
}

function PatientAvatar({ photoUrl, fullName, size = 'sm' }: PatientAvatarProps) {
    const [imageError, setImageError] = useState(false);
    const sizeClasses =
        size === 'lg' ? 'h-14 w-14 text-base'
            : size === 'md' ? 'h-10 w-10 text-xs'
                : 'h-8 w-8 text-[10px]';
    const hasPhoto = photoUrl && photoUrl.trim() !== '' && !imageError;

    return (
        <div
            className={cn(
                'rounded-full overflow-hidden bg-primary-100 text-primary-700',
                'flex items-center justify-center font-bold shrink-0',
                sizeClasses
            )}
        >
            {hasPhoto ? (
                <img
                    src={getImageUrl(photoUrl)}
                    alt={fullName || 'Paciente'}
                    className="h-full w-full object-cover"
                    onError={() => setImageError(true)}
                />
            ) : (
                <span>{getInitials(fullName)}</span>
            )}
        </div>
    );
}

/* ============================================================
   MAIN COMPONENT
   ============================================================ */
export function AppointmentDetailDialog({
    open,
    onOpenChange,
    appointment,
}: AppointmentDetailDialogProps) {
    if (!appointment) return null;

    const date = new Date(appointment.appointmentDate);
    const relativeLabel = getRelativeDateLabel(date);
    const overdue = isOverdue(appointment);
    const StatusIcon = statusIcons[appointment.status];
    const isCancelled = appointment.status === 'CANCELLED';
    const isNoShow = appointment.status === 'NO_SHOW';
    const isCompleted = appointment.status === 'COMPLETED';

    const patient = (appointment.patient || {}) as any;
    const doctor = (appointment.doctor || {}) as any;
    const treatment = (appointment as any).treatment as { name?: string } | undefined;

    const cancellationReason = (appointment as any).cancellationReason as string | undefined;
    const cancelledAt = (appointment as any).cancelledAt as string | undefined;
    const createdAt = (appointment as any).createdAt as string | undefined;
    const updatedAt = (appointment as any).updatedAt as string | undefined;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className={cn(
                    'w-full max-w-[95vw] sm:max-w-lg md:max-w-2xl lg:max-w-4xl',
                    'max-h-[90vh] overflow-y-auto overflow-x-hidden',
                    'p-0 gap-0',
                    '[&>*]:min-w-0'
                )}
            >
                {/* ─── Header con gradiente ─── */}
                <div className="bg-gradient-to-r from-primary-50 to-white border-b px-4 sm:px-6 py-4 rounded-t-2xl">
                    <DialogHeader>
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                                <div
                                    className={cn(
                                        'p-2 rounded-xl shrink-0',
                                        overdue
                                            ? 'bg-red-100'
                                            : isCompleted
                                                ? 'bg-green-100'
                                                : isCancelled
                                                    ? 'bg-gray-100'
                                                    : isNoShow
                                                        ? 'bg-orange-100'
                                                        : 'bg-primary-100'
                                    )}
                                >
                                    <StatusIcon
                                        className={cn(
                                            'h-5 w-5',
                                            overdue
                                                ? 'text-red-600'
                                                : isCompleted
                                                    ? 'text-green-600'
                                                    : isCancelled
                                                        ? 'text-gray-500'
                                                        : isNoShow
                                                            ? 'text-orange-600'
                                                            : 'text-primary-600'
                                        )}
                                    />
                                </div>
                                <div className="min-w-0">
                                    <DialogTitle className="text-lg sm:text-xl font-bold text-gray-900 leading-tight">
                                        Detalle de la Cita
                                    </DialogTitle>
                                    <DialogDescription className="text-xs sm:text-sm text-gray-500">
                                        Cita #{appointment.id}
                                    </DialogDescription>
                                </div>
                            </div>

                            <Badge
                                variant="default"
                                className={cn(
                                    'shrink-0 text-[10px] sm:text-xs px-2 py-0.5 whitespace-nowrap',
                                    statusColors[appointment.status]
                                )}
                            >
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {statusLabels[appointment.status]}
                            </Badge>
                        </div>
                    </DialogHeader>
                </div>

                {/* ─── Body ─── */}
                <div className="px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-5">
                    {/* Alertas */}
                    {overdue && (
                        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3">
                            <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
                            <div className="min-w-0">
                                <p className="text-xs sm:text-sm font-medium text-red-800">
                                    Cita vencida
                                </p>
                                <p className="text-xs sm:text-sm text-red-700 mt-0.5">
                                    La fecha y hora de esta cita ya pasaron y no fue
                                    marcada como completada, cancelada ni no asistida.
                                </p>
                            </div>
                        </div>
                    )}

                    {isCancelled && (
                        <div className="flex items-start gap-2 bg-gray-50 border border-gray-200 rounded-lg p-3">
                            <Ban className="h-4 w-4 text-gray-600 mt-0.5 shrink-0" />
                            <div className="min-w-0 flex-1">
                                <p className="text-xs sm:text-sm font-medium text-gray-700">
                                    Cita cancelada
                                </p>
                                {cancellationReason && (
                                    <p className="text-xs sm:text-sm text-gray-600 mt-0.5 break-words">
                                        <strong>Motivo:</strong> {cancellationReason}
                                    </p>
                                )}
                                {cancelledAt && (
                                    <p className="text-[11px] text-gray-500 mt-1">
                                        {format(
                                            new Date(cancelledAt),
                                            "dd/MM/yyyy 'a las' HH:mm",
                                            { locale: es }
                                        )}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    {isNoShow && (
                        <div className="flex items-start gap-2 bg-orange-50 border border-orange-200 rounded-lg p-3">
                            <UserX className="h-4 w-4 text-orange-600 mt-0.5 shrink-0" />
                            <p className="text-xs sm:text-sm text-orange-700">
                                El paciente no asistió a esta cita.
                            </p>
                        </div>
                    )}

                    {/* ⭐ GRID: en desktop 2 columnas (fecha+paciente | doctor+detalles) */}
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 lg:gap-5">
                        {/* Columna izquierda (2/5 en desktop): Fecha + Paciente + Doctor */}
                        <div className="lg:col-span-2 space-y-4">
                            {/* Fecha y hora — card destacada */}
                            <div
                                className={cn(
                                    'rounded-xl border p-4',
                                    overdue
                                        ? 'border-red-200 bg-red-50/40'
                                        : isCompleted
                                            ? 'border-green-200 bg-green-50/40'
                                            : isCancelled
                                                ? 'border-gray-200 bg-gray-50/60'
                                                : isNoShow
                                                    ? 'border-orange-200 bg-orange-50/40'
                                                    : 'border-primary-200 bg-primary-50/30'
                                )}
                            >
                                <div className="flex items-center justify-between gap-3 flex-wrap">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <CalendarDays className="h-8 w-8 text-gray-400 shrink-0" />
                                        <div className="min-w-0">
                                            {relativeLabel && (
                                                <div className="mb-1">
                                                    <RelativeDateBadge label={relativeLabel} />
                                                </div>
                                            )}
                                            <p className="text-sm font-semibold text-gray-900 capitalize">
                                                {format(date, "EEEE d 'de' MMMM, yyyy", { locale: es })}
                                            </p>
                                            <p className="text-xs text-gray-600 mt-0.5 flex items-center gap-1.5">
                                                <Clock className="h-3 w-3 shrink-0" />
                                                <span className="font-medium">
                                                    {format(date, 'HH:mm')}
                                                </span>
                                                <span className="text-gray-400">
                                                    · {appointment.duration} min
                                                </span>
                                            </p>
                                        </div>
                                    </div>
                                    {overdue && (
                                        <Badge className="bg-red-100 text-red-700 hover:bg-red-100 text-[10px] shrink-0">
                                            Vencida
                                        </Badge>
                                    )}
                                </div>
                            </div>

                            {/* Paciente */}
                            {patient.id && (
                                <div className="rounded-xl border border-gray-100 bg-white">
                                    <InfoRow icon={User} label="Paciente">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <PatientAvatar
                                                photoUrl={patient.photoUrl}
                                                fullName={patient.fullName}
                                                size="md"
                                            />
                                            <div className="min-w-0 flex-1">
                                                <p className="font-medium truncate text-sm sm:text-base">
                                                    {patient.fullName || '—'}
                                                </p>
                                                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-gray-500 mt-0.5">
                                                    {patient.medicalRecordNum && (
                                                        <span className="flex items-center gap-1">
                                                            <Hash className="h-3 w-3 shrink-0" />
                                                            {patient.medicalRecordNum}
                                                        </span>
                                                    )}
                                                    {patient.phoneNumber && (
                                                        <span className="flex items-center gap-1">
                                                            <Phone className="h-3 w-3 shrink-0" />
                                                            {patient.phoneNumber}
                                                        </span>
                                                    )}
                                                    {patient.email && (
                                                        <span className="flex items-center gap-1 truncate max-w-full">
                                                            <Mail className="h-3 w-3 shrink-0" />
                                                            <span className="truncate">
                                                                {patient.email}
                                                            </span>
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </InfoRow>
                                </div>
                            )}

                            {/* Doctor + Tratamiento */}
                            <div className="rounded-xl border border-gray-100 bg-white">
                                {doctor.id && (
                                    <InfoRow icon={Stethoscope} label="Doctor">
                                        <div className="min-w-0">
                                            <p className="font-medium truncate">
                                                {doctor.name || '—'}
                                            </p>
                                            {doctor.specialty && (
                                                <p className="text-[11px] text-gray-500 mt-0.5">
                                                    {doctor.specialty}
                                                </p>
                                            )}
                                        </div>
                                    </InfoRow>
                                )}

                                {treatment?.name && (
                                    <InfoRow icon={ClipboardList} label="Tratamiento">
                                        <p className="font-medium truncate">
                                            {treatment.name}
                                        </p>
                                    </InfoRow>
                                )}
                            </div>
                        </div>

                        {/* Columna derecha (3/5 en desktop): Motivo + Notas */}
                        <div className="lg:col-span-3 space-y-4">
                            <div className="rounded-xl border border-gray-100 bg-white">
                                <InfoRow icon={FileText} label="Motivo de la consulta">
                                    <p className="whitespace-pre-wrap">
                                        {appointment.reason || '—'}
                                    </p>
                                </InfoRow>

                                {appointment.notes && (
                                    <InfoRow icon={StickyNote} label="Notas adicionales">
                                        <p className="whitespace-pre-wrap text-gray-600">
                                            {appointment.notes}
                                        </p>
                                    </InfoRow>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Metadata de auditoría */}
                    <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-[11px] text-gray-400">
                        {createdAt && (
                            <span className="flex items-center gap-1">
                                <History className="h-3 w-3" />
                                Creada {format(new Date(createdAt), "dd/MM/yyyy 'a las' HH:mm", { locale: es })}
                            </span>
                        )}
                        {updatedAt && updatedAt !== createdAt && (
                            <span className="flex items-center gap-1">
                                <History className="h-3 w-3" />
                                Actualizada {format(new Date(updatedAt), "dd/MM/yyyy 'a las' HH:mm", { locale: es })}
                            </span>
                        )}
                    </div>
                </div>

                {/* ─── Footer ─── */}
                <div className="px-4 sm:px-6 py-3 border-t bg-gray-50/60 rounded-b-2xl">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        className="w-full sm:w-auto sm:ml-auto sm:flex"
                    >
                        Cerrar
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}