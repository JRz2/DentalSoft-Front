import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Appointment, AppointmentStatus } from '@/types/appointment';
import { StatusBadge } from './StatusBadge';
import { useUpdateAppointmentStatus, useDeleteAppointment } from '@/hooks/useAppointments';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { MoreHorizontal, Eye, Edit, Trash2, CalendarCheck, CalendarX, Clock, User, Stethoscope } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface AppointmentListProps {
    appointments: Appointment[];
    isLoading?: boolean;
    onViewAppointment?: (appointment: Appointment) => void;
    onEditAppointment?: (appointment: Appointment) => void;
    onRefresh?: () => void;
    doctorId?: number;
}

const statusOptions: { value: AppointmentStatus; label: string; icon: string }[] = [
    { value: 'SCHEDULED', label: 'Agendada', icon: '📅' },
    { value: 'CONFIRMED', label: 'Confirmada', icon: '✅' },
    { value: 'IN_PROGRESS', label: 'En curso', icon: '🔄' },
    { value: 'COMPLETED', label: 'Completada', icon: '✔️' },
    { value: 'CANCELLED', label: 'Cancelada', icon: '❌' },
    { value: 'NO_SHOW', label: 'No asistió', icon: '🚫' },
];

export function AppointmentList({
    appointments,
    isLoading,
    onViewAppointment,
    onEditAppointment,
    onRefresh,
    doctorId,
}: AppointmentListProps) {
    const updateStatus = useUpdateAppointmentStatus();
    const deleteAppointment = useDeleteAppointment();
    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [showStatusDialog, setShowStatusDialog] = useState(false);

    const handleStatusChange = async (appointmentId: number, status: AppointmentStatus) => {
        try {
            await updateStatus.mutateAsync({ id: appointmentId, status });
            onRefresh?.();
        } catch (error) {
            console.error('Error al cambiar estado:', error);
        }
    };

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
            <Card>
                <CardContent className="pt-6">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex items-center gap-4 py-3 border-b border-gray-100 last:border-0">
                            <Skeleton className="h-4 w-16" />
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-4 w-28" />
                            <Skeleton className="h-6 w-24" />
                            <Skeleton className="h-8 w-8 ml-auto" />
                        </div>
                    ))}
                </CardContent>
            </Card>
        );
    }

    if (!appointments || appointments.length === 0) {
        return (
            <Card>
                <CardContent className="py-12 text-center text-gray-500">
                    <CalendarX className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                    <p className="text-lg font-medium text-gray-600">No hay citas programadas</p>
                    <p className="text-sm">No se encontraron citas para los filtros seleccionados</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            <Card>
                <CardContent className="pt-6">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[80px]">Hora</TableHead>
                                    <TableHead>Paciente</TableHead>
                                    <TableHead>Doctor</TableHead>
                                    <TableHead className="w-[140px]">Estado</TableHead>
                                    <TableHead className="text-right w-[60px]">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {appointments.map((appointment) => {
                                    const appointmentDate = new Date(appointment.appointmentDate);
                                    const time = format(appointmentDate, 'HH:mm');
                                    const isPast = appointmentDate < new Date();

                                    return (
                                        <TableRow
                                            key={appointment.id}
                                            className={cn(
                                                "hover:bg-gray-50 transition-colors",
                                                isPast && appointment.status !== 'COMPLETED' && appointment.status !== 'CANCELLED' && "bg-gray-50/50"
                                            )}
                                        >
                                            <TableCell className="font-medium text-sm">
                                                <div className="flex flex-col">
                                                    <span>{time}</span>
                                                    <span className="text-xs text-gray-400">
                                                        {appointment.duration} min
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-gray-900">
                                                        {appointment.patient?.fullName || 'Paciente no disponible'}
                                                    </span>
                                                    {appointment.patient?.phoneNumber && (
                                                        <span className="text-xs text-gray-400">
                                                            {appointment.patient.phoneNumber}
                                                        </span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="text-sm">
                                                        {appointment.doctor?.name || 'Doctor no disponible'}
                                                    </span>
                                                    {appointment.treatment && (
                                                        <span className="text-xs text-gray-400">
                                                            {appointment.treatment.name}
                                                        </span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <StatusBadge status={appointment.status} />
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                                        <DropdownMenuSeparator />
                                                        {onViewAppointment && (
                                                            <DropdownMenuItem onClick={() => onViewAppointment(appointment)}>
                                                                <Eye className="h-4 w-4 mr-2" />
                                                                Ver detalles
                                                            </DropdownMenuItem>
                                                        )}
                                                        {onEditAppointment && (
                                                            <DropdownMenuItem onClick={() => onEditAppointment(appointment)}>
                                                                <Edit className="h-4 w-4 mr-2" />
                                                                Editar
                                                            </DropdownMenuItem>
                                                        )}
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuLabel>Cambiar estado</DropdownMenuLabel>
                                                        {statusOptions.map((option) => (
                                                            <DropdownMenuItem
                                                                key={option.value}
                                                                onClick={() => handleStatusChange(appointment.id, option.value)}
                                                                disabled={appointment.status === option.value}
                                                                className={cn(
                                                                    appointment.status === option.value && "text-gray-400"
                                                                )}
                                                            >
                                                                <span className="mr-2">{option.icon}</span>
                                                                {option.label}
                                                            </DropdownMenuItem>
                                                        ))}
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            onClick={() => {
                                                                setSelectedAppointment(appointment);
                                                                setShowDeleteDialog(true);
                                                            }}
                                                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                        >
                                                            <Trash2 className="h-4 w-4 mr-2" />
                                                            Eliminar
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Dialog de confirmación de eliminación */}
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>¿Eliminar cita?</DialogTitle>
                        <DialogDescription>
                            Esta acción no se puede deshacer. La cita será eliminada permanentemente.
                            {selectedAppointment && (
                                <div className="mt-2 p-3 bg-gray-50 rounded-lg text-sm">
                                    <p><strong>Paciente:</strong> {selectedAppointment.patient?.fullName}</p>
                                    <p><strong>Fecha:</strong> {format(new Date(selectedAppointment.appointmentDate), "dd/MM/yyyy HH:mm", { locale: es })}</p>
                                </div>
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                            Cancelar
                        </Button>
                        <Button variant="destructive" onClick={handleDelete}>
                            Eliminar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}