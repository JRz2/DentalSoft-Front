import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Clock, ClipboardList, Stethoscope } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { SessionForm } from '@/components/clinical/SessionForm';
import { SessionTable } from '@/components/clinical/SessionTable';
import { PaymentSummary } from '@/components/treatments/PaymentSummary';
import { PaymentHistory } from '@/components/treatments/PaymentHistory';
import { Treatment, TreatmentSession } from '@/types/clinicalHistory';
import { clinicalHistoryService } from '@/services/clinicalHistory.service';
import { usePatient } from '@/hooks/usePatients';
import { toast } from 'sonner';

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

const getInitials = (name: string) => {
    return name
        .split(' ')
        .map(word => word[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
};

const getImageUrl = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) {
        return path;
    }
    if (path.startsWith('/')) {
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        const cleanBaseUrl = baseUrl.replace(/\/api$/, '');
        return `${cleanBaseUrl}${path}`;
    }
    return path;
};

export function TreatmentSessionsPage() {
    const { treatmentId, patientId } = useParams<{ treatmentId: string; patientId: string }>();
    const navigate = useNavigate();

    const [treatment, setTreatment] = useState<Treatment | null>(null);
    const [sessions, setSessions] = useState<TreatmentSession[]>([]);
    const [paymentStatus, setPaymentStatus] = useState<any>(null);
    const [showSessionForm, setShowSessionForm] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const { data: patient, isLoading: patientLoading } = usePatient(parseInt(patientId || '0'));

    useEffect(() => {
        loadData();
    }, [treatmentId]);

    const loadData = async () => {
        if (!treatmentId) return;
        setIsLoading(true);
        try {
            const [treatmentData, sessionsData, paymentData] = await Promise.all([
                clinicalHistoryService.getTreatmentById(parseInt(treatmentId)),
                clinicalHistoryService.getSessionsByTreatment(parseInt(treatmentId)),
                clinicalHistoryService.getPaymentStatus(parseInt(treatmentId)),
            ]);
            setTreatment(treatmentData);
            setSessions(sessionsData);
            setPaymentStatus(paymentData);
        } catch (error) {
            console.error('Error al cargar datos:', error);
            toast.error('Error al cargar los datos del tratamiento');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSessionAdded = async () => {
        await loadData();
        setShowSessionForm(false);
    };

    const nextSessionNumber = sessions.length + 1;

    if (isLoading || patientLoading) {
        return (
            <div className="min-h-screen bg-gray-50 p-6">
                <div className="max-w-6xl mx-auto space-y-6">
                    <Skeleton className="h-10 w-32" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-40 w-full" />
                    <Skeleton className="h-96 w-full" />
                </div>
            </div>
        );
    }

    if (!treatment) return null;

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-6xl mx-auto p-4 lg:p-6 space-y-6">

                {/* Título del tratamiento */}
                <div className="mb-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-primary-100 rounded-xl">
                            <ClipboardList className="h-6 w-6 text-primary-600" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Tratamiento</h1>
                            <p className="text-sm text-gray-500">Registro completo del tratamiento y sesiones</p>
                        </div>
                    </div>
                </div>

                {/* Header con foto de paciente y tratamiento */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <div className="flex flex-col md:flex-row gap-6">
                        {/* Avatar del paciente */}
                        <div className="flex flex-col items-center gap-3">
                            <div
                                className="h-24 w-24 rounded-full border-4 border-primary-100 overflow-hidden bg-primary-500 flex items-center justify-center"
                                style={{ backgroundColor: '#fafafa' }}
                            >
                                {patient?.photoUrl && patient.photoUrl.trim() !== '' ? (
                                    <img
                                        src={getImageUrl(patient.photoUrl)}
                                        alt={patient.fullName}
                                        className="h-full w-full object-cover"
                                        onError={(e) => {
                                            e.currentTarget.style.display = 'none';
                                        }}
                                    />
                                ) : null}
                                <span
                                    className="text-black text-2xl font-medium"
                                    style={{ display: patient?.photoUrl && patient.photoUrl.trim() !== '' ? 'none' : 'block' }}
                                >
                                    {getInitials(patient?.fullName as string)}
                                </span>
                            </div>
                        </div>

                        {/* Información del paciente + tratamiento */}
                        <div className="flex-1">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900">{patient?.fullName}</h1>
                                    <p className="text-gray-500 mt-1 flex items-center gap-2">
                                        <Stethoscope className="h-4 w-4 text-primary-500" />
                                        {treatment.name}
                                    </p>
                                </div>
                                <Button
                                    variant="outline"
                                    onClick={() => navigate(`/clinical-history/${patientId}`)}
                                    className="gap-2"
                                >
                                    Ver Historia Clínica
                                </Button>
                            </div>

                            {/* Datos del tratamiento */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                                <div className="flex items-center gap-3 text-sm">
                                    <Stethoscope className="h-4 w-4 text-gray-400" />
                                    <span className="text-gray-600">Tipo: {typeLabels[treatment.type] || treatment.type}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <Clock className="h-4 w-4 text-gray-400" />
                                    <span className="text-gray-600">{treatment.estimatedSessions} sesiones</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <span className="h-4 w-4 flex items-center justify-center text-gray-400">
                                        <Badge className={statusColors[treatment.status]}>
                                            {statusLabels[treatment.status]}
                                        </Badge>
                                    </span>
                                </div>
                            </div>

                            {/* Descripción del tratamiento */}
                            <div className="mt-4 pt-4 border-t border-gray-100">
                                <div className="flex items-start gap-3 text-sm">
                                    <span className="font-medium text-gray-700 shrink-0">Descripción:</span>
                                    <span className="text-gray-600">
                                        {treatment.description || 'No se ha registrado una descripción para este tratamiento'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Resumen de pagos */}
                {paymentStatus && <PaymentSummary paymentStatus={paymentStatus} />}

                {/* Historial de pagos */}
                {paymentStatus && paymentStatus.payments?.length > 0 && (
                    <PaymentHistory payments={paymentStatus.payments || []} />
                )}

                {/* Lista de sesiones */}
                <Card className="border-0 shadow-sm">
                    <CardHeader className="border-b bg-gray-50/50">
                        <div className="flex justify-between items-center flex-wrap gap-3">
                            <div className="flex items-center gap-3">
                                <ClipboardList className="h-5 w-5 text-primary-600" />
                                <div>
                                    <CardTitle>Sesiones realizadas</CardTitle>
                                    <p className="text-sm text-gray-500 mt-0.5">
                                        {sessions.length} {sessions.length === 1 ? 'sesión registrada' : 'sesiones registradas'}
                                    </p>
                                </div>
                            </div>
                            <Button onClick={() => setShowSessionForm(true)} className="gap-2">
                                <Plus className="h-4 w-4" />
                                Nueva Sesión
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6">
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