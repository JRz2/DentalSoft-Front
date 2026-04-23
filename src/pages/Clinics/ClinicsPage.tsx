import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useClinics, useCreateClinic, useUpdateClinic, useDeleteClinic } from '@/hooks/useClinics';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ClinicTable } from '@/components/clinics/ClinicTable';
import { ClinicModal } from '@/components/clinics/ClinicModal';
import { DeleteConfirmDialog } from '@/components/patients/DeleteConfirmDialog';
import { SearchBar } from '@/components/shared/SearchBar';
import { Plus } from 'lucide-react';

export function ClinicsPage() {
    const { user: currentUser } = useAuth();
    const { data: clinics, isLoading } = useClinics();
    const createClinic = useCreateClinic();
    const updateClinic = useUpdateClinic();
    const deleteClinic = useDeleteClinic();

    // Estados
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [modalOpen, setModalOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedClinic, setSelectedClinic] = useState<any>(null);
    const [isEditing, setIsEditing] = useState(false);

    // Paginación
    const itemsPerPage = 10;

    // Filtrar clínicas por búsqueda
    const filteredClinics = (clinics || []).filter(clinic => {
        if (!searchTerm) return true;
        const searchLower = searchTerm.toLowerCase();
        return (
            clinic.name.toLowerCase().includes(searchLower) ||
            (clinic.commercialName && clinic.commercialName.toLowerCase().includes(searchLower)) ||
            (clinic.nit && clinic.nit.toLowerCase().includes(searchLower)) ||
            (clinic.email && clinic.email.toLowerCase().includes(searchLower))
        );
    });

    // Paginación
    const totalPages = Math.ceil(filteredClinics.length / itemsPerPage);
    const paginatedClinics = filteredClinics.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Verificar permisos (solo SUPER_ADMIN y ADMIN pueden gestionar clínicas)
    if (currentUser?.role !== 'SUPER_ADMIN' && currentUser?.role !== 'ADMIN') {
        return (
            <div className="flex items-center justify-center h-96">
                <Card className="text-center p-8">
                    <p className="text-red-500">No tienes permiso para acceder a esta página</p>
                </Card>
            </div>
        );
    }

    const handleSearch = (value: string) => {
        setSearchTerm(value);
        setCurrentPage(1);
    };

    const handleCreate = () => {
        setIsEditing(false);
        setSelectedClinic(null);
        setModalOpen(true);
    };

    const handleEdit = (clinic: any) => {
        setIsEditing(true);
        setSelectedClinic(clinic);
        setModalOpen(true);
    };

    const handleDelete = (clinic: any) => {
        setSelectedClinic(clinic);
        setDeleteDialogOpen(true);
    };

    const handleSubmitForm = async (data: any) => {
        try {
            if (isEditing && selectedClinic) {
                await updateClinic.mutateAsync({
                    id: selectedClinic.id,
                    data,
                });
            } else {
                await createClinic.mutateAsync(data);
            }
            setModalOpen(false);
        } catch (error) {
            console.error('Error al guardar:', error);
        }
    };

    const handleConfirmDelete = async () => {
        if (selectedClinic) {
            await deleteClinic.mutateAsync(selectedClinic.id);
            setDeleteDialogOpen(false);
            setSelectedClinic(null);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Clínicas</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Gestiona todas las clínicas del sistema
                    </p>
                </div>
                <Button onClick={handleCreate} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Nueva Clínica
                </Button>
            </div>

            {/* Tarjetas de estadísticas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">
                            Total Clínicas
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-gray-900">
                            {clinics?.length || 0}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">
                            Clínicas Activas
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            {clinics?.filter(c => c.isActive !== false).length || 0}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">
                            Con NIT registrado
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">
                            {clinics?.filter(c => c.nit).length || 0}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">
                            Con email configurado
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-purple-600">
                            {clinics?.filter(c => c.email).length || 0}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Barra de búsqueda y tabla */}
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <CardTitle>Listado de Clínicas</CardTitle>
                        <div className="w-full sm:w-72">
                            <SearchBar
                                onSearch={handleSearch}
                                placeholder="Buscar por nombre, NIT o email..."
                                delay={500}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <ClinicTable
                        data={paginatedClinics}
                        isLoading={isLoading}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        pagination={{
                            currentPage,
                            totalPages,
                            totalItems: filteredClinics.length,
                            itemsPerPage,
                            onPageChange: setCurrentPage,
                        }}
                    />
                </CardContent>
            </Card>

            {/* Modal para crear/editar clínica */}
            <ClinicModal
                open={modalOpen}
                onOpenChange={setModalOpen}
                onSubmit={handleSubmitForm}
                isLoading={createClinic.isPending || updateClinic.isPending}
                clinic={selectedClinic}
            />

            {/* Diálogo de confirmación para eliminar */}
            <DeleteConfirmDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                onConfirm={handleConfirmDelete}
                patientName={selectedClinic?.name}
                isLoading={deleteClinic.isPending}
            />
        </div>
    );
}