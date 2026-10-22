import { useState, useEffect } from 'react';
import { useForm, FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel,
    AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
    AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandInput } from '@/components/ui/command';
import { useCreateAppointment, useUpdateAppointment } from '@/hooks/useAppointments';
import { usePatients } from '@/hooks/usePatients';
import { useStaff } from '@/hooks/useDoctors';
import { CreateAppointmentDto, UpdateAppointmentDto, Appointment } from '@/types/appointment';
import {
    CalendarIcon as CalendarLucide, Stethoscope, Clock, FileText,
    CalendarPlus, UserRound, Sparkles, CheckCircle2, AlertCircle, Loader2,
    History, User, Pencil, Lock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { clinicalHistoryService } from '@/services/clinicalHistory.service';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Patient } from '@/types/patient';

const QUICK_TIMES = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'];

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

const FIELD_ID_MAP: Record<string, string> = {
    patientId: 'appointment-patient-container',
    doctorId: 'appointment-doctorId',
    appointmentDate: 'appointment-date-container',
    appointmentTime: 'appointment-time',
    duration: 'appointment-duration',
    reason: 'appointment-reason',
};

const FIELD_ORDER: (keyof AppointmentFormData)[] = [
    'patientId',
    'doctorId',
    'appointmentDate',
    'appointmentTime',
    'duration',
    'reason',
];

const parseLocalDate = (dateStr: string): Date => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
};

interface AppointmentFromPatientProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    patientId?: number;
    patientName?: string;
    onSuccess: () => void;
    defaultDate?: string;
    appointmentToEdit?: Appointment | null;
}

const roleLabels: Record<string, string> = {
    DOCTOR: 'Odontólogo',
    ADMIN: 'Administrador',
    ASSISTANT: 'Asistente',
    RECEPTIONIST: 'Recepcionista',
    OWNER: 'Propietario',
};

