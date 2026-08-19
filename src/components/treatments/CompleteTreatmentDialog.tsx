import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { CheckCircle2 } from 'lucide-react';

interface CompleteTreatmentDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    treatmentName: string;
    onConfirm: () => void;
    isLoading?: boolean;
}

export function CompleteTreatmentDialog({
    open,
    onOpenChange,
    treatmentName,
    onConfirm,
    isLoading,
}: CompleteTreatmentDialogProps) {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                        Completar tratamiento
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        ¿Estás seguro de que deseas marcar como completado el tratamiento?
                        <span className="block mt-2 font-medium text-gray-900">
                            {treatmentName}
                        </span>
                        <span className="block mt-2 text-sm text-gray-500">
                            Esta acción cambiará el estado del tratamiento a "Completado".
                        </span>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={onConfirm}
                        disabled={isLoading}
                        className="bg-green-600 hover:bg-green-700"
                    >
                        {isLoading ? 'Completando...' : 'Sí, completar'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}