import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUsers, useClinics, useCreateUser, useUpdateUser, useDeleteUser } from '@/hooks/useUser';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Pencil, Trash2, UserPlus } from 'lucide-react';

const roleLabels = {
    SUPER_ADMIN: { label: 'Super Admin', color: 'bg-purple-100 text-purple-700' },
    ADMIN: { label: 'Admin', color: 'bg-blue-100 text-blue-700' },
    DOCTOR: { label: 'Doctor', color: 'bg-green-100 text-green-700' },
    RECEPTIONIST: { label: 'Recepcionista', color: 'bg-yellow-100 text-yellow-700' },
};

export function UsersPage() {
    const { user: currentUser } = useAuth();
    const { data: users, isLoading: usersLoading } = useUsers();
    const { data: clinics, isLoading: clinicsLoading } = useClinics();
    const createUser = useCreateUser();
    const updateUser = useUpdateUser();
    const deleteUser = useDeleteUser();

    const [modalOpen, setModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<any>(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'DOCTOR',
        clinicId: '',
        specialty: '',
        licenseNumber: '',
        phoneNumber: '',
    });

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

    const handleOpenModal = (user?: any) => {
        if (user) {
            setEditingUser(user);
            setFormData({
                name: user.name,
                email: user.email,
                password: '',
                role: user.role,
                clinicId: user.clinicId?.toString() || '',
                specialty: user.specialty || '',
                licenseNumber: user.licenseNumber || '',
                phoneNumber: user.phoneNumber || '',
            });
        } else {
            setEditingUser(null);
            setFormData({
                name: '',
                email: '',
                password: '',
                role: 'DOCTOR',
                clinicId: '',
                specialty: '',
                licenseNumber: '',
                phoneNumber: '',
            });
        }
        setModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (editingUser) {
            await updateUser.mutateAsync({
                id: editingUser.id,
                data: {
                    name: formData.name,
                    email: formData.email,
                    role: formData.role,
                    clinicId: formData.clinicId ? parseInt(formData.clinicId) : undefined,
                    specialty: formData.specialty,
                    licenseNumber: formData.licenseNumber,
                    phoneNumber: formData.phoneNumber,
                },
            });
        } else {
            await createUser.mutateAsync({
                name: formData.name,
                email: formData.email,
                password: formData.password,
                role: formData.role as any,
                clinicId: formData.clinicId ? parseInt(formData.clinicId) : undefined,
                specialty: formData.specialty,
                licenseNumber: formData.licenseNumber,
                phoneNumber: formData.phoneNumber,
            });
        }
        setModalOpen(false);
    };

    const handleDelete = async (id: number) => {
        if (confirm('¿Estás seguro de eliminar este usuario?')) {
            await deleteUser.mutateAsync(id);
        }
    };

    if (usersLoading || clinicsLoading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-10 w-48" />
                <Skeleton className="h-96 w-full" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Usuarios</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Gestiona los usuarios del sistema y sus roles
                    </p>
                </div>
                <Button onClick={() => handleOpenModal()} className="gap-2">
                    <UserPlus className="h-4 w-4" />
                    Nuevo Usuario
                </Button>
            </div>

            {/* Tabla de usuarios */}
            <Card>
                <CardHeader>
                    <CardTitle>Listado de Usuarios</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nombre</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Rol</TableHead>
                                <TableHead>Clínica</TableHead>
                                <TableHead>Especialidad</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users?.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell className="font-medium">{user.name}</TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>
                                        <Badge className={roleLabels[user.role]?.color}>
                                            {roleLabels[user.role]?.label}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{user.clinic?.name || '-'}</TableCell>
                                    <TableCell>{user.specialty || '-'}</TableCell>
                                    <TableCell>
                                        <Badge variant={user.isActive ? 'default' : 'secondary'}>
                                            {user.isActive ? 'Activo' : 'Inactivo'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleOpenModal(user)}
                                                className="text-blue-600"
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDelete(user.id)}
                                                className="text-red-600"
                                                disabled={user.id === currentUser?.id}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Modal de creación/edición */}
            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>
                            {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Nombre completo *</Label>
                                <Input
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Email *</Label>
                                <Input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    required
                                />
                            </div>
                            {!editingUser && (
                                <div className="space-y-2">
                                    <Label>Contraseña *</Label>
                                    <Input
                                        type="password"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        required
                                    />
                                </div>
                            )}
                            <div className="space-y-2">
                                <Label>Rol *</Label>
                                <Select
                                    value={formData.role}
                                    onValueChange={(value) => setFormData({ ...formData, role: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                                        <SelectItem value="ADMIN">Admin</SelectItem>
                                        <SelectItem value="DOCTOR">Doctor</SelectItem>
                                        <SelectItem value="RECEPTIONIST">Recepcionista</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Clínica</Label>
                                <Select
                                    value={formData.clinicId}
                                    onValueChange={(value) => setFormData({ ...formData, clinicId: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar clínica" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {clinics?.map((clinic) => (
                                            <SelectItem key={clinic.id} value={clinic.id.toString()}>
                                                {clinic.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Especialidad</Label>
                                <Input
                                    value={formData.specialty}
                                    onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                                    placeholder="Odontología General"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Número de licencia</Label>
                                <Input
                                    value={formData.licenseNumber}
                                    onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Teléfono</Label>
                                <Input
                                    value={formData.phoneNumber}
                                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-4">
                            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit">
                                {editingUser ? 'Actualizar' : 'Crear'} Usuario
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}