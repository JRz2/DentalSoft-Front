import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUsers, useClinics, useCreateUser, useUpdateUser, useDeleteUser } from '@/hooks/useUser';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserTable } from '@/components/users/UserTable';
import { UserModal } from '@/components/users/UserModal';
import { DeleteConfirmDialog } from '@/components/patients/DeleteConfirmDialog';
import { SearchBar } from '@/components/shared/SearchBar';
import { UserPlus } from 'lucide-react';

export function UsersPage() {
    const { user: currentUser } = useAuth();
    const { data: users, isLoading: usersLoading } = useUsers();
    const { data: clinics, isLoading: clinicsLoading } = useClinics();
    const createUser = useCreateUser();
    const updateUser = useUpdateUser();
    const deleteUser = useDeleteUser();

    // Estados
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [modalOpen, setModalOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [isEditing, setIsEditing] = useState(false);

    // Paginación
    const itemsPerPage = 10;

    // Filtrar usuarios por búsqueda
    const filteredUsers = (users || []).filter(user => {
        if (!searchTerm) return true;
        const searchLower = searchTerm.toLowerCase();
        return (
            user.name.toLowerCase().includes(searchLower) ||
            user.email.toLowerCase().includes(searchLower) ||
            user.role.toLowerCase().includes(searchLower) ||
            (user.specialty && user.specialty.toLowerCase().includes(searchLower)) ||
            (user.clinic?.name && user.clinic.name.toLowerCase().includes(searchLower))
        );
    });

    // Paginación
    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
    const paginatedUsers = filteredUsers.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Verificar si es Super Admin
    if (currentUser?.role !== 'SUPER_ADMIN') {
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
        setSelectedUser(null);
        setModalOpen(true);
    };

    const handleEdit = (user: any) => {
        setIsEditing(true);
        setSelectedUser(user);
        setModalOpen(true);
    };

    const handleDelete = (user: any) => {
        setSelectedUser(user);
        setDeleteDialogOpen(true);
    };

    const handleSubmitForm = async (data: any) => {
        try {
            if (isEditing && selectedUser) {
                await updateUser.mutateAsync({
                    id: selectedUser.id,
                    data: {
                        name: data.name,
                        email: data.email,
                        role: data.role,
                        clinicId: data.clinicId ? parseInt(data.clinicId) : undefined,
                        specialty: data.specialty,
                        licenseNumber: data.licenseNumber,
                        phoneNumber: data.phoneNumber,
                    },
                });
            } else {
                await createUser.mutateAsync({
                    name: data.name,
                    email: data.email,
                    password: data.password,
                    role: data.role,
                    clinicId: data.clinicId ? parseInt(data.clinicId) : undefined,
                    specialty: data.specialty,
                    licenseNumber: data.licenseNumber,
                    phoneNumber: data.phoneNumber,
                });
            }
            setModalOpen(false);
        } catch (error) {
            console.error('Error al guardar:', error);
        }
    };

    const handleConfirmDelete = async () => {
        if (selectedUser) {
            await deleteUser.mutateAsync(selectedUser.id);
            setDeleteDialogOpen(false);
            setSelectedUser(null);
        }
    };

    if (usersLoading || clinicsLoading) {
        return (
            <div className="space-y-4">
                <div className="animate-pulse">
                    <div className="h-10 w-48 bg-gray-200 rounded mb-4"></div>
                    <div className="h-96 bg-gray-200 rounded"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Usuarios</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Gestiona los usuarios del sistema y sus roles
                    </p>
                </div>
                <Button onClick={handleCreate} className="gap-2">
                    <UserPlus className="h-4 w-4" />
                    Nuevo Usuario
                </Button>
            </div>

            {/* Tarjetas de estadísticas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">
                            Total Usuarios
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-gray-900">
                            {users?.length || 0}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">
                            Usuarios Activos
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            {users?.filter(u => u.isActive !== false).length || 0}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">
                            Doctores
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">
                            {users?.filter(u => u.role === 'DOCTOR').length || 0}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">
                            Administradores
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-purple-600">
                            {users?.filter(u => u.role === 'SUPER_ADMIN' || u.role === 'ADMIN').length || 0}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Barra de búsqueda y tabla */}
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <CardTitle>Listado de Usuarios</CardTitle>
                        <div className="w-full sm:w-72">
                            <SearchBar
                                onSearch={handleSearch}
                                placeholder="Buscar por nombre, email, rol o clínica..."
                                delay={500}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <UserTable
                        data={paginatedUsers}
                        isLoading={usersLoading}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        currentUserId={currentUser?.id}
                        pagination={{
                            currentPage,
                            totalPages,
                            totalItems: filteredUsers.length,
                            itemsPerPage,
                            onPageChange: setCurrentPage,
                        }}
                    />
                </CardContent>
            </Card>

            {/* Modal para crear/editar usuario */}
            <UserModal
                open={modalOpen}
                onOpenChange={setModalOpen}
                onSubmit={handleSubmitForm}
                isLoading={createUser.isPending || updateUser.isPending}
                user={selectedUser}
                clinics={clinics}
            />

            {/* Diálogo de confirmación para eliminar */}
            <DeleteConfirmDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                onConfirm={handleConfirmDelete}
                patientName={selectedUser?.name}
                isLoading={deleteUser.isPending}
            />
        </div>
    );
}