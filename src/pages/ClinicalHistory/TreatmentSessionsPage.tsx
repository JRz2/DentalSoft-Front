import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Clock, Stethoscope, CalendarPlus, Image, CreditCard, ListChecks, PlayCircle, CheckCircle2, AlertCircle, ChevronRight, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SessionForm } from '@/components/clinical/SessionForm';
import { SessionTable } from '@/components/clinical/SessionTable';
import { PaymentSummary } from '@/components/treatments/PaymentSummary';
import { PaymentHistory } from '@/components/treatments/PaymentHistory';
import { RegisterPaymentModal } from '@/components/treatments/RegisterPaymentModal';
import { Treatment, TreatmentSession } from '@/types/clinicalHistory';
import { clinicalHistoryService } from '@/services/clinicalHistory.service';
import { usePatient } from '@/hooks/usePatients';
import { toast } from 'sonner';
import { ImageCarousel } from '@/components/treatments/ImageGallery';
import { UploadImageModal } from '@/components/treatments/UploadImageModal';
import { useMediaByTreatment, useDeleteMedia } from '@/hooks/useMedia';
import { AppointmentFromTreatment } from '@/components/treatments/AppointmentFromTreatment';
import { TreatmentAppointmentsList } from '@/components/treatments/TreatmentAppointmentsList';
import { AppointmentDetailDialog } from '@/components/appointments/AppointmentDetailDialog';
import { Appointment } from '@/types/appointment';
import { appointmentService } from '@/services/appointment.service';
import { PaymentDetailDialog } from '@/components/treatments/PaymentDetailDialog';
import { VoidPaymentDialog } from '@/components/treatments/VoidPaymentDialog';
import { useStartTreatment, useCompleteTreatment } from '@/hooks/useTreatments';
import { StartTreatmentDialog } from '@/components/treatments/StartTreatmentDialog';
import { CompleteTreatmentDialog } from '@/components/treatments/CompleteTreatmentDialog';
import { SearchBar } from '@/components/shared/SearchBar';
import { useScrollDirection } from '@/hooks/useScrollDirection';
import dentplusImg from '@/assets/images/dentplus.png';
import { cn } from '@/lib/utils';
import { treatmentService } from '@/services/treatment.service';
import { parseApiError } from '@/lib/apiError';
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

