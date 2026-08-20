import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Receipt, Eye, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useState } from 'react';
import { RegisterPaymentModal } from '@/components/treatments/RegisterPaymentModal';

interface Payment {
    id: number;
    amount: number;
    paymentMethod: string;
    paymentDate: string;
    reference?: string;
    notes?: string;
    registeredBy?: string;
}

interface PaymentHistoryProps {
    payments: Payment[];
    totalCost: number;
    treatmentId: number;
    isLoading?: boolean;
    onViewPayment?: (payment: Payment) => void;
    onPaymentRegistered?: () => void;
}

const paymentMethodLabels: Record<string, string> = {
    CASH: 'Efectivo',
    CARD: 'Tarjeta',
    TRANSFER: 'Transferencia',
    CHECK: 'Cheque',
    OTHER: 'Otro',
};

const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    try {
        return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: es });
    } catch {
        return '-';
    }
};

export function PaymentHistory({
    payments,
    totalCost,
    treatmentId,
    isLoading,
    onViewPayment,
    onPaymentRegistered
}: PaymentHistoryProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Calcular total pagado
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    const remainingBalance = totalCost - totalPaid;

    if (isLoading) {
        return (
            <Card>
                <CardContent className="py-8 text-center text-gray-500">
                    Cargando historial de pagos...
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-3">
                            <Receipt className="h-5 w-5 text-primary-600" />
                            <CardTitle className="text-lg">Historial de Pagos</CardTitle>
                            <Badge variant="outline">
                                {payments.length} {payments.length === 1 ? 'pago' : 'pagos'}
                            </Badge>
                        </div>
                        <div className="flex items-center gap-4 flex-wrap">
                            {/* Botón Agregar Pago */}
                            {remainingBalance > 0 && (
                                <Button
                                    onClick={() => setIsModalOpen(true)}
                                    className="gap-2"
                                    size="sm"
                                >
                                    <Plus className="h-4 w-4" />
                                    Agregar Pago
                                </Button>
                            )}
                            {remainingBalance <= 0 && payments.length > 0 && (
                                <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">
                                    Tratamiento pagado
                                </Badge>
                            )}
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {!payments || payments.length === 0 ? (
                        <div className="py-8 text-center text-gray-500">
                            <Receipt className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                            <p>No hay pagos registrados</p>
                            <p className="text-sm">Registra el primer pago para este tratamiento</p>
                            <Button
                                onClick={() => setIsModalOpen(true)}
                                className="mt-4 gap-2"
                                variant="outline"
                            >
                                <Plus className="h-4 w-4" />
                                Registrar Pago
                            </Button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Fecha</TableHead>
                                        <TableHead>Monto</TableHead>
                                        <TableHead>Método</TableHead>
                                        <TableHead>Referencia</TableHead>
                                        <TableHead>Registrado por</TableHead>
                                        <TableHead className="text-right">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {payments.map((payment) => (
                                        <TableRow key={payment.id} className="hover:bg-gray-50">
                                            <TableCell className="whitespace-nowrap">
                                                {formatDate(payment.paymentDate)}
                                            </TableCell>
                                            <TableCell>
                                                <span className="font-medium text-gray-900">
                                                    Bs {payment.amount.toFixed(2)}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="bg-gray-50">
                                                    {paymentMethodLabels[payment.paymentMethod] || payment.paymentMethod}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {payment.reference ? (
                                                    <span className="text-sm text-gray-600">{payment.reference}</span>
                                                ) : (
                                                    <span className="text-gray-400">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm text-gray-600">{payment.registeredBy || '-'}</span>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {onViewPayment && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => onViewPayment(payment)}
                                                        className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 h-8 w-8"
                                                        title="Ver detalle"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Modal de registro de pago */}
            <RegisterPaymentModal
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                treatmentId={treatmentId}
                totalCost={totalCost}
                totalPaid={totalPaid}
                remainingBalance={remainingBalance}
                onSuccess={() => {
                    setIsModalOpen(false);
                    onPaymentRegistered?.();
                }}
            />
        </>
    );
}