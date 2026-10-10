import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel,
    AlertDialogContent, AlertDialogDescription, AlertDialogFooter,  AlertDialogHeader, 
    AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger,
    SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { useCreateAppointment, useUpdateAppointment } from '@/hooks/useAppointments';
import { useStaff } from '@/hooks/useDoctors';
import { CreateAppointmentDto, UpdateAppointmentDto, Appointment } from '@/types/appointment';
import { CalendarIcon, Stethoscope, Clock, FileText, CalendarDays,
    CheckCircle2, AlertCircle, Loader2, Ban, AlertTriangle, X, Pencil, History,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { parseApiError } from '@/lib/apiError';

const appointmentSchema = z.object({
    doctorId: z
        .number({
            error: (issue) =>
                issue.input === undefined
                    ? 'Selecciona un doctor'
                    : 'Debe ser un número válido',
        })
        .min(1, 'Selecciona un doctor'),
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
    appointmentToEdit?: Appointment | null;
}

const QUICK_TIMES = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'];

const parseLocalDate = (dateStr?: string): Date | undefined => {
    if (!dateStr) return undefined;
    const parts = dateStr.split('-').map(Number);
    if (parts.length !== 3 || parts.some(isNaN)) return undefined;
    const [y, m, d] = parts;
    return new Date(y, m - 1, d);
};

const getTodayLocalString = () => format(new Date(), 'yyyy-MM-dd');

const roleLabels: Record<string, string> = {
    DOCTOR: 'Odontólogo',
    ADMIN: 'Administrador',
    ASSISTANT: 'Asistente',
    RECEPTIONIST: 'Recepcionista',
    OWNER: 'Propietario',
};

export function AppointmentFromTreatment({
    open,
    onOpenChange,
    patientId,
    treatmentId,
    treatmentName,
    sessions = [],
    onSuccess,
    defaultDate,
    appointmentToEdit,
}: AppointmentFromTreatmentProps) {
    const isEditing = !!appointmentToEdit;

    const createAppointment = useCreateAppointment({ skipErrorToast: true });
    const updateAppointment = useUpdateAppointment({ skipErrorToast: true });
    const { data: staffData, isLoading: staffLoading } = useStaff();
    const staff = staffData?.data || [];

    const [selectedSessionId, setSelectedSessionId] = useState<number | undefined>(undefined);
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(() => {
        if (isEditing && appointmentToEdit) {
            return new Date(appointmentToEdit.appointmentDate);
        }
        return parseLocalDate(defaultDate) || new Date();
    });

    const [showRetroactiveDialog, setShowRetroactiveDialog] = useState(false);
    const [pendingFormData, setPendingFormData] = useState<AppointmentFormData | null>(null);
    const [availabilityError, setAvailabilityError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors, isSubmitting },
        reset,
    } = useForm<AppointmentFormData>({
        resolver: zodResolver(appointmentSchema) as any,
        defaultValues: {
            doctorId: undefined,
            appointmentDate: defaultDate || getTodayLocalString(),
            appointmentTime: '09:00',
            duration: 30,
            reason: `Cita para ${treatmentName}`,
            notes: '',
            sessionId: undefined,
        },
    });

    const doctorIdValue = watch('doctorId');

    useEffect(() => {
        if (!open) return;

        if (isEditing && appointmentToEdit) {
            const dt = new Date(appointmentToEdit.appointmentDate);
            reset({
                doctorId: appointmentToEdit.doctorId ?? appointmentToEdit.doctor?.id,
                appointmentDate: format(dt, 'yyyy-MM-dd'),
                appointmentTime: format(dt, 'HH:mm'),
                duration: appointmentToEdit.duration || 30,
                reason: appointmentToEdit.reason || '',
                notes: appointmentToEdit.notes || '',
                sessionId: undefined,
            });
            setSelectedDate(dt);
            setSelectedSessionId(undefined);
            setAvailabilityError(null);
        } else {
            const resetDateString = defaultDate || getTodayLocalString();
            reset({
                doctorId: undefined,
                appointmentDate: resetDateString,
                appointmentTime: '09:00',
                duration: 30,
                reason: `Cita para ${treatmentName}`,
                notes: '',
                sessionId: undefined,
            });
            setSelectedDate(parseLocalDate(resetDateString) || new Date());
            setSelectedSessionId(undefined);
            setAvailabilityError(null);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, appointmentToEdit?.id]);

    useEffect(() => {
        if (selectedDate) {
            setValue('appointmentDate', format(selectedDate, 'yyyy-MM-dd'));
        }
    }, [selectedDate, setValue]);

    useEffect(() => {
        setAvailabilityError(null);
    }, [watch('appointmentTime'), watch('doctorId'), watch('appointmentDate')]);

    /* ──────────────────────────────────────────────────────────
       SUBMIT CORE: crea o actualiza, con flag de retroactiva
       ────────────────────────────────────────────────────────── */
    const submitAppointment = async (data: AppointmentFormData, isRetroactive: boolean) => {
        try {
            const appointmentDateTime = new Date(
                `${data.appointmentDate}T${data.appointmentTime}:00`
            );
            const isoString = appointmentDateTime.toISOString();

            if (isEditing && appointmentToEdit) {
                const updateData: UpdateAppointmentDto = {
                    doctorId: data.doctorId,
                    appointmentDate: isoString,
                    duration: data.duration,
                    reason: data.reason,
                    notes: data.notes,
                };
                await updateAppointment.mutateAsync({
                    id: appointmentToEdit.id,
                    data: updateData,
                });
                toast.success('Cita actualizada correctamente');
            } else {
                const createData: CreateAppointmentDto = {
                    patientId,
                    doctorId: data.doctorId,
                    appointmentDate: isoString,
                    duration: data.duration,
                    reason: data.reason,
                    notes: data.notes,
                    treatmentId,
                    allowPastDate: isRetroactive,
                };
                await createAppointment.mutateAsync(createData);
                toast.success(
                    isRetroactive
                        ? 'Cita retroactiva registrada correctamente'
                        : 'Cita creada correctamente'
                );
            }

            reset();
            onSuccess();
        } catch (error) {
            const parsed = parseApiError(error);

            // ─── 1. Error de disponibilidad → SOLO banner inline (sin toast) ───
            if (
                parsed.status === 400 &&
                parsed.message.toLowerCase().includes('disponible')
            ) {
                setAvailabilityError(parsed.message);
                setTimeout(() => {
                    document.getElementById('appointmentTime')?.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center',
                    });
                }, 100);
                return;
            }

            // ─── 2. Otros errores de negocio → toast warning ───
            if (parsed.isBusinessError) {
                toast.warning(parsed.title || 'No se pudo guardar la cita', {
                    description: parsed.message,
                    duration: 6000,
                });
            } else {
                // ─── 3. Errores técnicos (500, red, 403) → toast error ───
                toast.error(parsed.title || 'Error', {
                    description: parsed.message,
                    duration: 5000,
                });
            }

            if (import.meta.env.DEV && parsed.status >= 500) {
                console.error('[AppointmentFromTreatment] Error 5xx:', error);
            }
        }
    };

    /* ──────────────────────────────────────────────────────────
       HANDLER DEL FORM: detecta retroactiva antes de enviar
       ────────────────────────────────────────────────────────── */
    const onSubmit = async (data: AppointmentFormData) => {
        // ⭐ Solo en modo crear: si la fecha es pasada, pedir confirmación
        if (!isEditing) {
            const selectedDateTime = new Date(
                `${data.appointmentDate}T${data.appointmentTime}:00`
            );

            if (selectedDateTime < new Date()) {
                setPendingFormData(data);
                setShowRetroactiveDialog(true);
                return;
            }
        }

        await submitAppointment(data, false);
    };

    /* ──────────────────────────────────────────────────────────
       CONFIRMAR RETROACTIVA
       ────────────────────────────────────────────────────────── */
    const handleConfirmRetroactive = async () => {
        if (!pendingFormData) return;
        const formData = pendingFormData;
        setShowRetroactiveDialog(false);
        setPendingFormData(null);
        await submitAppointment(formData, true);
    };

    const handleCancelRetroactive = () => {
        setShowRetroactiveDialog(false);
        setPendingFormData(null);
    };

    const todayString = getTodayLocalString();

    const selectedSession = selectedSessionId
        ? sessions.find((s) => s.id === selectedSessionId)
        : null;

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="w-full max-w-[95vw] sm:max-w-lg md:max-w-2xl lg:max-w-4xl max-h-[90vh] overflow-y-auto overflow-x-hidden p-0 gap-0">
                    <div className="bg-gradient-to-r from-primary-50 to-white border-b px-4 sm:px-6 py-4 rounded-t-2xl">
                        <DialogHeader>
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="p-2 bg-primary-100 rounded-xl shrink-0">
                                        {isEditing ? (
                                            <Pencil className="h-5 w-5 text-primary-600" />
                                        ) : (
                                            <CalendarIcon className="h-5 w-5 text-primary-600" />
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <DialogTitle className="text-lg sm:text-xl font-bold text-gray-900">
                                            {isEditing ? 'Editar Cita' : 'Agendar Cita'}
                                        </DialogTitle>
                                        <DialogDescription className="text-xs sm:text-sm text-gray-500">
                                            {isEditing
                                                ? `Modificá los datos de la cita para ${treatmentName}`
                                                : `Programar una cita para ${treatmentName}`}
                                            {!isEditing && selectedSession &&
                                                ` - Sesión #${selectedSession.sessionNumber}`}
                                        </DialogDescription>
                                    </div>
                                </div>
                                <Badge
                                    variant="outline"
                                    className={cn(
                                        'text-xs hidden sm:flex shrink-0',
                                        isEditing
                                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                                            : 'bg-blue-50 text-blue-700 border-blue-200'
                                    )}
                                >
                                    {isEditing ? 'Edición' : 'Nueva cita'}
                                </Badge>
                            </div>
                        </DialogHeader>
                    </div>

                    <div className="px-4 sm:px-6 py-4 sm:py-6">
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 sm:space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* SELECT DOCTOR */}
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                        <Stethoscope className="h-4 w-4 text-gray-400" />
                                        <span>Doctor</span>
                                        <span className="text-red-500">*</span>
                                    </Label>
                                    <Select
                                        onValueChange={(value) => {
                                            setValue('doctorId', parseInt(value), {
                                                shouldValidate: true,
                                                shouldDirty: true,
                                            });
                                            setAvailabilityError(null);
                                        }}
                                        value={doctorIdValue ? String(doctorIdValue) : ''}
                                        disabled={staffLoading}
                                    >
                                        <SelectTrigger
                                            className={cn(
                                                'w-full h-10',
                                                errors.doctorId && 'border-red-500 focus-visible:ring-red-500'
                                            )}
                                        >
                                            <SelectValue placeholder="Seleccionar doctor..." />
                                        </SelectTrigger>
                                        <SelectContent
                                            side="bottom"
                                            position="popper"
                                            align="start"
                                            sideOffset={4}
                                            className="max-h-[280px] w-[var(--radix-select-trigger-width)]"
                                        >
                                            {staffLoading ? (
                                                <div className="px-3 py-4 text-sm text-gray-500 text-center">
                                                    <Loader2 className="h-4 w-4 animate-spin mx-auto mb-1" />
                                                    Cargando doctores...
                                                </div>
                                            ) : staff.length === 0 ? (
                                                <div className="px-3 py-4 text-sm text-gray-500 text-center">
                                                    No hay doctores disponibles
                                                </div>
                                            ) : (
                                                staff.map((user: any) => (
                                                    <SelectItem
                                                        key={user.id}
                                                        value={String(user.id)}
                                                        className="py-2 cursor-pointer"
                                                    >
                                                        <div className="flex items-center gap-2 min-w-0 w-full">
                                                            <span className="text-sm font-medium truncate">
                                                                {user.name}
                                                            </span>
                                                            <span className="text-[11px] text-gray-400 shrink-0">
                                                                · {roleLabels[user.role] || user.role}
                                                            </span>
                                                        </div>
                                                    </SelectItem>
                                                ))
                                            )}
                                        </SelectContent>
                                    </Select>
                                    {errors.doctorId && (
                                        <p className="text-sm text-red-500 flex items-center gap-1">
                                            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                                            {errors.doctorId.message}
                                        </p>
                                    )}
                                </div>

                                {/* SELECT SESIÓN — solo en modo crear */}
                                {!isEditing && (
                                    <>
                                        {sessions.length > 0 ? (
                                            <div className="space-y-2">
                                                <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                                    <CalendarDays className="h-4 w-4 text-gray-400" />
                                                    <span>Sesión asociada</span>
                                                    <span className="text-xs text-gray-400 font-normal">
                                                        (opcional)
                                                    </span>
                                                </Label>
                                                <Select
                                                    onValueChange={(value) => {
                                                        const id = value === 'none' ? undefined : parseInt(value);
                                                        setSelectedSessionId(id);
                                                        setValue('sessionId', id, { shouldDirty: true });
                                                    }}
                                                    value={selectedSessionId ? String(selectedSessionId) : 'none'}
                                                >
                                                    <SelectTrigger className="w-full h-10">
                                                        <SelectValue placeholder="Sin sesión">
                                                            {selectedSession ? (
                                                                <span className="truncate text-sm">
                                                                    Sesión #{selectedSession.sessionNumber}
                                                                </span>
                                                            ) : (
                                                                <span className="flex items-center gap-2 text-gray-500 text-sm">
                                                                    <Ban className="h-3.5 w-3.5 shrink-0" />
                                                                    Sin sesión
                                                                </span>
                                                            )}
                                                        </SelectValue>
                                                    </SelectTrigger>
                                                    <SelectContent
                                                        side="bottom"
                                                        position="popper"
                                                        align="start"
                                                        sideOffset={4}
                                                        className="max-h-[280px] w-[var(--radix-select-trigger-width)]"
                                                    >
                                                        <SelectItem value="none" className="py-2 cursor-pointer">
                                                            <div className="flex items-center gap-2 text-gray-600">
                                                                <Ban className="h-4 w-4 shrink-0" />
                                                                <span className="text-sm">Sin sesión</span>
                                                            </div>
                                                        </SelectItem>
                                                        {sessions.map((session) => (
                                                            <SelectItem
                                                                key={session.id}
                                                                value={String(session.id)}
                                                                className="py-2 cursor-pointer"
                                                            >
                                                                <div className="flex items-center gap-2">
                                                                    <Badge
                                                                        variant="outline"
                                                                        className="bg-primary-50 text-primary-700 border-primary-200 text-[10px] shrink-0"
                                                                    >
                                                                        #{session.sessionNumber}
                                                                    </Badge>
                                                                    <span className="text-sm">
                                                                        Sesión {session.sessionNumber}
                                                                    </span>
                                                                </div>
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                                    <CalendarDays className="h-4 w-4 text-gray-400" />
                                                    <span>Sesión asociada</span>
                                                </Label>
                                                <div className="flex items-center gap-2 px-3 h-10 border border-gray-200 bg-gray-50 rounded-md text-sm text-gray-500">
                                                    <Ban className="h-4 w-4 shrink-0" />
                                                    <span>No hay sesiones registradas</span>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>

                            {/* Separador */}
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-background px-2 text-muted-foreground">
                                        Fecha y horario
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                        <CalendarIcon className="h-4 w-4 text-gray-400" />
                                        <span>Fecha</span>
                                        <span className="text-red-500">*</span>
                                    </Label>

                                    <div className="hidden md:block">
                                        <Calendar
                                            mode="single"
                                            selected={selectedDate}
                                            onSelect={setSelectedDate}
                                            className="rounded-lg border shadow-sm w-auto max-w-[220px] mx-auto"
                                            captionLayout="dropdown"
                                            locale={es}
                                        />
                                        <Input type="hidden" {...register('appointmentDate')} />
                                    </div>

                                    <div className="md:hidden">
                                        <Input
                                            type="date"
                                            value={watch('appointmentDate') || todayString}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setValue('appointmentDate', val, { shouldValidate: true });
                                                const parsed = parseLocalDate(val);
                                                if (parsed) setSelectedDate(parsed);
                                            }}
                                            className={cn(
                                                'w-full',
                                                errors.appointmentDate &&
                                                'border-red-500 focus-visible:ring-red-500'
                                            )}
                                        />
                                    </div>

                                    {errors.appointmentDate && (
                                        <p className="text-sm text-red-500 flex items-center gap-1">
                                            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                                            {errors.appointmentDate.message}
                                        </p>
                                    )}
                                    {selectedDate && (
                                        <p className="text-xs text-green-600 flex items-center gap-1">
                                            <CheckCircle2 className="h-3 w-3 shrink-0" />
                                            {format(selectedDate, "EEEE d 'de' MMMM", { locale: es })}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                        <Clock className="h-4 w-4 text-gray-400" />
                                        <span>Hora</span>
                                        <span className="text-red-500">*</span>
                                    </Label>
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        {QUICK_TIMES.map((time) => (
                                            <Button
                                                key={time}
                                                type="button"
                                                variant={watch('appointmentTime') === time ? 'default' : 'outline'}
                                                size="sm"
                                                onClick={() =>
                                                    setValue('appointmentTime', time, { shouldValidate: true })
                                                }
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
                                        min="06:00"
                                        max="23:00"
                                        className={cn(
                                            'w-full',
                                            errors.appointmentTime &&
                                            'border-red-500 focus-visible:ring-red-500',
                                            availabilityError &&
                                            'border-amber-500 focus-visible:ring-amber-500'
                                        )}
                                    />
                                    {errors.appointmentTime && (
                                        <p className="text-sm text-red-500 flex items-center gap-1">
                                            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                                            {errors.appointmentTime.message}
                                        </p>
                                    )}

                                    {availabilityError && (
                                        <div className="flex items-start gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded-md mt-2">
                                            <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-medium text-amber-800">
                                                    Horario no disponible
                                                </p>
                                                <p className="text-xs text-amber-700 mt-0.5 break-words">
                                                    {availabilityError}
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setAvailabilityError(null)}
                                                className="text-amber-600 hover:text-amber-800 shrink-0"
                                                aria-label="Cerrar aviso"
                                            >
                                                <X className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Duración */}
                            <div className="space-y-2">
                                <Label htmlFor="duration" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                    <Clock className="h-4 w-4 text-gray-400" />
                                    <span>Duración (minutos)</span>
                                    <span className="text-red-500">*</span>
                                </Label>
                                <div className="flex gap-2 flex-wrap">
                                    {[15, 30, 45, 60, 90, 120].map((mins) => (
                                        <Button
                                            key={mins}
                                            type="button"
                                            variant={watch('duration') === mins ? 'default' : 'outline'}
                                            size="sm"
                                            onClick={() =>
                                                setValue('duration', mins, { shouldValidate: true })
                                            }
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
                                    onWheel={(e) => e.currentTarget.blur()}
                                    className={cn(
                                        'w-full',
                                        errors.duration && 'border-red-500 focus-visible:ring-red-500'
                                    )}
                                    placeholder="O ingresa minutos manualmente"
                                />
                                {errors.duration && (
                                    <p className="text-sm text-red-500 flex items-center gap-1">
                                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                                        {errors.duration.message}
                                    </p>
                                )}
                            </div>

                            {/* Motivo y Notas */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="reason" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                        <FileText className="h-4 w-4 text-gray-400" />
                                        <span>Motivo de la consulta</span>
                                        <span className="text-red-500">*</span>
                                    </Label>
                                    <Textarea
                                        id="reason"
                                        {...register('reason')}
                                        placeholder="Motivo de la cita..."
                                        rows={3}
                                        className={cn(
                                            'w-full resize-none',
                                            errors.reason && 'border-red-500 focus-visible:ring-red-500'
                                        )}
                                    />
                                    {errors.reason && (
                                        <p className="text-sm text-red-500 flex items-center gap-1">
                                            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                                            {errors.reason.message}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="notes" className="text-sm font-medium text-gray-700">
                                        Notas adicionales
                                    </Label>
                                    <Textarea
                                        id="notes"
                                        {...register('notes')}
                                        placeholder="Información adicional sobre la cita..."
                                        rows={3}
                                        className="w-full resize-none"
                                    />
                                </div>
                            </div>

                            {/* Botones — lado a lado en mobile y desktop */}
                            <div className="flex flex-row justify-end gap-3 pt-4 border-t">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => onOpenChange(false)}
                                    className="flex-1 sm:flex-initial min-w-0"
                                >
                                    <span className="truncate min-w-0">Cancelar</span>
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-1 sm:flex-initial min-w-0 gap-2 text-white shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-700 hover:to-green-800 shadow-emerald-200/50"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                                            <span className="truncate min-w-0">
                                                {isEditing ? 'Guardando...' : 'Creando...'}
                                            </span>
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 className="h-4 w-4 shrink-0" />
                                            <span className="truncate min-w-0">
                                                {isEditing ? 'Guardar Cambios' : 'Crear Cita'}
                                            </span>
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </div>
                </DialogContent>
            </Dialog>

            {/* ──────────────────────────────────────────────────────────
                DIÁLOGO: Confirmar creación de cita retroactiva
                ────────────────────────────────────────────────────────── */}
            <AlertDialog open={showRetroactiveDialog} onOpenChange={setShowRetroactiveDialog}>
                <AlertDialogContent className="w-[calc(100vw-2rem)] max-w-md">
                    <AlertDialogHeader>
                        <div className="flex items-start gap-3">
                            <div className="p-2 rounded-full bg-blue-100 shrink-0">
                                <History className="h-5 w-5 text-blue-600" />
                            </div>
                            <div className="min-w-0">
                                <AlertDialogTitle className="text-base sm:text-lg font-bold">
                                    Registrar cita en el pasado
                                </AlertDialogTitle>
                                <AlertDialogDescription className="text-xs sm:text-sm pt-1">
                                    Estás por registrar una cita con fecha pasada.
                                    Esta opción es para documentar atenciones ya realizadas
                                    (por ejemplo, pacientes que vinieron sin cita).
                                </AlertDialogDescription>
                            </div>
                        </div>
                    </AlertDialogHeader>

                    <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-xs text-blue-700">
                        <p>
                            <strong>Fecha:</strong> {pendingFormData?.appointmentDate}{' '}
                            a las {pendingFormData?.appointmentTime}
                        </p>
                        <p className="mt-1">
                            Quedará registrada como <strong>retroactiva</strong>.
                        </p>
                    </div>

                    <AlertDialogFooter className="!flex-row justify-end gap-2 !space-x-0 pt-2">
                        <AlertDialogCancel
                            onClick={handleCancelRetroactive}
                            className="flex-1 sm:flex-initial min-w-0"
                        >
                            Cancelar
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmRetroactive}
                            className="flex-1 sm:flex-initial min-w-0 bg-blue-600 hover:bg-blue-700 text-white gap-2"
                        >
                            <History className="h-4 w-4 shrink-0" />
                            <span className="truncate">Registrar retroactiva</span>
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}