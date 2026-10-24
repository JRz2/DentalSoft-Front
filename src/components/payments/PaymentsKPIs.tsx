import { TrendingUp, AlertCircle, Banknote, CreditCard } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface PaymentsKPIsProps {
    totalIncome: number;
    pendingDebt: number;
    cashIncome: number;
    transferIncome: number;
    isLoading?: boolean;
}

export function PaymentsKPIs({ totalIncome, pendingDebt, cashIncome, transferIncome, isLoading }: PaymentsKPIsProps) {

    // Si está cargando, mostramos 4 tarjetas con skeletons para mantener el layout
    if (isLoading) {
        return (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-5 relative overflow-hidden">
                        <Skeleton className="h-4 w-24 mb-2" />
                        <Skeleton className="h-8 w-32" />
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            {/* 1. Ingresos Totales */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-5 hover:shadow-md transition-shadow relative overflow-hidden">
                <div>
                    <p className="text-xs md:text-sm font-medium text-gray-500">Ingresos Totales</p>
                    <p className="text-2xl md:text-3xl font-bold text-teal-600 mt-0.5 md:mt-1">
                        Bs {totalIncome.toLocaleString('es-BO')}
                    </p>
                </div>
                <div className="absolute bottom-0 right-0 p-2 md:p-3">
                    <TrendingUp className="w-8 h-8 md:w-12 md:h-12 text-teal-500 opacity-20" />
                </div>
            </div>

            {/* 2. Por Cobrar */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-5 hover:shadow-md transition-shadow relative overflow-hidden">
                <div>
                    <p className="text-xs md:text-sm font-medium text-gray-500">Saldo por Cobrar</p>
                    <p className="text-2xl md:text-3xl font-bold text-amber-600 mt-0.5 md:mt-1">
                        Bs {pendingDebt.toLocaleString('es-BO')}
                    </p>
                </div>
                <div className="absolute bottom-0 right-0 p-2 md:p-3">
                    <AlertCircle className="w-8 h-8 md:w-12 md:h-12 text-amber-500 opacity-20" />
                </div>
            </div>

            {/* 3. Efectivo */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-5 hover:shadow-md transition-shadow relative overflow-hidden">
                <div>
                    <p className="text-xs md:text-sm font-medium text-gray-500">Efectivo</p>
                    <p className="text-2xl md:text-3xl font-bold text-gray-900 mt-0.5 md:mt-1">
                        Bs {cashIncome.toLocaleString('es-BO')}
                    </p>
                </div>
                <div className="absolute bottom-0 right-0 p-2 md:p-3">
                    <Banknote className="w-8 h-8 md:w-12 md:h-12 text-gray-500 opacity-20" />
                </div>
            </div>

            {/* 4. Transferencias */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-5 hover:shadow-md transition-shadow relative overflow-hidden">
                <div>
                    <p className="text-xs md:text-sm font-medium text-gray-500">Transferencias</p>
                    <p className="text-2xl md:text-3xl font-bold text-blue-600 mt-0.5 md:mt-1">
                        Bs {transferIncome.toLocaleString('es-BO')}
                    </p>
                </div>
                <div className="absolute bottom-0 right-0 p-2 md:p-3">
                    <CreditCard className="w-8 h-8 md:w-12 md:h-12 text-blue-500 opacity-20" />
                </div>
            </div>
        </div>
    );
}