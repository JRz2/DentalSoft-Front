import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile, useUpdateProfile, useChangePassword } from '@/hooks/useUser';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { User, Mail, Phone, Stethoscope, Key, Save, Camera, Shield, IdCard } from 'lucide-react';

export function ProfilePage() {
    const { user } = useAuth();
    const { data: profile, isLoading } = useUserProfile();
    const updateProfile = useUpdateProfile();
    const changePassword = useChangePassword();

    // Estados para el formulario de perfil
    const [profileForm, setProfileForm] = useState({
        name: '',
        email: '',
        phoneNumber: '',
        specialty: '',
        licenseNumber: '',
    });

    // Estados para el formulario de contraseña
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [passwordErrors, setPasswordErrors] = useState<{ [key: string]: string }>({});
    const [isEditing, setIsEditing] = useState(false);

    // Cargar datos del perfil
    useEffect(() => {
        if (profile) {
            setProfileForm({
                name: profile.name || '',
                email: profile.email || '',
                phoneNumber: profile.phoneNumber || '',
                specialty: profile.specialty || '',
                licenseNumber: profile.licenseNumber || '',
            });
        }
    }, [profile]);

    const handleProfileSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await updateProfile.mutateAsync(profileForm);
        setIsEditing(false);
    };

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordErrors({});

        const errors: { [key: string]: string } = {};
        if (passwordForm.newPassword.length < 6) {
            errors.newPassword = 'La contraseña debe tener al menos 6 caracteres';
        }
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            errors.confirmPassword = 'Las contraseñas no coinciden';
        }
        if (Object.keys(errors).length > 0) {
            setPasswordErrors(errors);
            return;
        }

        await changePassword.mutateAsync({
            currentPassword: passwordForm.currentPassword,
            newPassword: passwordForm.newPassword,
            confirmPassword: passwordForm.confirmPassword,
        });

        setPasswordForm({
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
        });
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(word => word[0])
            .slice(0, 2)
            .join('')
            .toUpperCase();
    };

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-6">
                    <Skeleton className="h-24 w-24 rounded-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-48" />
                        <Skeleton className="h-4 w-32" />
                    </div>
                </div>
                <Skeleton className="h-96 w-full" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Mi Perfil</h1>
                <p className="text-sm text-gray-500 mt-1">
                    Gestiona tu información personal y seguridad
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Columna izquierda - Información de usuario */}
                <div className="space-y-6">
                    {/* Tarjeta de perfil */}
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex flex-col items-center text-center">
                                <div className="relative">
                                    <Avatar className="h-32 w-32 border-4 border-primary-100">
                                        <AvatarFallback className="bg-gradient-to-r from-primary-500 to-primary-600 text-white text-3xl">
                                            {getInitials(profile?.name || user?.name || 'U')}
                                        </AvatarFallback>
                                    </Avatar>
                                    <button
                                        className="absolute bottom-0 right-0 p-1.5 bg-primary-600 rounded-full text-white hover:bg-primary-700 transition-colors"
                                        title="Cambiar foto (próximamente)"
                                        disabled
                                    >
                                        <Camera className="h-4 w-4" />
                                    </button>
                                </div>
                                <h2 className="mt-4 text-xl font-semibold text-gray-900">
                                    {profile?.name || user?.name}
                                </h2>
                                <p className="text-sm text-gray-500">{profile?.role || user?.role}</p>
                                <div className="mt-4 w-full">
                                    <div className="bg-gray-50 rounded-lg p-3 text-sm">
                                        <p className="text-gray-600">
                                            <span className="font-medium">ID:</span> {profile?.id || user?.id}
                                        </p>
                                        <p className="text-gray-600 mt-1">
                                            <span className="font-medium">Email:</span> {profile?.email || user?.email}
                                        </p>
                                        {profile?.specialty && (
                                            <p className="text-gray-600 mt-1">
                                                <span className="font-medium">Especialidad:</span> {profile.specialty}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Tarjeta de información adicional */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                                <Shield className="h-4 w-4" />
                                Seguridad
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Último acceso</span>
                                <span className="text-gray-700">{new Date().toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Rol</span>
                                <span className="text-gray-700 font-medium">{profile?.role || user?.role}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Columna derecha - Formularios */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Formulario de información personal */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <User className="h-5 w-5 text-primary-600" />
                                    Información Personal
                                </CardTitle>
                                <p className="text-sm text-gray-500 mt-1">
                                    Actualiza tus datos personales
                                </p>
                            </div>
                            {!isEditing && (
                                <Button variant="outline" onClick={() => setIsEditing(true)}>
                                    Editar
                                </Button>
                            )}
                        </CardHeader>
                        <CardContent>
                            {isEditing ? (
                                <form onSubmit={handleProfileSubmit} className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="name">Nombre completo</Label>
                                            <div className="relative">
                                                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                <Input
                                                    id="name"
                                                    value={profileForm.name}
                                                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                                                    className="pl-9"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="email">Correo electrónico</Label>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                <Input
                                                    id="email"
                                                    type="email"
                                                    value={profileForm.email}
                                                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                                                    className="pl-9"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="phoneNumber">Teléfono</Label>
                                            <div className="relative">
                                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                <Input
                                                    id="phoneNumber"
                                                    value={profileForm.phoneNumber}
                                                    onChange={(e) => setProfileForm({ ...profileForm, phoneNumber: e.target.value })}
                                                    className="pl-9"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="specialty">Especialidad</Label>
                                            <div className="relative">
                                                <Stethoscope className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                <Input
                                                    id="specialty"
                                                    value={profileForm.specialty}
                                                    onChange={(e) => setProfileForm({ ...profileForm, specialty: e.target.value })}
                                                    className="pl-9"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="licenseNumber">Número de licencia</Label>
                                            <div className="relative">
                                                <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                <Input
                                                    id="licenseNumber"
                                                    value={profileForm.licenseNumber}
                                                    onChange={(e) => setProfileForm({ ...profileForm, licenseNumber: e.target.value })}
                                                    className="pl-9"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-end gap-2 pt-4">
                                        <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                                            Cancelar
                                        </Button>
                                        <Button type="submit" disabled={updateProfile.isPending}>
                                            <Save className="h-4 w-4 mr-2" />
                                            {updateProfile.isPending ? 'Guardando...' : 'Guardar Cambios'}
                                        </Button>
                                    </div>
                                </form>
                            ) : (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs text-gray-500">Nombre completo</p>
                                            <p className="text-gray-900 font-medium">{profileForm.name || '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500">Correo electrónico</p>
                                            <p className="text-gray-900 font-medium">{profileForm.email || '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500">Teléfono</p>
                                            <p className="text-gray-900 font-medium">{profileForm.phoneNumber || '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500">Especialidad</p>
                                            <p className="text-gray-900 font-medium">{profileForm.specialty || '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500">Número de licencia</p>
                                            <p className="text-gray-900 font-medium">{profileForm.licenseNumber || '-'}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Formulario de cambio de contraseña */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Key className="h-5 w-5 text-primary-600" />
                                Cambiar Contraseña
                            </CardTitle>
                            <p className="text-sm text-gray-500 mt-1">
                                Actualiza tu contraseña de acceso
                            </p>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handlePasswordSubmit} className="space-y-4">
                                <div className="grid grid-cols-1 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="currentPassword">Contraseña actual</Label>
                                        <Input
                                            id="currentPassword"
                                            type="password"
                                            value={passwordForm.currentPassword}
                                            onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                                            placeholder="Ingresa tu contraseña actual"
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="newPassword">Nueva contraseña</Label>
                                        <Input
                                            id="newPassword"
                                            type="password"
                                            value={passwordForm.newPassword}
                                            onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                            placeholder="Nueva contraseña (mínimo 6 caracteres)"
                                            required
                                        />
                                        {passwordErrors.newPassword && (
                                            <p className="text-sm text-red-500">{passwordErrors.newPassword}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="confirmPassword">Confirmar nueva contraseña</Label>
                                        <Input
                                            id="confirmPassword"
                                            type="password"
                                            value={passwordForm.confirmPassword}
                                            onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                            placeholder="Confirma tu nueva contraseña"
                                            required
                                        />
                                        {passwordErrors.confirmPassword && (
                                            <p className="text-sm text-red-500">{passwordErrors.confirmPassword}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex justify-end pt-4">
                                    <Button type="submit" disabled={changePassword.isPending}>
                                        <Key className="h-4 w-4 mr-2" />
                                        {changePassword.isPending ? 'Cambiando...' : 'Cambiar Contraseña'}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}