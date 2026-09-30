import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, UserCheck, UserPlus, UserX, CalendarClock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PatientTable } from '@/components/patients/PatientTable';
import { PatientModal } from '@/components/patients/PatientModal';
import { DeleteConfirmDialog } from '@/components/patients/DeleteConfirmDialog';
import { SearchBar } from '@/components/shared/SearchBar';
import { usePatients, useCreatePatient, useUpdatePatient, useDeletePatient, useRestorePatient } from '@/hooks/usePatients';
import { useAppointments } from '@/hooks/useAppointments';
import { Patient, CreatePatientDto } from '@/types/patient';
import api from '@/services/api';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { AppointmentFromPatient } from '@/components/appointments/AppointmentFromPatient';
import pacienteImg from '@/assets/images/paciente.png';
import { useScrollDirection } from '@/hooks/useScrollDirection';
import { cn } from '@/lib/utils';
import { format, startOfDay, endOfDay } from 'date-fns';

export function PatientsList() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [modalOpen, setModalOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [showAppointmentModal, setShowAppointmentModal] = useState(false);
    const [selectedPatientForAppointment, setSelectedPatientForAppointment] = useState<Patient | null>(null);

    const itemsPerPage = 10;

    const { data, isLoading, refetch } = usePatients({
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm || undefined,
    });

    const today = new Date();
    const { data: todayAppointmentsData } = useAppointments({
        page: 1,
        limit: 100,
        startDate: format(startOfDay(today), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"),
        endDate: format(endOfDay(today), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"),
    });

    const createPatient = useCreatePatient();
    const updatePatient = useUpdatePatient();
    const deletePatient = useDeletePatient();
    const restorePatient = useRestorePatient();
    const patients = data?.data || [];
    const totalPatients = data?.meta?.total || 0;
    const activePatients = data?.meta?.stats?.totalActive || 0;
    const newThisMonth = data?.meta?.stats?.newThisMonth || 0;
    const inactivePatients = totalPatients - activePatients;
    const todayAppointments = todayAppointmentsData?.data?.length || 0;
    const scrollDirection = useScrollDirection();

    const handleSearch = (value: string) => {
        setSearchTerm(value);
        if (value.trim() !== '') {
            setCurrentPage(1);
        }
    };

    const handleCreate = () => {
        setIsEditing(false);
        setSelectedPatient(null);
        setModalOpen(true);
    };

    const handleEdit = (patient: Patient) => {
        setIsEditing(true);
        setSelectedPatient(patient);
        setModalOpen(true);
    };

    const handleDelete = (patient: Patient) => {
        setSelectedPatient(patient);
        setDeleteDialogOpen(true);
    };

    const handleViewHistory = (patient: Patient) => {
        navigate(`/clinical-history/${patient.id}`);
    };

    const handleRestore = async (patient: Patient) => {
        try {
            await restorePatient.mutateAsync(patient.id);
            refetch();
        } catch (error) {
            console.error('Error al restaurar:', error);
        }
    };

    const handleQuickAppointment = (patient: Patient) => {
        setSelectedPatientForAppointment(patient);
        setShowAppointmentModal(true);
    };

    const handleSubmitForm = async (data: CreatePatientDto, files?: { photoFile?: File }) => {
        try {
            let photoUrl = data.photoUrl || '';

            if (!isEditing && files?.photoFile) {
                const formData = new FormData();
                formData.append('file', files.photoFile);

                try {
                    const response = await api.post('/uploads/temp', formData, {
                        headers: { 'Content-Type': 'multipart/form-data' },
                    });
                    photoUrl = response.data.fileUrl;
                } catch (error) {
                    console.error('Error al subir foto temporal:', error);
                }
            }

            let patientData;
            if (isEditing && selectedPatient) {
                const { photoUrl: _, ...restData } = data;
                patientData = { ...restData };
            } else {
                patientData = { ...data, photoUrl };
            }

            if (isEditing && selectedPatient) {
                await updatePatient.mutateAsync({
                    id: selectedPatient.id,
                    data: patientData,
                });
            } else {
                await createPatient.mutateAsync(patientData);
            }
            setModalOpen(false);
            refetch();
        } catch (error) {
            console.error('Error al guardar:', error);
        }
    };

    const handleConfirmDelete = async () => {
        if (selectedPatient) {
            try {
                await deletePatient.mutateAsync(selectedPatient.id);
                setDeleteDialogOpen(false);
                setSelectedPatient(null);
                refetch();
            } catch (error) {
                console.error('Error al eliminar:', error);
            }
        }
    };

    const handlePhotoUploaded = () => {
        refetch();
    };

    // Tarjetas de estadísticas
    const statsCards = [
        {
            label: 'Total Pacientes',
            value: totalPatients,
            icon: Users,
            iconColor: 'text-gray-500',
            valueColor: 'text-gray-900',
        },
        {
            label: 'Pacientes Activos',
            value: activePatients,
            icon: UserCheck,
            iconColor: 'text-green-500',
            valueColor: 'text-green-600',
        },
        {
            label: 'Nuevos este mes',
            value: newThisMonth,
            subtitle: totalPatients > 0
                ? `${Math.round((newThisMonth / totalPatients) * 100)}% del total`
                : 'Sin datos',
            icon: UserPlus,
            iconColor: 'text-purple-500',
            valueColor: 'text-purple-600',
        },
        ...(isAdmin
            ? [{
                label: 'Pacientes Inactivos',
                value: inactivePatients,
                subtitle: inactivePatients > 0 ? 'Requieren atención' : 'Sin inactivos',
                icon: UserX,
                iconColor: 'text-red-500',
                valueColor: 'text-red-600',
                isInactive: true,
            }]
            : [{
                label: 'Citas de Hoy',
                value: todayAppointments,
                subtitle: todayAppointments > 0 ? 'En agenda' : 'Sin citas',
                icon: CalendarClock,
                iconColor: 'text-orange-500',
                valueColor: 'text-orange-600',
            }]
        ),
    ];

    return (
        <div className="space-y-4 md:space-y-6">
            {/* Header compacto */}
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                    <img
                        src={pacienteImg}
                        alt="Pacientes"
                        className="w-12 h-12 md:w-16 md:h-16 rounded-full object-cover shrink-0"
                    />
                    <div className="min-w-0">
                        <h1 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <span className="truncate">Pacientes</span>
                        </h1>
                        <p className="text-xs md:text-sm text-gray-500 mt-0.5 hidden sm:block">
                            Gestiona todos los pacientes de la clínica
                        </p>
                    </div>
                </div>

                <Button
                    onClick={handleCreate}
                    className="gap-2 shadow-sm hover:shadow-md transition-shadow shrink-0 hidden lg:flex"
                >
                    <Plus className="h-4 w-4" />
                    Nuevo Paciente
                </Button>
            </div>

            {/* Grid de estadísticas */}
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 md:gap-4">
                {statsCards.map((card, index) => {
                    const Icon = card.icon;
                    return (
                        <div
                            key={index}
                            className={cn(
                                "bg-white rounded-2xl shadow-sm border border-gray-100 p-3 md:p-5 hover:shadow-md transition-shadow relative overflow-hidden",
                                card.isInactive && "border-red-100"
                            )}
                        >
                            <div>
                                <p className={cn(
                                    "text-[11px] md:text-sm font-medium leading-tight",
                                    card.isInactive ? "text-red-600" : "text-gray-500"
                                )}>
                                    {card.label}
                                </p>
                                {isLoading ? (
                                    <Skeleton className="h-6 md:h-8 w-12 md:w-16 mt-1" />
                                ) : (
                                    <p className={cn("text-lg md:text-3xl font-bold mt-0.5 md:mt-1", card.valueColor)}>
                                        {card.value}
                                    </p>
                                )}
                                {card.subtitle && !isLoading && (
                                    <p className={cn(
                                        "text-[10px] md:text-xs mt-0.5",
                                        card.isInactive ? "text-red-400" : "text-gray-400"
                                    )}>
                                        {card.subtitle}
                                    </p>
                                )}
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
                                Listado de Pacientes
                            </h2>
                            <p className="text-xs md:text-sm text-gray-500">
                                {totalPatients} {totalPatients === 1 ? 'paciente registrado' : 'pacientes registrados'}
                            </p>
                        </div>
                        <div className="w-full sm:w-72">
                            <SearchBar
                                onSearch={handleSearch}
                                placeholder="Buscar paciente..."
                                delay={500}
                            />
                        </div>
                    </div>
                </div>

                {/* Tabla */}
                <div className="p-4 md:p-6 rounded-b-2xl">
                    <PatientTable
                        data={patients}
                        isLoading={isLoading}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onViewHistory={handleViewHistory}
                        onRestore={handleRestore}
                        onQuickAppointment={handleQuickAppointment}
                        pagination={{
                            currentPage: currentPage,
                            totalPages: data?.meta?.totalPages || 1,
                            totalItems: data?.meta?.total || 0,
                            itemsPerPage: itemsPerPage,
                            onPageChange: (page) => setCurrentPage(page),
                        }}
                    />
                </div>
            </div>

            {/* FAB móvil */}
            <button
                type="button"
                onClick={handleCreate}
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

            {/* Modales */}
            <PatientModal
                open={modalOpen}
                onOpenChange={setModalOpen}
                onSubmit={handleSubmitForm}
                isLoading={createPatient.isPending || updatePatient.isPending}
                patient={selectedPatient}
                onPhotoUploaded={handlePhotoUploaded}
            />

            <DeleteConfirmDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                onConfirm={handleConfirmDelete}
                patientName={selectedPatient?.fullName}
                isLoading={deletePatient.isPending}
            />

            {selectedPatientForAppointment && (
                <AppointmentFromPatient
                    open={showAppointmentModal}
                    onOpenChange={setShowAppointmentModal}
                    patientId={selectedPatientForAppointment.id}
                    patientName={selectedPatientForAppointment.fullName}
                    onSuccess={() => {
                        setShowAppointmentModal(false);
                        setSelectedPatientForAppointment(null);
                        refetch();
                    }}
                    defaultDate={new Date().toISOString().split('T')[0]}
                />
            )}
        </div>
    );
}