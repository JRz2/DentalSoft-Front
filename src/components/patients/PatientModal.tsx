import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { PatientForm } from './PatientForm';
import { CreatePatientInput } from '@/lib/validations/patient.schema';
import { Patient } from '@/types/patient';

const formatDateForInput = (dateFromBackend: string | undefined): string => {
  if (!dateFromBackend) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateFromBackend)) return dateFromBackend;
  const date = new Date(dateFromBackend);
  if (isNaN(date.getTime())) return '';
  return date.toISOString().split('T')[0];
};

interface PatientModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (data: CreatePatientInput) => void;
    isLoading?: boolean;
    patient?: Patient | null;
}

export function PatientModal({
    open,
    onOpenChange,
    onSubmit,
    isLoading,
    patient,
}: PatientModalProps) {
    const isEditing = !!patient;

    const defaultValues: Partial<CreatePatientInput> = patient
        ? {
            fullName: patient.fullName,
            email: patient.email,
            phoneNumber: patient.phoneNumber,
            birthDate: formatDateForInput(patient.birthDate),
            address: patient.address,
            dentalHistory: patient.dentalHistory,
            habits: patient.habits,
            medicalConditions: patient.medicalConditions,
        }
        : {};

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{isEditing ? 'Editar Paciente' : 'Nuevo Paciente'}</DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? 'Modifica los datos del paciente'
                            : 'Ingresa los datos del nuevo paciente'}
                    </DialogDescription>
                </DialogHeader>
                <PatientForm
                    defaultValues={defaultValues}
                    onSubmit={onSubmit}
                    isLoading={isLoading}
                    submitLabel={isEditing ? 'Actualizar' : 'Crear'}
                />
            </DialogContent>
        </Dialog>
    );
}