import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Appointment } from '@/types/appointment';
import { StatusBadge } from './StatusBadge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { User, Stethoscope, Clock, FileText, CalendarIcon, Phone, Mail, Edit, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AppointmentDetailProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    appointment: Appointment;
    onEdit: () => void;
    onRefresh: () => void;
}

export function AppointmentDetail({
    open,
    onOpenChange,
    appointment,
    onEdit,
    onRefresh,
}: AppointmentDetailProps) {
    const appointmentDate = new Date(appointment.appointmentDate);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <DialogTitle className="flex items-center gap-2">
                            <span>Detalle de Cita</span>
                            <StatusBadge status={appointment.status} />
                        </DialogTitle>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={onEdit}>
                                <Edit className="h-4 w-4 mr-2" />
                                Editar
                            </Button>
                        </div>
                    </div>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Información de la cita */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 text-sm">
                                <CalendarIcon className="h-4 w-4 text-gray-400" />
                                <div>
                                    <p className="font-medium text-gray-900">
                                        {format(appointmentDate, "EEEE d 'de' MMMM 'de' yyyy", { locale: es })}
                                    </p>
                                    <p className="text-gray-500">
                                        {format(appointmentDate, 'HH:mm')} • {appointment.duration} minutos
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <User className="h-4 w-4 text-gray-400" />
                                <div>
                                    <p className="font-medium text-gray-900">
                                        {appointment.patient?.fullName || 'No disponible'}
                                    </p>
                                    <div className="flex gap-3 text-gray-500">
                                        {appointment.patient?.phoneNumber && (
                                            <span className="flex items-center gap-1">
                                                <Phone className="h-3 w-3" />
                                                {appointment.patient.phoneNumber}
                                            </span>
                                        )}
                                        {appointment.patient?.email && (
                                            <span className="flex items-center gap-1">
                                                <Mail className="h-3 w-3" />
                                                {appointment.patient.email}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center gap-3 text-sm">
                                <Stethoscope className="h-4 w-4 text-gray-400" />
                                <div>
                                    <p className="font-medium text-gray-900">
                                        {appointment.doctor?.name || 'No disponible'}
                                    </p>
                                    {appointment.doctor?.specialty && (
                                        <p className="text-gray-500">{appointment.doctor.specialty}</p>
                                    )}
                                </div>
                            </div>
                            {appointment.treatment && (
                                <div className="flex items-center gap-3 text-sm">
                                    <FileText className="h-4 w-4 text-gray-400" />
                                    <div>
                                        <p className="font-medium text-gray-900">{appointment.treatment.name}</p>
                                        <p className="text-gray-500">{appointment.treatment.type}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Motivo */}
                    <div className="space-y-2">
                        <h4 className="text-sm font-medium text-gray-900">Motivo de la consulta</h4>
                        <p className="text-sm text-gray-600 p-3 bg-gray-50 rounded-lg">
                            {appointment.reason}
                        </p>
                    </div>

                    {/* Notas */}
                    {appointment.notes && (
                        <div className="space-y-2">
                            <h4 className="text-sm font-medium text-gray-900">Notas adicionales</h4>
                            <p className="text-sm text-gray-600 p-3 bg-gray-50 rounded-lg">
                                {appointment.notes}
                            </p>
                        </div>
                    )}

                    {/* Información adicional */}
                    <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded-lg text-xs text-gray-500">
                        <div>
                            <span className="font-medium text-gray-700">Creado:</span>
                            <span className="ml-1">
                                {format(new Date(appointment.createdAt), "dd/MM/yyyy HH:mm", { locale: es })}
                            </span>
                        </div>
                        {appointment.cancelledAt && (
                            <div>
                                <span className="font-medium text-gray-700">Cancelado:</span>
                                <span className="ml-1">
                                    {format(new Date(appointment.cancelledAt), "dd/MM/yyyy HH:mm", { locale: es })}
                                </span>
                            </div>
                        )}
                        {appointment.cancellationReason && (
                            <div className="col-span-2">
                                <span className="font-medium text-gray-700">Motivo de cancelación:</span>
                                <span className="ml-1">{appointment.cancellationReason}</span>
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}