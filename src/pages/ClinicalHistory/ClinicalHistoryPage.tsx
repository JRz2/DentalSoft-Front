import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Edit, Stethoscope, ClipboardList, Phone, Mail, Calendar as CalendarIcon,
    MapPin, Search
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from '@/components/ui/select';
import { usePatient } from '@/hooks/usePatients';
import { useClinicalHistory, useCompleteTreatment, useTreatments, useStartTreatment,
    useCancelTreatment
} from '@/hooks/useClinicalHistory';
import { TreatmentForm } from '@/components/clinical/TreatmentForm';
import { ClinicalInfoForm } from '@/components/clinical/ClinicalInfoForm';
import { TreatmentTable } from '@/components/clinical/TreatmentTable';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CompleteTreatmentDialog } from '@/components/treatments/CompleteTreatmentDialog';
import { StartTreatmentDialog } from '@/components/treatments/StartTreatmentDialog';
import { CancelTreatmentDialog } from '@/components/treatments/CancelTreatmentDialog';
import { DeleteConfirmDialog } from '@/components/treatments/DeleteConfirmDialog';
import { clinicalHistoryService } from '@/services/clinicalHistory.service';
import historyclinicImg from '@/assets/images/historyclinicImg.png';
import { useScrollDirection } from '@/hooks/useScrollDirection';
import { cn } from '@/lib/utils';

// Opciones para filtros
const statusOptions = [
    { value: 'all', label: 'Todos' },
    { value: 'PLANNED', label: 'Planificado' },
    { value: 'IN_PROGRESS', label: 'En Progreso' },
    { value: 'ON_HOLD', label: 'En Espera' },
    { value: 'COMPLETED', label: 'Completado' },
    { value: 'CANCELLED', label: 'Cancelado' },
];

const typeOptions = [
    { value: 'all', label: 'Todos' },
    { value: 'DIAGNOSIS', label: 'Diagnóstico' },
    { value: 'PREVENTIVE', label: 'Preventivo' },
    { value: 'RESTORATIVE', label: 'Restaurador' },
    { value: 'ENDODONTIC', label: 'Endodoncia' },
    { value: 'PERIODONTAL', label: 'Periodoncia' },
    { value: 'ORTHODONTIC', label: 'Ortodoncia' },
    { value: 'SURGICAL', label: 'Quirúrgico' },
    { value: 'PROSTHETIC', label: 'Prótesis' },
    { value: 'AESTHETIC', label: 'Estética' },
    { value: 'MAINTENANCE', label: 'Mantenimiento' },
];

