import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wallet } from 'lucide-react';

interface PaymentSummaryProps {
    paymentStatus: {
        treatmentId: number;
        treatmentName: string;
        totalCost: number;
        discount: number;
        finalAmount: number;
        amountPaid: number;
        remainingBalance: number;
        paymentStatus: string;
        summary: {
            totalPayments: number;
            totalAmountPaid: number;
        };
    };
}

const statusConfig: Record<string, { label: string; className: string }> = {
    PAID: { label: 'Pagado', className: 'bg-green-100 text-green-700 border-green-200' },
    PARTIAL: { label: 'Parcial', className: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
    UNPAID: { label: 'Pendiente', className: 'bg-red-100 text-red-700 border-red-200' },
    CANCELLED: { label: 'Cancelado', className: 'bg-gray-100 text-gray-700 border-gray-200' },
};

export function PaymentSummary({ paymentStatus }: PaymentSummaryProps) {
    const {
        totalCost,
        discount,
        amountPaid,
        remainingBalance,
        paymentStatus: status,
        summary,
    } = paymentStatus;

    const progress = totalCost > 0 ? (amountPaid / totalCost) * 100 : 0;

    return (
        <Card className="border-l-4 border-l-primary-500">
            <CardHeader>
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary-100 rounded-lg">
                        <Wallet className="h-5 w-5 text-primary-600" />
                    </div>
                    <div>
                        <CardTitle className="text-lg">Resumen de Pagos</CardTitle>
                        <p className="text-sm text-gray-500 mt-1">
                            {summary.totalPayments} {summary.totalPayments === 1 ? 'pago registrado' : 'pagos registrados'}
                        </p>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Costo total */}
                    <div className="bg-gray-50 rounded-lg p-4 text-center">
                        <p className="text-xs text-gray-500 uppercase tracking-wider">Costo Total</p>
                        <p className="text-2xl font-bold text-gray-900">Bs {totalCost.toFixed(2)}</p>
                        {discount > 0 && (
                            <p className="text-xs text-green-600">- Bs {discount.toFixed(2)} descuento</p>
                        )}
                    </div>

                    {/* Monto pagado */}
                    <div className="bg-gray-50 rounded-lg p-4 text-center">
                        <p className="text-xs text-gray-500 uppercase tracking-wider">Pagado</p>
                        <p className="text-2xl font-bold text-green-600">Bs {amountPaid.toFixed(2)}</p>
                        <p className="text-xs text-gray-500">{summary.totalPayments} pagos</p>
                    </div>

                    {/* Saldo pendiente */}
                    <div className="bg-gray-50 rounded-lg p-4 text-center">
                        <p className="text-xs text-gray-500 uppercase tracking-wider">Saldo Pendiente</p>
                        <p className={`text-2xl font-bold ${remainingBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            Bs {remainingBalance.toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500">
                            {remainingBalance > 0 ? 'Pendiente de pago' : 'Completamente pagado'}
                        </p>
                    </div>

                    {/* Estado */}
                    <div className="bg-gray-50 rounded-lg p-4 text-center">
                        <p className="text-xs text-gray-500 uppercase tracking-wider">Estado</p>
                        <Badge className={`${statusConfig[status]?.className || 'bg-gray-100 text-gray-700'} mt-1 px-3 py-1`}>
                            {statusConfig[status]?.label || status}
                        </Badge>
                        <div className="mt-2">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    className="bg-primary-600 h-2 rounded-full transition-all duration-500"
                                    style={{ width: `${Math.min(progress, 100)}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}