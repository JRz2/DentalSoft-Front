import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ImageUpload } from '@/components/shared/ImageUpload';
import { useState } from 'react';

const clinicSchema = z.object({
    name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
    subdomain: z.string()
        .min(3, 'El subdominio debe tener al menos 3 caracteres')
        .regex(/^[a-z0-9]+$/, 'Solo letras minúsculas y números sin espacios'),
    phone: z.string().optional(),
    email: z.string().optional(),
    address: z.string().optional(),
    logoUrl: z.string().optional(),
    faviconUrl: z.string().optional(),
});

type ClinicFormData = z.infer<typeof clinicSchema>;

interface ClinicFormProps {
    defaultValues?: Partial<ClinicFormData>;
    onSubmit: (data: ClinicFormData, files?: { logoFile?: File; faviconFile?: File }) => void;
    isLoading?: boolean;
    submitLabel?: string;
    clinicId?: number;
    isEditing?: boolean;
}

export function ClinicForm({
    defaultValues,
    onSubmit,
    isLoading,
    submitLabel = 'Guardar',
    clinicId,
    isEditing = false,
}: ClinicFormProps) {
    const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<ClinicFormData>({
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

    const logoUrl = watch('logoUrl');
    const faviconUrl = watch('faviconUrl');
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [faviconFile, setFaviconFile] = useState<File | null>(null);

    // Asegurar que el logo se muestra después de guardar
    const handleLogoUpload = (url: string, file?: File) => {
        if (file) {
            // Es una nueva imagen seleccionada (preview local)
            setLogoFile(file);
            // Si es una nueva clínica, la URL está vacía, usamos el archivo para preview
            if (!url) {
                setValue('logoUrl', '');
            } else {
                setValue('logoUrl', url);
            }
        } else if (url) {
            // Es una URL del servidor
            setValue('logoUrl', url);
        }
    };

    const handleFaviconUpload = (url: string, file?: File) => {
        setValue('faviconUrl', url);
        if (file) setFaviconFile(file);
    };

    const handleFormSubmit = (data: ClinicFormData) => {
        onSubmit(data, { logoFile: logoFile || undefined, faviconFile: faviconFile || undefined });
    };

    const isNewClinic = !isEditing;

    return (
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
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
                        placeholder="info@clinica.com (opcional)"
                    />
                </div>

                <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="address">Dirección</Label>
                    <Input
                        id="address"
                        {...register('address')}
                        placeholder="Calle Principal #123"
                    />
                </div>

                {/* Subida de logo */}
                <div className="md:col-span-2">
                    <ImageUpload
                        label="Logo de la clínica"
                        currentImage={logoUrl}
                        onImageUploaded={handleLogoUpload}
                        clinicId={clinicId}
                        isNewClinic={isNewClinic}
                    />
                </div>

                {/* Subida de favicon */}
                <div className="md:col-span-2">
                    <ImageUpload
                        label="Favicon"
                        currentImage={faviconUrl}
                        onImageUploaded={handleFaviconUpload}
                        clinicId={clinicId}
                        isNewClinic={isNewClinic}
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