import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Plus, Activity, ArrowLeft, Calendar as CalendarIcon,
    Mail, Phone, MapPin, Clock, CheckCircle, XCircle,
    CalendarDays, FileText, ClipboardList, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { SessionForm } from '@/components/clinical/SessionForm';
import { SessionTable } from '@/components/clinical/SessionTable';
import { PaymentSummary } from '@/components/treatments/PaymentSummary';
import { PaymentHistory } from '@/components/treatments/PaymentHistory';
import { Treatment, TreatmentSession } from '@/types/clinicalHistory';
import { clinicalHistoryService } from '@/services/clinicalHistory.service';
import { usePatient } from '@/hooks/usePatients';
import { toast } from 'sonner';
import { format } from 'date-fns';

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

const statusIcons: Record<string, any> = {
    PLANNED: CalendarDays,
    IN_PROGRESS: Activity,
    ON_HOLD: Clock,
    COMPLETED: CheckCircle,
    CANCELLED: XCircle,
};

const getInitials = (name: string) => {
    return name
        .split(' ')
        .map(word => word[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
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
    const StatusIcon = treatment ? statusIcons[treatment.status] : Activity;

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
                {/* Navegación breadcrumb */}
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span
                        className="cursor-pointer hover:text-primary-600 transition-colors"
                        onClick={() => navigate('/treatments')}
                    >
                        Tratamientos
                    </span>
                    <ChevronRight className="h-4 w-4" />
                    <span
                        className="cursor-pointer hover:text-primary-600 transition-colors"
                        onClick={() => navigate(`/clinical-history/${patientId}`)}
                    >
                        Historia Clínica
                    </span>
                    <ChevronRight className="h-4 w-4" />
                    <span className="text-gray-900 font-medium truncate max-w-[200px]">
                        {treatment.name}
                    </span>
                </div>

                {/* Información del paciente - Mejorada */}
                {patient && (
                    <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="pt-6">
                            <div className="flex flex-col md:flex-row gap-6">
                                <div className="flex flex-col items-center gap-3">
                                    <Avatar className="h-20 w-20 border-4 border-primary-100">
                                        <AvatarFallback className="bg-gradient-to-r from-primary-500 to-primary-600 text-white text-xl">
                                            {getInitials(patient.fullName)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <Badge variant={patient.IsActive !== false ? 'default' : 'secondary'}>
                                        {patient.IsActive !== false ? 'Activo' : 'Inactivo'}
                                    </Badge>
                                </div>

                                <div className="flex-1">
                                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                        <div>
                                            <h1 className="text-2xl font-bold text-gray-900">{patient.fullName}</h1>
                                            <p className="text-sm text-gray-500 mt-1">
                                                Historia #{patient.medicalRecordNum}
                                            </p>
                                        </div>
                                        <Button
                                            variant="outline"
                                            onClick={() => navigate(`/clinical-history/${patientId}`)}
                                            className="gap-2"
                                        >
                                            <ArrowLeft className="h-4 w-4" />
                                            Ver Historia Clínica
                                        </Button>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
                                        <div className="flex items-center gap-2 text-sm bg-gray-50 rounded-lg px-3 py-2">
                                            <CalendarIcon className="h-4 w-4 text-gray-400" />
                                            <span className="text-gray-600">
                                                {patient.birthDate ? format(new Date(patient.birthDate), 'dd/MM/yyyy') : 'No registrada'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm bg-gray-50 rounded-lg px-3 py-2">
                                            <Mail className="h-4 w-4 text-gray-400" />
                                            <span className="text-gray-600 truncate">{patient.email || '-'}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm bg-gray-50 rounded-lg px-3 py-2">
                                            <Phone className="h-4 w-4 text-gray-400" />
                                            <span className="text-gray-600">{patient.phoneNumber || '-'}</span>
                                        </div>
                                        {patient.address && (
                                            <div className="flex items-center gap-2 text-sm bg-gray-50 rounded-lg px-3 py-2 col-span-full lg:col-span-1">
                                                <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                                <span className="text-gray-600 truncate">{patient.address}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Header del tratamiento - Mejorado */}
                <Card className="border-0 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                    <div className="bg-gradient-to-r from-primary-50 to-white px-6 py-4 border-b">
                        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-primary-100 rounded-xl">
                                    <Activity className="h-6 w-6 text-primary-600" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">{treatment.name}</h2>
                                    <div className="flex gap-2 mt-1 flex-wrap">
                                        <Badge className={statusColors[treatment.status]}>
                                            <StatusIcon className="h-3 w-3 mr-1" />
                                            {statusLabels[treatment.status]}
                                        </Badge>
                                        <Badge variant="outline">
                                            {typeLabels[treatment.type] || treatment.type}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2 flex-wrap">
                                <Button variant="outline" onClick={() => navigate('/treatments')} className="gap-2">
                                    <ArrowLeft className="h-4 w-4" />
                                    Volver
                                </Button>
                            </div>
                        </div>
                    </div>

                    {treatment.description && (
                        <CardContent className="pt-4">
                            <div className="flex items-start gap-2 text-gray-700">
                                <FileText className="h-4 w-4 text-gray-400 mt-0.5" />
                                <p>{treatment.description}</p>
                            </div>
                        </CardContent>
                    )}
                </Card>

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