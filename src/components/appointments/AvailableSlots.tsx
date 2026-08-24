import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAvailableSlots } from '@/hooks/useAppointments';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface AvailableSlotsProps {
    doctorId: number;
    date: string;
    onSelectSlot: (time: string) => void;
    selectedSlot?: string;
    isLoading?: boolean;
}

export function AvailableSlots({
    doctorId,
    date,
    onSelectSlot,
    selectedSlot,
    isLoading: parentLoading,
}: AvailableSlotsProps) {
    const { data: slots, isLoading, error } = useAvailableSlots(doctorId, date);
    const [hoveredSlot, setHoveredSlot] = useState<string | null>(null);

    const isLoadingState = isLoading || parentLoading;

    if (isLoadingState) {
        return (
            <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Clock className="h-4 w-4" />
                    <span>Cargando horarios disponibles...</span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {[...Array(6)].map((_, i) => (
                        <Skeleton key={i} className="h-10 rounded-lg" />
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-6 text-gray-500">
                <X className="h-8 w-8 mx-auto text-red-400 mb-2" />
                <p className="text-sm">Error al cargar los horarios disponibles</p>
                <p className="text-xs text-gray-400">Intenta de nuevo más tarde</p>
            </div>
        );
    }

    if (!slots || slots.length === 0) {
        return (
            <div className="text-center py-6 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
                <Clock className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                <p className="text-sm font-medium">No hay horarios disponibles</p>
                <p className="text-xs text-gray-400">
                    Para el {format(new Date(date), 'dd/MM/yyyy', { locale: es })}
                </p>
            </div>
        );
    }

    const availableSlots = slots.filter(slot => slot.available);
    const unavailableSlots = slots.filter(slot => !slot.available);

    return (
        <div className="space-y-4">
            {/* Resumen */}
            <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-3">
                    <span className="text-gray-500">Horarios disponibles:</span>
                    <Badge variant="outline" className="bg-green-50 text-green-700">
                        {availableSlots.length} disponibles
                    </Badge>
                </div>
                <span className="text-xs text-gray-400">
                    {format(new Date(date), 'EEEE dd/MM/yyyy', { locale: es })}
                </span>
            </div>

            {/* Grid de slots */}
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {slots.map((slot) => {
                    const isAvailable = slot.available;
                    const isSelected = selectedSlot === slot.startTime;
                    const isHovered = hoveredSlot === slot.startTime;

                    return (
                        <Button
                            key={slot.startTime}
                            variant="outline"
                            size="sm"
                            disabled={!isAvailable}
                            onClick={() => isAvailable && onSelectSlot(slot.startTime)}
                            onMouseEnter={() => setHoveredSlot(slot.startTime)}
                            onMouseLeave={() => setHoveredSlot(null)}
                            className={cn(
                                "relative h-10 text-sm font-normal transition-all",
                                isAvailable && "hover:border-primary-500 hover:bg-primary-50",
                                isSelected && "border-primary-500 bg-primary-50 text-primary-700 ring-2 ring-primary-200",
                                !isAvailable && "opacity-40 cursor-not-allowed bg-gray-50"
                            )}
                        >
                            {slot.startTime}
                            {isSelected && (
                                <Check className="absolute -top-1 -right-1 h-4 w-4 text-primary-600 bg-white rounded-full" />
                            )}
                            {!isAvailable && (
                                <span className="absolute -top-1 -right-1 text-[10px] text-red-400">✕</span>
                            )}
                        </Button>
                    );
                })}
            </div>

            {/* Leyenda */}
            <div className="flex items-center gap-4 text-xs text-gray-400 pt-2 border-t border-gray-100">
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-primary-50 border border-primary-200" />
                    <span>Disponible</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-gray-50 border border-gray-200 opacity-40" />
                    <span>Ocupado</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-primary-50 border-2 border-primary-500 ring-2 ring-primary-200" />
                    <span>Seleccionado</span>
                </div>
            </div>
        </div>
    );
}