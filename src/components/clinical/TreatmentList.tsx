import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar } from 'lucide-react';
import { Treatment } from '@/types/clinicalHistory';

interface TreatmentListProps {
    treatments: Treatment[];
    isLoading: boolean;
    onSelectTreatment: (treatment: Treatment) => void;
    onRefresh: () => void;
}

const statusColors = {
    PLANNED: 'bg-blue-100 text-blue-700',
    IN_PROGRESS: 'bg-yellow-100 text-yellow-700',
    ON_HOLD: 'bg-orange-100 text-orange-700',
    COMPLETED: 'bg-green-100 text-green-700',
    CANCELLED: 'bg-red-100 text-red-700',
};

const statusLabels = {
    PLANNED: 'Planificado',
    IN_PROGRESS: 'En Progreso',
    ON_HOLD: 'En Espera',
    COMPLETED: 'Completado',
    CANCELLED: 'Cancelado',
};

const typeLabels = {
    DIAGNOSIS: 'Diagnóstico',
    PREVENTIVE: 'Preventivo',
    RESTORATIVE: 'Restaurador',
    ENDODONTIC: 'Endodoncia',
    PERIODONTAL: 'Periodoncia',
    ORTHODONTIC: 'Ortodoncia',
    SURGICAL: 'Quirúrgico',
    PROSTHETIC: 'Prótesis',
    AESTHETIC: 'Estética',
    MAINTENANCE: 'Mantenimiento',
};

export function TreatmentList({ treatments, isLoading, onSelectTreatment }: TreatmentListProps) {
    if (isLoading) {
        return (
            <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                    <Card key={i}>
                        <CardHeader>
                            <Skeleton className="h-6 w-48" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-4 w-32" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    if (treatments.length === 0) {
        return (
            <Card>
                <CardContent className="text-center py-8 text-gray-500">
                    No hay tratamientos registrados
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            {treatments.map((treatment) => (
                <Card
                    key={treatment.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => onSelectTreatment(treatment)}
                >
                    <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle className="text-lg">{treatment.name}</CardTitle>
                                <div className="flex gap-2 mt-2">
                                    <Badge className={statusColors[treatment.status]}>
                                        {statusLabels[treatment.status]}
                                    </Badge>
                                    <Badge variant="outline">
                                        {typeLabels[treatment.type]}
                                    </Badge>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                                <div className="flex items-center gap-1">
                                    <Calendar className="h-4 w-4" />
                                    <span>{treatment.estimatedSessions} sesiones</span>
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    {treatment.description && (
                        <CardContent>
                            <p className="text-gray-600">{treatment.description}</p>
                        </CardContent>
                    )}
                </Card>
            ))}
        </div>
    );
}