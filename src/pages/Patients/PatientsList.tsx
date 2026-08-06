import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PatientTable } from '@/components/patients/PatientTable';
import { PatientModal } from '@/components/patients/PatientModal';
import { DeleteConfirmDialog } from '@/components/patients/DeleteConfirmDialog';
import { SearchBar } from '@/components/shared/SearchBar';
import { usePatients, useCreatePatient, useUpdatePatient, useDeletePatient } from '@/hooks/usePatients';
import { Patient, CreatePatientDto } from '@/types/patient';
import api from '@/services/api';

export function PatientsList() {
    const navigate = useNavigate();

    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [modalOpen, setModalOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
    const [isEditing, setIsEditing] = useState(false);

    const itemsPerPage = 10;

    const { data, isLoading, refetch } = usePatients({
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm || undefined,
    });

    const createPatient = useCreatePatient();
    const updatePatient = useUpdatePatient();
    const deletePatient = useDeletePatient();

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
                    <h1 className="text-2xl font-bold text-gray-900">Pacientes</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Gestiona todos los pacientes de la clínica
                    </p>
                </div>
                <Button onClick={handleCreate} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Nuevo Paciente
                </Button>
            </div>

            {/* Tarjetas de estadísticas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">
                            Total Pacientes
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-gray-900">
                            {data?.total || 0}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">
                            Pacientes Activos
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            {data?.data?.filter(p => p.IsActive !== false).length || 0}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">
                            Nuevos este mes
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">+12</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">
                            Citas Activas
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-600">8</div>
                    </CardContent>
                </Card>
            </div>

            {/* Barra de búsqueda y tabla */}
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <CardTitle>Listado de Pacientes</CardTitle>
                        <div className="w-full sm:w-72">
                            <SearchBar
                                onSearch={handleSearch}
                                placeholder="Buscar por nombre, email o teléfono..."
                                delay={500}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <PatientTable
                        data={data?.data || []}
                        isLoading={isLoading}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onViewHistory={handleViewHistory}
                        pagination={{
                            currentPage: currentPage,
                            totalPages: data?.totalPages || 1,
                            totalItems: data?.total || 0,
                            itemsPerPage: itemsPerPage,
                            onPageChange: (page) => setCurrentPage(page),
                        }}
                    />
                </CardContent>
            </Card>

            {/* Modal para crear/editar paciente */}
            <PatientModal
                open={modalOpen}
                onOpenChange={setModalOpen}
                onSubmit={handleSubmitForm}
                isLoading={createPatient.isPending || updatePatient.isPending}
                patient={selectedPatient}
                onPhotoUploaded={handlePhotoUploaded}
            />

            {/* Diálogo de confirmación para eliminar */}
            <DeleteConfirmDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                onConfirm={handleConfirmDelete}
                patientName={selectedPatient?.fullName}
                isLoading={deletePatient.isPending}
            />
        </div>
    );
}