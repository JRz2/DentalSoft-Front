import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, UserCheck, TrendingUp, UserX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PatientTable } from '@/components/patients/PatientTable';
import { PatientModal } from '@/components/patients/PatientModal';
import { DeleteConfirmDialog } from '@/components/patients/DeleteConfirmDialog';
import { SearchBar } from '@/components/shared/SearchBar';
import { usePatients, useCreatePatient, useUpdatePatient, useDeletePatient, useRestorePatient } from '@/hooks/usePatients';
import { Patient, CreatePatientDto } from '@/types/patient';
import api from '@/services/api';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { AppointmentFromPatient } from '@/components/appointments/AppointmentFromPatient';

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

    const createPatient = useCreatePatient();
    const updatePatient = useUpdatePatient();
    const deletePatient = useDeletePatient();
    const restorePatient = useRestorePatient();
    const patients = data?.data || [];
    const totalPatients = data?.meta?.total || 0;
    const activePatients = data?.meta?.stats?.totalActive || 0;
    const newThisMonth = data?.meta?.stats?.newThisMonth || 0;
    const inactivePatients = totalPatients - activePatients;

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

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Users className="h-6 w-6 text-primary-500" />
                        Pacientes
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Gestiona todos los pacientes de la clínica
                    </p>
                </div>
                <Button onClick={handleCreate} className="gap-2 shadow-sm hover:shadow-md transition-shadow">
                    <Plus className="h-4 w-4" />
                    Nuevo Paciente
                </Button>
            </div>

            {/* Stats cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Total Pacientes</p>
                                {isLoading ? (
                                    <Skeleton className="h-8 w-16 mt-1" />
                                ) : (
                                    <p className="text-2xl font-bold text-gray-900">{totalPatients}</p>
                                )}
                            </div>
                            <div className="p-3 bg-blue-50 rounded-xl">
                                <Users className="h-5 w-5 text-blue-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Pacientes Activos</p>
                                {isLoading ? (
                                    <Skeleton className="h-8 w-16 mt-1" />
                                ) : (
                                    <p className="text-2xl font-bold text-green-600">{activePatients}</p>
                                )}
                            </div>
                            <div className="p-3 bg-green-50 rounded-xl">
                                <UserCheck className="h-5 w-5 text-green-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Nuevos este mes</p>
                                {isLoading ? (
                                    <Skeleton className="h-8 w-16 mt-1" />
                                ) : (
                                    <p className="text-2xl font-bold text-purple-600">{newThisMonth}</p>
                                )}
                                <p className="text-xs text-gray-400 mt-0.5">
                                    {totalPatients > 0 ? `${Math.round((newThisMonth / totalPatients) * 100)}% del total` : 'Sin datos'}
                                </p>
                            </div>
                            <div className="p-3 bg-purple-50 rounded-xl">
                                <TrendingUp className="h-5 w-5 text-purple-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {isAdmin && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-red-600">Pacientes Inactivos</p>
                                    {isLoading ? (
                                        <Skeleton className="h-8 w-16 mt-1" />
                                    ) : (
                                        <p className="text-2xl font-bold text-red-600">{inactivePatients}</p>
                                    )}
                                    <p className="text-xs text-red-400 mt-0.5">
                                        {inactivePatients > 0 ? 'Requieren atención' : 'Sin inactivos'}
                                    </p>
                                </div>
                                <div className="p-3 bg-red-100 rounded-xl">
                                    <UserX className="h-5 w-5 text-red-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Tabla con buscador integrado */}
            <Card className="border-0 shadow-sm">
                <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">Listado de Pacientes</h2>
                            <p className="text-sm text-gray-500">
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
                </CardContent>
            </Card>

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

            {/* Modal para agendar cita desde la tabla */}
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