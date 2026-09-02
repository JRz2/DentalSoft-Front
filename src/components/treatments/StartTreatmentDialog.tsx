import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertCircle, PlayCircle } from 'lucide-react';

interface StartTreatmentDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    treatmentName: string;
    onConfirm: () => void;
    isLoading?: boolean;
}

export function StartTreatmentDialog({
    open,
    onOpenChange,
    treatmentName,
    onConfirm,
    isLoading = false,
}: StartTreatmentDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-100 rounded-full">
                            <PlayCircle className="h-6 w-6 text-emerald-600" />
                        </div>
                        <DialogTitle className="text-xl font-bold">Iniciar Tratamiento</DialogTitle>
                    </div>
                    <DialogDescription className="pt-2">
                        ¿Estás seguro de que deseas iniciar el tratamiento <strong>{treatmentName}</strong>?
                    </DialogDescription>
                </DialogHeader>

                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mt-2">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-emerald-600 mt-0.5" />
                        <div className="text-sm text-emerald-700">
                            <p>Al iniciar el tratamiento:</p>
                            <ul className="list-disc list-inside mt-1 space-y-1">
                                <li>El estado cambiará a <strong>"En Progreso"</strong></li>
                                <li>Se podrán registrar sesiones</li>
                                <li>El paciente podrá ser atendido</li>
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
                        Cancelar
                    </Button>
                    <Button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className="gap-2 bg-emerald-600 hover:bg-emerald-700"
                    >
                        {isLoading ? (
                            <>
                                <span className="animate-spin">⏳</span>
                                Iniciando...
                            </>
                        ) : (
                            <>
                                <PlayCircle className="h-4 w-4" />
                                Iniciar Tratamiento
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}