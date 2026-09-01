import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Appointment, AppointmentStatus } from '@/types/appointment';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarIcon, Eye, CalendarPlus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TreatmentAppointmentsListProps {
    appointments: Appointment[];
    isLoading?: boolean;
    onViewAppointment?: (appointment: Appointment) => void;
    onCreateAppointment?: () => void;
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
    CONFIRMED: 'bg-green-100 text-green-700 hover:bg-green-100',
    IN_PROGRESS: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100',
    COMPLETED: 'bg-gray-100 text-gray-700 hover:bg-gray-100',
    CANCELLED: 'bg-red-100 text-red-700 hover:bg-red-100',
    NO_SHOW: 'bg-red-100 text-red-700 hover:bg-red-100',
};

const statusIcons: Record<AppointmentStatus, string> = {
    SCHEDULED: '📅',
    CONFIRMED: '✅',
    IN_PROGRESS: '🔄',
    COMPLETED: '✔️',
    CANCELLED: '❌',
    NO_SHOW: '🚫',
};

export function TreatmentAppointmentsList({
    appointments,
    isLoading,
    onViewAppointment,
    onCreateAppointment,
}: TreatmentAppointmentsListProps) {
    if (isLoading) {
        return (
            <Card className="border-0 shadow-sm">
                <CardHeader className="border-b bg-gray-50/50">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <CalendarIcon className="h-5 w-5 text-primary-600" />
                            <CardTitle>Citas del tratamiento</CardTitle>
                            <Skeleton className="h-5 w-16" />
                        </div>
                        <Skeleton className="h-9 w-32" />
                    </div>
                </CardHeader>
                <CardContent className="pt-6">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="flex items-center gap-4 py-3 border-b border-gray-100 last:border-0">
                            <Skeleton className="h-4 w-24" />
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
            <Card className="border-0 shadow-sm">
                <CardHeader className="border-b bg-gray-50/50">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <CalendarIcon className="h-5 w-5 text-primary-600" />
                            <CardTitle>Citas del tratamiento</CardTitle>
                            <Badge variant="outline">0 citas</Badge>
                        </div>
                        {onCreateAppointment && (
                            <Button onClick={onCreateAppointment} className="gap-2 rounded-lg" size="sm">
                                <CalendarPlus className="h-4 w-4" />
                                Agendar Cita
                            </Button>
                            
                        )}
                    </div>
                </CardHeader>
                <CardContent className="py-12 text-center text-gray-500">
                    <CalendarIcon className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                    <p className="text-lg font-medium text-gray-600">Sin citas programadas</p>
                    <p className="text-sm">Este tratamiento no tiene citas asociadas</p>
                    {onCreateAppointment && (
                        <Button onClick={onCreateAppointment} className="mt-4 gap-2" variant="outline">
                            <CalendarPlus className="h-4 w-4" />
                            Agendar primera cita
                        </Button>
                    )}
                </CardContent>
            </Card>
        );
    }

    // Ordenar citas por fecha (más recientes primero)
    const sortedAppointments = [...appointments].sort(
        (a, b) => new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime()
    );

    return (
        <Card className="border-0 shadow-sm">
            <CardHeader className="border-b bg-gray-50/50">
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                        <CalendarIcon className="h-5 w-5 text-primary-600" />
                        <CardTitle>Citas del tratamiento</CardTitle>
                        <Badge variant="outline">
                            {appointments.length} {appointments.length === 1 ? 'cita' : 'citas'}
                        </Badge>
                    </div>
                    {onCreateAppointment && (
                        <Button onClick={onCreateAppointment} className="gap-2" size="sm">
                            <CalendarPlus className="h-4 w-4" />
                            Agendar Cita
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent className="pt-6">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Fecha</TableHead>
                                <TableHead>Hora</TableHead>
                                <TableHead>Doctor</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sortedAppointments.map((appointment) => {
                                const appointmentDate = new Date(appointment.appointmentDate);
                                const isPast = appointmentDate < new Date() && appointment.status !== 'COMPLETED' && appointment.status !== 'CANCELLED';

                                return (
                                    <TableRow key={appointment.id} className={cn(
                                        "hover:bg-gray-50 transition-colors",
                                        isPast && "bg-gray-50/50"
                                    )}>
                                        <TableCell>
                                            <span className="font-medium">
                                                {format(appointmentDate, "dd/MM/yyyy", { locale: es })}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            {format(appointmentDate, "HH:mm")}
                                            <span className="text-xs text-gray-400 ml-1">
                                                ({appointment.duration} min)
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            {appointment.doctor?.name || 'No asignado'}
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={statusColors[appointment.status]}>
                                                <span className="mr-1">{statusIcons[appointment.status]}</span>
                                                {statusLabels[appointment.status]}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {onViewAppointment && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => onViewAppointment(appointment)}
                                                    className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 h-8 w-8"
                                                    title="Ver detalle"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}