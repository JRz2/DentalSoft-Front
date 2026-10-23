import { Plus, CreditCard, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PaymentSummary } from '@/components/treatments/PaymentSummary';
import { PaymentHistory } from '@/components/treatments/PaymentHistory';
import { Treatment } from '@/types/clinicalHistory';
import { toNumber } from '@/lib/treatmentUtils';

interface TreatmentPaymentsTabProps {
    treatment: Treatment;
    paymentStatus: any;
    isLoading: boolean;
    isCompleted: boolean;
    isCancelled: boolean;
    onOpenPaymentModal: () => void;
    onViewPayment: (payment: any) => void;
    onVoidPayment: (payment: any) => void;
    onCostUpdated: () => Promise<void>;
}

export function TreatmentPaymentsTab({
    treatment,
    paymentStatus,
    isLoading,
    isCompleted,
    isCancelled,
    onOpenPaymentModal,
    onViewPayment,
    onVoidPayment,
    onCostUpdated,
}: TreatmentPaymentsTabProps) {
    const amountPaidValue = toNumber(paymentStatus?.amountPaid || 0);
    const remainingBalanceValue = toNumber(paymentStatus?.remainingBalance || 0);
    const paymentStatusValue = (paymentStatus?.paymentStatus as string) || 'UNPAID';
    const hasPendingBalance = remainingBalanceValue > 0.001;
    
    const paymentsDisabled = !hasPendingBalance;
    const paymentsDisabledReason = !hasPendingBalance
        ? 'El tratamiento ya está completamente pagado'
        : undefined;

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
            {/* Sticky header: título + botón */}
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
                            onClick={onOpenPaymentModal}
                            disabled={paymentsDisabled}
                            size="sm"
                            className="gap-2 rounded-lg w-full sm:w-auto hidden sm:flex bg-teal-600 hover:bg-teal-700 text-white"
                            title={paymentsDisabledReason}
                        >
                            <Plus className="h-4 w-4" />
                            Agregar Pago
                        </Button>
                        {paymentsDisabledReason && (
                            <span className="text-xs text-gray-500 flex items-center gap-1 sm:justify-end">
                                <CheckCircle2 className="h-3 w-3 shrink-0 text-green-500" />
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
                                onCostUpdated={onCostUpdated}
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
                                isLoading={isLoading}
                                isCancelled={isCancelled}
                                onViewPayment={onViewPayment}
                                onVoidPayment={onVoidPayment}
                                canEdit={false}
                                canVoid={true}
                            />
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}