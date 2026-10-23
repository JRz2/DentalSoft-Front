import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Clock, Stethoscope, CalendarPlus, Image, CreditCard, ListChecks, PlayCircle, CheckCircle2, AlertCircle, ChevronRight, Lock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SessionForm } from '@/components/clinical/SessionForm';
import { RegisterPaymentModal } from '@/components/treatments/RegisterPaymentModal';
import { UploadImageModal } from '@/components/treatments/UploadImageModal';
import { AppointmentFromTreatment } from '@/components/treatments/AppointmentFromTreatment';
import { AppointmentDetailDialog } from '@/components/appointments/AppointmentDetailDialog';
import { PaymentDetailDialog } from '@/components/treatments/PaymentDetailDialog';
import { VoidPaymentDialog } from '@/components/treatments/VoidPaymentDialog';
import { StartTreatmentDialog } from '@/components/treatments/StartTreatmentDialog';
import { CompleteTreatmentDialog } from '@/components/treatments/CompleteTreatmentDialog';
import { cn } from '@/lib/utils';
import { usePageHeader } from '@/contexts/PageHeaderContext';
import { typeLabels, statusColors, statusLabels, getInitials, getImageUrl } from '@/lib/treatmentUtils';
import { TreatmentSessionsTab } from '@/components/treatments/tabs/TreatmentSessionsTab';
import { TreatmentAppointmentsTab } from '@/components/treatments/tabs/TreatmentAppointmentsTab';
import { TreatmentImagesTab } from '@/components/treatments/tabs/TreatmentImagesTab';
import { TreatmentPaymentsTab } from '@/components/treatments/tabs/TreatmentPaymentsTab';
import { TreatmentMobileFAB } from '@/components/treatments/TreatmentMobileFAB';
import { useTreatmentSessions } from '@/hooks/useTreatmentSessions';

