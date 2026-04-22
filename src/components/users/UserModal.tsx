import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { UserForm } from './UserForm';
import { Clinic } from '@/types/user';

interface UserModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (data: any) => void;
    isLoading?: boolean;
    user?: any;
    clinics?: Clinic[];
}

export function UserModal({
    open,
    onOpenChange,
    onSubmit,
    isLoading,
    user,
    clinics = [],
}: UserModalProps) {
    const isEditing = !!user;

    const defaultValues = user ? {
        name: user.name,
        email: user.email,
        role: user.role,
        clinicId: user.clinicId?.toString() || '',
        specialty: user.specialty || '',
        licenseNumber: user.licenseNumber || '',
        phoneNumber: user.phoneNumber || '',
    } : {};

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{isEditing ? 'Editar Usuario' : 'Nuevo Usuario'}</DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? 'Modifica los datos del usuario'
                            : 'Ingresa los datos del nuevo usuario'}
                    </DialogDescription>
                </DialogHeader>
                <UserForm
                    defaultValues={defaultValues}
                    onSubmit={onSubmit}
                    isLoading={isLoading}
                    isEditing={isEditing}
                    clinics={clinics}
                    submitLabel={isEditing ? 'Actualizar' : 'Crear'}
                />
            </DialogContent>
        </Dialog>
    );
}