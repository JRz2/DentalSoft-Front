import { useState } from 'react';
import {
    Dialog,
    DialogDescription,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SessionForm } from './SessionForm';
import { Treatment, TreatmentSession } from '@/types/clinicalHistory';
import { Calendar, Plus } from 'lucide-react';

interface TreatmentDetailProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    treatment: Treatment | null;
    sessions?: TreatmentSession[];
    onSessionAdded: () => void;
}

const typeLabels = {
    DIAGNOSIS: 'Diagnóstico',
    PREVENTIVE: 'Preventivo',
    RESTORATIVE: 'Restaurador',
    ENDODONTIC: 'Endodoncia',
    PERIODONTAL: 'Periodoncia',
    ORTHODONTIC: 'Ortodoncia',
    SURGICAL: 'Quirúrgico',
    PROSTHETIC: 'Prótesis',
    AESTHETIC: 'Estética',
    MAINTENANCE: 'Mantenimiento',
};

const statusColors = {
    PLANNED: 'bg-blue-100 text-blue-700',
    IN_PROGRESS: 'bg-yellow-100 text-yellow-700',
    ON_HOLD: 'bg-orange-100 text-orange-700',
    COMPLETED: 'bg-green-100 text-green-700',
    CANCELLED: 'bg-red-100 text-red-700',
};

const statusLabels = {
    PLANNED: 'Planificado',
    IN_PROGRESS: 'En Progreso',
    ON_HOLD: 'En Espera',
    COMPLETED: 'Completado',
    CANCELLED: 'Cancelado',
};

export function TreatmentDetail({ open, onOpenChange, treatment,  sessions = [], onSessionAdded }: TreatmentDetailProps) {
    const [showSessionForm, setShowSessionForm] = useState(false);

    if (!treatment) return null;

    const completedSessions = sessions.filter(s => s.isCompleted).length;
    const nextSessionNumber = completedSessions + 1;

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-xl">{treatment.name}
                            <DialogDescription>
                                Información sobre el tratamiento
                            </DialogDescription>
                        </DialogTitle>
                        <div className="flex gap-2 mt-2">
                            <Badge className={statusColors[treatment.status]}>
                                {statusLabels[treatment.status]}
                            </Badge>
                            <Badge variant="outline">
                                {typeLabels[treatment.type] || treatment.type}
                            </Badge>
                        </div>
                    </DialogHeader>

                    <div className="space-y-4">
                        {treatment.description && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-sm">Descripción</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-gray-600">{treatment.description}</p>
                                </CardContent>
                            </Card>
                        )}

                        <div className="flex justify-between items-center">
                            <h3 className="font-semibold">Sesiones ({completedSessions}/{treatment.estimatedSessions})</h3>
                            {treatment.status !== 'COMPLETED' && treatment.status !== 'CANCELLED' && (
                                <Button size="sm" onClick={() => setShowSessionForm(true)}>
                                    <Plus className="h-4 w-4 mr-1" />
                                    Nueva Sesión
                                </Button>
                            )}
                        </div>

                        {sessions.length === 0 ? (
                            <Card>
                                <CardContent className="text-center py-8 text-gray-500">
                                    No hay sesiones registradas
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="space-y-3">
                                {sessions.map((session) => (
                                    <Card key={session.id}>
                                        <CardHeader className="pb-2">
                                            <div className="flex justify-between items-center">
                                                <CardTitle className="text-base">
                                                    Sesión #{session.sessionNumber}
                                                </CardTitle>
                                                <Badge variant={session.isCompleted ? 'default' : 'secondary'}>
                                                    {session.isCompleted ? 'Completada' : 'Pendiente'}
                                                </Badge>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-gray-600">{session.description}</p>
                                            {session.notes && (
                                                <p className="text-sm text-gray-500 mt-2">{session.notes}</p>
                                            )}
                                            {session.date && (
                                                <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                                                    <Calendar className="h-3 w-3" />
                                                    {new Date(session.date).toLocaleDateString()}
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            <SessionForm
                open={showSessionForm}
                onOpenChange={setShowSessionForm}
                treatmentId={treatment.id}
                nextSessionNumber={nextSessionNumber}
                onSuccess={() => {
                    setShowSessionForm(false);
                    onSessionAdded();
                }}
            />
        </>
    );
}