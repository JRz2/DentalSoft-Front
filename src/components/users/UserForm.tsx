import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clinic } from '@/types/user';

// Esquema de validación
const userSchema = z.object({
    name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
    email: z.string().email('Email inválido'),
    password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres').optional(),
    role: z.enum(['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'RECEPTIONIST']),
    clinicId: z.string().optional(),
    specialty: z.string().optional(),
    licenseNumber: z.string().optional(),
    phoneNumber: z.string().optional(),
});

type UserFormData = z.infer<typeof userSchema>;

interface UserFormProps {
    defaultValues?: Partial<UserFormData>;
    onSubmit: (data: UserFormData) => void;
    isLoading?: boolean;
    isEditing?: boolean;
    clinics?: Clinic[];
    submitLabel?: string;
}

export function UserForm({
    defaultValues,
    onSubmit,
    isLoading,
    isEditing = false,
    clinics = [],
    submitLabel = 'Guardar',
}: UserFormProps) {
    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<UserFormData>({
        resolver: zodResolver(userSchema),
        defaultValues: defaultValues || {
            name: '',
            email: '',
            password: '',
            role: 'DOCTOR',
            clinicId: '',
            specialty: '',
            licenseNumber: '',
            phoneNumber: '',
        },
    });

    const selectedRole = watch('role');

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Nombre */}
                <div className="space-y-2">
                    <Label htmlFor="name">Nombre completo *</Label>
                    <Input
                        id="name"
                        {...register('name')}
                        placeholder="Juan Pérez"
                        className={errors.name ? 'border-red-500' : ''}
                    />
                    {errors.name && (
                        <p className="text-sm text-red-500">{errors.name.message}</p>
                    )}
                </div>

                {/* Email */}
                <div className="space-y-2">
                    <Label htmlFor="email">Correo electrónico *</Label>
                    <Input
                        id="email"
                        type="email"
                        {...register('email')}
                        placeholder="juan@clinica.com"
                        className={errors.email ? 'border-red-500' : ''}
                    />
                    {errors.email && (
                        <p className="text-sm text-red-500">{errors.email.message}</p>
                    )}
                </div>

                {/* Contraseña (solo en creación) */}
                {!isEditing && (
                    <div className="space-y-2">
                        <Label htmlFor="password">Contraseña *</Label>
                        <Input
                            id="password"
                            type="password"
                            {...register('password')}
                            placeholder="••••••••"
                            className={errors.password ? 'border-red-500' : ''}
                        />
                        {errors.password && (
                            <p className="text-sm text-red-500">{errors.password.message}</p>
                        )}
                    </div>
                )}

                {/* Rol */}
                <div className="space-y-2">
                    <Label htmlFor="role">Rol *</Label>
                    <Select
                        onValueChange={(value) => setValue('role', value as any)}
                        defaultValue={defaultValues?.role || 'DOCTOR'}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Seleccionar rol" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="SUPER_ADMIN">Super Administrador</SelectItem>
                            <SelectItem value="ADMIN">Administrador</SelectItem>
                            <SelectItem value="DOCTOR">Doctor</SelectItem>
                            <SelectItem value="RECEPTIONIST">Recepcionista</SelectItem>
                        </SelectContent>
                    </Select>
                    {errors.role && (
                        <p className="text-sm text-red-500">{errors.role.message}</p>
                    )}
                </div>

                {/* Clínica */}
                <div className="space-y-2">
                    <Label htmlFor="clinicId">Clínica</Label>
                    <Select
                        onValueChange={(value) => setValue('clinicId', value)}
                        defaultValue={defaultValues?.clinicId}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Seleccionar clínica" />
                        </SelectTrigger>
                        <SelectContent>
                            {clinics.map((clinic) => (
                                <SelectItem key={clinic.id} value={clinic.id.toString()}>
                                    {clinic.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Especialidad (solo para doctores) */}
                {(selectedRole === 'DOCTOR' || (defaultValues?.role === 'DOCTOR' && !selectedRole)) && (
                    <div className="space-y-2">
                        <Label htmlFor="specialty">Especialidad</Label>
                        <Input
                            id="specialty"
                            {...register('specialty')}
                            placeholder="Odontología General"
                        />
                    </div>
                )}

                {/* Número de licencia (solo para doctores) */}
                {(selectedRole === 'DOCTOR' || (defaultValues?.role === 'DOCTOR' && !selectedRole)) && (
                    <div className="space-y-2">
                        <Label htmlFor="licenseNumber">Número de licencia</Label>
                        <Input
                            id="licenseNumber"
                            {...register('licenseNumber')}
                            placeholder="12345"
                        />
                    </div>
                )}

                {/* Teléfono */}
                <div className="space-y-2">
                    <Label htmlFor="phoneNumber">Teléfono</Label>
                    <Input
                        id="phoneNumber"
                        {...register('phoneNumber')}
                        placeholder="+591 78945612"
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