import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { AppointmentStatus } from '@/types/appointment';

interface StatusBadgeProps {
    status: AppointmentStatus;
    className?: string;
}

const statusLabels: Record<AppointmentStatus, string> = {
    SCHEDULED: 'Agendada',
    CONFIRMED: 'Confirmada',
    IN_PROGRESS: 'En curso',
    COMPLETED: 'Completada',
    CANCELLED: 'Cancelada',
    NO_SHOW: 'No asistió',
};

const statusColors: Record<AppointmentStatus, string> = {
    SCHEDULED: 'bg-blue-100 text-blue-700 hover:bg-blue-100',
    CONFIRMED: 'bg-green-100 text-green-700 hover:bg-green-100',
    IN_PROGRESS: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100',
    COMPLETED: 'bg-gray-100 text-gray-700 hover:bg-gray-100',
    CANCELLED: 'bg-red-100 text-red-700 hover:bg-red-100',
    NO_SHOW: 'bg-red-100 text-red-700 hover:bg-red-100',
};

const statusIcons: Record<AppointmentStatus, string> = {
    SCHEDULED: '📅',
    CONFIRMED: '✅',
    IN_PROGRESS: '🔄',
    COMPLETED: '✔️',
    CANCELLED: '❌',
    NO_SHOW: '🚫',
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
    return (
        <Badge className={cn(statusColors[status], className)}>
            <span className="mr-1">{statusIcons[status]}</span>
            {statusLabels[status]}
        </Badge>
    );
}