const appointmentStatusLabels: Record<string, string> = {
    SCHEDULED: 'Agendada',
    CONFIRMED: 'Confirmada',
    IN_PROGRESS: 'En curso',
    COMPLETED: 'Completada',
    CANCELLED: 'Cancelada',
    NO_SHOW: 'No asistió',
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

const toNumber = (value: unknown): number => {
    if (typeof value === 'number') return isNaN(value) ? 0 : value;
    if (typeof value === 'string') {
        const parsed = parseFloat(value);
        return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
};

export function TreatmentSessionsPage() {
    const { treatmentId, patientId } = useParams<{ treatmentId: string; patientId: string }>();
    const navigate = useNavigate();

    const [treatment, setTreatment] = useState<Treatment | null>(null);
    const [sessions, setSessions] = useState<TreatmentSession[]>([]);
    const [paymentStatus, setPaymentStatus] = useState<any>(null);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [showSessionForm, setShowSessionForm] = useState(false);

    // Buscador y paginación de sesiones
    const [sessionSearchTerm, setSessionSearchTerm] = useState('');
    const [sessionsCurrentPage, setSessionsCurrentPage] = useState(1);
    const sessionsItemsPerPage = 10;

    // Buscador y paginación de citas
    const [appointmentsSearchTerm, setAppointmentsSearchTerm] = useState('');
    const [appointmentsCurrentPage, setAppointmentsCurrentPage] = useState(1);
    const appointmentsItemsPerPage = 10;

    // Solo carga inicial de la página
    const [isInitialLoading, setIsInitialLoading] = useState(true);

    // Loaders granulares por sección
    const [sessionsLoading, setSessionsLoading] = useState(false);
    const [appointmentsLoading, setAppointmentsLoading] = useState(false);
    const [paymentsLoading, setPaymentsLoading] = useState(false);

    const [showUploadModal, setShowUploadModal] = useState(false);
    const [showAppointmentForm, setShowAppointmentForm] = useState(false);
    const [appointmentToEdit, setAppointmentToEdit] = useState<Appointment | null>(null);
    const [activeTab, setActiveTab] = useState('sessions');

    // Detalle de cita
    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
    const [showAppointmentDetail, setShowAppointmentDetail] = useState(false);

    const [showStartDialog, setShowStartDialog] = useState(false);
    const [showCompleteDialog, setShowCompleteDialog] = useState(false);

    const [selectedPayment, setSelectedPayment] = useState<any>(null);
    const [showPaymentDetail, setShowPaymentDetail] = useState(false);
    const [showVoidDialog, setShowVoidDialog] = useState(false);
    const [isVoiding, setIsVoiding] = useState(false);

    // Modal de registro de pago 
    const [showPaymentModal, setShowPaymentModal] = useState(false);

    const scrollDirection = useScrollDirection();

    const { data: patient, isLoading: patientLoading } = usePatient(parseInt(patientId || '0'));
    const { data: images, isLoading: imagesLoading } = useMediaByTreatment(
        treatment ? treatment.id : 0
    );
    const deleteMedia = useDeleteMedia(treatment ? treatment.id : 0);
    const startTreatment = useStartTreatment();
    const completeTreatment = useCompleteTreatment();

    // ============ LOADERS GRANULARES ============

    const treatmentIdNum = treatmentId ? parseInt(treatmentId) : null;

    const loadAllData = async () => {
        if (!treatmentIdNum) return;
        setIsInitialLoading(true);
        try {
            const [treatmentData, sessionsData, paymentData, appointmentsData] = await Promise.all([
                clinicalHistoryService.getTreatmentById(treatmentIdNum),
                clinicalHistoryService.getSessionsByTreatment(treatmentIdNum),
                clinicalHistoryService.getPaymentStatus(treatmentIdNum),
                appointmentService.getByTreatment(treatmentIdNum),
            ]);
            setTreatment(treatmentData);
            setSessions(sessionsData);
            setPaymentStatus(paymentData);
            setAppointments(appointmentsData || []);
        } catch (error) {
            console.error('Error al cargar datos:', error);
            toast.error('Error al cargar los datos del tratamiento');
        } finally {
            setIsInitialLoading(false);
        }
    };

    const reloadSessions = async () => {
        if (!treatmentIdNum) return;
        setSessionsLoading(true);
        try {
            const data = await clinicalHistoryService.getSessionsByTreatment(treatmentIdNum);
            setSessions(data);
        } catch (error) {
            console.error('Error al recargar sesiones:', error);
        } finally {
            setSessionsLoading(false);
        }
    };

    const reloadTreatment = async () => {
        if (!treatmentIdNum) return;
        try {
            const data = await clinicalHistoryService.getTreatmentById(treatmentIdNum);
            setTreatment(data);
        } catch (error) {
            console.error('Error al recargar tratamiento:', error);
        }
    };

    const reloadAppointments = async () => {
        if (!treatmentIdNum) return;
        setAppointmentsLoading(true);
        try {
            const data = await appointmentService.getByTreatment(treatmentIdNum);
            setAppointments(data || []);
        } catch (error) {
            console.error('Error al recargar citas:', error);
        } finally {
            setAppointmentsLoading(false);
        }
    };

    const reloadPayments = async () => {
        if (!treatmentIdNum) return;
        setPaymentsLoading(true);
        try {
            const data = await clinicalHistoryService.getPaymentStatus(treatmentIdNum);
            setPaymentStatus(data);
        } catch (error) {
            console.error('Error al recargar pagos:', error);
        } finally {
            setPaymentsLoading(false);
        }
    };

    useEffect(() => {
        if (treatmentIdNum) {
            loadAllData();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [treatmentIdNum]);

    useEffect(() => {
        setSessionsCurrentPage(1);
    }, [sessionSearchTerm]);

    useEffect(() => {
        setAppointmentsCurrentPage(1);
    }, [appointmentsSearchTerm]);

    // ============ HANDLERS ============

    const handleSessionAdded = async () => {
        setShowSessionForm(false);
        await reloadSessions();
    };

    const handleAppointmentCreated = async () => {
        setShowAppointmentForm(false);
        setAppointmentToEdit(null);
        await reloadAppointments();
    };

    const handleOpenCreateAppointment = () => {
        setAppointmentToEdit(null);
        setShowAppointmentForm(true);
    };

    const handleEditAppointment = (appointment: Appointment) => {
        setAppointmentToEdit(appointment);
        setShowAppointmentForm(true);
    };

    const handleAppointmentFormClose = (open: boolean) => {
        setShowAppointmentForm(open);
        if (!open) setAppointmentToEdit(null);
    };

    const handleViewAppointment = (appointment: Appointment) => {
        setSelectedAppointment(appointment);
        setShowAppointmentDetail(true);
    };

    const handleCompleteSession = async (session: TreatmentSession) => {
        try {
            await clinicalHistoryService.completeSession(session.id);
            toast.success('Sesión completada correctamente');
            await Promise.all([reloadSessions(), reloadTreatment()]);
        } catch (error) {
            const parsed = parseApiError(error);
            if (parsed.isBusinessError) {
                toast.warning(parsed.title || 'No se pudo completar', {
                    description: parsed.message,
                });
            } else {
                toast.error(parsed.title || 'Error', {
                    description: parsed.message,
                });
            }
            throw error;
        }
    };

    const handleNoShowSession = async (session: TreatmentSession, reason?: string) => {
        try {
            await clinicalHistoryService.noShowSession(session.id, reason);
            toast.success('Inasistencia registrada');
            await reloadSessions();
        } catch (error) {
            const parsed = parseApiError(error);
            if (parsed.isBusinessError) {
                toast.warning(parsed.title || 'No se pudo registrar', {
                    description: parsed.message,
                });
            } else {
                toast.error(parsed.title || 'Error', {
                    description: parsed.message,
                });
            }
            throw error;
        }
    };

    const handleCompleteAppointment = async (appointment: Appointment) => {
        try {
            await appointmentService.updateStatus(appointment.id, 'COMPLETED');
            toast.success('Cita completada correctamente');
            await reloadAppointments();
        } catch (error) {
            const parsed = parseApiError(error);
            if (parsed.isBusinessError) {
                toast.warning(parsed.title || 'No se pudo completar', {
                    description: parsed.message,
                });
            } else {
                toast.error(parsed.title || 'Error', {
                    description: parsed.message,
                });
            }
            throw error;
        }
    };

    const handleNoShowAppointment = async (appointment: Appointment, reason?: string) => {
        try {
            await appointmentService.updateStatus(appointment.id, 'NO_SHOW', reason);
            toast.success('Inasistencia registrada');
            await reloadAppointments();
        } catch (error) {
            const parsed = parseApiError(error);
            if (parsed.isBusinessError) {
                toast.warning(parsed.title || 'No se pudo registrar', {
                    description: parsed.message,
                });
            } else {
                toast.error(parsed.title || 'Error', {
                    description: parsed.message,
                });
            }
            throw error;
        }
    };

    const handleCancelAppointment = async (appointment: Appointment, reason: string) => {
        try {
            await appointmentService.updateStatus(appointment.id, 'CANCELLED', reason);
            toast.success('Cita cancelada correctamente');
            await reloadAppointments();
        } catch (error) {
            const parsed = parseApiError(error);
            if (parsed.isBusinessError) {
                toast.warning(parsed.title || 'No se pudo cancelar', {
                    description: parsed.message,
                });
            } else {
                toast.error(parsed.title || 'Error', {
                    description: parsed.message,
                });
            }
            throw error;
        }
    };

    const handlePaymentRegistered = async () => {
        await reloadPayments();
    };

    const handleViewPayment = (payment: any) => {
        setSelectedPayment(payment);
        setShowPaymentDetail(true);
    };

    const handleVoidPaymentClick = (payment: any) => {
        setSelectedPayment(payment);
        setShowVoidDialog(true);
    };

    const handleConfirmVoidPayment = async (reason: string) => {
        if (!selectedPayment || !treatmentIdNum) return;
        setIsVoiding(true);
        try {
            await treatmentService.voidPayment(treatmentIdNum, selectedPayment.id, { reason });
            toast.success('Pago anulado correctamente');
            setShowVoidDialog(false);
            setSelectedPayment(null);
            await reloadPayments();
        } catch (error: any) {
            const code = error.response?.data?.code;
            const message = error.response?.data?.message;

            if (code === 'PAYMENT_ALREADY_VOIDED') {
                toast.warning('Este pago ya estaba anulado');
                setShowVoidDialog(false);
                setSelectedPayment(null);
                await reloadPayments();
                return;
            }

            console.error('Error al anular pago:', error);
            toast.error(message || 'Error al anular el pago');
        } finally {
            setIsVoiding(false);
        }
    };

    const confirmStart = () => {
        if (!treatment) return;
        startTreatment.mutate(treatment.id, {
            onSuccess: async () => {
                setShowStartDialog(false);
                await Promise.all([reloadTreatment(), reloadSessions()]);
            },
        });
    };

    const confirmComplete = () => {
        if (!treatment) return;
        completeTreatment.mutate(treatment.id, {
            onSuccess: async () => {
                setShowCompleteDialog(false);
                await Promise.all([reloadTreatment(), reloadSessions()]);
            },
        });
    };

    const nextSessionNumber = sessions.length + 1;

    // Filtrado y paginación de sesiones
    const filteredSessions = sessions.filter((s) => {
        if (!sessionSearchTerm) return true;
        const term = sessionSearchTerm.toLowerCase();
        return (
            s.description?.toLowerCase().includes(term) ||
            s.notes?.toLowerCase().includes(term) ||
            String(s.sessionNumber).includes(term)
        );
    });

    const sessionsTotalPages = Math.ceil(filteredSessions.length / sessionsItemsPerPage);
    const paginatedSessions = filteredSessions.slice(
        (sessionsCurrentPage - 1) * sessionsItemsPerPage,
        sessionsCurrentPage * sessionsItemsPerPage
    );

    // Filtrado y paginación de citas
    const filteredAppointments = appointments.filter((a) => {
        if (!appointmentsSearchTerm) return true;
        const term = appointmentsSearchTerm.toLowerCase();
        const dateStr = format(new Date(a.appointmentDate), 'dd/MM/yyyy');
        return (
            a.doctor?.name?.toLowerCase().includes(term) ||
            dateStr.includes(term) ||
            appointmentStatusLabels[a.status]?.toLowerCase().includes(term) ||
            a.status.toLowerCase().includes(term)
        );
    });

    const appointmentsTotalPages = Math.ceil(filteredAppointments.length / appointmentsItemsPerPage);
    const paginatedAppointments = filteredAppointments.slice(
        (appointmentsCurrentPage - 1) * appointmentsItemsPerPage,
        appointmentsCurrentPage * appointmentsItemsPerPage
    );

    const sortedPaginatedAppointments = [...paginatedAppointments].sort(
        (a, b) => new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime()
    );

    const isPlanned = treatment?.status === 'PLANNED';
    const isInProgress = treatment?.status === 'IN_PROGRESS';
    const isCompleted = treatment?.status === 'COMPLETED';
    const isCancelled = treatment?.status === 'CANCELLED';
    const isFinished = isCompleted || isCancelled;

    const sessionsDisabled = isPlanned || isFinished;
    const sessionsDisabledReason = isPlanned
        ? 'Iniciá el tratamiento para registrar sesiones'
        : isFinished
            ? `El tratamiento está ${isCompleted ? 'completado' : 'cancelado'}, no se pueden registrar más sesiones`
            : undefined;

    const appointmentsDisabled = isFinished;
    const appointmentsDisabledReason = isFinished
        ? `El tratamiento está ${isCompleted ? 'completado' : 'cancelado'}, no se pueden agendar más citas`
        : undefined;

    const imagesDisabled = isCancelled;
    const imagesDisabledReason = isCancelled
        ? 'El tratamiento fue cancelado, no se pueden agregar más imágenes'
        : undefined;

    // Cálculo de saldo pendiente para el botón de pagos
    const finalAmountValue = toNumber(paymentStatus?.finalAmount || treatment?.totalCost || 0);
    const amountPaidValue = toNumber(paymentStatus?.amountPaid || 0);
    const remainingBalanceValue = toNumber(paymentStatus?.remainingBalance || 0);
    const paymentStatusValue = (paymentStatus?.paymentStatus as string) || 'UNPAID';
    const hasPendingBalance = remainingBalanceValue > 0.001;
    const paymentsDisabled = !hasPendingBalance;
    const paymentsDisabledReason = !hasPendingBalance
        ? 'El tratamiento ya está completamente pagado'
        : undefined;

    if (isInitialLoading || patientLoading) {
        return (
            <div className="space-y-3 md:space-y-6">
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-40 w-full" />
                <Skeleton className="h-96 w-full" />
            </div>
        );
    }

    if (!treatment) return null;

    return (
        <div className="space-y-3 md:space-y-6">

            {/* Header unificado */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 px-3 md:px-6 py-3 md:py-4 border-b border-gray-100">
                    <div className="flex items-center gap-3 min-w-0">
                        <img
                            src={dentplusImg}
                            alt="Tratamiento"
                            className="w-12 h-12 md:w-16 md:h-16 rounded-full object-cover shrink-0"
                        />
                        <div className="min-w-0">
                            <h1 className="text-lg md:text-2xl font-bold text-gray-900">
                                Tratamiento
                            </h1>
                            <p className="text-xs md:text-sm text-gray-500 mt-0.5 hidden sm:block">
                                Registro completo del tratamiento y sesiones
                            </p>
                        </div>
                    </div>
                    <Button
                        variant="outline"
                        onClick={() => navigate('/treatments')}
                        className="shrink-0 w-full sm:w-auto"
                    >
                        Volver a Tratamientos
                    </Button>
                </div>

                <div className="p-3 md:p-6">
                    <div className="flex flex-col md:flex-row gap-3 md:gap-6">
                        <div
                            className="flex justify-center md:justify-start shrink-0 cursor-pointer group"
                            onClick={() => navigate(`/clinical-history/${patientId}`)}
                            title="Ver historia clínica completa"
                        >
                            <div className="h-20 w-20 md:h-24 md:w-24 rounded-full border-4 border-primary-100 group-hover:border-primary-300 overflow-hidden bg-gray-50 flex items-center justify-center transition-colors">
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
                                    className="text-gray-700 text-lg md:text-2xl font-semibold"
                                    style={{ display: patient?.photoUrl && patient.photoUrl.trim() !== '' ? 'none' : 'block' }}
                                >
                                    {getInitials(patient?.fullName as string)}
                                </span>
                            </div>
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                                <div className="min-w-0 text-center md:text-left">
                                    <div
                                        className="flex items-center justify-center md:justify-start gap-1.5 cursor-pointer group w-full md:w-fit"
                                        onClick={() => navigate(`/clinical-history/${patientId}`)}
                                        title="Ver historia clínica completa"
                                    >
                                        <h2 className="text-xl md:text-2xl font-bold text-gray-900 group-hover:text-primary-600 transition-colors truncate">
                                            {patient?.fullName}
                                        </h2>
                                        <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-primary-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                                    </div>
                                    <p className="text-xs text-gray-400 mt-0.5">
                                        Ver historia clínica completa
                                    </p>
                                    <p className="text-gray-500 mt-2 flex items-center justify-center md:justify-start gap-2">
                                        <Stethoscope className="h-4 w-4 text-primary-500 shrink-0" />
                                        <span className="truncate">{treatment.name}</span>
                                    </p>
                                </div>

                                {(isPlanned || isInProgress) && (
                                    <div className="flex gap-2 flex-wrap justify-center md:justify-end shrink-0">
                                        {isPlanned && (
                                            <Button
                                                onClick={() => setShowStartDialog(true)}
                                                className="gap-2 bg-amber-600 hover:bg-amber-700 w-full sm:w-auto"
                                            >
                                                <PlayCircle className="h-4 w-4" />
                                                Iniciar Tratamiento
                                            </Button>
                                        )}
                                        {isInProgress && (
                                            <Button
                                                onClick={() => setShowCompleteDialog(true)}
                                                className="gap-2 bg-green-600 hover:bg-green-700 w-full sm:w-auto"
                                            >
                                                <CheckCircle2 className="h-4 w-4" />
                                                Completar Tratamiento
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 mt-3 md:mt-5">
                                <div className="flex items-center justify-center md:justify-start gap-2 text-sm min-w-0">
                                    <Stethoscope className="h-4 w-4 text-gray-400 shrink-0" />
                                    <span className="text-gray-600 truncate">Tipo: {typeLabels[treatment.type] || treatment.type}</span>
                                </div>
                                <div className="flex items-center justify-center md:justify-start gap-2 text-sm min-w-0">
                                    <Clock className="h-4 w-4 text-gray-400 shrink-0" />
                                    <span className="text-gray-600 truncate">{treatment.estimatedSessions} sesiones</span>
                                </div>
                                <div className="flex items-center justify-center md:justify-start gap-2 text-sm">
                                    <Badge className={statusColors[treatment.status]}>
                                        {statusLabels[treatment.status]}
                                    </Badge>
                                </div>
                            </div>

                            <div className="mt-3 md:mt-4 pt-3 md:pt-4 border-t border-gray-100">
                                <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3 text-sm text-center sm:text-left">
                                    <span className="font-medium text-gray-700 shrink-0">Descripción:</span>
                                    <span className="text-gray-600">
                                        {treatment.description || 'No se ha registrado una descripción para este tratamiento'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Banner no iniciado */}
            {isPlanned && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 md:p-4 flex flex-col sm:flex-row items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
                    <div className="flex-1">
                        <p className="text-sm font-medium text-amber-800">
                            Este tratamiento aún no ha sido iniciado
                        </p>
                        <p className="text-sm text-amber-700 mt-0.5">
                            Para registrar sesiones necesitás iniciarlo primero. Citas, imágenes y pagos siguen disponibles.
                        </p>
                    </div>
                    <Button
                        onClick={() => setShowStartDialog(true)}
                        size="sm"
                        className="gap-2 bg-amber-600 hover:bg-amber-700 shrink-0 w-full sm:w-auto"
                    >
                        <PlayCircle className="h-4 w-4" />
                        Iniciar ahora
                    </Button>
                </div>
            )}

            {/* Banner finalizado */}
            {isFinished && (
                <div className={`rounded-xl p-3 md:p-4 flex items-start gap-3 border ${isCompleted ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    <Lock className={`h-5 w-5 mt-0.5 shrink-0 ${isCompleted ? 'text-green-600' : 'text-red-600'}`} />
                    <div className="flex-1">
                        <p className={`text-sm font-medium ${isCompleted ? 'text-green-800' : 'text-red-800'}`}>
                            Tratamiento {isCompleted ? 'completado' : 'cancelado'}
                        </p>
                        <p className={`text-sm mt-0.5 ${isCompleted ? 'text-green-700' : 'text-red-700'}`}>
                            {isCompleted
                                ? 'No se pueden registrar más sesiones ni agendar citas. Todavía podés subir imágenes de resultado final y registrar pagos pendientes.'
                                : 'No se pueden registrar sesiones, agendar citas ni subir imágenes. Si queda saldo pendiente, todavía podés registrarlo en la pestaña de pagos.'}
                        </p>
                    </div>
                </div>
            )}

            {/* TABS */}
            <div className="w-full">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex flex-col">
                    <TabsList className="w-full max-w-2xl mx-auto grid grid-cols-4 h-auto p-1 gap-1 bg-gray-100/80 rounded-xl">
                        <TabsTrigger
                            value="sessions"
                            className={cn(
                                "flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-2",
                                "py-2 sm:py-2.5 px-1 sm:px-3 rounded-lg",
                                "text-[10px] sm:text-sm font-medium",
                                "transition-all duration-200",
                                "data-[state=active]:bg-white data-[state=active]:text-primary-700",
                                "data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-primary-100"
                            )}
                        >
                            <ListChecks className="h-4 w-4 sm:h-4 sm:w-4 shrink-0" />
                            <span className="leading-tight text-center">Sesiones</span>
                            <Badge variant="secondary" className="text-[9px] sm:text-xs h-4 sm:h-5 px-1 min-w-[16px] sm:min-w-[20px] justify-center shrink-0 mt-0.5 sm:mt-0">
                                {sessions.length}
                            </Badge>
                        </TabsTrigger>

                        <TabsTrigger
                            value="appointments"
                            className={cn(
                                "flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-2",
                                "py-2 sm:py-2.5 px-1 sm:px-3 rounded-lg",
                                "text-[10px] sm:text-sm font-medium",
                                "transition-all duration-200",
                                "data-[state=active]:bg-white data-[state=active]:text-primary-700",
                                "data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-primary-100"
                            )}
                        >
                            <CalendarPlus className="h-4 w-4 shrink-0" />
                            <span className="leading-tight text-center">Citas</span>
                            <Badge variant="secondary" className="text-[9px] sm:text-xs h-4 sm:h-5 px-1 min-w-[16px] sm:min-w-[20px] justify-center shrink-0 mt-0.5 sm:mt-0">
                                {appointments.length}
                            </Badge>
                        </TabsTrigger>

                        <TabsTrigger
                            value="images"
                            className={cn(
                                "flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-2",
                                "py-2 sm:py-2.5 px-1 sm:px-3 rounded-lg",
                                "text-[10px] sm:text-sm font-medium",
                                "transition-all duration-200",
                                "data-[state=active]:bg-white data-[state=active]:text-primary-700",
                                "data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-primary-100"
                            )}
                        >
                            <Image className="h-4 w-4 shrink-0" />
                            <span className="leading-tight text-center">Imágenes</span>
                            <Badge variant="secondary" className="text-[9px] sm:text-xs h-4 sm:h-5 px-1 min-w-[16px] sm:min-w-[20px] justify-center shrink-0 mt-0.5 sm:mt-0">
                                {images?.length || 0}
                            </Badge>
                        </TabsTrigger>

                        <TabsTrigger
                            value="payments"
                            className={cn(
                                "flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-2",
                                "py-2 sm:py-2.5 px-1 sm:px-3 rounded-lg",
                                "text-[10px] sm:text-sm font-medium",
                                "transition-all duration-200",
                                "data-[state=active]:bg-white data-[state=active]:text-primary-700",
                                "data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-primary-100"
                            )}
                        >
                            <CreditCard className="h-4 w-4 shrink-0" />
                            <span className="leading-tight text-center">Pagos</span>
                            <Badge variant="secondary" className="text-[9px] sm:text-xs h-4 sm:h-5 px-1 min-w-[16px] sm:min-w-[20px] justify-center shrink-0 mt-0.5 sm:mt-0">
                                {paymentStatus?.payments?.length || 0}
                            </Badge>
                        </TabsTrigger>
                    </TabsList>

                    {/* SESIONES */}
                    <TabsContent value="sessions" className="mt-4 md:mt-6 w-full">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
                            <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-100 px-3 md:px-6 py-2.5 md:py-4 rounded-t-2xl">
                                <div className="flex flex-col gap-2.5 md:gap-3">
                                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-3">
                                        <div className="min-w-0">
                                            <h2 className="text-base md:text-lg font-semibold text-gray-900 flex items-center gap-2">
                                                <ListChecks className="h-5 w-5 text-primary-600 shrink-0" />
                                                Sesiones realizadas
                                            </h2>
                                            <p className="text-xs md:text-sm text-gray-500 mt-0.5">
                                                {filteredSessions.length}{' '}
                                                {filteredSessions.length === 1 ? 'sesión' : 'sesiones'}
                                                {sessionSearchTerm && ` · filtradas de ${sessions.length}`}
                                            </p>
                                        </div>
                                        <div className="flex flex-col items-stretch sm:items-end gap-1.5">
                                            <Button
                                                onClick={() => setShowSessionForm(true)}
                                                disabled={sessionsDisabled}
                                                size="sm"
                                                className="gap-2 rounded-lg w-full sm:w-auto hidden sm:flex"
                                                title={sessionsDisabledReason}
                                            >
                                                <Plus className="h-4 w-4" />
                                                Nueva Sesión
                                            </Button>
                                            {sessionsDisabledReason && (
                                                <span className="text-xs text-gray-500 flex items-center gap-1 sm:justify-end">
                                                    <Lock className="h-3 w-3 shrink-0" />
                                                    {sessionsDisabledReason}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {sessions.length > 0 && (
                                        <SearchBar
                                            onSearch={setSessionSearchTerm}
                                            placeholder="Buscar por descripción, notas o #..."
                                            delay={400}
                                        />
                                    )}
                                </div>
                            </div>

                            <div className="p-3 md:p-6 rounded-b-2xl">
                                <SessionTable
                                    data={paginatedSessions}
                                    isLoading={sessionsLoading}
                                    treatmentId={treatment.id}
                                    onComplete={handleCompleteSession}
                                    onNoShow={handleNoShowSession}
                                    onSessionUpdated={reloadSessions}
                                    actionsDisabled={isFinished}
                                    actionsDisabledReason={
                                        isFinished
                                            ? `El tratamiento está ${isCompleted ? 'completado' : 'cancelado'}`
                                            : undefined
                                    }
                                    pagination={{
                                        currentPage: sessionsCurrentPage,
                                        totalPages: sessionsTotalPages,
                                        totalItems: filteredSessions.length,
                                        itemsPerPage: sessionsItemsPerPage,
                                        onPageChange: setSessionsCurrentPage,
                                    }}
                                />
                            </div>
                        </div>
                    </TabsContent>

                    {/* CITAS */}
                    <TabsContent value="appointments" className="mt-4 md:mt-6 w-full">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
                            <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-100 px-3 md:px-6 py-2.5 md:py-4 rounded-t-2xl">
                                <div className="flex flex-col gap-2.5 md:gap-3">
                                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-3">
                                        <div className="min-w-0">
                                            <h2 className="text-base md:text-lg font-semibold text-gray-900 flex items-center gap-2">
                                                <CalendarPlus className="h-5 w-5 text-primary-600 shrink-0" />
                                                Citas del Tratamiento
                                            </h2>
                                            <p className="text-xs md:text-sm text-gray-500 mt-0.5">
                                                {filteredAppointments.length}{' '}
                                                {filteredAppointments.length === 1 ? 'cita' : 'citas'}
                                                {appointmentsSearchTerm && ` · filtradas de ${appointments.length}`}
                                            </p>
                                        </div>
                                        <div className="flex flex-col items-stretch sm:items-end gap-1.5">
                                            <Button
                                                onClick={handleOpenCreateAppointment}
                                                disabled={appointmentsDisabled}
                                                size="sm"
                                                className="gap-2 rounded-lg w-full sm:w-auto hidden sm:flex"
                                                title={appointmentsDisabledReason}
                                            >
                                                <Plus className="h-4 w-4" />
                                                Agendar Cita
                                            </Button>
                                            {appointmentsDisabledReason && (
                                                <span className="text-xs text-gray-500 flex items-center gap-1 sm:justify-end">
                                                    <Lock className="h-3 w-3 shrink-0" />
                                                    {appointmentsDisabledReason}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {appointments.length > 0 && (
                                        <SearchBar
                                            onSearch={setAppointmentsSearchTerm}
                                            placeholder="Buscar por doctor, fecha o estado..."
                                            delay={400}
                                        />
                                    )}
                                </div>
                            </div>

                            <div className="p-3 md:p-6 rounded-b-2xl">
                                <TreatmentAppointmentsList
                                    appointments={sortedPaginatedAppointments}
                                    isLoading={appointmentsLoading}
                                    onViewAppointment={handleViewAppointment}
                                    onEdit={handleEditAppointment}
                                    onComplete={handleCompleteAppointment}
                                    onNoShow={handleNoShowAppointment}
                                    onCancel={handleCancelAppointment}
                                    actionsDisabled={appointmentsDisabled}
                                    actionsDisabledReason={appointmentsDisabledReason}
                                    pagination={{
                                        currentPage: appointmentsCurrentPage,
                                        totalPages: appointmentsTotalPages,
                                        totalItems: filteredAppointments.length,
                                        itemsPerPage: appointmentsItemsPerPage,
                                        onPageChange: setAppointmentsCurrentPage,
                                    }}
                                />
                            </div>
                        </div>
                    </TabsContent>

                    {/* IMÁGENES */}
                    <TabsContent value="images" className="mt-4 md:mt-6 w-full">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
                            {/* Sticky header: título + botón */}
                            <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-100 px-3 md:px-6 py-2.5 md:py-4 rounded-t-2xl">
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-3">
                                    <div className="min-w-0">
                                        <h2 className="text-base md:text-lg font-semibold text-gray-900 flex items-center gap-2">
                                            <Image className="h-5 w-5 text-primary-600 shrink-0" />
                                            Galería de Imágenes
                                        </h2>
                                        <p className="text-xs md:text-sm text-gray-500 mt-0.5">
                                            {images?.length || 0}{' '}
                                            {(images?.length || 0) === 1 ? 'imagen registrada' : 'imágenes registradas'}
                                            {treatment?.name && (
                                                <span className="hidden lg:inline"> · {treatment.name}</span>
                                            )}
                                        </p>
                                    </div>
                                    <div className="flex flex-col items-stretch sm:items-end gap-1.5">
                                        <Button
                                            onClick={() => setShowUploadModal(true)}
                                            disabled={imagesDisabled}
                                            size="sm"
                                            className="gap-2 rounded-lg w-full sm:w-auto hidden sm:flex"
                                            title={imagesDisabledReason}
                                        >
                                            <Plus className="h-4 w-4" />
                                            Nueva Imagen
                                        </Button>
                                        {imagesDisabledReason && (
                                            <span className="text-xs text-gray-500 flex items-center gap-1 sm:justify-end">
                                                <Lock className="h-3 w-3 shrink-0" />
                                                {imagesDisabledReason}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Contenido */}
                            <div className="p-3 md:p-6 rounded-b-2xl">
                                {treatment && (
                                    <ImageCarousel
                                        images={images || []}
                                        isLoading={imagesLoading}
                                        treatmentName={treatment.name}
                                        onUpload={() => setShowUploadModal(true)}
                                        onDelete={(id) => deleteMedia.mutateAsync(id)}
                                        disabled={imagesDisabled}
                                        disabledReason={imagesDisabledReason}
                                        hideHeader
                                    />
                                )}
                            </div>
                        </div>
                    </TabsContent>

                    {/* PAGOS */}
                    <TabsContent value="payments" className="mt-4 md:mt-6 w-full">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
                            {/* Sticky header: título + botón (consistente con sessions/citas/imágenes) */}
                            <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-100 px-3 md:px-6 py-2.5 md:py-4 rounded-t-2xl">
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-3">
                                    <div className="min-w-0">
                                        <h2 className="text-base md:text-lg font-semibold text-gray-900 flex items-center gap-2">
                                            <CreditCard className="h-5 w-5 text-primary-600 shrink-0" />
                                            Pagos del Tratamiento
                                        </h2>
                                        <p className="text-xs md:text-sm text-gray-500 mt-0.5">
                                            {paymentStatus?.payments?.length || 0}{' '}
                                            {(paymentStatus?.payments?.length || 0) === 1 ? 'pago registrado' : 'pagos registrados'}
                                        </p>
                                    </div>
                                    <div className="flex flex-col items-stretch sm:items-end gap-1.5">
                                        <Button
                                            onClick={() => setShowPaymentModal(true)}
                                            disabled={paymentsDisabled}
                                            size="sm"
                                            className="gap-2 rounded-lg w-full sm:w-auto hidden sm:flex"
                                            title={paymentsDisabledReason}
                                        >
                                            <Plus className="h-4 w-4" />
                                            Agregar Pago
                                        </Button>
                                        {paymentsDisabledReason && (
                                            <span className="text-xs text-gray-500 flex items-center gap-1 sm:justify-end">
                                                <CheckCircle2 className="h-3 w-3 shrink-0" />
                                                {paymentsDisabledReason}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Contenido */}
                            <div className="p-3 md:p-6 space-y-4 md:space-y-6 rounded-b-2xl">
                                {paymentStatus && (
                                    <Card>
                                        <CardHeader className="p-4 md:p-6">
                                            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                                                <CreditCard className="h-5 w-5 text-primary-600 shrink-0" />
                                                Resumen de Pagos
                                            </CardTitle>
                                            <CardDescription>
                                                {paymentStatus.payments?.length || 0} pagos registrados
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="p-3 md:p-6 pt-0 md:pt-0">
                                            <PaymentSummary
                                                paymentStatus={paymentStatus}
                                                treatmentId={treatment.id}
                                                isCompleted={isCompleted}
                                                canEditCost={!isCancelled}
                                                onCostUpdated={reloadPayments}
                                            />
                                        </CardContent>
                                    </Card>
                                )}

                                {paymentStatus && (
                                    <Card>
                                        <CardHeader className="p-4 md:p-6">
                                            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                                                Historial de Pagos
                                            </CardTitle>
                                            <CardDescription>
                                                {paymentStatus.payments?.length || 0} pagos registrados
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="p-3 md:p-6 pt-0 md:pt-0">
                                            <PaymentHistory
                                                payments={paymentStatus?.payments || []}
                                                amountPaid={amountPaidValue}
                                                remainingBalance={remainingBalanceValue}
                                                paymentStatus={paymentStatusValue}
                                                isLoading={paymentsLoading}
                                                isCancelled={isCancelled}
                                                onViewPayment={handleViewPayment}
                                                onVoidPayment={handleVoidPaymentClick}
                                                canEdit={false}
                                                canVoid={true}
                                            />
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>

            {/* Modales */}
            <SessionForm
                open={showSessionForm}
                onOpenChange={setShowSessionForm}
                treatmentId={treatment.id}
                nextSessionNumber={nextSessionNumber}
                onSuccess={handleSessionAdded}
            />

            {treatment && (
                <UploadImageModal
                    open={showUploadModal}
                    onOpenChange={setShowUploadModal}
                    treatmentId={treatment.id}
                    sessions={sessions.map(s => ({ id: s.id, sessionNumber: s.sessionNumber }))}
                    onSuccess={() => {
                        setShowUploadModal(false);
                    }}
                />
            )}

            {treatment && patient && (
                <AppointmentFromTreatment
                    open={showAppointmentForm}
                    onOpenChange={handleAppointmentFormClose}
                    patientId={patient.id}
                    treatmentId={treatment.id}
                    treatmentName={treatment.name}
                    sessions={sessions.map(s => ({ id: s.id, sessionNumber: s.sessionNumber }))}
                    onSuccess={handleAppointmentCreated}
                    defaultDate={new Date().toISOString().split('T')[0]}
                    appointmentToEdit={appointmentToEdit}
                />
            )}

            <StartTreatmentDialog
                open={showStartDialog}
                onOpenChange={setShowStartDialog}
                treatmentName={treatment.name}
                onConfirm={confirmStart}
                isLoading={startTreatment.isPending}
            />

            <CompleteTreatmentDialog
                open={showCompleteDialog}
                onOpenChange={setShowCompleteDialog}
                treatmentName={treatment.name}
                onConfirm={confirmComplete}
                isLoading={completeTreatment.isPending}
            />

            <PaymentDetailDialog
                open={showPaymentDetail}
                onOpenChange={(open) => {
                    setShowPaymentDetail(open);
                    if (!open) setSelectedPayment(null);
                }}
                payment={selectedPayment}
            />

            <VoidPaymentDialog
                open={showVoidDialog}
                onOpenChange={(open) => {
                    setShowVoidDialog(open);
                    if (!open) setSelectedPayment(null);
                }}
                paymentAmount={selectedPayment?.amount || 0}
                onConfirm={handleConfirmVoidPayment}
                isLoading={isVoiding}
            />

            {/* Modal de registro de pago */}
            {treatment && (
                <RegisterPaymentModal
                    open={showPaymentModal}
                    onOpenChange={setShowPaymentModal}
                    treatmentId={treatment.id}
                    totalCost={finalAmountValue}
                    totalPaid={amountPaidValue}
                    remainingBalance={remainingBalanceValue}
                    onSuccess={() => {
                        setShowPaymentModal(false);
                        handlePaymentRegistered();
                    }}
                />
            )}

            {/* Detalle de cita */}
            <AppointmentDetailDialog
                open={showAppointmentDetail}
                onOpenChange={(open) => {
                    setShowAppointmentDetail(open);
                    if (!open) setSelectedAppointment(null);
                }}
                appointment={selectedAppointment}
            />

            {/* FAB móvil: cambia según el tab activo */}
            {activeTab === 'sessions' && !sessionsDisabled && (
                <button
                    type="button"
                    onClick={() => setShowSessionForm(true)}
                    aria-label="Nueva Sesión"
                    className={cn(
                        "fixed right-5 z-50 sm:hidden",
                        "h-14 w-14 rounded-full",
                        "bg-blue-600 hover:bg-blue-700 text-white",
                        "flex items-center justify-center",
                        "shadow-xl shadow-blue-600/30",
                        "hover:shadow-2xl hover:shadow-blue-600/40",
                        "active:scale-95 transition-all duration-300 ease-out",
                        scrollDirection === 'down'
                            ? "translate-y-24 opacity-0 pointer-events-none"
                            : "translate-y-0 opacity-100"
                    )}
                    style={{
                        bottom: 'calc(1.25rem + env(safe-area-inset-bottom))',
                    }}
                >
                    <Plus className="h-6 w-6" strokeWidth={2.5} />
                </button>
            )}

            {activeTab === 'appointments' && !appointmentsDisabled && (
                <button
                    type="button"
                    onClick={handleOpenCreateAppointment}
                    aria-label="Agendar Cita"
                    className={cn(
                        "fixed right-5 z-50 sm:hidden",
                        "h-14 w-14 rounded-full",
                        "bg-blue-600 hover:bg-blue-700 text-white",
                        "flex items-center justify-center",
                        "shadow-xl shadow-blue-600/30",
                        "hover:shadow-2xl hover:shadow-blue-600/40",
                        "active:scale-95 transition-all duration-300 ease-out",
                        scrollDirection === 'down'
                            ? "translate-y-24 opacity-0 pointer-events-none"
                            : "translate-y-0 opacity-100"
                    )}
                    style={{
                        bottom: 'calc(1.25rem + env(safe-area-inset-bottom))',
                    }}
                >
                    <Plus className="h-6 w-6" strokeWidth={2.5} />
                </button>
            )}

            {activeTab === 'images' && !imagesDisabled && (
                <button
                    type="button"
                    onClick={() => setShowUploadModal(true)}
                    aria-label="Nueva Imagen"
                    className={cn(
                        "fixed right-5 z-50 sm:hidden",
                        "h-14 w-14 rounded-full",
                        "bg-blue-600 hover:bg-blue-700 text-white",
                        "flex items-center justify-center",
                        "shadow-xl shadow-blue-600/30",
                        "hover:shadow-2xl hover:shadow-blue-600/40",
                        "active:scale-95 transition-all duration-300 ease-out",
                        scrollDirection === 'down'
                            ? "translate-y-24 opacity-0 pointer-events-none"
                            : "translate-y-0 opacity-100"
                    )}
                    style={{
                        bottom: 'calc(1.25rem + env(safe-area-inset-bottom))',
                    }}
                >
                    <Plus className="h-6 w-6" strokeWidth={2.5} />
                </button>
            )}

            {/* FAB móvil para Pagos */}
            {activeTab === 'payments' && !paymentsDisabled && (
                <button
                    type="button"
                    onClick={() => setShowPaymentModal(true)}
                    aria-label="Agregar Pago"
                    className={cn(
                        "fixed right-5 z-50 sm:hidden",
                        "h-14 w-14 rounded-full",
                        "bg-blue-600 hover:bg-blue-700 text-white",
                        "flex items-center justify-center",
                        "shadow-xl shadow-blue-600/30",
                        "hover:shadow-2xl hover:shadow-blue-600/40",
                        "active:scale-95 transition-all duration-300 ease-out",
                        scrollDirection === 'down'
                            ? "translate-y-24 opacity-0 pointer-events-none"
                            : "translate-y-0 opacity-100"
                    )}
                    style={{
                        bottom: 'calc(1.25rem + env(safe-area-inset-bottom))',
                    }}
                >
                    <Plus className="h-6 w-6" strokeWidth={2.5} />
                </button>
            )}
        </div>
    );
}