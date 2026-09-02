import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useCreateAppointment } from '@/hooks/useAppointments';
import { useStaff } from '@/hooks/useDoctors';
import { CreateAppointmentDto } from '@/types/appointment';
import { CalendarIcon as CalendarLucide, Stethoscope, Clock, FileText,
    CalendarPlus,
    UserRound,
    Sparkles,
    CheckCircle2,
    AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { clinicalHistoryService } from '@/services/clinicalHistory.service';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { format, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';

const QUICK_TIMES = ['07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'];

const appointmentSchema = z.object({
    doctorId: z.number().min(1, 'Selecciona un doctor'),
    appointmentDate: z.string().min(1, 'Selecciona una fecha'),
    appointmentTime: z.string().min(1, 'Selecciona una hora'),
    duration: z.number().min(15, 'Mínimo 15 minutos').max(120, 'Máximo 120 minutos'),
    reason: z.string().min(3, 'El motivo es requerido'),
    notes: z.string().optional(),
    treatmentId: z.number().optional(),
});

type AppointmentFormData = z.infer<typeof appointmentSchema>;

interface AppointmentFromPatientProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    patientId: number;
    patientName: string;
    onSuccess: () => void;
    defaultDate?: string;
}

export function AppointmentFromPatient({
    open,
    onOpenChange,
    patientId,
    patientName,
    onSuccess,
    defaultDate,
}: AppointmentFromPatientProps) {
    const createAppointment = useCreateAppointment();
    const { data: staffData } = useStaff();
    const staff = staffData?.data || [];
    const [treatments, setTreatments] = useState<any[]>([]);
    const [isLoadingTreatments, setIsLoadingTreatments] = useState(false);
    const [showSummary, setShowSummary] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(
        defaultDate ? new Date(defaultDate) : new Date()
    );

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors, isSubmitting, isValid },
        reset,
        trigger,
    } = useForm<AppointmentFormData>({
        resolver: zodResolver(appointmentSchema),
        defaultValues: {
            doctorId: undefined,
            appointmentDate: defaultDate || new Date().toISOString().split('T')[0],
            appointmentTime: '09:00',
            duration: 30,
            reason: '',
            notes: '',
            treatmentId: undefined,
        },
        mode: 'onChange',
    });

    const selectedDoctorId = watch('doctorId');
    const selectedDoctor = staff.find((d: any) => d.id === selectedDoctorId);
    const selectedTime = watch('appointmentTime');
    const selectedDuration = watch('duration');
    const selectedTreatmentId = watch('treatmentId');
    const selectedTreatment = treatments.find((t: any) => t.id === selectedTreatmentId);

    useEffect(() => {
        if (selectedDate) {
            const dateStr = format(selectedDate, 'yyyy-MM-dd');
            setValue('appointmentDate', dateStr);
        }
    }, [selectedDate, setValue]);

    useEffect(() => {
        const fetchTreatments = async () => {
            if (patientId) {
                setIsLoadingTreatments(true);
                try {
                    const data = await clinicalHistoryService.getTreatmentsByPatient(patientId);
                    setTreatments(data || []);
                } catch (error) {
                    console.error('Error al cargar tratamientos:', error);
                } finally {
                    setIsLoadingTreatments(false);
                }
            }
        };

        if (open) {
            fetchTreatments();
            setShowSummary(false);
        }
    }, [patientId, open]);

    useEffect(() => {
        if (!open) {
            reset({
                doctorId: undefined,
                appointmentDate: defaultDate || new Date().toISOString().split('T')[0],
                appointmentTime: '09:00',
                duration: 30,
                reason: '',
                notes: '',
                treatmentId: undefined,
            });
            setShowSummary(false);
        }
    }, [open, reset, defaultDate]);

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
                treatmentId: data.treatmentId,
            };

            await createAppointment.mutateAsync(createData);

            toast.success('Cita creada correctamente', {
                description: `Cita programada para ${patientName} el ${new Date(isoString).toLocaleDateString()} a las ${data.appointmentTime}`,
            });
            reset();
            onSuccess();
        } catch (error) {
            console.error('Error al crear cita:', error);
        }
    };

    const handleShowSummary = async () => {
        const isValidForm = await trigger();
        if (isValidForm) {
            setShowSummary(true);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-full max-w-[90vw] md:max-w-[80vw] lg:max-w-4xl max-h-[90vh] overflow-y-auto p-0 gap-0">
                {/* Header */}
                <div className="bg-gradient-to-r from-primary-50 to-white border-b px-6 py-4 rounded-t-2xl">
                    <DialogHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary-100 rounded-xl">
                                    <CalendarPlus className="h-5 w-5 text-primary-600" />
                                </div>
                                <div>
                                    <DialogTitle className="text-xl font-bold text-gray-900">
                                        Agendar Cita
                                    </DialogTitle>
                                    <DialogDescription className="flex items-center gap-1 text-sm text-gray-500">
                                        <UserRound className="h-4 w-4" />
                                        Programar cita para: <span className="font-medium text-gray-700">{patientName}</span>
                                    </DialogDescription>
                                </div>
                            </div>
                            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200 hidden sm:flex">
                                <Sparkles className="h-3 w-3 mr-1" />
                                Nueva Cita
                            </Badge>
                        </div>
                    </DialogHeader>
                </div>

                {/* Contenido */}
                <div className="px-6 py-6">
                    {!showSummary ? (
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {/* Doctor */}
                                <div className="space-y-2 md:col-span-2">
                                    <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                        <Stethoscope className="h-4 w-4 text-gray-400" />
                                        Doctor
                                        <span className="text-red-500">*</span>
                                    </Label>
                                    <Select
                                        onValueChange={(value) => setValue('doctorId', parseInt(value))}
                                        value={watch('doctorId')?.toString() || ''}
                                    >
                                        <SelectTrigger className={cn(
                                            "w-full transition-all duration-200",
                                            errors.doctorId && "border-red-500 focus-visible:ring-red-500",
                                            watch('doctorId') && "border-green-300 bg-green-50/30"
                                        )}>
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
                                        <p className="text-sm text-red-500 flex items-center gap-1">
                                            <AlertCircle className="h-3.5 w-3.5" />
                                            {errors.doctorId.message}
                                        </p>
                                    )}
                                    {selectedDoctor && !errors.doctorId && (
                                        <p className="text-xs text-green-600 flex items-center gap-1">
                                            <CheckCircle2 className="h-3 w-3" />
                                            Doctor seleccionado: {selectedDoctor.name}
                                        </p>
                                    )}
                                </div>

                                {/* Fecha con calendario pequeño */}
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                        <CalendarLucide className="h-4 w-4 text-gray-400" />
                                        Fecha
                                        <span className="text-red-500">*</span>
                                    </Label>

                                    {/* Calendario en desktop  */}
                                    <div className="hidden md:block">
                                        <Calendar
                                            mode="single"
                                            selected={selectedDate}
                                            onSelect={setSelectedDate}
                                            className="rounded-lg border shadow-sm w-auto max-w-[220px] mx-auto"
                                            captionLayout="dropdown"
                                            locale={es}
                                            disabled={(date: Date) => date < startOfDay(new Date())}
                                        />
                                        <Input type="hidden" {...register('appointmentDate')} />
                                    </div>

                                    {/* Input en móvil */}
                                    <div className="md:hidden">
                                        <Input
                                            type="date"
                                            {...register('appointmentDate')}
                                            min={new Date().toISOString().split('T')[0]}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                if (val) {
                                                    setSelectedDate(new Date(val));
                                                }
                                                register('appointmentDate').onChange(e);
                                            }}
                                            className={cn(
                                                "w-full",
                                                errors.appointmentDate && "border-red-500 focus-visible:ring-red-500"
                                            )}
                                        />
                                    </div>

                                    {errors.appointmentDate && (
                                        <p className="text-sm text-red-500 flex items-center gap-1">
                                            <AlertCircle className="h-3.5 w-3.5" />
                                            {errors.appointmentDate.message}
                                        </p>
                                    )}
                                    {selectedDate && (
                                        <p className="text-xs text-green-600 flex items-center gap-1">
                                            <CheckCircle2 className="h-3 w-3" />
                                            {format(selectedDate, "EEEE d 'de' MMMM", { locale: es })}
                                        </p>
                                    )}
                                </div>

                                {/* Hora */}
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                        <Clock className="h-4 w-4 text-gray-400" />
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
                                                className={cn(
                                                    "min-w-[65px] text-sm",
                                                    watch('appointmentTime') === time && "ring-2 ring-primary-200 ring-offset-1"
                                                )}
                                            >
                                                {time}
                                            </Button>
                                        ))}
                                    </div>
                                    <Input
                                        type="time"
                                        {...register('appointmentTime')}
                                        step="900"
                                        min="08:00"
                                        max="20:00"
                                        className={cn(
                                            "w-full",
                                            errors.appointmentTime && "border-red-500 focus-visible:ring-red-500"
                                        )}
                                    />
                                    {errors.appointmentTime && (
                                        <p className="text-sm text-red-500 flex items-center gap-1">
                                            <AlertCircle className="h-3.5 w-3.5" />
                                            {errors.appointmentTime.message}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Duración */}
                            <div className="space-y-2">
                                <Label htmlFor="duration" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                    <Clock className="h-4 w-4 text-gray-400" />
                                    Duración (minutos)
                                    <span className="text-red-500">*</span>
                                </Label>
                                <div className="flex flex-wrap gap-3">
                                    {[15, 30, 45, 60, 90, 120].map((mins) => (
                                        <Button
                                            key={mins}
                                            type="button"
                                            variant={watch('duration') === mins ? 'default' : 'outline'}
                                            size="sm"
                                            onClick={() => setValue('duration', mins)}
                                            className={cn(
                                                "min-w-[60px]",
                                                watch('duration') === mins && "ring-2 ring-primary-200 ring-offset-1"
                                            )}
                                        >
                                            {mins} min
                                        </Button>
                                    ))}
                                </div>
                                <Input
                                    type="number"
                                    {...register('duration', { valueAsNumber: true })}
                                    min={15}
                                    max={120}
                                    step={15}
                                    className={cn(
                                        "w-full mt-2",
                                        errors.duration && "border-red-500 focus-visible:ring-red-500"
                                    )}
                                    placeholder="O ingresa minutos manualmente"
                                />
                                {errors.duration && (
                                    <p className="text-sm text-red-500 flex items-center gap-1">
                                        <AlertCircle className="h-3.5 w-3.5" />
                                        {errors.duration.message}
                                    </p>
                                )}
                            </div>

                            {/* Tratamiento asociado */}
                            <div className="space-y-2">
                                <Label htmlFor="treatmentId" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                    <FileText className="h-4 w-4 text-gray-400" />
                                    Tratamiento asociado
                                </Label>
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
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder={isLoadingTreatments ? "Cargando tratamientos..." : "Sin tratamiento"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Sin tratamiento</SelectItem>
                                        {treatments.map((treatment) => (
                                            <SelectItem key={treatment.id} value={treatment.id.toString()}>
                                                {treatment.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Motivo */}
                            <div className="space-y-2">
                                <Label htmlFor="reason" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                    <FileText className="h-4 w-4 text-gray-400" />
                                    Motivo de la consulta
                                    <span className="text-red-500">*</span>
                                </Label>
                                <Textarea
                                    {...register('reason')}
                                    placeholder="Motivo de la cita..."
                                    rows={2}
                                    className={cn(
                                        "w-full resize-none",
                                        errors.reason && "border-red-500 focus-visible:ring-red-500"
                                    )}
                                />
                                {errors.reason && (
                                    <p className="text-sm text-red-500 flex items-center gap-1">
                                        <AlertCircle className="h-3.5 w-3.5" />
                                        {errors.reason.message}
                                    </p>
                                )}
                            </div>

                            {/* Notas */}
                            <div className="space-y-2">
                                <Label htmlFor="notes" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                    <FileText className="h-4 w-4 text-gray-400" />
                                    Notas adicionales
                                </Label>
                                <Textarea
                                    {...register('notes')}
                                    placeholder="Información adicional sobre la cita..."
                                    rows={2}
                                    className="w-full resize-none"
                                />
                            </div>

                            {/* Botones */}
                            <div className="flex justify-end gap-3 pt-4 border-t">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => onOpenChange(false)}
                                    className="px-6"
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    type="button"
                                    onClick={handleShowSummary}
                                    disabled={isSubmitting || !isValid}
                                    className="px-8 gap-2"
                                >
                                    <span>Ver Resumen</span>
                                    <span className="text-sm">→</span>
                                </Button>
                            </div>
                        </form>
                    ) : (
                        // Resumen
                        <div className="space-y-6">
                            <div className="bg-gradient-to-br from-primary-50 to-blue-50 rounded-xl p-6 border border-primary-100">
                                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                    <Sparkles className="h-5 w-5 text-primary-600" />
                                    Resumen de la cita
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">Confirma los datos antes de crear la cita</p>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                    <div className="bg-white/60 rounded-lg p-3">
                                        <p className="text-xs text-gray-500">Paciente</p>
                                        <p className="font-medium text-gray-900">{patientName}</p>
                                    </div>
                                    <div className="bg-white/60 rounded-lg p-3">
                                        <p className="text-xs text-gray-500">Doctor</p>
                                        <p className="font-medium text-gray-900">{selectedDoctor?.name || 'No seleccionado'}</p>
                                    </div>
                                    <div className="bg-white/60 rounded-lg p-3">
                                        <p className="text-xs text-gray-500">Fecha y Hora</p>
                                        <p className="font-medium text-gray-900">
                                            {selectedDate && format(selectedDate, "EEEE d 'de' MMMM 'de' yyyy", { locale: es })}
                                            {selectedTime && ` a las ${selectedTime}`}
                                        </p>
                                    </div>
                                    <div className="bg-white/60 rounded-lg p-3">
                                        <p className="text-xs text-gray-500">Duración</p>
                                        <p className="font-medium text-gray-900">{selectedDuration} minutos</p>
                                    </div>
                                    {selectedTreatment && (
                                        <div className="bg-white/60 rounded-lg p-3 md:col-span-2">
                                            <p className="text-xs text-gray-500">Tratamiento asociado</p>
                                            <p className="font-medium text-gray-900">{selectedTreatment.name}</p>
                                        </div>
                                    )}
                                    <div className="bg-white/60 rounded-lg p-3 md:col-span-2">
                                        <p className="text-xs text-gray-500">Motivo</p>
                                        <p className="font-medium text-gray-900">{watch('reason')}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setShowSummary(false)}
                                    className="px-6"
                                >
                                    ← Volver
                                </Button>
                                <Button
                                    type="button"
                                    onClick={handleSubmit(onSubmit)}
                                    disabled={isSubmitting}
                                    className="px-8 gap-2 bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-700 hover:to-green-800 text-white shadow-lg shadow-emerald-200/50 hover:shadow-emerald-300/50 transition-all duration-200"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <span className="animate-spin">⏳</span>
                                            Creando...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 className="h-4 w-4" />
                                            Confirmar Cita
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}