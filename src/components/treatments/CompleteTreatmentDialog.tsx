import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Sparkles } from 'lucide-react';

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
    isLoading = false,
}: CompleteTreatmentDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-full">
                            <CheckCircle2 className="h-6 w-6 text-green-600" />
                        </div>
                        <DialogTitle className="text-xl font-bold">Completar Tratamiento</DialogTitle>
                    </div>
                    <DialogDescription className="pt-2">
                        ¿Estás seguro de que deseas marcar como completado el tratamiento <strong>{treatmentName}</strong>?
                    </DialogDescription>
                </DialogHeader>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-2">
                    <div className="flex items-start gap-3">
                        <Sparkles className="h-5 w-5 text-green-600 mt-0.5" />
                        <div className="text-sm text-green-700">
                            <p>Al completar el tratamiento:</p>
                            <ul className="list-disc list-inside mt-1 space-y-1">
                                <li>El estado cambiará a <strong>"Completado"</strong></li>
                                <li>No se podrán registrar más sesiones</li>
                                <li>Quedará marcado como finalizado en el historial</li>
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
                        className="gap-2 bg-green-600 hover:bg-green-700"
                    >
                        {isLoading ? (
                            <>
                                <span className="animate-spin">⏳</span>
                                Completando...
                            </>
                        ) : (
                            <>
                                <CheckCircle2 className="h-4 w-4" />
                                Completar Tratamiento
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}