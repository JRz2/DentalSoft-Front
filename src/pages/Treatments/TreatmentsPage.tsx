import { useState } from 'react';
import { useTreatments } from '@/hooks/useTreatments';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TreatmentTable } from '@/components/treatments/TreatmentTable';
import { TreatmentForm } from '@/components/treatments/TreatmentForm';
import { SearchBar } from '@/components/shared/SearchBar';
import { Plus, Activity, Clock, CheckCircle, XCircle } from 'lucide-react';

export function TreatmentsPage() {
    const { data: treatments, isLoading, refetch } = useTreatments();
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [modalOpen, setModalOpen] = useState(false);

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
        setCurrentPage(1);
    };

    const handleView = (treatment: any) => {
        console.log('Ver tratamiento:', treatment);
        // TODO: Implementar vista de detalles
    };

    const handleEdit = (treatment: any) => {
        console.log('Editar tratamiento:', treatment);
        // TODO: Implementar edición
    };

    const handleDelete = (treatment: any) => {
        console.log('Eliminar tratamiento:', treatment);
        // TODO: Implementar eliminación
    };

    // Estadísticas
    const total = treatments?.length || 0;
    const inProgress = treatments?.filter(t => t.status === 'IN_PROGRESS').length || 0;
    const completed = treatments?.filter(t => t.status === 'COMPLETED').length || 0;
    const cancelled = treatments?.filter(t => t.status === 'CANCELLED').length || 0;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Tratamientos</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Gestiona todos los tratamientos odontológicos
                    </p>
                </div>
                <Button onClick={() => setModalOpen(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Nuevo Tratamiento
                </Button>
            </div>

            {/* Tarjetas de estadísticas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">
                            <Activity className="h-4 w-4 inline mr-1" />
                            Total Tratamientos
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-gray-900">
                            {total}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">
                            <Clock className="h-4 w-4 inline mr-1 text-yellow-500" />
                            En Progreso
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-yellow-600">
                            {inProgress}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">
                            <CheckCircle className="h-4 w-4 inline mr-1 text-green-500" />
                            Completados
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            {completed}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">
                            <XCircle className="h-4 w-4 inline mr-1 text-red-500" />
                            Cancelados
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">
                            {cancelled}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tabla de tratamientos */}
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <CardTitle>Listado de Tratamientos</CardTitle>
                        <div className="w-full sm:w-72">
                            <SearchBar
                                onSearch={handleSearch}
                                placeholder="Buscar por nombre, tipo o paciente..."
                                delay={500}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <TreatmentTable
                        data={paginatedTreatments}
                        isLoading={isLoading}
                        onView={handleView}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
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

            {/* Modal para crear tratamiento */}
            <TreatmentForm
                open={modalOpen}
                onOpenChange={setModalOpen}
                onSuccess={() => {
                    setModalOpen(false);
                    refetch();
                }}
            />
        </div>
    );
}