import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect, useState } from 'react';
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
import { Loader2, CheckCircle2, Building2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ImageUpload } from '@/components/shared/ImageUpload';
import { Clinic } from '@/types/clinic';

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

interface ClinicModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (data: ClinicFormData, files?: { logoFile?: File; faviconFile?: File }) => void;
    isLoading?: boolean;
    clinic?: Clinic | null;
    clinicId?: number;
}

export function ClinicModal({
    open,
    onOpenChange,
    onSubmit,
    isLoading,
    clinic,
    clinicId,
}: ClinicModalProps) {
    const isEditing = !!clinic;
    const currentClinicId = clinicId || clinic?.id;

    const defaultValues: Partial<ClinicFormData> = clinic ? {
        name: clinic.name,
        subdomain: clinic.subdomain,
        phone: clinic.phone || '',
        email: clinic.email || '',
        address: clinic.address || '',
        logoUrl: clinic.logoUrl || '',
        faviconUrl: clinic.faviconUrl || '',
    } : {
        name: '',
        subdomain: '',
        phone: '',
        email: '',
        address: '',
        logoUrl: '',
        faviconUrl: '',
    };

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        reset,
        formState: { errors },
    } = useForm<ClinicFormData>({
        resolver: zodResolver(clinicSchema),
        defaultValues,
    });

    const logoUrl = watch('logoUrl');
    const faviconUrl = watch('faviconUrl');

    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [faviconFile, setFaviconFile] = useState<File | null>(null);

    useEffect(() => {
        if (open) {
            reset(defaultValues);
            setLogoFile(null);
            setFaviconFile(null);
        }
    }, [open, clinic?.id]);

    const handleLogoUpload = (url: string, file?: File) => {
        setValue('logoUrl', url);
        if (file) setLogoFile(file);
    };

    const handleFaviconUpload = (url: string, file?: File) => {
        setValue('faviconUrl', url);
        if (file) setFaviconFile(file);
    };

    const handleFormSubmit = (data: ClinicFormData) => {
        onSubmit(data, { logoFile: logoFile || undefined, faviconFile: faviconFile || undefined });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-full max-w-[90vw] md:max-w-[80vw] lg:max-w-2xl max-h-[90vh] overflow-y-auto p-0 gap-0">
                <div className="bg-gradient-to-r from-teal-50 to-white border-b px-4 md:px-6 py-4 rounded-t-2xl">
                    <DialogHeader>
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="p-2 bg-teal-100 rounded-xl shrink-0">
                                    <Building2 className="h-5 w-5 text-teal-600" />
                                </div>
                                <div className="min-w-0">
                                    <DialogTitle className="text-lg md:text-xl font-bold text-gray-900">
                                        {isEditing ? 'Editar Clínica' : 'Nueva Clínica'}
                                    </DialogTitle>
                                    <DialogDescription className="text-xs md:text-sm text-gray-500">
                                        {isEditing
                                            ? 'Modifica los datos de la clínica'
                                            : 'Ingresa los datos de la nueva clínica'}
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

                <div className="px-4 md:px-6 py-4 md:py-6">
                    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 md:space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                            {/* Fila de imágenes */}
                            <div className="md:col-span-2 flex flex-wrap justify-center gap-8 py-4 bg-gray-50/50 rounded-xl">
                                <ImageUpload
                                    label="Logo de la clínica"
                                    currentImage={logoUrl}
                                    onImageUploaded={handleLogoUpload}
                                    clinicId={currentClinicId}
                                    isNewClinic={!isEditing}
                                    type="logo"
                                />
                                <ImageUpload
                                    label="Favicon"
                                    currentImage={faviconUrl}
                                    onImageUploaded={handleFaviconUpload}
                                    clinicId={currentClinicId}
                                    isNewClinic={!isEditing}
                                    type="favicon"
                                />
                            </div>

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
                        </div>

                        <div className="flex flex-row justify-end gap-2 sm:gap-3 pt-4 border-t">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
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
                                        {isEditing ? 'Actualizar' : 'Crear Clínica'}
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