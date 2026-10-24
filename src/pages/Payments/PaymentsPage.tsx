import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Banknote, Clock, CalendarDays, Calendar, CalendarRange, History } from 'lucide-react';
import { usePageHeader } from '@/contexts/PageHeaderContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { PaymentsKPIs } from '@/components/payments/PaymentsKPIs';
import { PendingBalancesTable } from '@/components/payments/PendingBalancesTable';
import { PaymentsHistoryTable } from '@/components/payments/PaymentsHistoryTable';
import { Payment, PendingBalance } from '@/types/payment';
import { format, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear } from 'date-fns';
import { RegisterPaymentModal } from '@/components/treatments/RegisterPaymentModal';
import { PaymentDetailDialog } from '@/components/treatments/PaymentDetailDialog';
import { VoidPaymentDialog } from '@/components/treatments/VoidPaymentDialog';
import { usePaymentKPIs, usePaymentsHistory, usePendingBalances, useVoidPayment } from '@/hooks/usePayments';

const periodOptions = [
    { value: 'month', label: 'Este Mes', icon: CalendarDays },
    { value: 'lastMonth', label: 'Mes Pasado', icon: CalendarRange },
    { value: 'year', label: 'Este Año', icon: Calendar },
    { value: 'all', label: 'Histórico Total', icon: History },
];

