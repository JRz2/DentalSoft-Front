import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const clinicSchema = z.object({
    name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
    subdomain: z.string()
        .min(3, 'El subdominio debe tener al menos 3 caracteres')
        .regex(/^[a-z0-9]+$/, 'Solo letras minúsculas y números sin espacios'),
    phone: z.string().optional(),
    email: z.string().email('Email inválido').optional().or(z.literal('')),
    address: z.string().optional(),
    logoUrl: z.string().optional(),
    faviconUrl: z.string().optional(),
});

type ClinicFormData = z.infer<typeof clinicSchema>;

interface ClinicFormProps {
    defaultValues?: Partial<ClinicFormData>;
    onSubmit: (data: ClinicFormData) => void;
    isLoading?: boolean;
    submitLabel?: string;
}

export function ClinicForm({
    defaultValues,
    onSubmit,
    isLoading,
    submitLabel = 'Guardar',
}: ClinicFormProps) {
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ClinicFormData>({
        resolver: zodResolver(clinicSchema),
        defaultValues: defaultValues || {
            name: '',
            subdomain: '',
            phone: '',
            email: '',
            address: '',
            logoUrl: '',
            faviconUrl: '',
        },
    });

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="name">Nombre de la clínica *</Label>
                    <Input
                        id="name"
                        {...register('name')}
                        placeholder="Clínica Dental Ejemplo"
                        className={errors.name ? 'border-red-500' : ''}
                    />
                    {errors.name && (
                        <p className="text-sm text-red-500">{errors.name.message}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="subdomain">Subdominio *</Label>
                    <Input
                        id="subdomain"
                        {...register('subdomain')}
                        placeholder="ejemplo (clinica1, sonrisadental)"
                        className={errors.subdomain ? 'border-red-500' : ''}
                    />
                    {errors.subdomain && (
                        <p className="text-sm text-red-500">{errors.subdomain.message}</p>
                    )}
                    <p className="text-xs text-gray-500">Solo letras minúsculas y números, sin espacios</p>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="phone">Teléfono</Label>
                    <Input
                        id="phone"
                        {...register('phone')}
                        placeholder="+591 78945612"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="email">Correo electrónico</Label>
                    <Input
                        id="email"
                        type="email"
                        {...register('email')}
                        placeholder="info@clinica.com"
                    />
                    {errors.email && (
                        <p className="text-sm text-red-500">{errors.email.message}</p>
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

                <div className="space-y-2">
                    <Label htmlFor="logoUrl">URL del logo</Label>
                    <Input
                        id="logoUrl"
                        {...register('logoUrl')}
                        placeholder="https://ejemplo.com/logo.png"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="faviconUrl">URL del favicon</Label>
                    <Input
                        id="faviconUrl"
                        {...register('faviconUrl')}
                        placeholder="https://ejemplo.com/favicon.ico"
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