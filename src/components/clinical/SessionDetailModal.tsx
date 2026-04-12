import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { TreatmentSession } from '@/types/clinicalHistory';
import { 
    Calendar, 
    FileText, 
    Stethoscope, 
    NotebookPen, 
    Clock,
    CheckCircle2,
    XCircle,
    Activity
} from 'lucide-react';

interface SessionDetailModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    session: TreatmentSession | null;
    treatmentName?: string;
}

const formatUTCDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${day}/${month}/${year}`;
};

const formatDateTime = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} - ${hours}:${minutes}`;
};

const getProceduresText = (procedures: any) => {
    if (!procedures) return 'No registrados';
    if (typeof procedures === 'string') return procedures;
    if (procedures.text) return procedures.text;
    return JSON.stringify(procedures);
};

export function SessionDetailModal({ open, onOpenChange, session, treatmentName }: SessionDetailModalProps) {
    if (!session) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl p-0 overflow-hidden">
                {/* Header con gradiente */}
                <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-4">
                    <DialogHeader>
                        <div className="flex items-center gap-2 mb-1">
                            <Activity className="h-4 w-4 text-primary-200" />
                            <span className="text-primary-100 text-sm">
                                {treatmentName || 'Tratamiento'}
                            </span>
                        </div>
                        <DialogTitle className="text-primary-100 text-xl">
                            Sesión #{session.sessionNumber}
                        </DialogTitle>
                        <DialogDescription className="text-primary-100 mt-1">
                            Detalles completos de la sesión realizada
                        </DialogDescription>
                        <div className="flex items-center gap-2 mt-2">
                            <Clock className="h-3 w-3 text-primary-200" />
                            <span className="text-primary-100 text-xs">
                                Registrada el {formatDateTime(session.createdAt || '')}
                            </span>
                        </div>
                    </DialogHeader>
                </div>

                {/* Contenido */}
                <div className="p-6 space-y-2">
                    {/* Fila de estado y fecha */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 rounded-lg p-3 text-center">
                            <p className="text-xs text-gray-500 mb-1">Fecha de la sesión</p>
                            <div className="flex items-center justify-center gap-2">
                                <Calendar className="h-4 w-4 text-primary-500" />
                                <span className="text-gray-900 font-medium">
                                    {session.sessionDate ? formatUTCDate(session.sessionDate) : '-'}
                                </span>
                            </div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3 text-center">
                            <p className="text-xs text-gray-500 mb-1">Estado</p>
                            <Badge className={session.isCompleted 
                                ? 'bg-green-100 text-green-700 hover:bg-green-100' 
                                : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100'
                            }>
                                {session.isCompleted ? (
                                    <>
                                        <CheckCircle2 className="h-3 w-3 mr-1" />
                                        Completada
                                    </>
                                ) : (
                                    <>
                                        <XCircle className="h-3 w-3 mr-1" />
                                        Pendiente
                                    </>
                                )}
                            </Badge>
                        </div>
                    </div>

                    <Separator />

                    {/* Descripción */}
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <div className="p-1.5 bg-blue-50 rounded-lg">
                                <FileText className="h-4 w-4 text-blue-600" />
                            </div>
                            <h3 className="text-sm font-semibold text-gray-700">Descripción</h3>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4">
                            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                                {session.description || 'No registrada'}
                            </p>
                        </div>
                    </div>

                    {/* Procedimientos */}
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <div className="p-1.5 bg-green-50 rounded-lg">
                                <Stethoscope className="h-4 w-4 text-green-600" />
                            </div>
                            <h3 className="text-sm font-semibold text-gray-700">Procedimientos realizados</h3>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4">
                            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                                {getProceduresText(session.procedures)}
                            </p>
                        </div>
                    </div>

                    {/* Notas */}
                    {session.notes && (
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <div className="p-1.5 bg-purple-50 rounded-lg">
                                    <NotebookPen className="h-4 w-4 text-purple-600" />
                                </div>
                                <h3 className="text-sm font-semibold text-gray-700">Notas adicionales</h3>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-4">
                                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                                    {session.notes}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="border-t bg-gray-50 px-6 py-4 flex justify-end">
                    <Button onClick={() => onOpenChange(false)} variant="outline">
                        Cerrar
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}