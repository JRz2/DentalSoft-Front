import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createPatientSchema, CreatePatientInput } from '@/lib/validations/patient.schema';
import {
    normalizeName,
    normalizeEmail,
    normalizePhone,
    normalizeShortText,
    normalizeMultilineText,
} from '@/lib/normalize';
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
import { PatientImageUpload } from '@/components/shared/PatientImageUpload';
import { Loader2, CheckCircle2, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Patient } from '@/types/patient';

// ============================================================
// HELPERS
// ============================================================
const formatDateForInput = (dateFromBackend?: string): string => {
    if (!dateFromBackend) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateFromBackend)) return dateFromBackend;
    const date = new Date(dateFromBackend);
    if (isNaN(date.getTime())) return '';
    return date.toISOString().split('T')[0];
};

// ============================================================
// PROPS
// ============================================================
interface PatientFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (
        data: CreatePatientInput,
        files?: { photoFile?: File },
    ) => void;
    isLoading?: boolean;
    patient?: Patient | null;
    onPhotoUploaded?: () => void;
}

// ============================================================
// COMPONENT
// ============================================================
export function PatientForm({
    open,
    onOpenChange,
    onSubmit,
    isLoading,
    patient,
    onPhotoUploaded,
}: PatientFormProps) {
    const isEditing = !!patient;

    // Valores por defecto (creación o edición)
    const defaultValues: Partial<CreatePatientInput> = patient
        ? {
            fullName: patient.fullName,
            email: patient.email || '',
            phoneNumber: patient.phoneNumber || '',
            birthDate: formatDateForInput(patient.birthDate),
            address: patient.address || '',
            photoUrl: patient.photoUrl || '',
            dentalHistory: patient.dentalHistory || '',
            habits: patient.habits || '',
            medicalConditions: patient.medicalConditions || '',
        }
        : {
            fullName: '',
            email: '',
            phoneNumber: '',
            birthDate: '',
            address: '',
            photoUrl: '',
            dentalHistory: '',
            habits: '',
            medicalConditions: '',
        };

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        reset,
        formState: { errors },
    } = useForm<CreatePatientInput>({
        resolver: zodResolver(createPatientSchema),
        defaultValues,
    });

    const photoUrl = watch('photoUrl');
    const [photoFile, setPhotoFile] = useState<File | null>(null);

    useEffect(() => {
        if (open) {
            reset(defaultValues);
            setPhotoFile(null);
        }
    }, [open, patient?.id]);

    // ============================================================
    // HANDLERS
    // ============================================================
    const handlePhotoUpload = (url: string, file?: File) => {
        setValue('photoUrl', url);
        if (file) {
            setPhotoFile(file);
        }
    };

    const handlePhotoFileSelected = (file: File) => {
        setPhotoFile(file);
    };

    // Normaliza los datos y los envía al padre
    const handleFormSubmit = (data: CreatePatientInput) => {
        const normalized: CreatePatientInput = {
            ...data,
            fullName: normalizeName(data.fullName),
            email: data.email ? normalizeEmail(data.email) : undefined,
            phoneNumber: data.phoneNumber ? normalizePhone(data.phoneNumber) : undefined,
            address: normalizeShortText(data.address),
            dentalHistory: normalizeMultilineText(data.dentalHistory),
            habits: normalizeShortText(data.habits),
            medicalConditions: normalizeShortText(data.medicalConditions),
        };

        onSubmit(normalized, { photoFile: photoFile || undefined });
    };

    const handleCancel = () => {
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-full max-w-[90vw] md:max-w-[80vw] lg:max-w-4xl max-h-[90vh] overflow-y-auto p-0 gap-0">
                {/* Header con gradiente */}
                <div className="bg-gradient-to-r from-teal-50 to-white border-b px-4 md:px-6 py-4 rounded-t-2xl">
                    <DialogHeader>
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="p-2 bg-teal-100 rounded-xl shrink-0">
                                    <User className="h-5 w-5 text-teal-600" />
                                </div>
                                <div className="min-w-0">
                                    <DialogTitle className="text-lg md:text-xl font-bold text-gray-900">
                                        {isEditing ? 'Editar Paciente' : 'Nuevo Paciente'}
                                    </DialogTitle>
                                    <DialogDescription className="text-xs md:text-sm text-gray-500">
                                        {isEditing
                                            ? 'Modifica los datos del paciente'
                                            : 'Ingresa los datos del nuevo paciente'}
                                    </DialogDescription>
                                </div>
                            </div>
                            <Badge
                                variant="outline"
                                className="text-xs bg-teal-50 text-teal-700 border-teal-200 hidden sm:flex shrink-0"
                            >
                                {isEditing ? 'Edición' : 'Nuevo'}
                            </Badge>
                        </div>
                    </DialogHeader>
                </div>

                {/* Formulario con padding */}
                <div className="px-4 md:px-6 py-4 md:py-6">
                    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 md:space-y-5">
                        {/* Foto + Datos principales */}
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                            <div className="md:col-span-2 flex justify-center">
                                <PatientImageUpload
                                    currentImage={photoUrl}
                                    onImageUploaded={handlePhotoUpload}
                                    patientId={patient?.id}
                                    isNewPatient={!isEditing}
                                    onFileSelected={handlePhotoFileSelected}
                                    onPhotoUploaded={onPhotoUploaded}
                                    patientName={watch('fullName')}
                                />
                            </div>

                            <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="fullName">Nombre completo *</Label>
                                    <Input
                                        id="fullName"
                                        {...register('fullName')}
                                        placeholder="Juan Pérez"
                                        className={errors.fullName ? 'border-red-500' : ''}
                                    />
                                    {errors.fullName && (
                                        <p className="text-sm text-red-500">{errors.fullName.message}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email">
                                        Email
                                        <span className="text-xs text-gray-400 font-normal ml-1">(opcional)</span>
                                    </Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        {...register('email')}
                                        placeholder="juan@ejemplo.com"
                                        className={errors.email ? 'border-red-500' : ''}
                                    />
                                    {errors.email && (
                                        <p className="text-sm text-red-500">{errors.email.message}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="phoneNumber">
                                        Teléfono
                                        <span className="text-xs text-gray-400 font-normal ml-1">(opcional)</span>
                                    </Label>
                                    <Input
                                        id="phoneNumber"
                                        {...register('phoneNumber')}
                                        placeholder="+591 78945612"
                                        className={errors.phoneNumber ? 'border-red-500' : ''}
                                    />
                                    {errors.phoneNumber && (
                                        <p className="text-sm text-red-500">{errors.phoneNumber.message}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="birthDate">Fecha de nacimiento *</Label>
                                    <Input
                                        id="birthDate"
                                        type="date"
                                        {...register('birthDate')}
                                        className={errors.birthDate ? 'border-red-500' : ''}
                                    />
                                    {errors.birthDate && (
                                        <p className="text-sm text-red-500">{errors.birthDate.message}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Dirección */}
                        <div className="space-y-2">
                            <Label htmlFor="address">Dirección</Label>
                            <Input
                                id="address"
                                {...register('address')}
                                placeholder="Calle Principal #123"
                            />
                        </div>

                        {/* Historial dental */}
                        <div className="space-y-2">
                            <Label htmlFor="dentalHistory">Historial dental</Label>
                            <Textarea
                                id="dentalHistory"
                                {...register('dentalHistory')}
                                placeholder="Historial odontológico del paciente..."
                                rows={3}
                                className="resize-none"
                            />
                        </div>

                        {/* Hábitos + Condiciones médicas */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="habits">Hábitos</Label>
                                <Input
                                    id="habits"
                                    {...register('habits')}
                                    placeholder="Fumador, bruxismo, etc."
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="medicalConditions">Condiciones médicas</Label>
                                <Input
                                    id="medicalConditions"
                                    {...register('medicalConditions')}
                                    placeholder="Hipertensión, alergias, etc."
                                />
                            </div>
                        </div>

                        {/* Botones */}
                        <div className="flex flex-row justify-end gap-2 sm:gap-3 pt-4 border-t">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleCancel}
                                disabled={isLoading}
                                className="flex-1 sm:flex-none sm:px-6"
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="flex-1 sm:flex-none sm:px-8 gap-2 bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-700 hover:to-green-800 text-white shadow-lg shadow-emerald-200/50 hover:shadow-emerald-300/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Guardando...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="h-4 w-4" />
                                        {isEditing ? 'Actualizar' : 'Crear Paciente'}
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    );
}