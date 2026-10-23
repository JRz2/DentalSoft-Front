import { ColumnDef } from '@tanstack/react-table';
import { useState } from 'react';
import {
    CalendarClock, CheckCircle2, PlayCircle, CheckCheck, XCircle, UserX,
    Eye, CalendarDays, User, Clock, Lock, Ban, Circle, ChevronRight, ChevronLeft,
    Pencil, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTableShadcn } from '@/components/shared/DataTableShadcn';
import { Appointment, AppointmentStatus } from '@/types/appointment';
import { format, isToday, isTomorrow, isYesterday, isPast } from 'date-fns';
import { es } from 'date-fns/locale';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { cn } from '@/lib/utils';
import { AppointmentStatusConfirmDialog, AppointmentActionType } from '@/components/appointments/AppointmentStatusConfirmDialog';

interface TreatmentAppointmentsListProps {
    appointments: Appointment[];
    isLoading?: boolean;
    onViewAppointment?: (appointment: Appointment) => void;
    onEdit?: (appointment: Appointment) => void;
    onComplete?: (appointment: Appointment, reason?: string) => Promise<void> | void;
    onNoShow?: (appointment: Appointment, reason?: string) => Promise<void> | void;
    onCancel?: (appointment: Appointment, reason: string) => Promise<void> | void;
    actionsDisabled?: boolean;
    actionsDisabledReason?: string;
    pagination?: {
        currentPage: number;
        totalPages: number;
        totalItems: number;
        itemsPerPage: number;
        onPageChange: (page: number) => void;
    };
}

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

const getRelativeDateLabel = (date: Date): string | null => {
    if (isToday(date)) return 'Hoy';
    if (isTomorrow(date)) return 'Mañana';
    if (isYesterday(date)) return 'Ayer';
    return null;
};

