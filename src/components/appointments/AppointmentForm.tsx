import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandInput, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { useCreateAppointment, useUpdateAppointment } from '@/hooks/useAppointments';
import { usePatients } from '@/hooks/usePatients';
import { useStaff } from '@/hooks/useDoctors';
import { useTreatments } from '@/hooks/useTreatments';
import { Appointment, CreateAppointmentDto, UpdateAppointmentDto } from '@/types/appointment';
import { CalendarIcon, User, Stethoscope, Clock, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Patient } from '@/types/patient';

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
    const [patientSearchTerm, setPatientSearchTerm] = useState('');
    const { data: patientsData, isLoading: patientsLoading } = usePatients({
        search: patientSearchTerm || undefined,
        limit: 20,
    });
    const { data: staffData } = useStaff();
    const { data: treatments } = useTreatments();

    const isEditing = !!appointmentToEdit;
    const patients = patientsData?.data || [];
    const staff = staffData?.data || [];

    const [popoverPatientOpen, setPopoverPatientOpen] = useState(false);
    const [popoverDoctorOpen, setPopoverDoctorOpen] = useState(false);
    const [doctorSearchTerm, setDoctorSearchTerm] = useState('');

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

    const selectedPatientId = watch('patientId');
    const selectedPatient = patients.find((p: Patient) => p.id === selectedPatientId);

    const selectedDoctorId = watch('doctorId');
    const selectedDoctor = staff.find((d: any) => d.id === selectedDoctorId);

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
            setPatientSearchTerm('');
            setDoctorSearchTerm('');
        }
    }, [open, reset, defaultDate, defaultDoctorId]);

    const handleSelectPatient = (patientId: number) => {
        setValue('patientId', patientId);
        setPopoverPatientOpen(false);
        setPatientSearchTerm('');
    };

    const handleSelectDoctor = (doctorId: number) => {
        setValue('doctorId', doctorId);
        setPopoverDoctorOpen(false);
        setDoctorSearchTerm('');
    };

    const onSubmit = async (data: AppointmentFormData) => {
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
                    {/* Selección de paciente */}
                    <div className="space-y-2">
                        <Label>Paciente *</Label>
                        <Popover open={popoverPatientOpen} onOpenChange={setPopoverPatientOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    className={cn(
                                        "w-full justify-between",
                                        !selectedPatientId && "text-muted-foreground",
                                        errors.patientId && "border-red-500"
                                    )}
                                >
                                    {selectedPatientId && selectedPatient ? (
                                        <div className="flex items-center gap-2">
                                            <User className="h-4 w-4" />
                                            <span>{selectedPatient.fullName}</span>
                                            <span className="text-xs text-gray-400">#{selectedPatient.medicalRecordNum}</span>
                                        </div>
                                    ) : (
                                        "Buscar paciente..."
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent
                                className="p-0 w-[400px] max-w-[90vw]"
                                align="start"
                                style={{ maxHeight: '300px', overflowY: 'auto' }}
                                onWheel={(e) => e.stopPropagation()}
                            >
                                <Command className="max-h-[300px] overflow-y-auto">
                                    <CommandInput
                                        placeholder="Buscar paciente..."
                                        value={patientSearchTerm}
                                        onValueChange={(value) => setPatientSearchTerm(value)}
                                        className="h-10 !border-0 !ring-0 !outline-none focus:!ring-0 focus:!outline-none focus-visible:!ring-0 focus-visible:!outline-none"
                                    />
                                    <CommandList className="py-2 max-h-[200px] overflow-y-auto">
                                        {patientsLoading ? (
                                            <div className="px-3 py-2 text-sm text-gray-500">Cargando...</div>
                                        ) : (
                                            <>
                                                <CommandEmpty>No se encontraron pacientes</CommandEmpty>
                                                <CommandGroup>
                                                    {patients.map((patient: Patient) => (
                                                        <CommandItem
                                                            key={patient.id}
                                                            onSelect={() => handleSelectPatient(patient.id)}
                                                            className="flex items-center gap-2 cursor-pointer"
                                                        >
                                                            <User className="h-4 w-4 text-gray-400" />
                                                            <span>{patient.fullName}</span>
                                                            <span className="text-xs text-gray-400">#{patient.medicalRecordNum}</span>
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </>
                                        )}
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                        {errors.patientId && (
                            <p className="text-sm text-red-500">{errors.patientId.message}</p>
                        )}
                    </div>

                    {/* Selección de doctor - Búsqueda local */}
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                            <Stethoscope className="h-4 w-4" />
                            Doctor
                            <span className="text-red-500">*</span>
                        </Label>
                        <Popover open={popoverDoctorOpen} onOpenChange={setPopoverDoctorOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    className={cn(
                                        "w-full justify-between",
                                        !selectedDoctorId && "text-muted-foreground",
                                        errors.doctorId && "border-red-500"
                                    )}
                                >
                                    {selectedDoctorId && selectedDoctor ? (
                                        <div className="flex items-center gap-2">
                                            <Stethoscope className="h-4 w-4" />
                                            <span>{selectedDoctor.name}</span>
                                            <span className="text-xs text-gray-400">
                                                {selectedDoctor.role === 'DOCTOR' ? '👨‍⚕️' : '👩‍💼'}
                                            </span>
                                        </div>
                                    ) : (
                                        "Buscar doctor..."
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent
                                className="p-0 w-[400px] max-w-[90vw]"
                                align="start"
                                style={{ maxHeight: '300px', overflowY: 'auto' }}
                                onWheel={(e) => e.stopPropagation()}
                            >
                                <Command className="max-h-[300px] overflow-y-auto">
                                    <CommandInput
                                        placeholder="Buscar doctor..."
                                        value={doctorSearchTerm}
                                        onValueChange={setDoctorSearchTerm}
                                        className="h-10 !border-0 !ring-0 !outline-none focus:!ring-0 focus:!outline-none focus-visible:!ring-0 focus-visible:!outline-none"
                                    />
                                    <CommandList className="py-2 max-h-[200px] overflow-y-auto">
                                        <CommandEmpty>No se encontraron doctores</CommandEmpty>
                                        <CommandGroup>
                                            {staff.map((user: any) => (
                                                <CommandItem
                                                    key={user.id}
                                                    onSelect={() => handleSelectDoctor(user.id)}
                                                    className="flex items-center gap-2 cursor-pointer"
                                                >
                                                    <Stethoscope className="h-4 w-4 text-gray-400" />
                                                    <span>{user.name}</span>
                                                    <span className="text-xs text-gray-400">
                                                        {user.role === 'DOCTOR' ? '👨‍⚕️ Doctor' : '👩‍💼 Recepcionista'}
                                                    </span>
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                        {errors.doctorId && (
                            <p className="text-sm text-red-500">{errors.doctorId.message}</p>
                        )}
                    </div>

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
                        {/* Hora - Slider */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label className="flex items-center gap-2">
                                    <Clock className="h-4 w-4" />
                                    Hora
                                    <span className="text-red-500">*</span>
                                </Label>
                                <span className="text-sm font-medium text-gray-700">
                                    {watch('appointmentTime') || '09:00'}
                                </span>
                            </div>
                            <input
                                type="range"
                                min="8"
                                max="20"
                                step="0.25"
                                defaultValue="9"
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-500"
                                onChange={(e) => {
                                    const hour = parseFloat(e.target.value);
                                    const hours = Math.floor(hour);
                                    const minutes = (hour - hours) * 60;
                                    const time = `${hours.toString().padStart(2, '0')}:${Math.round(minutes).toString().padStart(2, '0')}`;
                                    setValue('appointmentTime', time);
                                }}
                            />
                            <div className="flex justify-between text-xs text-gray-400">
                                <span>08:00</span>
                                <span>14:00</span>
                                <span>20:00</span>
                            </div>
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
                            placeholder="Ej: Dolor en la muela, limpieza dental, revisión..."
                            rows={2}
                            className={errors.reason ? 'border-red-500' : ''}
                        />
                        {errors.reason && (
                            <p className="text-sm text-red-500">{errors.reason.message}</p>
                        )}
                    </div>

                    {/* Tratamiento y Notas */}
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