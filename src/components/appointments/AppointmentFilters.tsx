import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { AppointmentStatus } from '@/types/appointment';
import { X } from 'lucide-react';

interface AppointmentFiltersProps {
    onFilterChange: (filters: {
        doctorId?: number;
        status?: AppointmentStatus;
        date?: string;
    }) => void;
    doctors: { id: number; name: string }[];
    onClearFilters: () => void;
    hasFilters: boolean;
}

const statusOptions: { value: AppointmentStatus; label: string }[] = [
    { value: 'SCHEDULED', label: 'Agendada' },
    { value: 'CONFIRMED', label: 'Confirmada' },
    { value: 'IN_PROGRESS', label: 'En curso' },
    { value: 'COMPLETED', label: 'Completada' },
    { value: 'CANCELLED', label: 'Cancelada' },
    { value: 'NO_SHOW', label: 'No asistió' },
];

export function AppointmentFilters({
    onFilterChange,
    doctors,
    onClearFilters,
    hasFilters,
}: AppointmentFiltersProps) {
    const [doctorId, setDoctorId] = useState<string>('all');
    const [status, setStatus] = useState<string>('all');
    const [date, setDate] = useState<string>('');

    const handleApplyFilters = () => {
        const filters: any = {};
        if (doctorId !== 'all') filters.doctorId = parseInt(doctorId);
        if (status !== 'all') filters.status = status as AppointmentStatus;
        if (date) filters.date = date;
        onFilterChange(filters);
    };

    const handleClearFilters = () => {
        setDoctorId('all');
        setStatus('all');
        setDate('');
        onClearFilters();
    };

    return (
        <div className="flex flex-wrap items-end gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex-1 min-w-[150px]">
                <Label className="text-sm text-gray-600">Doctor</Label>
                <Select value={doctorId} onValueChange={setDoctorId}>
                    <SelectTrigger>
                        <SelectValue placeholder="Todos los doctores" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos los doctores</SelectItem>
                        {doctors.map((doctor) => (
                            <SelectItem key={doctor.id} value={doctor.id.toString()}>
                                {doctor.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="flex-1 min-w-[150px]">
                <Label className="text-sm text-gray-600">Estado</Label>
                <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger>
                        <SelectValue placeholder="Todos los estados" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos los estados</SelectItem>
                        {statusOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                                {option.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="flex-1 min-w-[150px]">
                <Label className="text-sm text-gray-600">Fecha</Label>
                <Input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                />
            </div>

            <div className="flex gap-2">
                <Button onClick={handleApplyFilters} className="gap-2">
                    <span>🔍</span>
                    Filtrar
                </Button>
                {hasFilters && (
                    <Button
                        variant="ghost"
                        onClick={handleClearFilters}
                        className="gap-2 text-gray-500"
                    >
                        <X className="h-4 w-4" />
                        Limpiar
                    </Button>
                )}
            </div>
        </div>
    );
}