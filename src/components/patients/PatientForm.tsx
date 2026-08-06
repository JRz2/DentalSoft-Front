import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createPatientSchema, CreatePatientInput } from '@/lib/validations/patient.schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PatientImageUpload } from '@/components/shared/PatientImageUpload';
import { useState } from 'react';

interface PatientFormProps {
    defaultValues?: Partial<CreatePatientInput>;
    onSubmit: (data: CreatePatientInput, files?: { photoFile?: File }) => void;
    isLoading?: boolean;
    submitLabel?: string;
    patientId?: number;
    isEditing?: boolean;
    onPhotoUploaded?: () => void;
}

export function PatientForm({
    defaultValues,
    onSubmit,
    isLoading,
    submitLabel = 'Guardar',
    patientId,
    isEditing = false,
    onPhotoUploaded,
}: PatientFormProps) {
    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<CreatePatientInput>({
        resolver: zodResolver(createPatientSchema),
        defaultValues: defaultValues || {
            fullName: '',
            email: '',
            phoneNumber: '',
            birthDate: '',
            address: '',
            dentalHistory: '',
            habits: '',
            medicalConditions: '',
            photoUrl: '',
        },
    });

    const photoUrl = watch('photoUrl');
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const isNewPatient = !isEditing;

    const handlePhotoUpload = (url: string, file?: File) => {
        setValue('photoUrl', url);
        if (file) {
            setPhotoFile(file);
        }
    };

    const handleFormSubmit = (data: CreatePatientInput) => {
        onSubmit(data, { photoFile: photoFile || undefined });
    };

    const handlePhotoFileSelected = (file: File) => {
        setPhotoFile(file);
    };

    return (
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Foto del paciente */}
                <div className="md:col-span-2">
                    <PatientImageUpload
                        currentImage={photoUrl}
                        onImageUploaded={handlePhotoUpload}
                        patientId={patientId}
                        isNewPatient={isNewPatient}
                        onFileSelected={handlePhotoFileSelected}
                        onPhotoUploaded={onPhotoUploaded}
                    />
                </div>

                {/* Resto del formulario existente */}
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
                    <Label htmlFor="email">Email *</Label>
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
                    <Label htmlFor="phoneNumber">Teléfono *</Label>
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

                <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="address">Dirección</Label>
                    <Input
                        id="address"
                        {...register('address')}
                        placeholder="Calle Principal #123"
                    />
                </div>

                <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="dentalHistory">Historial dental</Label>
                    <Textarea
                        id="dentalHistory"
                        {...register('dentalHistory')}
                        placeholder="Historial odontológico del paciente..."
                        rows={3}
                    />
                </div>

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

            <div className="flex justify-end gap-2 pt-4">
                <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Guardando...' : submitLabel}
                </Button>
            </div>
        </form>
    );
}