const relativeDateConfig: Record<string, { className: string; Icon: any }> = {
    'Hoy': {
        className: 'bg-blue-600 text-white shadow-sm ring-1 ring-primary-700/20',
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
                'text-[9px] font-bold uppercase tracking-wider leading-none',
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

const canComplete = (status: AppointmentStatus): boolean =>
    ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS'].includes(status);

const canNoShow = (status: AppointmentStatus): boolean =>
    ['SCHEDULED', 'CONFIRMED'].includes(status);

const canCancel = (status: AppointmentStatus): boolean =>
    ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS'].includes(status);

const canEdit = (status: AppointmentStatus): boolean =>
    ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS'].includes(status);

const formatApptDate = (appointment: Appointment): string =>
    format(new Date(appointment.appointmentDate), "dd/MM/yyyy 'a las' HH:mm", { locale: es });

const getCardStateClasses = (status: AppointmentStatus, overdue: boolean): string => {
    if (overdue) return 'border-amber-200 bg-amber-50/40';
    switch (status) {
        case 'COMPLETED':
            return 'border-green-200 bg-green-50/40';
        case 'CANCELLED':
            return 'border-gray-200 bg-gray-50/60 opacity-80';
        case 'NO_SHOW':
            return 'border-orange-200 bg-orange-50/40';
        default:
            return '';
    }
};

const getCellStateClasses = (status: AppointmentStatus): string => {
    switch (status) {
        case 'COMPLETED':
            return 'text-green-700';
        case 'CANCELLED':
            return 'text-gray-400 line-through';
        case 'NO_SHOW':
            return 'text-orange-700';
        default:
            return 'text-gray-900';
    }
};

const getIconWrapClasses = (appointment: Appointment): string => {
    const { status } = appointment;
    if (isOverdue(appointment)) return 'bg-amber-100 text-amber-700';
    switch (status) {
        case 'COMPLETED':
            return 'bg-green-100 text-green-700';
        case 'CANCELLED':
            return 'bg-gray-100 text-gray-500';
        case 'NO_SHOW':
            return 'bg-orange-100 text-orange-700';
        default:
            return 'bg-primary-50 text-primary-700';
    }
};

interface AppointmentCardProps {
    appointment: Appointment;
    onView?: (appointment: Appointment) => void;
    onEdit?: (appointment: Appointment) => void;
    onComplete?: (appointment: Appointment) => void;
    onNoShow?: (appointment: Appointment) => void;
    onCancel?: (appointment: Appointment) => void;
    actionsDisabled?: boolean;
}

function AppointmentCard({
    appointment,
    onView,
    onEdit,
    onComplete,
    onNoShow,
    onCancel,
    actionsDisabled,
}: AppointmentCardProps) {
    const date = new Date(appointment.appointmentDate);
    const relativeLabel = getRelativeDateLabel(date);
    const overdue = isOverdue(appointment);
    const StatusIcon = statusIcons[appointment.status];
    const isCancelled = appointment.status === 'CANCELLED';

    const showEdit = canEdit(appointment.status) && onEdit && !actionsDisabled;
    const showComplete = canComplete(appointment.status) && onComplete && !actionsDisabled;
    const showNoShow = canNoShow(appointment.status) && onNoShow && !actionsDisabled;
    const showCancel = canCancel(appointment.status) && onCancel && !actionsDisabled;

    return (
        <div
            onClick={() => onView?.(appointment)}
            className={cn(
                'bg-white rounded-xl border border-gray-100 p-4 transition-all hover:shadow-md active:scale-[0.99] cursor-pointer h-full flex flex-col',
                getCardStateClasses(appointment.status, overdue)
            )}
        >
            {/* Header: fecha + estado */}
            <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                    <div
                        className={cn(
                            'h-10 w-10 rounded-lg flex items-center justify-center shrink-0',
                            getIconWrapClasses(appointment)
                        )}
                    >
                        <CalendarDays className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                        {relativeLabel && (
                            <div className="mb-1">
                                <RelativeDateBadge label={relativeLabel} />
                            </div>
                        )}
                        <p className={cn('text-sm font-semibold leading-tight', getCellStateClasses(appointment.status))}>
                            {format(date, "d 'de' MMM", { locale: es })}
                        </p>
                    </div>
                </div>
                <Badge
                    variant="default"
                    className={cn('shrink-0 text-[10px] px-2 py-0.5 whitespace-nowrap', statusColors[appointment.status])}
                >
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {statusLabels[appointment.status]}
                </Badge>
            </div>

            {/* Hora + duración */}
            <div className="mt-3 flex items-center gap-2 text-sm text-gray-700">
                <Clock className={cn("h-4 w-4 shrink-0", overdue ? "text-amber-500" : "text-gray-400")} />
                <span className={cn('font-medium', overdue ? 'text-amber-700' : getCellStateClasses(appointment.status))}>
                    {format(date, 'HH:mm')}
                </span>
                <span className="text-xs text-gray-400">· {appointment.duration} min</span>
                
                {overdue && (
                    <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 text-[10px] ml-auto border border-amber-200">
                        Vencida
                    </Badge>
                )}
            </div>

            {/* Doctor */}
            <div className={cn(
                'mt-2 flex items-center gap-2 text-xs min-w-0',
                isCancelled ? 'text-gray-400' : 'text-gray-600'
            )}>
                <User className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                <span className="truncate" title={appointment.doctor?.name}>
                    {appointment.doctor?.name || 'Sin doctor asignado'}
                </span>
            </div>

            {overdue && (
                <div className="flex items-start gap-1.5 mt-2 text-[11px] font-medium text-amber-700 bg-amber-100/60 p-2 rounded-lg border border-amber-200/50">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                    <span>La hora de la cita ya pasó. Por favor, actualiza el estado a Completada o No Asistió.</span>
                </div>
            )}

            {/* Acciones */}
            <div className="flex items-center justify-end gap-1 mt-3 pt-3 border-t border-gray-100">
                {onView && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => { e.stopPropagation(); onView(appointment); }}
                        className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 h-9 w-9"
                        title="Ver detalle"
                    >
                        <Eye className="h-4 w-4" />
                    </Button>
                )}

                {showEdit && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => { e.stopPropagation(); onEdit(appointment); }}
                        className="text-amber-600 hover:text-amber-800 hover:bg-amber-50 h-9 w-9"
                        title="Editar cita"
                    >
                        <Pencil className="h-4 w-4" />
                    </Button>
                )}

                {showComplete && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => { e.stopPropagation(); onComplete(appointment); }}
                        className="text-green-600 hover:text-green-800 hover:bg-green-50 h-9 w-9"
                        title="Completar cita"
                    >
                        <CheckCircle2 className="h-4 w-4" />
                    </Button>
                )}

                {showNoShow && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => { e.stopPropagation(); onNoShow(appointment); }}
                        className="text-orange-600 hover:text-orange-800 hover:bg-orange-50 h-9 w-9"
                        title="Marcar como no asistió"
                    >
                        <UserX className="h-4 w-4" />
                    </Button>
                )}

                {showCancel && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => { e.stopPropagation(); onCancel(appointment); }}
                        className="text-red-600 hover:text-red-800 hover:bg-red-50 h-9 w-9"
                        title="Cancelar cita"
                    >
                        <XCircle className="h-4 w-4" />
                    </Button>
                )}
            </div>
        </div>
    );
}