export function PaymentsPage() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('pending');

    // Filtro Global (Período)
    const [period, setPeriod] = useState<'month' | 'lastMonth' | 'year' | 'all'>('month');

    // Filtros del Historial
    const [historyMethod, setHistoryMethod] = useState('all');
    const [historyStatus, setHistoryStatus] = useState('all');
    const [historyPage, setHistoryPage] = useState(1);
    const itemsPerPage = 10;

    // Estados para los Modales
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedBalance, setSelectedBalance] = useState<PendingBalance | null>(null);

    const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
    const [showPaymentDetail, setShowPaymentDetail] = useState(false);
    const [showVoidDialog, setShowVoidDialog] = useState(false);

    const voidPaymentMutation = useVoidPayment();

    usePageHeader('Estado Financiero', 'Gestiona los ingresos y saldos pendientes.');

    // Cálculo de fechas
    const { startDate, endDate } = useMemo(() => {
        const now = new Date();
        if (period === 'month') return { startDate: format(startOfMonth(now), 'yyyy-MM-dd'), endDate: format(endOfMonth(now), 'yyyy-MM-dd') };
        if (period === 'lastMonth') {
            const lm = subMonths(now, 1);
            return { startDate: format(startOfMonth(lm), 'yyyy-MM-dd'), endDate: format(endOfMonth(lm), 'yyyy-MM-dd') };
        }
        if (period === 'year') return { startDate: format(startOfYear(now), 'yyyy-MM-dd'), endDate: format(endOfYear(now), 'yyyy-MM-dd') };
        return { startDate: undefined, endDate: undefined };
    }, [period]);

    // Hooks de datos
    const { data: kpis, isLoading: isLoadingKPIs } = usePaymentKPIs(startDate, endDate);

    const { data: historyData, isLoading: isLoadingHistory } = usePaymentsHistory({
        page: historyPage,
        limit: itemsPerPage,
        startDate,
        endDate,
        paymentMethod: historyMethod,
        status: historyStatus,
    });

    const { data: pendingBalances, isLoading: isLoadingPending } = usePendingBalances();

    // Paginación local para Cuentas por Cobrar
    const [pendingPage, setPendingPage] = useState(1);
    const paginatedPending = useMemo(() => {
        if (!pendingBalances) return [];
        return pendingBalances.slice((pendingPage - 1) * itemsPerPage, pendingPage * itemsPerPage);
    }, [pendingBalances, pendingPage]);

    // ─── HANDLERS ───

    const handleRegisterPayment = (treatmentId: number, _patientId: number) => {
        const balance = pendingBalances?.find(b => b.treatmentId === treatmentId);
        if (balance) {
            setSelectedBalance(balance);
            setShowPaymentModal(true);
        }
    };

    const handleViewTreatment = (treatmentId: number, patientId: number) => {
        navigate(`/treatment-sessions/${treatmentId}/patient/${patientId}`);
    };

    const handlePaymentSuccess = () => {
        setShowPaymentModal(false);
        setSelectedBalance(null);
    };

    const handleViewPayment = (payment: Payment) => {
        setSelectedPayment(payment);
        setShowPaymentDetail(true);
    };

    const handleVoidPaymentClick = (payment: Payment) => {
        setSelectedPayment(payment);
        setShowVoidDialog(true);
    };

    const handleConfirmVoidPayment = async (reason: string) => {
        if (!selectedPayment) return;
        try {
            await voidPaymentMutation.mutateAsync({
                treatmentId: selectedPayment.treatmentId,
                paymentId: selectedPayment.id,
                reason,
            });
            toast.success('Pago anulado correctamente');
            setShowVoidDialog(false);
            setSelectedPayment(null);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error al anular el pago');
        }
    };

    return (
        <div className="space-y-4 md:space-y-6 max-w-7xl mx-auto pb-10">

            {/* 1. KPIs */}
            <PaymentsKPIs
                totalIncome={kpis?.totalIncome || 0}
                pendingDebt={kpis?.pendingDebt || 0}
                cashIncome={kpis?.cashIncome || 0}
                transferIncome={kpis?.transferIncome || 0}
                isLoading={isLoadingKPIs}
            />

            {/* 2. SELECTOR DE PERÍODO */}
            <div className="flex justify-end">
                <Select
                    value={period}
                    onValueChange={(val: any) => { setPeriod(val); setHistoryPage(1); }}
                >
                    <SelectTrigger className="w-full sm:w-[200px] bg-white h-10 shadow-sm border-gray-200 rounded-lg">
                        <SelectValue placeholder="Seleccionar período" />
                    </SelectTrigger>
                    <SelectContent
                        side="bottom"
                        position="popper"
                        align="end"
                        sideOffset={4}
                        className="w-[var(--radix-select-trigger-width)]"
                    >
                        {periodOptions.map((opt) => {
                            const Icon = opt.icon;
                            return (
                                <SelectItem
                                    key={opt.value}
                                    value={opt.value}
                                    className="py-2 cursor-pointer"
                                >
                                    <div className="flex items-center gap-2 min-w-0 w-full">
                                        <Icon className="h-4 w-4 text-gray-500 shrink-0" />
                                        <span className="text-sm font-medium truncate">
                                            {opt.label}
                                        </span>
                                    </div>
                                </SelectItem>
                            );
                        })}
                    </SelectContent>
                </Select>
            </div>

            {/* 3. TABS */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex flex-col">
                <TabsList className="w-full max-w-md mx-auto grid grid-cols-2 h-auto p-1 gap-1 bg-gray-100/80 rounded-xl">
                    <TabsTrigger value="pending" className={cn("flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium transition-all", "data-[state=active]:bg-white data-[state=active]:text-amber-700 data-[state=active]:shadow-sm")}>
                        <Clock className="h-4 w-4 shrink-0" /> Cuentas por Cobrar
                    </TabsTrigger>
                    <TabsTrigger value="history" className={cn("flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium transition-all", "data-[state=active]:bg-white data-[state=active]:text-teal-700 data-[state=active]:shadow-sm")}>
                        <Banknote className="h-4 w-4 shrink-0" /> Historial de Pagos
                    </TabsTrigger>
                </TabsList>

                {/* TAB: PENDIENTES */}
                <TabsContent value="pending" className="mt-4 md:mt-6 w-full">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-6">
                        <div className="mb-4">
                            <h2 className="text-lg font-semibold text-gray-900">Saldos Pendientes</h2>
                            <p className="text-sm text-gray-500">Deudas activas de todos los tratamientos.</p>
                        </div>

                        <PendingBalancesTable
                            data={paginatedPending}
                            isLoading={isLoadingPending}
                            onRegisterPayment={handleRegisterPayment}
                            onViewTreatment={handleViewTreatment}
                            pagination={{
                                currentPage: pendingPage,
                                totalPages: Math.ceil((pendingBalances?.length || 0) / itemsPerPage),
                                totalItems: pendingBalances?.length || 0,
                                itemsPerPage,
                                onPageChange: setPendingPage,
                            }}
                        />
                    </div>
                </TabsContent>

                {/* TAB: HISTORIAL */}
                <TabsContent value="history" className="mt-4 md:mt-6 w-full">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-6">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-5 pb-4 border-b border-gray-100">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">Historial de Pagos</h2>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                <Select value={historyMethod} onValueChange={(v) => { setHistoryMethod(v); setHistoryPage(1); }}>
                                    <SelectTrigger className="w-[140px] h-9 text-xs bg-white">
                                        <SelectValue placeholder="Método" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos los métodos</SelectItem>
                                        <SelectItem value="CASH">Efectivo</SelectItem>
                                        <SelectItem value="TRANSFER">Transferencia</SelectItem>
                                    </SelectContent>
                                </Select>

                                <Select value={historyStatus} onValueChange={(v) => { setHistoryStatus(v); setHistoryPage(1); }}>
                                    <SelectTrigger className="w-[130px] h-9 text-xs bg-white">
                                        <SelectValue placeholder="Estado" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos los estados</SelectItem>
                                        <SelectItem value="ACTIVE">Activo</SelectItem>
                                        <SelectItem value="VOIDED">Anulado</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <PaymentsHistoryTable
                            data={historyData?.data || []}
                            isLoading={isLoadingHistory}
                            onViewPayment={handleViewPayment}
                            onVoidPayment={handleVoidPaymentClick}
                            pagination={{
                                currentPage: historyPage,
                                totalPages: historyData?.meta?.totalPages || 1,
                                totalItems: historyData?.meta?.total || 0,
                                itemsPerPage,
                                onPageChange: setHistoryPage,
                            }}
                        />
                    </div>
                </TabsContent>
            </Tabs>

            {/* ─── MODALES ─── */}
            {selectedBalance && (
                <RegisterPaymentModal
                    open={showPaymentModal}
                    onOpenChange={(open) => {
                        setShowPaymentModal(open);
                        if (!open) setSelectedBalance(null);
                    }}
                    treatmentId={selectedBalance.treatmentId}
                    totalCost={selectedBalance.finalAmount}
                    totalPaid={selectedBalance.amountPaid}
                    remainingBalance={selectedBalance.remainingBalance}
                    onSuccess={handlePaymentSuccess}
                />
            )}

            {selectedPayment && (
                <PaymentDetailDialog
                    open={showPaymentDetail}
                    onOpenChange={(open) => {
                        setShowPaymentDetail(open);
                        if (!open) setSelectedPayment(null);
                    }}
                    payment={selectedPayment}
                />
            )}

            {selectedPayment && (
                <VoidPaymentDialog
                    open={showVoidDialog}
                    onOpenChange={(open) => {
                        setShowVoidDialog(open);
                        if (!open) setSelectedPayment(null);
                    }}
                    paymentAmount={selectedPayment.amount}
                    onConfirm={handleConfirmVoidPayment}
                    isLoading={voidPaymentMutation.isPending}
                />
            )}
        </div>
    );
}