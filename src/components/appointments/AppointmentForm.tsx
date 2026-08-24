import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useCreateAppointment, useUpdateAppointment } from '@/hooks/useAppointments';
import { usePatients } from '@/hooks/usePatients';
import { useDoctors } from '@/hooks/useDoctors';
import { useTreatments } from '@/hooks/useTreatments';
import { Appointment, CreateAppointmentDto, UpdateAppointmentDto } from '@/types/appointment';
import { toast } from 'sonner';
import { CalendarIcon, User, Stethoscope, Clock, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const appointmentSchema = z.object({
    patientId: z.number().min(1, 'Selecciona un paciente'),
    doctorId: z.number().min(1, 'Selecciona un doctor'),
    appointmentDate: z.string().min(1, 'Selecciona una fecha'),
    appointmentTime: z.string().min(1, 'Selecciona una hora'),
    duration: z.number().min(15, 'Mínimo 15 minutos').max(120, 'Máximo 120 minutos'),
    reason: z.string().min(3, 'El motivo es requerido'),
    notes: z.string().optional(),
    treatmentId: z.number().optional(),
});

type AppointmentFormData = z.infer<typeof appointmentSchema>;

interface AppointmentFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    appointmentToEdit?: Appointment | null;
    onSuccess: () => void;
    defaultDate?: string;
    defaultDoctorId?: number;
}

// ✅ Generar horas disponibles (de 8:00 a 20:00 en intervalos de 15 minutos)
const generateTimeSlots = () => {
    const slots: string[] = [];
    for (let hour = 8; hour < 20; hour++) {
        for (let minute = 0; minute < 60; minute += 15) {
            const hourStr = hour.toString().padStart(2, '0');
            const minuteStr = minute.toString().padStart(2, '0');
            slots.push(`${hourStr}:${minuteStr}`);
        }
    }
    return slots;
};

const TIME_SLOTS = generateTimeSlots();

