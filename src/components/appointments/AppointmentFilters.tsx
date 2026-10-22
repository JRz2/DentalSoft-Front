import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { AppointmentStatus } from '@/types/appointment';
import { Stethoscope, X, Filter, Check } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandInput, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { useStaff } from '@/hooks/useDoctors';
import { useState } from 'react';

interface AppointmentFiltersProps {
    onFilterChange: (filters: { doctorId?: number; status?: AppointmentStatus }) => void;
    onClearFilters: () => void;
    hasFilters: boolean;
}
const statusOptions: { value: AppointmentStatus; label: string; colorClass: string }[] = [
    { value: 'SCHEDULED', label: 'Agendada', colorClass: 'bg-blue-500' },
    { value: 'COMPLETED', label: 'Completada', colorClass: 'bg-green-500' },
    { value: 'CANCELLED', label: 'Cancelada', colorClass: 'bg-red-500' },
    { value: 'NO_SHOW', label: 'No asistió', colorClass: 'bg-red-500' },
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
    const [popoverDoctorOpen, setPopoverDoctorOpen] = useState(false);
    const [doctorSearchTerm, setDoctorSearchTerm] = useState('');

    const triggerFilter = (newDocId: number | undefined, newStatus: string) => {
        const filters: any = {};
        if (newDocId) filters.doctorId = newDocId;
        if (newStatus !== 'all') filters.status = newStatus as AppointmentStatus;
        onFilterChange(filters);
    };

    const handleSelectDoctor = (doctorId: number | undefined) => {
        setSelectedDoctorId(doctorId);
        setPopoverDoctorOpen(false);
        setDoctorSearchTerm('');
        triggerFilter(doctorId, status);
    };

    const handleStatusChange = (newStatus: string) => {
        setStatus(newStatus);
        triggerFilter(selectedDoctorId, newStatus);
    };

    const handleClearFilters = () => {
        setSelectedDoctorId(undefined);
        setStatus('all');
        onClearFilters();
    };

    const selectedDoctor = staff.find((d: any) => d.id === selectedDoctorId);
    const selectedStatusOption = statusOptions.find(o => o.value === status);

    return (
        <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-sm font-medium text-gray-500 mr-2">
                <Filter className="h-4 w-4" />
                Filtrar:
            </div>

            {/* SELECT DOCTOR */}
            <Popover open={popoverDoctorOpen} onOpenChange={setPopoverDoctorOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        className={cn(
                            "h-9 justify-between font-normal min-w-[170px] bg-white",
                            !selectedDoctorId && "text-gray-500"
                        )}
                    >
                        {selectedDoctorId && selectedDoctor ? (
                            <div className="flex items-center gap-2 truncate">
                                <Stethoscope className="h-3.5 w-3.5 shrink-0 text-teal-600" />
                                <span className="truncate">{selectedDoctor.name}</span>
                            </div>
                        ) : (
                            "Todos los doctores"
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0 w-[250px]" align="start">
                    <Command>
                        <CommandInput placeholder="Buscar doctor..." value={doctorSearchTerm} onValueChange={setDoctorSearchTerm} />
                        <CommandList className="py-2 max-h-[200px]">
                            <CommandEmpty>No se encontraron doctores</CommandEmpty>
                            <CommandGroup>
                                <CommandItem
                                    onSelect={() => handleSelectDoctor(undefined)}
                                    className="flex items-center justify-between cursor-pointer text-gray-500"
                                >
                                    <div className="flex items-center gap-2">
                                        <X className="h-4 w-4" />
                                        <span>Todos los doctores</span>
                                    </div>
                                    {!selectedDoctorId && <Check className="h-4 w-4 text-teal-600" />}
                                </CommandItem>
                                {staff.map((user: any) => (
                                    <CommandItem
                                        key={user.id}
                                        onSelect={() => handleSelectDoctor(user.id)}
                                        className="flex items-center justify-between cursor-pointer"
                                    >
                                        <div className="flex items-center gap-2">
                                            <Stethoscope className="h-4 w-4 text-gray-400" />
                                            <span>{user.name}</span>
                                        </div>
                                        {selectedDoctorId === user.id && <Check className="h-4 w-4 text-teal-600" />}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>

            {/* SELECT ESTADO */}
            <Select value={status} onValueChange={handleStatusChange}>
                <SelectTrigger className="h-9 min-w-[160px] bg-white text-gray-700">
                    <SelectValue placeholder="Todos los estados">
                        {selectedStatusOption ? (
                            <div className="flex items-center gap-2">
                                <div className={cn("h-2 w-2 rounded-full", selectedStatusOption.colorClass)} />
                                {selectedStatusOption.label}
                            </div>
                        ) : (
                            "Todos los estados"
                        )}
                    </SelectValue>
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">
                        <span className="text-gray-500">Todos los estados</span>
                    </SelectItem>
                    {statusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                            <div className="flex items-center gap-2">
                                <div className={cn("h-2 w-2 rounded-full", option.colorClass)} />
                                {option.label}
                            </div>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {/* BOTÓN LIMPIAR */}
            {hasFilters && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearFilters}
                    className="h-9 text-gray-500 hover:text-red-600 hover:bg-red-50 px-2"
                >
                    <X className="h-4 w-4 mr-1" />
                    Limpiar
                </Button>
            )}
        </div>
    );
}