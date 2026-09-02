import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertCircle, XCircle } from 'lucide-react';

interface CancelTreatmentDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    treatmentName: string;
    onConfirm: () => void;
    isLoading?: boolean;
}

export function CancelTreatmentDialog({
    open,
    onOpenChange,
    treatmentName,
    onConfirm,
    isLoading = false,
}: CancelTreatmentDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 rounded-full">
                            <XCircle className="h-6 w-6 text-red-600" />
                        </div>
                        <DialogTitle className="text-xl font-bold">Cancelar Tratamiento</DialogTitle>
                    </div>
                    <DialogDescription className="pt-2">
                        ¿Estás seguro de que deseas cancelar el tratamiento <strong>{treatmentName}</strong>?
                    </DialogDescription>
                </DialogHeader>

                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-2">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                        <div className="text-sm text-red-700">
                            <p>Al cancelar el tratamiento:</p>
                            <ul className="list-disc list-inside mt-1 space-y-1">
                                <li>El estado cambiará a <strong>"Cancelado"</strong></li>
                                <li>No se podrán registrar más sesiones</li>
                                <li>El tratamiento quedará inactivo</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <DialogFooter className="gap-2">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isLoading}
                    >
                        Volver
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={onConfirm}
                        disabled={isLoading}
                        className="gap-2"
                    >
                        {isLoading ? (
                            <>
                                <span className="animate-spin">⏳</span>
                                Cancelando...
                            </>
                        ) : (
                            <>
                                <XCircle className="h-4 w-4" />
                                Cancelar Tratamiento
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}