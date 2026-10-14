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
import { AlertTriangle, Loader2, Trash2 } from 'lucide-react';

interface DeleteConfirmDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    patientName?: string;
    isLoading?: boolean;
}

export function DeleteConfirmDialog({
    open,
    onOpenChange,
    onConfirm,
    patientName,
    isLoading = false,
}: DeleteConfirmDialogProps) {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent className="w-[calc(100vw-2rem)] max-w-md p-0 gap-0 overflow-hidden">
                {/* Header con acento rojo */}
                <div className="bg-gradient-to-r from-red-50 to-white border-b border-red-100 px-5 sm:px-6 py-4">
                    <AlertDialogHeader>
                        <div className="flex items-start gap-3">
                            <div className="p-2 rounded-xl bg-red-100 shrink-0">
                                <Trash2 className="h-5 w-5 text-red-600" />
                            </div>
                            <div className="min-w-0">
                                <AlertDialogTitle className="text-base sm:text-lg font-bold text-gray-900">
                                    Eliminar Paciente
                                </AlertDialogTitle>
                                <AlertDialogDescription className="text-xs sm:text-sm text-gray-500 pt-0.5">
                                    El paciente quedará archivado en el sistema
                                </AlertDialogDescription>
                            </div>
                        </div>
                    </AlertDialogHeader>
                </div>

                {/* Contenido */}
                <div className="px-5 sm:px-6 py-4 space-y-3">
                    <p className="text-sm text-gray-700">
                        ¿Estás seguro de que querés eliminar a{' '}
                        <strong className="text-gray-900">
                            {patientName || 'este paciente'}
                        </strong>
                        ?
                    </p>

                    {/* Advertencia con consecuencias */}
                    <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-lg p-3">
                        <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                        <div className="text-xs text-amber-800 space-y-1">
                            <p className="font-medium">
                                Al eliminar el paciente:
                            </p>
                            <ul className="list-disc list-inside space-y-0.5 text-amber-700">
                                <li>No aparecerá en la lista de pacientes activos</li>
                                <li>Sus citas y tratamientos se mantienen en el historial</li>
                                <li>Un administrador puede restaurarlo después</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <AlertDialogFooter className="!flex-row !justify-end gap-2 px-5 sm:px-6 pt-4 pb-5 sm:pb-6 bg-gray-50/60 border-t border-gray-100 !space-x-0">
                    <AlertDialogCancel
                        disabled={isLoading}
                        className="flex-1 sm:flex-initial min-w-0 mt-0"
                    >
                        Cancelar
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={onConfirm}
                        disabled={isLoading}
                        className="flex-1 sm:flex-initial min-w-0 gap-2 bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                                <span className="truncate">Eliminando...</span>
                            </>
                        ) : (
                            <>
                                <Trash2 className="h-4 w-4 shrink-0" />
                                <span className="truncate">Eliminar Paciente</span>
                            </>
                        )}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}