export function TreatmentAppointmentsList({
    appointments,
    isLoading,
    onViewAppointment,
    onEdit,
    onComplete,
    onNoShow,
    onCancel,
    actionsDisabled = false,
    actionsDisabledReason,
    pagination,
}: TreatmentAppointmentsListProps) {
    const useCardView = useMediaQuery('(max-width: 1024px)');

    const [pendingAction, setPendingAction] = useState<{
        type: AppointmentActionType;
        appointment: Appointment;
    } | null>(null);
    const [isActing, setIsActing] = useState(false);

    const closePendingAction = () => {
        if (isActing) return;
        setPendingAction(null);
    };

    const confirmAction = async (reason?: string) => {
        if (!pendingAction) return;
        const { type, appointment } = pendingAction;

        setIsActing(true);
        try {
            if (type === 'complete') {
                await onComplete?.(appointment, reason);
            } else if (type === 'noShow') {
                await onNoShow?.(appointment, reason);
            } else if (type === 'cancel') {
                await onCancel?.(appointment, reason || '');
            }
            setPendingAction(null);
        } catch {
            // El error ya se notificó en el handler de la página
        } finally {
            setIsActing(false);
        }
    };

    const actionsDisabledBanner = actionsDisabled && actionsDisabledReason && (
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3">
            <Lock className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-700">{actionsDisabledReason}</p>
        </div>
    );

    const columns: ColumnDef<Appointment>[] = [
        {
            accessorKey: 'appointmentDate',
            header: 'Fecha',
            size: 140,
            cell: ({ row }) => {
                const date = new Date(row.original.appointmentDate);
                const relativeLabel = getRelativeDateLabel(date);
                const overdue = isOverdue(row.original);
                return (
                    <div>
                        {relativeLabel && (
                            <div className="mb-1">
                                <RelativeDateBadge label={relativeLabel} />
                            </div>
                        )}
                        <span
                            className={cn(
                                'font-medium',
                                overdue && 'text-amber-600',
                                !overdue && getCellStateClasses(row.original.status)
                            )}
                        >
                            {format(date, "dd/MM/yyyy", { locale: es })}
                        </span>
                    </div>
                );
            },
        },
        {
            accessorKey: 'duration',
            header: 'Hora',
            size: 110,
            cell: ({ row }) => {
                const date = new Date(row.original.appointmentDate);
                const overdue = isOverdue(row.original);
                
                return (
                    <div className="flex flex-col">
                        <div className={cn(
                            "flex items-center gap-1.5 px-2 py-1 rounded-md w-fit",
                            overdue ? "bg-amber-50 text-amber-700 border border-amber-100" : ""
                        )}>
                            <span
                                className={cn(
                                    'font-semibold',
                                    overdue && 'text-amber-700',
                                    !overdue && getCellStateClasses(row.original.status)
                                )}
                            >
                                {format(date, 'HH:mm')}
                            </span>
                            {overdue && <AlertCircle className="h-3.5 w-3.5 text-amber-500 shrink-0" />}
                        </div>
                        <span className="text-[11px] text-gray-400 mt-1 pl-1">
                            {row.original.duration} min
                        </span>
                    </div>
                );
            },
        },
        {
            accessorKey: 'doctor',
            header: 'Doctor',
            size: 180,
            cell: ({ row }) => {
                const doctor = row.original.doctor;
                const isCancelled = row.original.status === 'CANCELLED';
                return (
                    <div className={cn('flex items-center gap-2 min-w-0', isCancelled && 'opacity-60')}>
                        <User className="h-4 w-4 text-gray-400 shrink-0" />
                        <span
                            className={cn('truncate', isCancelled ? 'text-gray-400 line-through' : 'text-gray-600')}
                            title={doctor?.name}
                        >
                            {doctor?.name || 'No asignado'}
                        </span>
                    </div>
                );
            },
        },
        {
            id: 'state',
            header: 'Estado',
            size: 180,
            cell: ({ row }) => {
                const status = row.original.status;
                const StatusIcon = statusIcons[status];
                const overdue = isOverdue(row.original);
                
                return (
                    <div className="flex items-center gap-2 flex-wrap"> 
                        <Badge className={cn('whitespace-nowrap rounded-md', statusColors[status])}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusLabels[status]}
                        </Badge>
                        
                        {overdue && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100/80 text-amber-800 whitespace-nowrap shadow-sm">
                                <AlertCircle className="h-2.5 w-2.5" />
                                Vencida
                            </span>
                        )}
                    </div>
                );
            },
        },
        {
            id: 'actions',
            header: 'Acciones',
            size: 200,
            cell: ({ row }) => {
                const appointment = row.original;

                const showEdit = canEdit(appointment.status) && onEdit && !actionsDisabled;
                const showComplete = canComplete(appointment.status) && onComplete && !actionsDisabled;
                const showNoShow = canNoShow(appointment.status) && onNoShow && !actionsDisabled;
                const showCancel = canCancel(appointment.status) && onCancel && !actionsDisabled;

                return (
                    <div className="flex justify-end gap-1">
                        {onViewAppointment && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => { e.stopPropagation(); onViewAppointment(appointment); }}
                                className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 h-8 w-8"
                                title="Ver detalle"
                            >
                                <Eye className="h-4 w-4" />
                            </Button>
                        )}

                        {showEdit && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => { e.stopPropagation(); onEdit(appointment); }}
                                className="text-amber-600 hover:text-amber-800 hover:bg-amber-50 h-8 w-8"
                                title="Editar cita"
                            >
                                <Pencil className="h-4 w-4" />
                            </Button>
                        )}

                        {showComplete && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => { e.stopPropagation(); setPendingAction({ type: 'complete', appointment }); }}
                                className="text-green-600 hover:text-green-800 hover:bg-green-50 h-8 w-8"
                                title="Completar cita"
                            >
                                <CheckCircle2 className="h-4 w-4" />
                            </Button>
                        )}

                        {showNoShow && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => { e.stopPropagation(); setPendingAction({ type: 'noShow', appointment }); }}
                                className="text-orange-600 hover:text-orange-800 hover:bg-orange-50 h-8 w-8"
                                title="Marcar como no asistió"
                            >
                                <UserX className="h-4 w-4" />
                            </Button>
                        )}

                        {showCancel && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => { e.stopPropagation(); setPendingAction({ type: 'cancel', appointment }); }}
                                className="text-red-600 hover:text-red-800 hover:bg-red-50 h-8 w-8"
                                title="Cancelar cita"
                            >
                                <XCircle className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                );
            },
        },
    ];

    if (isLoading && useCardView) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 animate-pulse">
                        <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                                <div className="h-10 w-10 rounded-lg bg-gray-200" />
                                <div className="space-y-1">
                                    <div className="h-3 bg-gray-200 rounded w-16" />
                                    <div className="h-3 bg-gray-100 rounded w-20" />
                                </div>
                            </div>
                            <div className="h-5 bg-gray-200 rounded w-20" />
                        </div>
                        <div className="mt-3 space-y-2">
                            <div className="h-3 bg-gray-200 rounded w-2/3" />
                            <div className="h-3 bg-gray-100 rounded w-1/2" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (!appointments.length && !isLoading && useCardView) {
        return (
            <>
                {actionsDisabledBanner}
                <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
                    <CalendarClock className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                    <p className="text-sm font-medium text-gray-700">Sin citas programadas</p>
                    <p className="text-xs text-gray-500 mt-1">Este tratamiento no tiene citas asociadas</p>
                </div>
            </>
        );
    }

    if (useCardView) {
        return (
            <>
                {actionsDisabledBanner}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {appointments.map((appointment) => (
                        <AppointmentCard
                            key={appointment.id}
                            appointment={appointment}
                            onView={onViewAppointment}
                            onEdit={onEdit}
                            onComplete={(a) => setPendingAction({ type: 'complete', appointment: a })}
                            onNoShow={(a) => setPendingAction({ type: 'noShow', appointment: a })}
                            onCancel={(a) => setPendingAction({ type: 'cancel', appointment: a })}
                            actionsDisabled={actionsDisabled}
                        />
                    ))}
                </div>

                {pagination && pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between bg-white rounded-xl border border-gray-100 p-3 mt-3">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
                            disabled={pagination.currentPage <= 1}
                        >
                            Anterior
                        </Button>
                        <span className="text-xs text-gray-600">
                            {pagination.currentPage} / {pagination.totalPages}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
                            disabled={pagination.currentPage >= pagination.totalPages}
                        >
                            Siguiente
                        </Button>
                    </div>
                )}

                <AppointmentStatusConfirmDialog
                    open={!!pendingAction}
                    onOpenChange={(open) => !open && closePendingAction()}
                    action={pendingAction?.type || null}
                    appointmentDate={pendingAction ? formatApptDate(pendingAction.appointment) : ''}
                    onConfirm={confirmAction}
                    isLoading={isActing}
                />
            </>
        );
    }

    return (
        <>
            {actionsDisabledBanner}
            <DataTableShadcn
                columns={columns}
                data={appointments}
                isLoading={isLoading}
                onRowClick={onViewAppointment}
                pagination={pagination}
            />

            <AppointmentStatusConfirmDialog
                open={!!pendingAction}
                onOpenChange={(open) => !open && closePendingAction()}
                action={pendingAction?.type || null}
                appointmentDate={pendingAction ? formatApptDate(pendingAction.appointment) : ''}
                onConfirm={confirmAction}
                isLoading={isActing}
            />
        </>
    );
}