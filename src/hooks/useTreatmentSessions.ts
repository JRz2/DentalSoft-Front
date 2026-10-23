import { useState, useEffect } from 'react';
import { usePatient } from '@/hooks/usePatients';
import { clinicalHistoryService } from '@/services/clinicalHistory.service';
import { appointmentService } from '@/services/appointment.service';
import { treatmentService } from '@/services/treatment.service';
import { useMediaByTreatment, useDeleteMedia } from '@/hooks/useMedia';
import { useStartTreatment, useCompleteTreatment } from '@/hooks/useTreatments';
import { toast } from 'sonner';
import { parseApiError } from '@/lib/apiError';
import { Treatment, TreatmentSession } from '@/types/clinicalHistory';
import { Appointment } from '@/types/appointment';
import { toNumber } from '@/lib/treatmentUtils';

export function useTreatmentSessions(treatmentIdStr?: string, patientIdStr?: string) {
    const treatmentIdNum = treatmentIdStr ? parseInt(treatmentIdStr) : null;
    const patientIdNum = patientIdStr ? parseInt(patientIdStr) : 0;

    // --- ESTADOS DE DATOS ---
    const [treatment, setTreatment] = useState<Treatment | null>(null);
    const [sessions, setSessions] = useState<TreatmentSession[]>([]);
    const [paymentStatus, setPaymentStatus] = useState<any>(null);
    const [appointments, setAppointments] = useState<Appointment[]>([]);

    // --- ESTADOS DE LOADERS ---
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [sessionsLoading, setSessionsLoading] = useState(false);
    const [appointmentsLoading, setAppointmentsLoading] = useState(false);
    const [paymentsLoading, setPaymentsLoading] = useState(false);

    // --- ESTADOS DE MODALES ---
    const [showSessionForm, setShowSessionForm] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [showAppointmentForm, setShowAppointmentForm] = useState(false);
    const [appointmentToEdit, setAppointmentToEdit] = useState<Appointment | null>(null);
    const [showStartDialog, setShowStartDialog] = useState(false);
    const [showCompleteDialog, setShowCompleteDialog] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);

    // Modales de pago
    const [selectedPayment, setSelectedPayment] = useState<any>(null);
    const [showPaymentDetail, setShowPaymentDetail] = useState(false);
    const [showVoidDialog, setShowVoidDialog] = useState(false);
    const [isVoiding, setIsVoiding] = useState(false);

    // Detalle de cita
    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
    const [showAppointmentDetail, setShowAppointmentDetail] = useState(false);

    // --- HOOKS EXTERNOS ---
    const { data: patient, isLoading: patientLoading } = usePatient(patientIdNum);
    const { data: images, isLoading: imagesLoading } = useMediaByTreatment(treatment ? treatment.id : 0);
    const deleteMedia = useDeleteMedia(treatment ? treatment.id : 0);
    const startTreatment = useStartTreatment();
    const completeTreatment = useCompleteTreatment();

    // --- FETCHERS ---
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
            console.error(error);
        }
    };

    const reloadAppointments = async () => {
        if (!treatmentIdNum) return;
        setAppointmentsLoading(true);
        try {
            const data = await appointmentService.getByTreatment(treatmentIdNum);
            setAppointments(data || []);
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
        } finally {
            setPaymentsLoading(false);
        }
    };

    useEffect(() => {
        if (treatmentIdNum) loadAllData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [treatmentIdNum]);

    // --- HANDLERS DE SESIONES ---
    const handleSessionAdded = async () => {
        setShowSessionForm(false);
        await reloadSessions();
    };

    const handleCompleteSession = async (session: TreatmentSession) => {
        try {
            await clinicalHistoryService.completeSession(session.id);
            toast.success('Sesión completada correctamente');
            await Promise.all([reloadSessions(), reloadTreatment()]);
        } catch (error) {
            const parsed = parseApiError(error);
            toast.error(parsed.title || 'Error', { description: parsed.message });
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
            toast.error(parsed.title || 'Error', { description: parsed.message });
            throw error;
        }
    };

    // --- HANDLERS DE CITAS ---
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

    const handleAppointmentCreated = async () => {
        setShowAppointmentForm(false);
        setAppointmentToEdit(null);
        await reloadAppointments();
    };

    const handleViewAppointment = (appointment: Appointment) => {
        setSelectedAppointment(appointment);
        setShowAppointmentDetail(true);
    };

    const handleCompleteAppointment = async (appointment: Appointment) => {
        try {
            await appointmentService.updateStatus(appointment.id, 'COMPLETED');
            toast.success('Cita completada correctamente');
            await reloadAppointments();
        } catch (error) {
            const parsed = parseApiError(error);
            toast.error(parsed.title || 'Error', { description: parsed.message });
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
            toast.error(parsed.title || 'Error', { description: parsed.message });
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
            toast.error(parsed.title || 'Error', { description: parsed.message });
            throw error;
        }
    };

    // --- HANDLERS DE PAGOS ---
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
            toast.error(message || 'Error al anular el pago');
        } finally {
            setIsVoiding(false);
        }
    };

    // --- HANDLERS DE ESTADO DEL TRATAMIENTO ---
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

    // --- CÁLCULOS DERIVADOS ---
    const isPlanned = treatment?.status === 'PLANNED';
    const isInProgress = treatment?.status === 'IN_PROGRESS';
    const isCompleted = treatment?.status === 'COMPLETED';
    const isCancelled = treatment?.status === 'CANCELLED';
    const isFinished = isCompleted || isCancelled;

    const sessionsDisabled = isPlanned || isFinished;
    const appointmentsDisabled = isFinished;
    const imagesDisabled = isCancelled;

    const finalAmountValue = toNumber(paymentStatus?.finalAmount || treatment?.totalCost || 0);
    const amountPaidValue = toNumber(paymentStatus?.amountPaid || 0);
    const remainingBalanceValue = toNumber(paymentStatus?.remainingBalance || 0);
    const paymentsDisabled = remainingBalanceValue <= 0.001;

    return {
        // Datos
        treatment, sessions, appointments, paymentStatus, images, patient,
        // Loaders
        isLoading: isInitialLoading || patientLoading, sessionsLoading, appointmentsLoading, paymentsLoading, imagesLoading,
        // Estados de Modales y Setters
        showSessionForm, setShowSessionForm,
        showUploadModal, setShowUploadModal,
        showAppointmentForm, handleAppointmentFormClose, appointmentToEdit,
        showStartDialog, setShowStartDialog,
        showCompleteDialog, setShowCompleteDialog,
        showPaymentModal, setShowPaymentModal,
        selectedPayment, setSelectedPayment, showPaymentDetail, setShowPaymentDetail,
        showVoidDialog, setShowVoidDialog, isVoiding,
        selectedAppointment, setSelectedAppointment, showAppointmentDetail, setShowAppointmentDetail,
        // Handlers
        handleSessionAdded, handleCompleteSession, handleNoShowSession,
        handleOpenCreateAppointment, handleEditAppointment, handleAppointmentCreated,
        handleViewAppointment, handleCompleteAppointment, handleNoShowAppointment, handleCancelAppointment,
        handlePaymentRegistered, handleViewPayment, handleVoidPaymentClick, handleConfirmVoidPayment,
        confirmStart, confirmComplete,
        // FUNCIONES DE RECARGA
        reloadSessions, reloadAppointments, reloadPayments,
        // Otros
        startTreatment, completeTreatment, deleteMedia,
        nextSessionNumber: sessions.length + 1,
        // Derived States
        isPlanned, isInProgress, isCompleted, isCancelled, isFinished,
        sessionsDisabled, appointmentsDisabled, imagesDisabled, paymentsDisabled,
        imagesDisabledReason: isCancelled ? 'El tratamiento fue cancelado, no se pueden agregar más imágenes' : undefined,
        finalAmountValue, amountPaidValue, remainingBalanceValue
    };
}