export function ClinicalHistoryPage() {
    const { id } = useParams<{ id: string }>();
    const patientId = parseInt(id!);
    const navigate = useNavigate();

    const completeTreatment = useCompleteTreatment();
    const startTreatment = useStartTreatment();
    const cancelTreatment = useCancelTreatment();
    const scrollDirection = useScrollDirection();

    const [showTreatmentForm, setShowTreatmentForm] = useState(false);
    const [showClinicalInfoForm, setShowClinicalInfoForm] = useState(false);

    // Buscador con debounce
    const [searchInput, setSearchInput] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    const [statusFilter, setStatusFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
    const [startDialogOpen, setStartDialogOpen] = useState(false);
    const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedTreatment, setSelectedTreatment] = useState<any>(null);
    const [showEditTreatmentForm, setShowEditTreatmentForm] = useState(false);
    const [treatmentToEdit, setTreatmentToEdit] = useState<any>(null);

    const { data: patient, isLoading: patientLoading } = usePatient(patientId);
    const { data: clinicalHistory, isLoading: historyLoading, refetch: refetchHistory } = useClinicalHistory(patientId);
    const { data: treatments, isLoading: treatmentsLoading, refetch: refetchTreatments } = useTreatments(patientId);

    // Debounce del buscador
    useEffect(() => {
        const timer = setTimeout(() => {
            setSearchTerm(searchInput);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchInput]);

    const filteredTreatments = (treatments || []).filter((treatment) => {
        const matchesSearch = treatment.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || treatment.status === statusFilter;
        const matchesType = typeFilter === 'all' || treatment.type === typeFilter;
        return matchesSearch && matchesStatus && matchesType;
    });

    const totalPages = Math.ceil(filteredTreatments.length / itemsPerPage);
    const paginatedTreatments = filteredTreatments.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handleEdit = (treatment: any) => {
        setTreatmentToEdit(treatment);
        setShowEditTreatmentForm(true);
    };

    const handleCompleteClick = (treatment: any) => {
        setSelectedTreatment(treatment);
        setCompleteDialogOpen(true);
    };

    const handleStartClick = (treatment: any) => {
        setSelectedTreatment(treatment);
        setStartDialogOpen(true);
    };

    const handleCancelClick = (treatment: any) => {
        setSelectedTreatment(treatment);
        setCancelDialogOpen(true);
    };

    const handleDelete = (treatment: any) => {
        setSelectedTreatment(treatment);
        setDeleteDialogOpen(true);
    };

    const handleConfirmComplete = async () => {
        if (selectedTreatment) {
            await completeTreatment.mutateAsync(selectedTreatment.id);
            setCompleteDialogOpen(false);
            setSelectedTreatment(null);
            refetchTreatments();
        }
    };

    const handleConfirmStart = async () => {
        if (selectedTreatment) {
            await startTreatment.mutateAsync(selectedTreatment.id);
            setStartDialogOpen(false);
            setSelectedTreatment(null);
            refetchTreatments();
        }
    };

    const handleConfirmCancel = async () => {
        if (selectedTreatment) {
            await cancelTreatment.mutateAsync(selectedTreatment.id);
            setCancelDialogOpen(false);
            setSelectedTreatment(null);
            refetchTreatments();
        }
    };

    const handleConfirmDelete = async () => {
        if (selectedTreatment) {
            await clinicalHistoryService.deleteTreatment(selectedTreatment.id);
            setDeleteDialogOpen(false);
            setSelectedTreatment(null);
            refetchTreatments();
        }
    };

    useEffect(() => {
        if (!patientLoading && !patient) {
            navigate('/patients');
        }
    }, [patient, patientLoading, navigate]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter, typeFilter]);

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(word => word[0])
            .slice(0, 2)
            .join('')
            .toUpperCase();
    };

    const getImageUrl = (path: string) => {
        if (!path) return '';
        if (path.startsWith('http://') || path.startsWith('https://')) {
            return path;
        }
        if (path.startsWith('/')) {
            const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
            const cleanBaseUrl = baseUrl.replace(/\/api$/, '');
            return `${cleanBaseUrl}${path}`;
        }
        return path;
    };

    if (patientLoading || historyLoading) {
        return (
            <div className="space-y-6">
                <div className="flex gap-4 md:gap-6">
                    <Skeleton className="h-16 w-16 md:h-24 md:w-24 rounded-full shrink-0" />
                    <div className="space-y-2 flex-1">
                        <Skeleton className="h-6 md:h-8 w-48 md:w-64" />
                        <Skeleton className="h-4 w-24 md:w-32" />
                    </div>
                </div>
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-96 w-full" />
            </div>
        );
    }

    if (!patient) return null;

    return (
        <div className="space-y-4 md:space-y-6">

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 md:px-6 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-3 min-w-0">
                        <img
                            src={historyclinicImg}
                            alt="Historia Clínica"
                            className="w-12 h-12 md:w-16 md:h-16 rounded-full object-cover shrink-0"
                        />
                        <div className="min-w-0">
                            <h1 className="text-lg md:text-2xl font-bold text-gray-900">
                                Historia Clínica
                            </h1>
                            <p className="text-xs md:text-sm text-gray-500 mt-0.5 hidden sm:block">
                                Registro completo de tratamientos y consultas del paciente
                            </p>
                        </div>
                    </div>
                    <Button
                        variant="outline"
                        onClick={() => navigate('/patients')}
                        className="shrink-0 w-full sm:w-auto"
                    >
                        Volver a Pacientes
                    </Button>
                </div>

                <div className="p-4 md:p-6">
                    <div className="flex flex-col md:flex-row gap-4 md:gap-6">

                        <div className="flex justify-center md:justify-start shrink-0">
                            <div className="h-20 w-20 md:h-24 md:w-24 rounded-full border-4 border-primary-100 overflow-hidden bg-gray-50 flex items-center justify-center">
                                {patient?.photoUrl && patient.photoUrl.trim() !== '' ? (
                                    <img
                                        src={getImageUrl(patient.photoUrl)}
                                        alt={patient.fullName}
                                        className="h-full w-full object-cover"
                                        onError={(e) => {
                                            e.currentTarget.style.display = 'none';
                                        }}
                                    />
                                ) : null}
                                <span
                                    className="text-gray-700 text-lg md:text-2xl font-semibold"
                                    style={{
                                        display: patient?.photoUrl && patient.photoUrl.trim() !== ''
                                            ? 'none'
                                            : 'block'
                                    }}
                                >
                                    {getInitials(patient.fullName)}
                                </span>
                            </div>
                        </div>

                        <div className="flex-1 min-w-0">
                            <h2 className="text-xl md:text-2xl font-bold text-gray-900 text-center md:text-left truncate">
                                {patient.fullName}
                            </h2>

                            <div className="mt-1 flex flex-wrap items-center justify-center md:justify-start gap-x-3 gap-y-1 text-sm text-gray-500">
                                <span>Historia #{patient.medicalRecordNum}</span>
                                {patient.createdAt && (
                                    <>
                                        <span className="hidden sm:inline text-gray-300">·</span>
                                        <span>
                                            Paciente desde {format(new Date(patient.createdAt), 'MMMM yyyy', { locale: es })}
                                        </span>
                                    </>
                                )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4 md:mt-5">
                                {patient.email && (
                                    <div className="flex items-center gap-2 text-sm min-w-0">
                                        <Mail className="h-4 w-4 text-gray-400 shrink-0" />
                                        <span className="text-gray-600 truncate">{patient.email}</span>
                                    </div>
                                )}
                                {patient.phoneNumber && (
                                    <div className="flex items-center gap-2 text-sm min-w-0">
                                        <Phone className="h-4 w-4 text-gray-400 shrink-0" />
                                        <span className="text-gray-600 truncate">{patient.phoneNumber}</span>
                                    </div>
                                )}
                                {patient.birthDate && (
                                    <div className="flex items-center gap-2 text-sm min-w-0">
                                        <CalendarIcon className="h-4 w-4 text-gray-400 shrink-0" />
                                        <span className="text-gray-600 truncate">
                                            {format(new Date(patient.birthDate), 'dd/MM/yyyy')}
                                        </span>
                                    </div>
                                )}
                                {patient.address && (
                                    <div className="flex items-center gap-2 text-sm min-w-0 sm:col-span-2 lg:col-span-3">
                                        <MapPin className="h-4 w-4 text-gray-400 shrink-0" />
                                        <span className="text-gray-600 truncate">{patient.address}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Card className="border-l-4 border-l-primary-500">
                <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="p-2 bg-primary-100 rounded-lg shrink-0">
                                <Stethoscope className="h-5 w-5 text-primary-600" />
                            </div>
                            <div className="min-w-0">
                                <CardTitle>Información Clínica</CardTitle>
                                <p className="text-sm text-gray-500 mt-1">Antecedentes médicos, alergias y observaciones</p>
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowClinicalInfoForm(true)}
                            className="w-full sm:w-auto shrink-0"
                        >
                            <Edit className="h-4 w-4 mr-2" />
                            Actualizar
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Antecedentes Médicos</label>
                            <p className="mt-2 text-gray-700">{clinicalHistory?.medicalHistory || 'No registrados'}</p>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Alergias</label>
                            <p className="mt-2 text-gray-700">{clinicalHistory?.allergies || 'No registradas'}</p>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Observaciones Generales</label>
                            <p className="mt-2 text-gray-700">{clinicalHistory?.observations || 'No registradas'}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="overflow-visible">
                {/* Sticky header con buscador y filtros */}
                <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-100 px-4 md:px-6 py-3 md:py-4 rounded-t-2xl">
                    <div className="flex flex-col gap-3">
                        {/* Fila 1: título + contador + botón (desktop) */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                                <ClipboardList className="h-5 w-5 text-primary-600 shrink-0" />
                                <div className="min-w-0">
                                    <h2 className="text-base md:text-lg font-semibold text-gray-900">
                                        Listado de Tratamientos
                                    </h2>
                                    <p className="text-xs md:text-sm text-gray-500">
                                        {filteredTreatments.length}{' '}
                                        {filteredTreatments.length === 1
                                            ? 'tratamiento registrado'
                                            : 'tratamientos registrados'}
                                    </p>
                                </div>
                            </div>
                            <Button
                                onClick={() => setShowTreatmentForm(true)}
                                className="gap-2 shadow-sm hover:shadow-md transition-shadow shrink-0 hidden lg:flex"
                            >
                                <Plus className="h-4 w-4" />
                                Nuevo Tratamiento
                            </Button>
                        </div>

                        {/* Fila 2: buscador + filtros */}
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Buscar tratamiento..."
                                    value={searchInput}
                                    onChange={(e) => setSearchInput(e.target.value)}
                                    className="pl-9 w-full"
                                />
                            </div>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-full sm:w-[150px]">
                                    <SelectValue placeholder="Estado" />
                                </SelectTrigger>
                                <SelectContent>
                                    {statusOptions.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select value={typeFilter} onValueChange={setTypeFilter}>
                                <SelectTrigger className="w-full sm:w-[150px]">
                                    <SelectValue placeholder="Tipo" />
                                </SelectTrigger>
                                <SelectContent>
                                    {typeOptions.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                <CardContent className="space-y-4 pt-4">
                    {/* FAB móvil */}
                    <button
                        type="button"
                        onClick={() => setShowTreatmentForm(true)}
                        aria-label="Nuevo Tratamiento"
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

                    <TreatmentTable
                        data={paginatedTreatments}
                        isLoading={treatmentsLoading}
                        patientId={patientId}
                        onStart={handleStartClick}
                        onComplete={handleCompleteClick}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onCancel={handleCancelClick}
                        pagination={{
                            currentPage,
                            totalPages,
                            totalItems: filteredTreatments.length,
                            itemsPerPage,
                            onPageChange: setCurrentPage,
                        }}
                    />
                </CardContent>
            </Card>

            {showTreatmentForm && clinicalHistory && (
                <TreatmentForm
                    open={showTreatmentForm}
                    onOpenChange={setShowTreatmentForm}
                    clinicalHistoryId={clinicalHistory.id}
                    onSuccess={() => {
                        setShowTreatmentForm(false);
                        refetchTreatments();
                    }}
                />
            )}

            {showClinicalInfoForm && clinicalHistory && (
                <ClinicalInfoForm
                    open={showClinicalInfoForm}
                    onOpenChange={setShowClinicalInfoForm}
                    clinicalHistory={clinicalHistory}
                    patientId={patientId}
                    onSuccess={() => {
                        setShowClinicalInfoForm(false);
                        refetchHistory();
                    }}
                />
            )}

            {completeDialogOpen && (
                <CompleteTreatmentDialog
                    open={completeDialogOpen}
                    onOpenChange={setCompleteDialogOpen}
                    treatmentName={selectedTreatment?.name || ''}
                    onConfirm={handleConfirmComplete}
                    isLoading={completeTreatment.isPending}
                />
            )}

            {startDialogOpen && (
                <StartTreatmentDialog
                    open={startDialogOpen}
                    onOpenChange={setStartDialogOpen}
                    treatmentName={selectedTreatment?.name || ''}
                    onConfirm={handleConfirmStart}
                    isLoading={startTreatment.isPending}
                />
            )}

            {cancelDialogOpen && (
                <CancelTreatmentDialog
                    open={cancelDialogOpen}
                    onOpenChange={setCancelDialogOpen}
                    treatmentName={selectedTreatment?.name || ''}
                    onConfirm={handleConfirmCancel}
                    isLoading={cancelTreatment.isPending}
                />
            )}

            {deleteDialogOpen && (
                <DeleteConfirmDialog
                    open={deleteDialogOpen}
                    onOpenChange={setDeleteDialogOpen}
                    treatmentName={selectedTreatment?.name || ''}
                    onConfirm={handleConfirmDelete}
                    isLoading={false}
                />
            )}

            {showEditTreatmentForm && (
                <TreatmentForm
                    open={showEditTreatmentForm}
                    onOpenChange={setShowEditTreatmentForm}
                    treatmentToEdit={treatmentToEdit}
                    onSuccess={() => {
                        setShowEditTreatmentForm(false);
                        setTreatmentToEdit(null);
                        refetchTreatments();
                    }}
                />
            )}
        </div>
    );
}