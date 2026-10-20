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
import { AlertTriangle, CheckCircle2, Loader2, Coins } from 'lucide-react';

interface ZeroCostConfirmDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    treatmentName?: string;
    isLoading?: boolean;
}

export function ZeroCostConfirmDialog({
    open,
    onOpenChange,
    onConfirm,
    treatmentName,
    isLoading = false,
}: ZeroCostConfirmDialogProps) {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent className="w-[calc(100vw-2rem)] max-w-md p-0 gap-0 overflow-hidden">
                {/* Header con acento ámbar */}
                <div className="bg-gradient-to-r from-amber-50 to-white border-b border-amber-100 px-5 sm:px-6 py-4">
                    <AlertDialogHeader>
                        <div className="flex items-start gap-3">
                            <div className="p-2 rounded-xl bg-amber-100 shrink-0">
                                <AlertTriangle className="h-5 w-5 text-amber-600" />
                            </div>
                            <div className="min-w-0">
                                <AlertDialogTitle className="text-base sm:text-lg font-bold text-gray-900">
                                    ¿Registrar tratamiento gratuito?
                                </AlertDialogTitle>
                                <AlertDialogDescription className="text-xs sm:text-sm text-gray-500 pt-0.5">
                                    El costo del tratamiento es de Bs 0
                                </AlertDialogDescription>
                            </div>
                        </div>
                    </AlertDialogHeader>
                </div>

                {/* Contenido */}
                <div className="px-5 sm:px-6 py-4 space-y-3">
                    <p className="text-sm text-gray-700">
                        {treatmentName ? (
                            <>
                                Estás por registrar <strong>"{treatmentName}"</strong> sin costo.
                                Esto significa que:
                            </>
                        ) : (
                            'Estás por registrar un tratamiento sin costo. Esto significa que:'
                        )}
                    </p>

                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 pl-1">
                        <li>No se generará un cobro inicial</li>
                        <li>El tratamiento aparecerá como <strong>Pagado</strong> en el historial</li>
                        <li>Podrás ajustar el costo más tarde desde el detalle del tratamiento</li>
                    </ul>

                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 flex items-start gap-2">
                        <Coins className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
                        <p>
                            <strong>¿Es un caso real?</strong> Esto se usa típicamente para garantías,
                            promociones, familiares del personal o consultas de diagnóstico gratuitas.
                        </p>
                    </div>
                </div>

                {/* Botones */}
                <AlertDialogFooter className="!flex-row !justify-end gap-2 px-5 sm:px-6 pt-4 pb-5 bg-gray-50/60 border-t border-gray-100 !space-x-0">
                    <AlertDialogCancel
                        disabled={isLoading}
                        className="flex-1 sm:flex-initial min-w-0 mt-0"
                    >
                        Volver a editar
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={onConfirm}
                        disabled={isLoading}
                        className="flex-1 sm:flex-initial min-w-0 gap-2 bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                                <span className="truncate">Registrando...</span>
                            </>
                        ) : (
                            <>
                                <CheckCircle2 className="h-4 w-4 shrink-0" />
                                <span className="truncate">Sí, registrar gratis</span>
                            </>
                        )}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}