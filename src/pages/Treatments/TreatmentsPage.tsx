import { useState } from 'react';
import { useTreatments, useStartTreatment, useCancelTreatment } from '@/hooks/useTreatments';
import { Button } from '@/components/ui/button';
import { TreatmentTable } from '@/components/treatments/TreatmentTable';
import { TreatmentForm } from '@/components/treatments/TreatmentForm';
import { StartTreatmentDialog } from '@/components/treatments/StartTreatmentDialog';
import { CancelTreatmentDialog } from '@/components/treatments/CancelTreatmentDialog';
import { SearchBar } from '@/components/shared/SearchBar';
import { Plus, Activity, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Treatment } from '@/types/treatment';
import tratamientoImg from '@/assets/images/consultorio.png';
import { cn } from '@/lib/utils';
import { useScrollDirection } from '@/hooks/useScrollDirection';

export function TreatmentsPage() {
    const navigate = useNavigate();
    const { data: treatments, isLoading, refetch } = useTreatments();
    const startTreatment = useStartTreatment();
    const cancelTreatment = useCancelTreatment();

    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [modalOpen, setModalOpen] = useState(false);
    const [treatmentToEdit, setTreatmentToEdit] = useState<Treatment | null>(null);
    const [treatmentToStart, setTreatmentToStart] = useState<Treatment | null>(null);
    const [treatmentToCancel, setTreatmentToCancel] = useState<Treatment | null>(null);
    const scrollDirection = useScrollDirection();
    const itemsPerPage = 10;

    // Filtrar tratamientos por búsqueda
    const filteredTreatments = (treatments || []).filter(treatment => {
        if (!searchTerm) return true;
        const searchLower = searchTerm.toLowerCase();
        return (
            treatment.name.toLowerCase().includes(searchLower) ||
            treatment.description?.toLowerCase().includes(searchLower) ||
            treatment.type.toLowerCase().includes(searchLower) ||
            treatment.patient?.fullName.toLowerCase().includes(searchLower)
        );
    });

    const totalPages = Math.ceil(filteredTreatments.length / itemsPerPage);
    const paginatedTreatments = filteredTreatments.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handleSearch = (value: string) => {
        setSearchTerm(value);
        if (value.trim() !== '') {
            setCurrentPage(1);
        }
    };

    const handleOpenCreate = () => {
        setTreatmentToEdit(null);
        setModalOpen(true);
    };

    const handleViewDetail = (treatment: Treatment) => {
        if (treatment.patient?.id) {
            navigate(`/treatment-sessions/${treatment.id}/patient/${treatment.patient.id}`);
        } else {
            console.log('Ver tratamiento:', treatment);
        }
    };

    const handleEdit = (treatment: Treatment) => {
        setTreatmentToEdit(treatment);
        setModalOpen(true);
    };

    // ============ START ============
    const handleStart = (treatment: Treatment) => {
        setTreatmentToStart(treatment);
    };

    const confirmStart = () => {
        if (!treatmentToStart) return;
        startTreatment.mutate(treatmentToStart.id, {
            onSuccess: () => setTreatmentToStart(null),
        });
    };

    // ============ CANCEL ============
    const handleCancel = (treatment: Treatment) => {
        setTreatmentToCancel(treatment);
    };

    const confirmCancel = () => {
        if (!treatmentToCancel) return;
        cancelTreatment.mutate(treatmentToCancel.id, {
            onSuccess: () => setTreatmentToCancel(null),
        });
    };

    const handleModalOpenChange = (openValue: boolean) => {
        setModalOpen(openValue);
        if (!openValue) {
            setTreatmentToEdit(null);
        }
    };

    // Estadísticas
    const total = treatments?.length || 0;
    const inProgress = treatments?.filter(t => t.status === 'IN_PROGRESS').length || 0;
    const completed = treatments?.filter(t => t.status === 'COMPLETED').length || 0;
    const cancelled = treatments?.filter(t => t.status === 'CANCELLED').length || 0;

    // Tarjetas de estadísticas — mismo patrón que PatientsList: ícono grande en esquina, opacity-20
    const statsCards = [
        {
            label: 'Total Tratamientos',
            value: total,
            icon: Activity,
            iconColor: 'text-gray-500',
            valueColor: 'text-gray-900',
        },
        {
            label: 'En Progreso',
            value: inProgress,
            icon: Clock,
            iconColor: 'text-yellow-500',
            valueColor: 'text-yellow-600',
        },
        {
            label: 'Completados',
            value: completed,
            icon: CheckCircle,
            iconColor: 'text-green-500',
            valueColor: 'text-green-600',
        },
        {
            label: 'Cancelados',
            value: cancelled,
            icon: XCircle,
            iconColor: 'text-red-500',
            valueColor: 'text-red-600',
        },
    ];

    return (
        <div className="space-y-4 md:space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                    <img
                        src={tratamientoImg}
                        alt="Tratamientos"
                        className="w-12 h-12 md:w-16 md:h-16 rounded-full object-cover shrink-0"
                    />
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold text-gray-900">Tratamientos</h1>
                        <p className="text-xs md:text-sm text-gray-500 mt-0.5 hidden sm:block">
                            Gestiona todos los tratamientos odontológicos
                        </p>
                    </div>
                </div>
                <Button onClick={handleOpenCreate} className="gap-2 shadow-sm hover:shadow-md transition-shadow shrink-0 hidden lg:flex"
                >
                    <Plus className="h-4 w-4" />
                    Nuevo Tratamiento
                </Button>
            </div>

            {/* Tarjetas de estadísticas — 2 columnas en mobile, 4 en desktop */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4">
                {statsCards.map((card, index) => {
                    const Icon = card.icon;
                    return (
                        <div
                            key={index}
                            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 md:p-5 hover:shadow-md transition-shadow relative overflow-hidden"
                        >
                            <div>
                                <p className="text-[11px] md:text-sm font-medium leading-tight text-gray-500">
                                    {card.label}
                                </p>
                                <p className={cn("text-lg md:text-3xl font-bold mt-0.5 md:mt-1", card.valueColor)}>
                                    {card.value}
                                </p>
                            </div>
                            <div className="absolute bottom-0 right-0 p-2 md:p-3">
                                <Icon className={cn("w-8 h-8 md:w-12 md:h-12 opacity-20", card.iconColor)} />
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
                {/* Sticky header */}
                <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-100 px-4 md:px-6 py-3 md:py-4 rounded-t-2xl">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="min-w-0">
                            <h2 className="text-base md:text-lg font-semibold text-gray-900">
                                Listado de Tratamientos
                            </h2>
                            <p className="text-xs md:text-sm text-gray-500">
                                {total} {total === 1 ? 'tratamiento registrado' : 'tratamientos registrados'}
                            </p>
                        </div>
                        <div className="w-full sm:w-72">
                            <SearchBar
                                onSearch={handleSearch}
                                placeholder="Buscar tratamiento..."
                                delay={500}
                            />
                        </div>
                    </div>
                </div>

                {/* Tabla */}
                <div className="p-4 md:p-6 rounded-b-2xl">
                    <TreatmentTable
                        data={paginatedTreatments}
                        isLoading={isLoading}
                        onViewDetail={handleViewDetail}
                        onEdit={handleEdit}
                        onStart={handleStart}
                        onCancel={handleCancel}
                        pagination={{
                            currentPage,
                            totalPages,
                            totalItems: filteredTreatments.length,
                            itemsPerPage,
                            onPageChange: setCurrentPage,
                        }}
                    />
                </div>
            </div>

            {/* FAB móvil */}
            <button
                type="button"
                onClick={handleOpenCreate}
                aria-label="Nuevo Paciente"
                className={cn(
                    "fixed right-5 z-50 lg:hidden",
                    "h-14 w-14 rounded-full",
                    "bg-blue-600 hover:bg-blue-700 text-white",
                    "flex items-center justify-center",
                    "shadow-xl shadow-blue-600/30",
                    "hover:shadow-2xl hover:shadow-blue-600/40",
                    "active:scale-95 transition-all duration-300 ease-out",
                    scrollDirection === 'down'
                        ? "translate-y-24 opacity-0 pointer-events-none"
                        : "translate-y-0 opacity-100"
                )}
                style={{
                    bottom: 'calc(1.25rem + env(safe-area-inset-bottom))',
                }}
            >
                <Plus className="h-6 w-6" strokeWidth={2.5} />
            </button>

            {/* Modal para crear/editar tratamiento */}
            <TreatmentForm
                open={modalOpen}
                onOpenChange={handleModalOpenChange}
                treatmentToEdit={treatmentToEdit}
                onSuccess={() => {
                    handleModalOpenChange(false);
                    refetch();
                }}
            />

            {/* Modal de confirmación: Iniciar */}
            <StartTreatmentDialog
                open={!!treatmentToStart}
                onOpenChange={(open) => !open && setTreatmentToStart(null)}
                treatmentName={treatmentToStart?.name || ''}
                onConfirm={confirmStart}
                isLoading={startTreatment.isPending}
            />

            {/* Modal de confirmación: Cancelar */}
            <CancelTreatmentDialog
                open={!!treatmentToCancel}
                onOpenChange={(open) => !open && setTreatmentToCancel(null)}
                treatmentName={treatmentToCancel?.name || ''}
                onConfirm={confirmCancel}
                isLoading={cancelTreatment.isPending}
            />
        </div>
    );
}