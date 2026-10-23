import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useScrollDirection } from '@/hooks/useScrollDirection';

interface TreatmentMobileFABProps {
    activeTab: string;
    onNewSession: () => void;
    onNewAppointment: () => void;
    onNewImage: () => void;
    onNewPayment: () => void;
    sessionsDisabled: boolean;
    appointmentsDisabled: boolean;
    imagesDisabled: boolean;
    paymentsDisabled: boolean;
}

export function TreatmentMobileFAB({
    activeTab,
    onNewSession,
    onNewAppointment,
    onNewImage,
    onNewPayment,
    sessionsDisabled,
    appointmentsDisabled,
    imagesDisabled,
    paymentsDisabled,
}: TreatmentMobileFABProps) {
    const scrollDirection = useScrollDirection();

    // Lógica centralizada: decide si se muestra y qué acción ejecuta
    let onClick: (() => void) | null = null;
    let ariaLabel = '';

    if (activeTab === 'sessions' && !sessionsDisabled) {
        onClick = onNewSession;
        ariaLabel = 'Nueva Sesión';
    } else if (activeTab === 'appointments' && !appointmentsDisabled) {
        onClick = onNewAppointment;
        ariaLabel = 'Agendar Cita';
    } else if (activeTab === 'images' && !imagesDisabled) {
        onClick = onNewImage;
        ariaLabel = 'Nueva Imagen';
    } else if (activeTab === 'payments' && !paymentsDisabled) {
        onClick = onNewPayment;
        ariaLabel = 'Agregar Pago';
    }

    // Si no hay acción permitida para el tab actual, no renderiza nada
    if (!onClick) return null;

    return (
        <button
            type="button"
            onClick={onClick}
            aria-label={ariaLabel}
            className={cn(
                "fixed right-5 z-50 sm:hidden",
                "h-14 w-14 rounded-full",
                "bg-teal-600 hover:bg-teal-700 text-white",
                "flex items-center justify-center",
                "shadow-xl shadow-teal-600/30",
                "hover:shadow-2xl hover:shadow-teal-600/40",
                "active:scale-95 transition-all duration-300 ease-out",
                scrollDirection === 'down'
                    ? "translate-y-24 opacity-0 pointer-events-none"
                    : "translate-y-0 opacity-100"
            )}
            style={{
                bottom: 'calc(5rem + env(safe-area-inset-bottom))',
            }}
        >
            <Plus className="h-6 w-6" strokeWidth={2.5} />
        </button>
    );
}