export function AppointmentForm({
    open,
    onOpenChange,
    appointmentToEdit,
    onSuccess,
    defaultDate,
    defaultDoctorId,
}: AppointmentFormProps) {
    const createAppointment = useCreateAppointment();
    const updateAppointment = useUpdateAppointment();
    const { data: patientsData } = usePatients({ page: 1, limit: 100 });
    const { data: doctors } = useDoctors();
    const { data: treatments } = useTreatments();

    const isEditing = !!appointmentToEdit;
    const patients = patientsData?.data || [];

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors, isSubmitting },
        reset,
    } = useForm<AppointmentFormData>({
        resolver: zodResolver(appointmentSchema),
        defaultValues: {
            patientId: appointmentToEdit?.patientId,
            doctorId: appointmentToEdit?.doctorId || defaultDoctorId,
            appointmentDate: appointmentToEdit?.appointmentDate
                ? new Date(appointmentToEdit.appointmentDate).toISOString().split('T')[0]
                : defaultDate || new Date().toISOString().split('T')[0],
            appointmentTime: appointmentToEdit?.appointmentDate
                ? new Date(appointmentToEdit.appointmentDate).toTimeString().slice(0, 5)
                : '09:00',
            duration: appointmentToEdit?.duration || 30,
            reason: appointmentToEdit?.reason || '',
            notes: appointmentToEdit?.notes || '',
            treatmentId: appointmentToEdit?.treatmentId || undefined,
        },
    });

    useEffect(() => {
        if (appointmentToEdit) {
            setValue('patientId', appointmentToEdit.patientId);
            setValue('doctorId', appointmentToEdit.doctorId);
            setValue('appointmentDate', new Date(appointmentToEdit.appointmentDate).toISOString().split('T')[0]);
            setValue('appointmentTime', new Date(appointmentToEdit.appointmentDate).toTimeString().slice(0, 5));
            setValue('duration', appointmentToEdit.duration);
            setValue('reason', appointmentToEdit.reason);
            setValue('notes', appointmentToEdit.notes || '');
            setValue('treatmentId', appointmentToEdit.treatmentId || undefined);
        }
    }, [appointmentToEdit, setValue]);

    useEffect(() => {
        if (!open) {
            reset({
                patientId: undefined,
                doctorId: defaultDoctorId,
                appointmentDate: defaultDate || new Date().toISOString().split('T')[0],
                appointmentTime: '09:00',
                duration: 30,
                reason: '',
                notes: '',
                treatmentId: undefined,
            });
        }
    }, [open, reset, defaultDate, defaultDoctorId]);

    const onSubmit = async (data: AppointmentFormData) => {
        try {
              console.log('📤 Datos a enviar:', {
            patientId: data.patientId,
            doctorId: data.doctorId, // ✅ Verificar qué doctorId se envía
            appointmentDate: data.appointmentDate,
            duration: data.duration,
            reason: data.reason,
        });
            // ✅ Combinar fecha y hora
            const appointmentDateTime = new Date(`${data.appointmentDate}T${data.appointmentTime}:00`);
            const isoString = appointmentDateTime.toISOString();

            if (isEditing && appointmentToEdit) {
                const updateData: UpdateAppointmentDto = {
                    patientId: data.patientId,
                    doctorId: data.doctorId,
                    appointmentDate: isoString,
                    duration: data.duration,
                    reason: data.reason,
                    notes: data.notes,
                    treatmentId: data.treatmentId,
                };
                await updateAppointment.mutateAsync({
                    id: appointmentToEdit.id,
                    data: updateData,
                });
            } else {
                const createData: CreateAppointmentDto = {
                    patientId: data.patientId,
                    doctorId: data.doctorId,
                    appointmentDate: isoString,
                    duration: data.duration,
                    reason: data.reason,
                    notes: data.notes,
                    treatmentId: data.treatmentId,
                };
                await createAppointment.mutateAsync(createData);
            }

            reset();
            onSuccess();
        } catch (error) {
            console.error('Error al guardar cita:', error);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <CalendarIcon className="h-5 w-5 text-primary-600" />
                        {isEditing ? 'Editar Cita' : 'Nueva Cita'}
                    </DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? 'Modifica los detalles de la cita programada.'
                            : 'Programa una nueva cita para un paciente.'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {/* Fila 1: Paciente y Doctor */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="patientId" className="flex items-center gap-2">
                                <User className="h-4 w-4" />
                                Paciente
                                <span className="text-red-500">*</span>
                            </Label>
                            <Select
                                onValueChange={(value) => setValue('patientId', parseInt(value))}
                                value={watch('patientId')?.toString() || ''}
                            >
                                <SelectTrigger className={errors.patientId ? 'border-red-500' : ''}>
                                    <SelectValue placeholder="Buscar paciente..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {patients.map((patient) => (
                                        <SelectItem key={patient.id} value={patient.id.toString()}>
                                            {patient.fullName}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.patientId && (
                                <p className="text-sm text-red-500">{errors.patientId.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="doctorId" className="flex items-center gap-2">
                                <Stethoscope className="h-4 w-4" />
                                Doctor
                                <span className="text-red-500">*</span>
                            </Label>
                            <Select
                                onValueChange={(value) => setValue('doctorId', parseInt(value))}
                                value={watch('doctorId')?.toString() || ''}
                            >
                                <SelectTrigger className={errors.doctorId ? 'border-red-500' : ''}>
                                    <SelectValue placeholder="Seleccionar doctor..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {doctors?.map((doctor: any) => (
                                        <SelectItem key={doctor.id} value={doctor.id.toString()}>
                                            {doctor.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.doctorId && (
                                <p className="text-sm text-red-500">{errors.doctorId.message}</p>
                            )}
                        </div>
                    </div>

                    {/* Fila 2: Fecha y Hora */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="appointmentDate" className="flex items-center gap-2">
                                <CalendarIcon className="h-4 w-4" />
                                Fecha
                                <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="appointmentDate"
                                type="date"
                                {...register('appointmentDate')}
                                min={new Date().toISOString().split('T')[0]}
                                className={errors.appointmentDate ? 'border-red-500' : ''}
                            />
                            {errors.appointmentDate && (
                                <p className="text-sm text-red-500">{errors.appointmentDate.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="appointmentTime" className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                Hora
                                <span className="text-red-500">*</span>
                            </Label>
                            <Select
                                onValueChange={(value) => setValue('appointmentTime', value)}
                                value={watch('appointmentTime') || '09:00'}
                            >
                                <SelectTrigger className={errors.appointmentTime ? 'border-red-500' : ''}>
                                    <SelectValue placeholder="Seleccionar hora..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {TIME_SLOTS.map((time) => (
                                        <SelectItem key={time} value={time}>
                                            {time}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.appointmentTime && (
                                <p className="text-sm text-red-500">{errors.appointmentTime.message}</p>
                            )}
                        </div>
                    </div>

                    {/* Fila 3: Duración */}
                    <div className="space-y-2">
                        <Label htmlFor="duration" className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            Duración (minutos)
                            <span className="text-red-500">*</span>
                        </Label>
                        <div className="flex gap-4 flex-wrap">
                            {[15, 30, 45, 60, 90, 120].map((mins) => (
                                <Button
                                    key={mins}
                                    type="button"
                                    variant={watch('duration') === mins ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setValue('duration', mins)}
                                    className="min-w-[60px]"
                                >
                                    {mins} min
                                </Button>
                            ))}
                        </div>
                        <Input
                            id="duration"
                            type="number"
                            {...register('duration', { valueAsNumber: true })}
                            min={15}
                            max={120}
                            step={15}
                            className={errors.duration ? 'border-red-500' : ''}
                            placeholder="O ingresa minutos manualmente"
                        />
                        {errors.duration && (
                            <p className="text-sm text-red-500">{errors.duration.message}</p>
                        )}
                    </div>

                    {/* Fila 4: Motivo */}
                    <div className="space-y-2">
                        <Label htmlFor="reason" className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Motivo de la consulta
                            <span className="text-red-500">*</span>
                        </Label>
                        <Textarea
                            id="reason"
                            {...register('reason')}
                            placeholder="Ej: Dolor en la muela, limpieza dental, revisión..."
                            rows={2}
                            className={errors.reason ? 'border-red-500' : ''}
                        />
                        {errors.reason && (
                            <p className="text-sm text-red-500">{errors.reason.message}</p>
                        )}
                    </div>

                    {/* Fila 5: Tratamiento y Notas */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="treatmentId">Tratamiento asociado</Label>
                            <Select
                                onValueChange={(value) => {
                                    if (value === 'none') {
                                        setValue('treatmentId', undefined);
                                    } else {
                                        setValue('treatmentId', parseInt(value));
                                    }
                                }}
                                value={watch('treatmentId')?.toString() || 'none'}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Sin tratamiento" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Sin tratamiento</SelectItem>
                                    {treatments?.map((treatment) => (
                                        <SelectItem key={treatment.id} value={treatment.id.toString()}>
                                            {treatment.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="notes">Notas adicionales</Label>
                            <Textarea
                                id="notes"
                                {...register('notes')}
                                placeholder="Información adicional sobre la cita..."
                                rows={2}
                            />
                        </div>
                    </div>

                    {/* Botones */}
                    <div className="flex justify-end gap-2 pt-4 border-t">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="gap-2"
                        >
                            {isSubmitting ? 'Guardando...' : (isEditing ? 'Actualizar Cita' : 'Crear Cita')}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}