export function AppointmentFromPatient({
    open,
    onOpenChange,
    patientId,
    patientName,
    onSuccess,
    defaultDate,
    appointmentToEdit,
}: AppointmentFromPatientProps) {
    const isEditing = !!appointmentToEdit;

    const editPatientId = appointmentToEdit?.patientId || appointmentToEdit?.patient?.id;

    const createAppointment = useCreateAppointment();
    const updateAppointment = useUpdateAppointment();
    const { data: staffData, isLoading: staffLoading } = useStaff();
    const staff = staffData?.data || [];

    const [patientSearchTerm, setPatientSearchTerm] = useState('');
    const { data: patientsData, isLoading: patientsLoading } = usePatients({
        search: patientSearchTerm || undefined,
        limit: 20,
    });
    const patients = patientsData?.data || [];
    const [popoverPatientOpen, setPopoverPatientOpen] = useState(false);

    const [treatments, setTreatments] = useState<any[]>([]);
    const [isLoadingTreatments, setIsLoadingTreatments] = useState(false);
    const [showSummary, setShowSummary] = useState(false);

    const [selectedDate, setSelectedDate] = useState<Date | undefined>(() => {
        if (isEditing && appointmentToEdit) return new Date(appointmentToEdit.appointmentDate);
        return defaultDate ? parseLocalDate(defaultDate) : new Date();
    });

    const [showRetroactiveDialog, setShowRetroactiveDialog] = useState(false);
    const [pendingData, setPendingData] = useState<AppointmentFormData | null>(null);

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
            patientId: editPatientId || patientId || undefined,
            doctorId: appointmentToEdit?.doctorId || undefined,
            appointmentDate: appointmentToEdit
                ? format(new Date(appointmentToEdit.appointmentDate), 'yyyy-MM-dd')
                : defaultDate || format(new Date(), 'yyyy-MM-dd'),
            appointmentTime: appointmentToEdit
                ? format(new Date(appointmentToEdit.appointmentDate), 'HH:mm')
                : '09:00',
            duration: appointmentToEdit?.duration || 30,
            reason: appointmentToEdit?.reason || '',
            notes: appointmentToEdit?.notes || '',
            treatmentId: appointmentToEdit?.treatmentId || undefined,
        },
        mode: 'onChange',
    });

    const selectedPatientId = watch('patientId');

    const currentPatientName = patientName
        || appointmentToEdit?.patient?.fullName
        || patients.find((p: Patient) => p.id === selectedPatientId)?.fullName
        || 'Paciente';

    const currentMedicalRecordNum = (appointmentToEdit?.patient as any)?.medicalRecordNum
        || (patients.find((p: Patient) => p.id === selectedPatientId) as any)?.medicalRecordNum;

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
            const idToFetch = editPatientId || patientId || selectedPatientId;
            if (idToFetch) {
                setIsLoadingTreatments(true);
                try {
                    const data = await clinicalHistoryService.getTreatmentsByPatient(idToFetch);
                    setTreatments(data || []);
                } catch (error) {
                    console.error('Error al cargar tratamientos:', error);
                } finally {
                    setIsLoadingTreatments(false);
                }
            } else {
                setTreatments([]);
                setValue('treatmentId', undefined);
            }
        };

        if (open) {
            fetchTreatments();
            setShowSummary(false);
        }
    }, [editPatientId, patientId, selectedPatientId, open, setValue]);

    useEffect(() => {
        if (open) {
            if (isEditing && appointmentToEdit) {
                const dt = new Date(appointmentToEdit.appointmentDate);
                reset({
                    patientId: editPatientId,
                    doctorId: appointmentToEdit.doctorId,
                    appointmentDate: format(dt, 'yyyy-MM-dd'),
                    appointmentTime: format(dt, 'HH:mm'),
                    duration: appointmentToEdit.duration || 30,
                    reason: appointmentToEdit.reason || '',
                    notes: appointmentToEdit.notes || '',
                    treatmentId: appointmentToEdit.treatmentId || undefined,
                });
                setSelectedDate(dt);
            } else {
                reset({
                    patientId: patientId || undefined,
                    doctorId: undefined,
                    appointmentDate: defaultDate || format(new Date(), 'yyyy-MM-dd'),
                    appointmentTime: '09:00',
                    duration: 30,
                    reason: '',
                    notes: '',
                    treatmentId: undefined,
                });
                setSelectedDate(defaultDate ? parseLocalDate(defaultDate) : new Date());
            }
            setShowSummary(false);
            setShowRetroactiveDialog(false);
            setPendingData(null);
            setPatientSearchTerm('');
        }
    }, [open, appointmentToEdit?.id, patientId, defaultDate, reset, editPatientId, isEditing, appointmentToEdit]);

    const handleSelectPatient = (id: number) => {
        setValue('patientId', id, { shouldValidate: true, shouldDirty: true });
        setPopoverPatientOpen(false);
        setPatientSearchTerm('');
    };

    const processSubmit = async (data: AppointmentFormData, isRetroactive: boolean) => {
        try {
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
                toast.success('Cita actualizada correctamente');
            } else {
                const createData: CreateAppointmentDto = {
                    patientId: data.patientId,
                    doctorId: data.doctorId,
                    appointmentDate: isoString,
                    duration: data.duration,
                    reason: data.reason,
                    notes: data.notes,
                    treatmentId: data.treatmentId,
                    allowPastDate: isRetroactive,
                };
                await createAppointment.mutateAsync(createData);
                toast.success(
                    isRetroactive ? 'Cita retroactiva registrada correctamente' : 'Cita creada correctamente',
                    { description: `Cita programada para ${currentPatientName} el ${new Date(isoString).toLocaleDateString()} a las ${data.appointmentTime}` }
                );
            }

            reset();
            onSuccess();
        } catch (error) {
            console.error('Error al guardar cita:', error);
        }
    };

    const onSubmit = async (data: AppointmentFormData) => {
        if (!isEditing) {
            const selectedDateTime = new Date(`${data.appointmentDate}T${data.appointmentTime}:00`);
            if (selectedDateTime < new Date()) {
                setPendingData(data);
                setShowRetroactiveDialog(true);
                return;
            }
        }
        await processSubmit(data, false);
    };

    const onError = (formErrors: FieldErrors<AppointmentFormData>) => {
        const firstError = FIELD_ORDER.find((field) => formErrors[field]);
        if (!firstError) return;

        const elementId = FIELD_ID_MAP[firstError] || firstError;
        const el = document.getElementById(elementId);

        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            try { el.focus({ preventScroll: true }); } catch { /* noop */ }
            el.classList.add('ring-2', 'ring-red-500', 'ring-offset-2', 'transition-all', 'duration-300');
            setTimeout(() => el.classList.remove('ring-2', 'ring-red-500', 'ring-offset-2'), 2500);
        }

        toast.error('Completa los campos requeridos', {
            description: 'Revisa los campos marcados en rojo.',
            duration: 4000,
        });
    };

    const handleConfirmRetroactive = async () => {
        if (!pendingData) return;
        const formData = pendingData;
        setShowRetroactiveDialog(false);
        setPendingData(null);
        await processSubmit(formData, true);
    };

    const isSaving = isSubmitting || createAppointment.isPending || updateAppointment.isPending;

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="w-full max-w-[90vw] md:max-w-[80vw] lg:max-w-4xl max-h-[90vh] overflow-y-auto p-0 gap-0">
                    <div className="bg-gradient-to-r from-teal-50 to-white border-b px-4 sm:px-6 py-4 rounded-t-2xl">
                        <DialogHeader>
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="p-2 bg-teal-100 rounded-xl shrink-0">
                                        {isEditing ? <Pencil className="h-5 w-5 text-teal-600" /> : <CalendarPlus className="h-5 w-5 text-teal-600" />}
                                    </div>
                                    <div className="min-w-0">
                                        <DialogTitle className="text-lg sm:text-xl font-bold text-gray-900">
                                            {isEditing ? 'Editar Cita' : 'Agendar Cita'}
                                        </DialogTitle>
                                        {!isEditing && patientId && (
                                            <DialogDescription className="flex items-center gap-1 text-xs sm:text-sm text-gray-500">
                                                <UserRound className="h-4 w-4 shrink-0" />
                                                <span className="truncate">
                                                    Programar cita para:{' '}
                                                    <span className="font-medium text-gray-700">{patientName}</span>
                                                </span>
                                            </DialogDescription>
                                        )}
                                    </div>
                                </div>
                                <Badge variant="outline" className={cn(
                                    "text-xs hidden sm:flex shrink-0",
                                    isEditing ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-teal-50 text-teal-700 border-teal-200"
                                )}>
                                    {isEditing ? 'Edición' : <><Sparkles className="h-3 w-3 mr-1" /> Nueva Cita</>}
                                </Badge>
                            </div>
                        </DialogHeader>
                    </div>

                    <div className="px-6 py-6">
                        {!showSummary ? (
                            <form onSubmit={handleSubmit(onSubmit, onError)} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                                    {!patientId && (
                                        <div id="appointment-patient-container" className="space-y-2 md:col-span-2">
                                            <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                                <User className="h-4 w-4 text-gray-400" />
                                                Paciente
                                                <span className="text-red-500">*</span>
                                            </Label>
                                            <Popover open={popoverPatientOpen} onOpenChange={setPopoverPatientOpen}>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        role="combobox"
                                                        disabled={isEditing}
                                                        className={cn(
                                                            "w-full min-w-0 justify-between font-normal",
                                                            !selectedPatientId && "text-muted-foreground",
                                                            errors.patientId && "border-red-500 focus-visible:ring-red-500",
                                                            isEditing && "opacity-60 cursor-not-allowed bg-gray-50"
                                                        )}
                                                    >
                                                        {selectedPatientId ? (
                                                            <div className="flex items-center gap-2 min-w-0 flex-1">
                                                                <User className="h-4 w-4 shrink-0" />
                                                                <span className="truncate">{currentPatientName}</span>
                                                                {currentMedicalRecordNum && (
                                                                    <span className="text-xs text-gray-400 shrink-0">
                                                                        #{currentMedicalRecordNum}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <span className="truncate">Buscar paciente...</span>
                                                        )}
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="p-0 w-[400px] max-w-[90vw]" align="start">
                                                    <Command>
                                                        <CommandInput placeholder="Buscar paciente..." value={patientSearchTerm} onValueChange={setPatientSearchTerm} className="h-10 !border-0 !ring-0 !outline-none focus:!ring-0 focus:!outline-none focus-visible:!ring-0 focus-visible:!outline-none" />
                                                        <div className="py-2">
                                                            {patientsLoading ? (
                                                                <div className="px-3 py-2 text-sm text-gray-500">Cargando...</div>
                                                            ) : patients?.length === 0 ? (
                                                                <div className="px-3 py-2 text-sm text-gray-500">No se encontraron pacientes</div>
                                                            ) : (
                                                                patients?.map((patient: Patient) => (
                                                                    <div key={patient.id} className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gray-100 min-w-0" onClick={() => handleSelectPatient(patient.id)}>
                                                                        <User className="h-4 w-4 text-gray-400 shrink-0" />
                                                                        <span className="truncate">{patient.fullName}</span>
                                                                        <span className="text-xs text-gray-400 shrink-0">#{(patient as any)?.medicalRecordNum}</span>
                                                                    </div>
                                                                ))
                                                            )}
                                                        </div>
                                                    </Command>
                                                </PopoverContent>
                                            </Popover>
                                            {isEditing && (
                                                <p className="text-xs text-gray-500 flex items-center gap-1">
                                                    <Lock className="h-3 w-3" /> El paciente no se puede modificar.
                                                </p>
                                            )}
                                            {errors.patientId && (
                                                <p className="text-sm text-red-500 flex items-center gap-1">
                                                    <AlertCircle className="h-3.5 w-3.5" /> {errors.patientId.message}
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    <div className="space-y-2 md:col-span-2">
                                        <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                            <Stethoscope className="h-4 w-4 text-gray-400" />
                                            Doctor <span className="text-red-500">*</span>
                                        </Label>
                                        <Select
                                            onValueChange={(value) => setValue('doctorId', parseInt(value), { shouldValidate: true, shouldDirty: true })}
                                            value={watch('doctorId') ? String(watch('doctorId')) : ''}
                                            disabled={staffLoading}
                                        >
                                            <SelectTrigger id="appointment-doctorId" className={cn("w-full h-10", errors.doctorId && "border-red-500 focus-visible:ring-red-500")}>
                                                <SelectValue placeholder="Seleccionar doctor..." />
                                            </SelectTrigger>
                                            <SelectContent side="bottom" position="popper" align="start" className="max-h-[280px] w-[var(--radix-select-trigger-width)]">
                                                {staffLoading ? (
                                                    <div className="px-3 py-4 text-sm text-gray-500 text-center">
                                                        <Loader2 className="h-4 w-4 animate-spin mx-auto mb-1" /> Cargando doctores...
                                                    </div>
                                                ) : staff.map((user: any) => (
                                                    <SelectItem key={user.id} value={String(user.id)} className="py-2 cursor-pointer">
                                                        <div className="flex items-center gap-2 min-w-0 w-full">
                                                            <span className="text-sm font-medium truncate">{user.name}</span>
                                                            <span className="text-[11px] text-gray-400 shrink-0">· {roleLabels[user.role] || user.role}</span>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.doctorId && (
                                            <p className="text-sm text-red-500 flex items-center gap-1"><AlertCircle className="h-3.5 w-3.5" /> {errors.doctorId.message}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                            <CalendarLucide className="h-4 w-4 text-gray-400" /> Fecha <span className="text-red-500">*</span>
                                        </Label>
                                        <div id="appointment-date-container">
                                            <div className="hidden md:block">
                                                <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} className="rounded-lg border shadow-sm w-auto max-w-[220px] mx-auto" captionLayout="dropdown" locale={es} />
                                                <Input type="hidden" {...register('appointmentDate')} />
                                            </div>
                                            <div className="md:hidden">
                                                <Input type="date" {...register('appointmentDate')} onChange={(e) => { const val = e.target.value; if (val) setSelectedDate(new Date(val)); register('appointmentDate').onChange(e); }} className={cn("w-full", errors.appointmentDate && "border-red-500 focus-visible:ring-red-500")} />
                                            </div>
                                        </div>
                                        {errors.appointmentDate && (
                                            <p className="text-sm text-red-500 flex items-center gap-1"><AlertCircle className="h-3.5 w-3.5" /> {errors.appointmentDate.message}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                            <Clock className="h-4 w-4 text-gray-400" /> Hora <span className="text-red-500">*</span>
                                        </Label>
                                        <div className="flex flex-wrap gap-2 mb-2">
                                            {QUICK_TIMES.map((time) => (
                                                <Button key={time} type="button" variant={watch('appointmentTime') === time ? 'default' : 'outline'} size="sm" onClick={() => setValue('appointmentTime', time, { shouldValidate: true })} className={cn("min-w-[65px] text-sm", watch('appointmentTime') === time && "bg-teal-600 text-white")}>
                                                    {time}
                                                </Button>
                                            ))}
                                        </div>
                                        <Input id="appointment-time" type="time" {...register('appointmentTime')} step="900" className={cn("w-full", errors.appointmentTime && "border-red-500 focus-visible:ring-red-500")} />
                                        {errors.appointmentTime && (
                                            <p className="text-sm text-red-500 flex items-center gap-1"><AlertCircle className="h-3.5 w-3.5" /> {errors.appointmentTime.message}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="space-y-2">
                                        <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                            <Clock className="h-4 w-4 text-gray-400" /> Duración (min) <span className="text-red-500">*</span>
                                        </Label>
                                        <div className="flex flex-wrap gap-2">
                                            {[15, 30, 45, 60, 90, 120].map((mins) => (
                                                <Button key={mins} type="button" variant={watch('duration') === mins ? 'default' : 'outline'} size="sm" onClick={() => setValue('duration', mins, { shouldValidate: true })} className={cn("min-w-[60px]", watch('duration') === mins && "bg-teal-600 text-white")}>
                                                    {mins}
                                                </Button>
                                            ))}
                                        </div>
                                        <Input id="appointment-duration" type="number" {...register('duration', { valueAsNumber: true })} className="mt-2" />
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                            <FileText className="h-4 w-4 text-gray-400" /> Tratamiento (opcional)
                                        </Label>
                                        <Select onValueChange={(value) => setValue('treatmentId', value === 'none' ? undefined : parseInt(value))} value={watch('treatmentId')?.toString() || 'none'}>
                                            <SelectTrigger className="w-full h-10"><SelectValue placeholder="Sin tratamiento" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">Sin tratamiento</SelectItem>
                                                {isLoadingTreatments ? (
                                                    <div className="p-2 text-center text-sm text-gray-500">Cargando...</div>
                                                ) : treatments.map((t: any) => (
                                                    <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="space-y-2">
                                        <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                            <FileText className="h-4 w-4 text-gray-400" /> Motivo <span className="text-red-500">*</span>
                                        </Label>
                                        <Textarea id="appointment-reason" {...register('reason')} placeholder="Motivo de la cita..." rows={3} className={cn("resize-none", errors.reason && "border-red-500")} />
                                        {errors.reason && <p className="text-sm text-red-500">{errors.reason.message}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                            <FileText className="h-4 w-4 text-gray-400" /> Notas Adicionales
                                        </Label>
                                        <Textarea {...register('notes')} placeholder="Información extra..." rows={3} className="resize-none" />
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 pt-4 border-t">
                                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="px-6">Cancelar</Button>
                                    <Button type="button" onClick={handleSubmit(() => setShowSummary(true), onError)} disabled={isSaving} className="px-8 gap-2 bg-teal-600 hover:bg-teal-700 text-white">
                                        Ver Resumen <span className="text-sm">→</span>
                                    </Button>
                                </div>
                            </form>
                        ) : (
                            <div className="space-y-6">
                                <div className="bg-gradient-to-br from-teal-50 to-blue-50 rounded-xl p-6 border border-teal-100">
                                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                        <Sparkles className="h-5 w-5 text-teal-600" /> Resumen de la cita
                                    </h3>
                                    <p className="text-sm text-gray-500 mt-1">Confirma los datos antes de guardar</p>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                        <div className="bg-white/60 rounded-lg p-3">
                                            <p className="text-xs text-gray-500">Paciente</p>
                                            <p className="font-medium text-gray-900">{currentPatientName}</p>
                                        </div>
                                        <div className="bg-white/60 rounded-lg p-3">
                                            <p className="text-xs text-gray-500">Doctor</p>
                                            <p className="font-medium text-gray-900">{selectedDoctor?.name || 'No seleccionado'}</p>
                                        </div>
                                        <div className="bg-white/60 rounded-lg p-3">
                                            <p className="text-xs text-gray-500">Fecha y Hora</p>
                                            <p className="font-medium text-gray-900">
                                                {selectedDate && format(selectedDate, "EEEE d 'de' MMMM 'de' yyyy", { locale: es })} a las {selectedTime}
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
                                    <Button type="button" variant="outline" onClick={() => setShowSummary(false)} className="px-6">← Volver</Button>
                                    <Button type="button" onClick={handleSubmit(onSubmit)} disabled={isSaving} className="px-8 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
                                        {isSaving ? <><Loader2 className="h-4 w-4 animate-spin" /> Guardando...</> : <><CheckCircle2 className="h-4 w-4" /> {isEditing ? 'Actualizar' : 'Confirmar Cita'}</>}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            <AlertDialog open={showRetroactiveDialog} onOpenChange={setShowRetroactiveDialog}>
                <AlertDialogContent className="w-[calc(100vw-2rem)] max-w-md">
                    <AlertDialogHeader>
                        <div className="flex items-start gap-3">
                            <div className="p-2 rounded-full bg-blue-100 shrink-0"><History className="h-5 w-5 text-blue-600" /></div>
                            <div className="min-w-0">
                                <AlertDialogTitle className="text-base sm:text-lg font-bold">Registrar cita en el pasado</AlertDialogTitle>
                                <AlertDialogDescription className="text-xs sm:text-sm pt-1">Estás por registrar una cita con fecha pasada.</AlertDialogDescription>
                            </div>
                        </div>
                    </AlertDialogHeader>
                    <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-xs text-blue-700">
                        <p><strong>Fecha:</strong> {pendingData?.appointmentDate} a las {pendingData?.appointmentTime}</p>
                    </div>
                    <AlertDialogFooter className="!flex-row justify-end gap-2 !space-x-0 pt-2">
                        <AlertDialogCancel onClick={() => setShowRetroactiveDialog(false)} className="flex-1 sm:flex-initial">Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmRetroactive} className="flex-1 sm:flex-initial bg-blue-600 hover:bg-blue-700 text-white gap-2">
                            <History className="h-4 w-4 shrink-0" /> <span className="truncate">Registrar</span>
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}