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
import { Stethoscope, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandInput, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { useStaff } from '@/hooks/useDoctors';

interface AppointmentFiltersProps {
    onFilterChange: (filters: {
        doctorId?: number;
        status?: AppointmentStatus;
        date?: string;
    }) => void;
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
    onClearFilters,
    hasFilters,
}: AppointmentFiltersProps) {
    const { data: staffData } = useStaff();
    const staff = staffData?.data || [];

    const [selectedDoctorId, setSelectedDoctorId] = useState<number | undefined>(undefined);
    const [status, setStatus] = useState<string>('all');
    const [date, setDate] = useState<string>('');
    const [popoverDoctorOpen, setPopoverDoctorOpen] = useState(false);
    const [doctorSearchTerm, setDoctorSearchTerm] = useState('');

    const handleSelectDoctor = (doctorId: number) => {
        setSelectedDoctorId(doctorId);
        setPopoverDoctorOpen(false);
        setDoctorSearchTerm('');
    };

    const handleClearDoctor = () => {
        setSelectedDoctorId(undefined);
        setDoctorSearchTerm('');
    };

    const handleApplyFilters = () => {
        const filters: any = {};
        if (selectedDoctorId) filters.doctorId = selectedDoctorId;
        if (status !== 'all') filters.status = status as AppointmentStatus;
        if (date) filters.date = date;
        onFilterChange(filters);
    };

    const handleClearFilters = () => {
        setSelectedDoctorId(undefined);
        setStatus('all');
        setDate('');
        onClearFilters();
    };

    const selectedDoctor = staff.find((d: any) => d.id === selectedDoctorId);

    return (
        <div className="flex flex-wrap items-end gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            {/* Doctor - Popover con búsqueda */}
            <div className="flex-1 min-w-[150px]">
                <Label className="text-sm text-gray-600">Doctor</Label>
                <Popover open={popoverDoctorOpen} onOpenChange={setPopoverDoctorOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            role="combobox"
                            className={cn(
                                "w-full justify-between font-normal",
                                !selectedDoctorId && "text-muted-foreground"
                            )}
                        >
                            {selectedDoctorId && selectedDoctor ? (
                                <div className="flex items-center gap-2">
                                    <Stethoscope className="h-4 w-4" />
                                    <span>{selectedDoctor.name}</span>
                                    <span className="text-xs text-gray-400">
                                        {selectedDoctor.role === 'DOCTOR' ? '👨‍⚕️' : '👩‍💼'}
                                    </span>
                                </div>
                            ) : (
                                "Todos los doctores..."
                            )}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent
                        className="p-0 w-[400px] max-w-[90vw]"
                        align="start"
                        style={{ maxHeight: '300px', overflowY: 'auto' }}
                        onWheel={(e) => e.stopPropagation()}
                    >
                        <Command className="max-h-[300px] overflow-y-auto">
                            <CommandInput
                                placeholder="Buscar doctor..."
                                value={doctorSearchTerm}
                                onValueChange={setDoctorSearchTerm}
                                className="h-10 !border-0 !ring-0 !outline-none focus:!ring-0 focus:!outline-none focus-visible:!ring-0 focus-visible:!outline-none"
                            />
                            <CommandList className="py-2 max-h-[200px] overflow-y-auto">
                                <CommandEmpty>No se encontraron doctores</CommandEmpty>
                                <CommandGroup>
                                    {/* Opción para limpiar el filtro */}
                                    <CommandItem
                                        onSelect={() => {
                                            handleClearDoctor();
                                            setPopoverDoctorOpen(false);
                                        }}
                                        className="flex items-center gap-2 cursor-pointer text-gray-500"
                                    >
                                        <X className="h-4 w-4" />
                                        <span>Todos los doctores</span>
                                    </CommandItem>
                                    {staff.map((user: any) => (
                                        <CommandItem
                                            key={user.id}
                                            onSelect={() => handleSelectDoctor(user.id)}
                                            className="flex items-center gap-2 cursor-pointer"
                                        >
                                            <Stethoscope className="h-4 w-4 text-gray-400" />
                                            <span>{user.name}</span>
                                            <span className="text-xs text-gray-400">
                                                {user.role === 'DOCTOR' ? '👨‍⚕️ Doctor' : '👩‍💼 Recepcionista'}
                                            </span>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
            </div>

            {/* Estado */}
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

            {/* Fecha */}
            <div className="flex-1 min-w-[150px]">
                <Label className="text-sm text-gray-600">Fecha</Label>
                <Input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                />
            </div>

            {/* Botones */}
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