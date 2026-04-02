import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PatientTable } from '@/components/patients/PatientTable';
import { PatientModal } from '@/components/patients/PatientModal';
import { DeleteConfirmDialog } from '@/components/patients/DeleteConfirmDialog';
import { SearchBar } from '@/components/shared/SearchBar';
import { usePatients, useCreatePatient, useUpdatePatient, useDeletePatient } from '@/hooks/usePatients';
import { Patient, CreatePatientDto } from '@/types/patient';

export function PatientsList() {
    //estados
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [modalOpen, setModalOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
    const [isEditing, setIsEditing] = useState(false);

    // PAginacion
    const itemsPerPage = 10;

    // Hooks de React Query
    const { data, isLoading, refetch } = usePatients({
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm || undefined,
    });

    const createPatient = useCreatePatient();
    const updatePatient = useUpdatePatient();
    const deletePatient = useDeletePatient();

    // Handlers
    const handleSearch = (value: string) => {
        setSearchTerm(value);
        setCurrentPage(1);
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
        // Navegar a la página de historia clínica
        console.log('Ver historial de:', patient);
        // TODO: Implementar navegación
    };

    const handleSubmitForm = async (data: CreatePatientDto) => {
        try {
            if (isEditing && selectedPatient) {
                await updatePatient.mutateAsync({
                    id: selectedPatient.id,
                    data: data,
                });
            } else {
                await createPatient.mutateAsync(data);
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

                    {/* Paginación */}
                    {data && data.totalPages > 1 && (
                        <div className="flex items-center justify-between mt-4">
                            <div className="text-sm text-gray-500">
                                Mostrando {((currentPage - 1) * itemsPerPage) + 1} a{' '}
                                {Math.min(currentPage * itemsPerPage, data.total)} de {data.total} resultados
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                >
                                    Anterior
                                </Button>
                                <div className="flex gap-1">
                                    {Array.from({ length: Math.min(5, data.totalPages) }, (_, i) => {
                                        let pageNum;
                                        if (data.totalPages <= 5) {
                                            pageNum = i + 1;
                                        } else if (currentPage <= 3) {
                                            pageNum = i + 1;
                                        } else if (currentPage >= data.totalPages - 2) {
                                            pageNum = data.totalPages - 4 + i;
                                        } else {
                                            pageNum = currentPage - 2 + i;
                                        }

                                        return (
                                            <Button
                                                key={pageNum}
                                                variant={currentPage === pageNum ? 'default' : 'outline'}
                                                size="sm"
                                                onClick={() => setCurrentPage(pageNum)}
                                            >
                                                {pageNum}
                                            </Button>
                                        );
                                    })}
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(p => Math.min(data.totalPages, p + 1))}
                                    disabled={currentPage === data.totalPages}
                                >
                                    Siguiente
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Modal para crear/editar paciente */}
            <PatientModal
                open={modalOpen}
                onOpenChange={setModalOpen}
                onSubmit={handleSubmitForm}
                isLoading={createPatient.isPending || updatePatient.isPending}
                patient={selectedPatient}
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