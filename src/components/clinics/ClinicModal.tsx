import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { ClinicForm } from './ClinicForm';
import { Clinic } from '@/types/clinic';

interface ClinicModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (data: any) => void;
    isLoading?: boolean;
    clinic?: Clinic | null;
}

export function ClinicModal({
    open,
    onOpenChange,
    onSubmit,
    isLoading,
    clinic,
}: ClinicModalProps) {
    const isEditing = !!clinic;

    const defaultValues = clinic ? {
        name: clinic.name,
        commercialName: clinic.commercialName || '',
        nit: clinic.nit || '',
        address: clinic.address || '',
        phone: clinic.phone || '',
        email: clinic.email || '',
        subdomain: clinic.subdomain || '',
        logoUrl: clinic.logoUrl || '',
    } : {};

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{isEditing ? 'Editar Clínica' : 'Nueva Clínica'}</DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? 'Modifica los datos de la clínica'
                            : 'Ingresa los datos de la nueva clínica'}
                    </DialogDescription>
                </DialogHeader>
                <ClinicForm
                    defaultValues={defaultValues}
                    onSubmit={onSubmit}
                    isLoading={isLoading}
                    submitLabel={isEditing ? 'Actualizar' : 'Crear'}
                />
            </DialogContent>
        </Dialog>
    );
}