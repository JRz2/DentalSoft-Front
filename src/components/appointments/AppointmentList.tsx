import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Appointment } from '@/types/appointment';
import { useDeleteAppointment } from '@/hooks/useAppointments';
import { format, isPast } from 'date-fns';
import { es } from 'date-fns/locale';
import {
    Pencil, Trash2, CalendarX, Clock, Stethoscope, AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface AppointmentListProps {
    appointments: Appointment[];
    isLoading?: boolean;
    onViewAppointment?: (appointment: Appointment) => void;
    onEditAppointment?: (appointment: Appointment) => void;
    onRefresh?: () => void;
    doctorId?: number;
}

// Configuración visual por estado
const STATUS_STYLES: Record<string, { bg: string; border: string; text: string; badgeBg: string; badgeText: string; label: string }> = {
    SCHEDULED: { bg: 'bg-blue-50/50', border: 'border-l-4 border-blue-500', text: 'text-blue-700', badgeBg: 'bg-blue-100', badgeText: 'text-blue-700', label: 'Agendada' },
    CONFIRMED: { bg: 'bg-emerald-50/50', border: 'border-l-4 border-emerald-500', text: 'text-emerald-700', badgeBg: 'bg-emerald-100', badgeText: 'text-emerald-700', label: 'Confirmada' },
    IN_PROGRESS: { bg: 'bg-amber-50/50', border: 'border-l-4 border-amber-500', text: 'text-amber-700', badgeBg: 'bg-amber-100', badgeText: 'text-amber-700', label: 'En curso' },
    COMPLETED: { bg: 'bg-green-50/50', border: 'border-l-4 border-green-500', text: 'text-green-700', badgeBg: 'bg-green-100', badgeText: 'text-green-700', label: 'Completada' },
    CANCELLED: { bg: 'bg-red-50/50', border: 'border-l-4 border-red-500', text: 'text-red-700', badgeBg: 'bg-red-100', badgeText: 'text-red-700', label: 'Cancelada' },
    NO_SHOW: { bg: 'bg-red-50/50', border: 'border-l-4 border-red-500', text: 'text-red-700', badgeBg: 'bg-red-100', badgeText: 'text-red-700', label: 'No asistió' },
};

// Estilo para citas cuya hora ya pasó y necesitan resolución
const OVERDUE_STYLE = {
    bg: 'bg-amber-50/60',
    border: 'border-l-4 border-amber-500 border-y-amber-100 border-r-amber-100',
    text: 'text-amber-700',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-800',
    label: 'Vencida'
};

const DEFAULT_STYLE = { bg: 'bg-gray-50', border: 'border-l-4 border-gray-300', text: 'text-gray-700', badgeBg: 'bg-gray-100', badgeText: 'text-gray-700', label: 'Desconocido' };

const isOverdue = (appointment: Appointment): boolean => {
    const date = new Date(appointment.appointmentDate);
    const isTerminal = ['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(appointment.status);
    return isPast(date) && !isTerminal;
};

export function AppointmentList({
    appointments,
    isLoading,
    onViewAppointment,
    onEditAppointment,
    onRefresh,
}: AppointmentListProps) {
    const deleteAppointment = useDeleteAppointment();
    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    const handleDelete = async () => {
        if (!selectedAppointment) return;
        try {
            await deleteAppointment.mutateAsync(selectedAppointment.id);
            setShowDeleteDialog(false);
            setSelectedAppointment(null);
            onRefresh?.();
        } catch (error) {
            console.error('Error al eliminar cita:', error);
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex gap-3 p-3 rounded-xl border border-gray-100 bg-white">
                        <Skeleton className="h-10 w-14 rounded-lg" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-3 w-1/2" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (!appointments || appointments.length === 0) {
        return (
            <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                <CalendarX className="h-10 w-10 mx-auto text-gray-300 mb-3" />
                <p className="text-sm font-medium text-gray-700">Sin citas para este día</p>
                <p className="text-xs text-gray-500 mt-1">Selecciona otro día en el calendario o agenda una nueva cita.</p>
            </div>
        );
    }

    return (
        <>
            <div className="space-y-3">
                {appointments.map((appointment) => {
                    const date = new Date(appointment.appointmentDate);
                    const overdue = isOverdue(appointment);
                    const style = overdue ? OVERDUE_STYLE : (STATUS_STYLES[appointment.status] || DEFAULT_STYLE);

                    return (
                        <div
                            key={appointment.id}
                            onClick={() => onViewAppointment?.(appointment)}
                            className={cn(
                                "group relative w-full text-left flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-xl transition-all cursor-pointer border",
                                style.bg,
                                style.border,
                                "hover:shadow-md"
                            )}
                        >
                            <div className="flex items-center gap-3 w-full">
                                {/* Bloque de Hora */}
                                <div className={cn(
                                    "flex-shrink-0 flex flex-col items-center justify-center min-w-[50px] border-r pr-3",
                                    overdue ? "border-amber-200/60" : "border-gray-200/60"
                                )}>
                                    <span className={cn("text-sm font-bold tabular-nums", style.text)}>
                                        {format(date, 'HH:mm')}
                                    </span>
                                    <span className="text-[10px] text-gray-500 font-medium flex items-center gap-0.5">
                                        <Clock className="h-2.5 w-2.5" />
                                        {appointment.duration}m
                                    </span>
                                </div>

                                {/* Información del Paciente */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-semibold text-gray-900 truncate">
                                            {appointment.patient?.fullName || 'Paciente no disponible'}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500 truncate">
                                        {appointment.doctor?.name && (
                                            <span className="flex items-center gap-1 truncate">
                                                <Stethoscope className="h-3 w-3 shrink-0" />
                                                {appointment.doctor.name}
                                            </span>
                                        )}
                                        {appointment.treatment?.name && (
                                            <>
                                                <span className="text-gray-300">·</span>
                                                <span className="truncate">{appointment.treatment.name}</span>
                                            </>
                                        )}
                                    </div>

                                    {overdue && (
                                        <div className="flex items-center gap-1 mt-1 text-[11px] font-medium text-amber-700 bg-amber-100/50 w-fit px-1.5 py-0.5 rounded-md">
                                            <AlertCircle className="h-3 w-3 shrink-0" />
                                            <span>Requiere confirmación</span>
                                        </div>
                                    )}
                                </div>

                                {/* Estado y Acciones Directas */}
                                <div className="flex-shrink-0 flex items-center gap-2">
                                    <Badge className={cn("hidden sm:inline-flex text-[10px] px-2 py-0.5 whitespace-nowrap", style.badgeBg, style.badgeText)}>
                                        {overdue && <AlertCircle className="h-2.5 w-2.5 mr-1" />}
                                        {style.label}
                                    </Badge>

                                    <div className="flex items-center gap-0.5 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                        {onEditAppointment && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onEditAppointment(appointment);
                                                }}
                                                className="h-7 w-7 text-amber-600 hover:text-amber-700 hover:bg-amber-100/50"
                                                title="Editar cita"
                                            >
                                                <Pencil className="h-3.5 w-3.5" />
                                            </Button>
                                        )}

                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedAppointment(appointment);
                                                setShowDeleteDialog(true);
                                            }}
                                            className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-100/50"
                                            title="Eliminar cita"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Dialog de confirmación de eliminación */}
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent className="w-[calc(100vw-2rem)] max-w-md">
                    <DialogHeader>
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-red-100 rounded-full shrink-0">
                                <Trash2 className="h-5 w-5 text-red-600" />
                            </div>
                            <div>
                                <DialogTitle className="text-base sm:text-lg font-bold">¿Eliminar esta cita?</DialogTitle>
                                <DialogDescription className="text-xs sm:text-sm pt-1">
                                    Esta acción no se puede deshacer. La cita será eliminada permanentemente del sistema.
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    {selectedAppointment && (
                        <div className="bg-gray-50 border border-gray-100 rounded-lg p-3 text-sm mt-2">
                            <p className="font-medium text-gray-900">{selectedAppointment.patient?.fullName}</p>
                            <p className="text-gray-500 text-xs mt-0.5">
                                {format(new Date(selectedAppointment.appointmentDate), "EEEE d 'de' MMMM, HH:mm", { locale: es })}
                            </p>
                        </div>
                    )}

                    <DialogFooter className="!flex-row justify-end gap-2 !space-x-0 pt-4">
                        <Button variant="outline" onClick={() => setShowDeleteDialog(false)} className="flex-1 sm:flex-initial">
                            Cancelar
                        </Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={deleteAppointment.isPending} className="flex-1 sm:flex-initial">
                            {deleteAppointment.isPending ? 'Eliminando...' : 'Sí, eliminar'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}