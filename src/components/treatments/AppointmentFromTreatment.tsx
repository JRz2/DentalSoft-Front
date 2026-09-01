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
import { useCreateAppointment } from '@/hooks/useAppointments';
import { useStaff } from '@/hooks/useDoctors';
import { Appointment, CreateAppointmentDto } from '@/types/appointment';
import { CalendarIcon, Stethoscope, Clock, FileText, CalendarDays } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Generar horas disponibles (de 8:00 a 20:00 en intervalos de 15 minutos)
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

// Horas rápidas comunes
const QUICK_TIMES = ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00'];

const appointmentSchema = z.object({
    doctorId: z.number().min(1, 'Selecciona un doctor'),
    appointmentDate: z.string().min(1, 'Selecciona una fecha'),
    appointmentTime: z.string().min(1, 'Selecciona una hora'),
    duration: z.number().min(15, 'Mínimo 15 minutos').max(120, 'Máximo 120 minutos'),
    reason: z.string().min(3, 'El motivo es requerido'),
    notes: z.string().optional(),
    sessionId: z.number().optional(),
});

type AppointmentFormData = z.infer<typeof appointmentSchema>;

interface AppointmentFromTreatmentProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    patientId: number;
    treatmentId: number;
    treatmentName: string;
    sessions?: { id: number; sessionNumber: number }[];
    onSuccess: () => void;
    defaultDate?: string;
}

export function AppointmentFromTreatment({
    open,
    onOpenChange,
    patientId,
    treatmentId,
    treatmentName,
    sessions = [],
    onSuccess,
    defaultDate,
}: AppointmentFromTreatmentProps) {
    const createAppointment = useCreateAppointment();
    const { data: staffData } = useStaff();
    const staff = staffData?.data || [];

    const [selectedSessionId, setSelectedSessionId] = useState<number | undefined>(undefined);

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
            doctorId: undefined,
            appointmentDate: defaultDate || new Date().toISOString().split('T')[0],
            appointmentTime: '09:00',
            duration: 30,
            reason: `Cita para ${treatmentName}`,
            notes: '',
            sessionId: undefined,
        },
    });

    const selectedDoctorId = watch('doctorId');
    const selectedDoctor = staff.find((d: any) => d.id === selectedDoctorId);

    useEffect(() => {
        if (!open) {
            reset({
                doctorId: undefined,
                appointmentDate: defaultDate || new Date().toISOString().split('T')[0],
                appointmentTime: '09:00',
                duration: 30,
                reason: `Cita para ${treatmentName}`,
                notes: '',
                sessionId: undefined,
            });
            setSelectedSessionId(undefined);
        }
    }, [open, reset, defaultDate, treatmentName]);

    const onSubmit = async (data: AppointmentFormData) => {
        try {
            const appointmentDateTime = new Date(`${data.appointmentDate}T${data.appointmentTime}:00`);
            const isoString = appointmentDateTime.toISOString();

            const createData: CreateAppointmentDto = {
                patientId: patientId,
                doctorId: data.doctorId,
                appointmentDate: isoString,
                duration: data.duration,
                reason: data.reason,
                notes: data.notes,
                treatmentId: treatmentId, // ✅ Vincular al tratamiento
            };

            await createAppointment.mutateAsync(createData);

            toast.success('Cita creada correctamente');
            reset();
            onSuccess();
        } catch (error) {
            console.error('Error al crear cita:', error);
            toast.error('Error al crear la cita');
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <CalendarIcon className="h-5 w-5 text-primary-600" />
                        Agendar Cita
                    </DialogTitle>
                    <DialogDescription>
                        Programar una cita para {treatmentName}
                        {selectedSessionId && ` - Sesión #${sessions.find(s => s.id === selectedSessionId)?.sessionNumber}`}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {/* Doctor */}
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2">
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
                                {staff.map((user: any) => (
                                    <SelectItem key={user.id} value={user.id.toString()}>
                                        {user.name} {user.role === 'DOCTOR' ? '👨‍⚕️' : '👩‍💼'}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.doctorId && (
                            <p className="text-sm text-red-500">{errors.doctorId.message}</p>
                        )}
                    </div>

                    {/* Sesión (opcional) */}
                    {sessions.length > 0 && (
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                                <CalendarDays className="h-4 w-4" />
                                Sesión asociada (opcional)
                            </Label>
                            <Select
                                onValueChange={(value) => {
                                    const id = value === 'none' ? undefined : parseInt(value);
                                    setSelectedSessionId(id);
                                    setValue('sessionId', id);
                                }}
                                value={selectedSessionId?.toString() || 'none'}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Sin sesión" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Sin sesión</SelectItem>
                                    {sessions.map((session) => (
                                        <SelectItem key={session.id} value={session.id.toString()}>
                                            Sesión #{session.sessionNumber}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {/* Fecha y Hora */}
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
                            <Label className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                Hora
                                <span className="text-red-500">*</span>
                            </Label>
                            <div className="flex flex-wrap gap-2 mb-2">
                                {QUICK_TIMES.map((time) => (
                                    <Button
                                        key={time}
                                        type="button"
                                        variant={watch('appointmentTime') === time ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => setValue('appointmentTime', time)}
                                        className="min-w-[65px]"
                                    >
                                        {time}
                                    </Button>
                                ))}
                            </div>
                            <Input
                                id="appointmentTime"
                                type="time"
                                {...register('appointmentTime')}
                                step="900"
                                min="08:00"
                                max="20:00"
                                className={cn(
                                    "w-full",
                                    errors.appointmentTime ? 'border-red-500' : ''
                                )}
                            />
                            {errors.appointmentTime && (
                                <p className="text-sm text-red-500">{errors.appointmentTime.message}</p>
                            )}
                        </div>
                    </div>

                    {/* Duración */}
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

                    {/* Motivo */}
                    <div className="space-y-2">
                        <Label htmlFor="reason" className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Motivo de la consulta
                            <span className="text-red-500">*</span>
                        </Label>
                        <Textarea
                            id="reason"
                            {...register('reason')}
                            placeholder="Motivo de la cita..."
                            rows={2}
                            className={errors.reason ? 'border-red-500' : ''}
                        />
                        {errors.reason && (
                            <p className="text-sm text-red-500">{errors.reason.message}</p>
                        )}
                    </div>

                    {/* Notas */}
                    <div className="space-y-2">
                        <Label htmlFor="notes">Notas adicionales</Label>
                        <Textarea
                            id="notes"
                            {...register('notes')}
                            placeholder="Información adicional sobre la cita..."
                            rows={2}
                        />
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
                            {isSubmitting ? 'Creando...' : 'Crear Cita'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}