export function TreatmentSessionsPage() {
    const { treatmentId, patientId } = useParams<{ treatmentId: string; patientId: string }>();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('sessions');

    usePageHeader('Tratamiento', 'Registro completo del tratamiento y sesiones.');

    const {
        treatment, sessions, appointments, paymentStatus, images, patient,
        isLoading, sessionsLoading, appointmentsLoading, paymentsLoading, imagesLoading,
        
        showSessionForm, setShowSessionForm,
        showUploadModal, setShowUploadModal,
        showAppointmentForm, handleAppointmentFormClose, appointmentToEdit,
        showStartDialog, setShowStartDialog,
        showCompleteDialog, setShowCompleteDialog,
        showPaymentModal, setShowPaymentModal,

        selectedPayment, setSelectedPayment, showPaymentDetail, setShowPaymentDetail,
        showVoidDialog, setShowVoidDialog, isVoiding,
        selectedAppointment, setSelectedAppointment, showAppointmentDetail, setShowAppointmentDetail,
        
        handleSessionAdded, handleCompleteSession, handleNoShowSession,
        handleOpenCreateAppointment, handleEditAppointment, handleAppointmentCreated,
        handleViewAppointment, handleCompleteAppointment, handleNoShowAppointment, handleCancelAppointment,
        handlePaymentRegistered, handleViewPayment, handleVoidPaymentClick, handleConfirmVoidPayment,
        confirmStart, confirmComplete,
        
        startTreatment, completeTreatment, deleteMedia, nextSessionNumber,
        isPlanned, isInProgress, isCompleted, isCancelled, isFinished,
        sessionsDisabled, appointmentsDisabled, imagesDisabled, paymentsDisabled, imagesDisabledReason,
        finalAmountValue, amountPaidValue, remainingBalanceValue,
        
        reloadSessions, reloadAppointments, reloadPayments
    } = useTreatmentSessions(treatmentId, patientId);

    if (isLoading) {
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
            {/* HEADER Y BANNERS (Igual que antes) */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
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
                                <div className="flex justify-center md:justify-end shrink-0">
                                    <Button
                                        variant="outline"
                                        onClick={() => navigate('/treatments')}
                                        className="w-full sm:w-auto"
                                    >
                                        Volver a Tratamientos
                                    </Button>
                                </div>
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

            {isPlanned && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 md:p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 sm:mt-0 shrink-0" />
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
                        className="gap-2 bg-amber-600 hover:bg-amber-700 shrink-0 w-full sm:w-auto rounded-lg"
                    >
                        <PlayCircle className="h-4 w-4" />
                        Iniciar Tratamiento
                    </Button>
                </div>
            )}

            {isInProgress && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 md:p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <Clock className="h-5 w-5 text-blue-600 mt-0.5 sm:mt-0 shrink-0" />
                    <div className="flex-1">
                        <p className="text-sm font-medium text-blue-800">
                            El tratamiento está en curso
                        </p>
                        <p className="text-sm text-blue-700 mt-0.5">
                            Podés continuar registrando sesiones y agendando citas. Cuando hayas terminado todo el plan, marcalo como completado.
                        </p>
                    </div>
                    <Button
                        onClick={() => setShowCompleteDialog(true)}
                        size="sm"
                        className="gap-2 bg-green-600 hover:bg-green-700 shrink-0 w-full sm:w-auto text-white rounded-lg"
                    >
                        <CheckCircle2 className="h-4 w-4" />
                        Completar Tratamiento
                    </Button>
                </div>
            )}

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

                    <TabsContent value="sessions" className="mt-4 md:mt-6 w-full">
                        <TreatmentSessionsTab
                            treatment={treatment}
                            sessions={sessions}
                            isLoading={sessionsLoading}
                            onRefresh={reloadSessions}
                            onOpenCreateSession={() => setShowSessionForm(true)}
                            onCompleteSession={handleCompleteSession}
                            onNoShowSession={handleNoShowSession}
                            isFinished={isFinished}
                            isCompleted={isCompleted}
                        />
                    </TabsContent>

                    <TabsContent value="appointments" className="mt-4 md:mt-6 w-full">
                        <TreatmentAppointmentsTab
                            treatment={treatment}
                            appointments={appointments}
                            isLoading={appointmentsLoading}
                            onRefresh={reloadAppointments}
                            onOpenCreateAppointment={handleOpenCreateAppointment}
                            onEditAppointment={handleEditAppointment}
                            onViewAppointment={handleViewAppointment}
                            onCompleteAppointment={handleCompleteAppointment}
                            onNoShowAppointment={handleNoShowAppointment}
                            onCancelAppointment={handleCancelAppointment}
                            isFinished={isFinished}
                            isCompleted={isCompleted}
                        />
                    </TabsContent>

                    <TabsContent value="images" className="mt-4 md:mt-6 w-full">
                        <TreatmentImagesTab
                            treatment={treatment}
                            images={images || []}
                            isLoading={imagesLoading}
                            onOpenUploadModal={() => setShowUploadModal(true)}
                            onDeleteImage={(id) => deleteMedia.mutateAsync(id)}
                            imagesDisabled={imagesDisabled}
                            imagesDisabledReason={imagesDisabledReason}
                        />
                    </TabsContent>

                    <TabsContent value="payments" className="mt-4 md:mt-6 w-full">
                        <TreatmentPaymentsTab
                            treatment={treatment}
                            paymentStatus={paymentStatus}
                            isLoading={paymentsLoading}
                            isCompleted={isCompleted}
                            isCancelled={isCancelled}
                            onOpenPaymentModal={() => setShowPaymentModal(true)}
                            onViewPayment={handleViewPayment}
                            onVoidPayment={handleVoidPaymentClick}
                            onCostUpdated={reloadPayments}
                        />
                    </TabsContent>
                </Tabs>
            </div>

            <SessionForm
                open={showSessionForm}
                onOpenChange={setShowSessionForm}
                treatmentId={treatment.id}
                nextSessionNumber={nextSessionNumber}
                onSuccess={handleSessionAdded}
            />

            <UploadImageModal
                open={showUploadModal}
                onOpenChange={setShowUploadModal}
                treatmentId={treatment.id}
                sessions={sessions.map(s => ({ id: s.id, sessionNumber: s.sessionNumber }))}
                onSuccess={() => setShowUploadModal(false)}
            />

            {patient && (
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

            <AppointmentDetailDialog
                open={showAppointmentDetail}
                onOpenChange={(open) => {
                    setShowAppointmentDetail(open);
                    if (!open) setSelectedAppointment(null);
                }}
                appointment={selectedAppointment}
            />

            <TreatmentMobileFAB
                activeTab={activeTab}
                sessionsDisabled={sessionsDisabled}
                appointmentsDisabled={appointmentsDisabled}
                imagesDisabled={imagesDisabled}
                paymentsDisabled={paymentsDisabled}
                onNewSession={() => setShowSessionForm(true)}
                onNewAppointment={handleOpenCreateAppointment}
                onNewImage={() => setShowUploadModal(true)}
                onNewPayment={() => setShowPaymentModal(true)}
            />
        </div>
    );
}