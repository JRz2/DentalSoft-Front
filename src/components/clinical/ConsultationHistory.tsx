import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Calendar, Eye, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Consultation {
    id: number;
    date: string;
    doctor: string;
    reason: string;
    diagnosis?: string;
    treatment?: string;
    status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
}

interface ConsultationHistoryProps {
    patientId: number;
}

// Datos de ejemplo mientras se implementa el backend
const mockConsultations: Consultation[] = [
    {
        id: 1,
        date: '2024-04-01T10:00:00',
        doctor: 'Dr. Juan Pérez',
        reason: 'Dolor en muela',
        diagnosis: 'Caries profunda',
        treatment: 'Endodoncia programada',
        status: 'COMPLETED',
    },
    {
        id: 2,
        date: '2024-03-15T11:30:00',
        doctor: 'Dra. María López',
        reason: 'Limpieza dental',
        diagnosis: 'Sarros y placa bacteriana',
        treatment: 'Profilaxis dental',
        status: 'COMPLETED',
    },
    {
        id: 3,
        date: '2024-04-10T09:00:00',
        doctor: 'Dr. Juan Pérez',
        reason: 'Control de ortodoncia',
        diagnosis: 'Progreso normal',
        treatment: 'Ajuste de brackets',
        status: 'SCHEDULED',
    },
];

const statusConfig = {
    SCHEDULED: { label: 'Agendada', className: 'bg-yellow-100 text-yellow-700' },
    COMPLETED: { label: 'Completada', className: 'bg-green-100 text-green-700' },
    CANCELLED: { label: 'Cancelada', className: 'bg-red-100 text-red-700' },
};

export function ConsultationHistory({ patientId }: ConsultationHistoryProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [consultations, setConsultations] = useState<Consultation[]>([]);

    // TODO: Conectar con la API real cuando esté disponible
    // useEffect(() => {
    //     const fetchConsultations = async () => {
    //         setIsLoading(true);
    //         try {
    //             const response = await api.get(`/appointment/patient/${patientId}`);
    //             setConsultations(response.data);
    //         } catch (error) {
    //             console.error('Error fetching consultations:', error);
    //         } finally {
    //             setIsLoading(false);
    //         }
    //     };
    //     fetchConsultations();
    // }, [patientId]);

    // Mientras tanto, usamos datos de ejemplo
    useEffect(() => {
        // Simulando carga
        setIsLoading(true);
        setTimeout(() => {
            setConsultations(mockConsultations);
            setIsLoading(false);
        }, 500);
    }, [patientId]); // patientId se usa aquí, eliminando el warning

    const filteredConsultations = consultations.filter(
        (c) =>
            c.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.doctor.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.diagnosis?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (isLoading) {
        return (
            <Card>
                <CardContent className="flex justify-center items-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <CardTitle>Historial de Consultas</CardTitle>
                    <div className="relative w-full sm:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Buscar consultas..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {filteredConsultations.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        No hay consultas registradas
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Fecha</TableHead>
                                    <TableHead>Doctor</TableHead>
                                    <TableHead>Motivo</TableHead>
                                    <TableHead>Diagnóstico</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredConsultations.map((consultation) => (
                                    <TableRow key={consultation.id}>
                                        <TableCell className="whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-4 w-4 text-gray-400" />
                                                {format(new Date(consultation.date), 'dd/MM/yyyy HH:mm', { locale: es })}
                                            </div>
                                        </TableCell>
                                        <TableCell>{consultation.doctor}</TableCell>
                                        <TableCell>{consultation.reason}</TableCell>
                                        <TableCell>{consultation.diagnosis || '-'}</TableCell>
                                        <TableCell>
                                            <Badge className={statusConfig[consultation.status].className}>
                                                {statusConfig[consultation.status].label}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" className="text-blue-600">
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}