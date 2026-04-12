import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { SessionForm } from '@/components/clinical/SessionForm';
import { SessionTable } from '@/components/clinical/SessionTable';
import { Treatment, TreatmentSession } from '@/types/clinicalHistory';
import { clinicalHistoryService } from '@/services/clinicalHistory.service';

const typeLabels: Record<string, string> = {
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

const statusColors: Record<string, string> = {
    PLANNED: 'bg-blue-100 text-blue-700',
    IN_PROGRESS: 'bg-yellow-100 text-yellow-700',
    ON_HOLD: 'bg-orange-100 text-orange-700',
    COMPLETED: 'bg-green-100 text-green-700',
    CANCELLED: 'bg-red-100 text-red-700',
};

const statusLabels: Record<string, string> = {
    PLANNED: 'Planificado',
    IN_PROGRESS: 'En Progreso',
    ON_HOLD: 'En Espera',
    COMPLETED: 'Completado',
    CANCELLED: 'Cancelado',
};

export function TreatmentSessionsPage() {
    const { treatmentId, patientId } = useParams<{ treatmentId: string; patientId: string }>();
    const navigate = useNavigate();

    const [treatment, setTreatment] = useState<Treatment | null>(null);
    const [sessions, setSessions] = useState<TreatmentSession[]>([]);
    const [showSessionForm, setShowSessionForm] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, [treatmentId]);

    const loadData = async () => {
        if (!treatmentId) return;
        setIsLoading(true);
        try {
            const [treatmentData, sessionsData] = await Promise.all([
                clinicalHistoryService.getTreatmentById(parseInt(treatmentId)),
                clinicalHistoryService.getSessionsByTreatment(parseInt(treatmentId)),
            ]);
            setTreatment(treatmentData);
            setSessions(sessionsData);
        } catch (error) {
            console.error('Error al cargar datos:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSessionAdded = async () => {
        await loadData();
        setShowSessionForm(false);
    };

    const nextSessionNumber = sessions.length + 1;

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 p-6">
                <div className="max-w-6xl mx-auto space-y-6">
                    <Skeleton className="h-10 w-32" />
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-96 w-full" />
                </div>
            </div>
        );
    }

    if (!treatment) return null;

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-6xl mx-auto p-4 lg:p-6 space-y-6">
                {/* Header del tratamiento */}
                <Card>
                    <CardHeader>
                        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <Activity className="h-6 w-6 text-primary-600" />
                                    <CardTitle className="text-2xl">{treatment.name}</CardTitle>
                                </div>
                                <div className="flex gap-2 mt-2">
                                    <Badge className={statusColors[treatment.status]}>
                                        {statusLabels[treatment.status]}
                                    </Badge>
                                    <Badge variant="outline">
                                        {typeLabels[treatment.type] || treatment.type}
                                    </Badge>
                                </div>
                            </div>
                            <Button variant="outline" onClick={() => navigate(`/clinical-history/${patientId}`)}>
                                Volver Historia Clínica
                            </Button>
                        </div>
                    </CardHeader>
                    {treatment.description && (
                        <CardContent>
                            <p className="text-gray-700">{treatment.description}</p>
                        </CardContent>
                    )}
                </Card>

                {/* Lista de sesiones */}
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center flex-wrap gap-3">
                            <div>
                                <CardTitle>Sesiones realizadas</CardTitle>
                                <p className="text-sm text-gray-500 mt-1">
                                    Historial completo de todas las sesiones del tratamiento
                                </p>
                            </div>
                            <Button onClick={() => setShowSessionForm(true)} className="gap-2">
                                <Plus className="h-4 w-4" />
                                Nueva Sesión
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <SessionTable
                            data={sessions}
                            isLoading={isLoading}
                            treatmentName={treatment?.name} 
                            onComplete={async (session) => {
                                try {
                                    await clinicalHistoryService.completeSession(session.id);
                                    await loadData();
                                } catch (error) {
                                    console.error('Error al completar sesión:', error);
                                }
                            }}
                            onSessionUpdated={loadData}
                        />
                    </CardContent>
                </Card>
            </div>

            {/* Modal para nueva sesión */}
            <SessionForm
                open={showSessionForm}
                onOpenChange={setShowSessionForm}
                treatmentId={treatment.id}
                nextSessionNumber={nextSessionNumber}
                onSuccess={handleSessionAdded}
            />
        </div>
    );
}