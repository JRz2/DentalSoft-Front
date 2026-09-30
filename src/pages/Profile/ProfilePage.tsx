import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile, useUpdateProfile, useChangePassword } from '@/hooks/useUser';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
    User, Mail, Phone, Stethoscope, Key, Save, Camera, Shield, Loader2,
    Pencil, Eye, EyeOff, CheckCircle2, AlertCircle, IdCard,
} from 'lucide-react';
import { toast } from 'sonner';
import api from '@/services/api';
import { cn } from '@/lib/utils';
import doctorImg from '@/assets/images/doctor.png';

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

const roleLabels: Record<string, string> = {
    ADMIN: 'Administrador',
    DOCTOR: 'Doctor',
    RECEPTIONIST: 'Recepcionista',
};

export function ProfilePage() {
    const { user } = useAuth();
    const { data: profile, isLoading, refetch } = useUserProfile();
    const updateProfile = useUpdateProfile();
    const changePassword = useChangePassword();
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [profileForm, setProfileForm] = useState({
        name: '',
        email: '',
        phoneNumber: '',
        specialty: '',
        licenseNumber: '',
    });

    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [passwordErrors, setPasswordErrors] = useState<{ [key: string]: string }>({});
    const [isEditing, setIsEditing] = useState(false);

    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast.error('Solo se permiten imágenes');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            toast.error('La imagen no puede superar los 5MB');
            return;
        }

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            await api.post('/uploads/user/photo', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            toast.success('Foto de perfil actualizada exitosamente');
            refetch();
        } catch (error) {
            console.error('Error al subir foto:', error);
            const err = error as any;
            toast.error(err.response?.data?.message || 'Error al subir la foto');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordErrors({});

        const errors: { [key: string]: string } = {};

        if (!passwordForm.currentPassword) {
            errors.currentPassword = 'Ingresa tu contraseña actual';
        }
        if (!passwordForm.newPassword) {
            errors.newPassword = 'Ingresa una nueva contraseña';
        } else if (passwordForm.newPassword.length < 6) {
            errors.newPassword = 'La contraseña debe tener al menos 6 caracteres';
        }
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            errors.confirmPassword = 'Las contraseñas no coinciden';
        }

        if (Object.keys(errors).length > 0) {
            setPasswordErrors(errors);
            return;
        }

        try {
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
            setShowCurrentPassword(false);
            setShowNewPassword(false);
            setShowConfirmPassword(false);
            setPasswordErrors({});
        } catch (error) {
            console.error('Error al cambiar contraseña:', error);
        }
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(word => word[0])
            .slice(0, 2)
            .join('')
            .toUpperCase();
    };

    const passwordsMatch = passwordForm.newPassword.length >= 6
        && passwordForm.newPassword === passwordForm.confirmPassword;

    const roleValue = profile?.role || user?.role || '';
    const roleLabel = roleLabels[roleValue] || roleValue;

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
            <div className="flex items-center gap-3">
                <img
                    src={doctorImg}
                    alt="doctor"
                    className="w-12 h-12 md:w-16 md:h-16 rounded-full object-cover shrink-0"
                />
                <div className="min-w-0">
                    <h1 className="text-xl md:text-2xl font-bold text-gray-900">Mi Perfil</h1>
                    <p className="text-xs md:text-sm text-gray-500 mt-1">
                        Gestiona tu información personal y seguridad
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Columna izquierda */}
                <div className="space-y-6">
                    {/* Tarjeta de perfil */}
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex flex-col items-center text-center">
                                {/* Avatar */}
                                <div className="relative">
                                    <div
                                        className="cursor-pointer group"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <Avatar className="h-28 w-28 md:h-32 md:w-32 border-4 border-primary-100 transition-opacity group-hover:opacity-80">
                                            {profile?.photoUrl && (
                                                <AvatarImage
                                                    src={getImageUrl(profile.photoUrl)}
                                                    alt={profile?.name || user?.name || 'Usuario'}
                                                    className="object-cover"
                                                />
                                            )}
                                            <AvatarFallback className="bg-gradient-to-r from-primary-500 to-primary-600 text-white text-2xl md:text-3xl">
                                                {getInitials(profile?.name || user?.name || 'U')}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            {isUploading ? (
                                                <Loader2 className="h-8 w-8 text-white animate-spin" />
                                            ) : (
                                                <Camera className="h-8 w-8 text-white" />
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={isUploading}
                                        className="absolute bottom-1 right-1 h-9 w-9 rounded-full bg-gray-900/90 hover:bg-gray-900 backdrop-blur-sm flex items-center justify-center shadow-lg ring-2 ring-white/80 hover:ring-white transition-all hover:scale-105 disabled:opacity-60 disabled:hover:scale-100"
                                        title="Cambiar foto de perfil"
                                    >
                                        {isUploading ? (
                                            <Loader2 className="h-4 w-4 animate-spin text-white" strokeWidth={2.5} />
                                        ) : (
                                            <Camera
                                                className="h-4 w-4 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]"
                                                stroke="white"
                                                strokeWidth={2.5}
                                            />
                                        )}
                                    </button>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handlePhotoUpload}
                                        className="hidden"
                                    />
                                </div>

                                <h2 className="mt-4 text-lg md:text-xl font-semibold text-gray-900 break-words max-w-full">
                                    {profile?.name || user?.name}
                                </h2>
                                <p className="text-sm text-gray-500">{roleLabel}</p>

                                <div className="mt-4 w-full space-y-2">
                                    <div className="bg-gray-50 rounded-xl p-3 text-sm space-y-2">
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <Mail className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                                            <span className="truncate">{profile?.email || user?.email}</span>
                                        </div>
                                        {profile?.specialty && (
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <Stethoscope className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                                                <span className="truncate">{profile.specialty}</span>
                                            </div>
                                        )}
                                        {profile?.licenseNumber && (
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <IdCard className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                                                <span className="truncate">Matrícula {profile.licenseNumber}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Tarjeta de seguridad */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                                <Shield className="h-4 w-4" />
                                Seguridad
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between text-sm gap-2">
                                <span className="text-gray-500">Rol asignado</span>
                                <span className="text-gray-900 font-medium bg-primary-50 text-primary-700 px-2.5 py-0.5 rounded-full text-xs shrink-0">
                                    {roleLabel}
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Columna derecha */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Formulario de información personal */}
                    <Card>
                        <CardHeader>
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <div className="min-w-0">
                                    <CardTitle className="flex items-center gap-2">
                                        <User className="h-5 w-5 text-primary-600 shrink-0" />
                                        <span className="truncate">Información Personal</span>
                                    </CardTitle>
                                    <p className="text-sm text-gray-500 mt-1">
                                        Actualiza tus datos personales
                                    </p>
                                </div>
                                {!isEditing && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setIsEditing(true)}
                                        className="gap-2 shrink-0 self-start sm:self-auto"
                                    >
                                        <Pencil className="h-3.5 w-3.5" />
                                        Editar
                                    </Button>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent>
                            {isEditing ? (
                                <form onSubmit={handleProfileSubmit} className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="name" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                                <User className="h-4 w-4 text-gray-400" />
                                                Nombre completo
                                            </Label>
                                            <Input
                                                id="name"
                                                value={profileForm.name}
                                                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                                                className="w-full"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="email" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                                <Mail className="h-4 w-4 text-gray-400" />
                                                Correo electrónico
                                            </Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                value={profileForm.email}
                                                onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                                                className="w-full"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="phoneNumber" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                                <Phone className="h-4 w-4 text-gray-400" />
                                                Teléfono
                                            </Label>
                                            <Input
                                                id="phoneNumber"
                                                value={profileForm.phoneNumber}
                                                onChange={(e) => setProfileForm({ ...profileForm, phoneNumber: e.target.value })}
                                                className="w-full"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="specialty" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                                <Stethoscope className="h-4 w-4 text-gray-400" />
                                                Especialidad
                                            </Label>
                                            <Input
                                                id="specialty"
                                                value={profileForm.specialty}
                                                onChange={(e) => setProfileForm({ ...profileForm, specialty: e.target.value })}
                                                className="w-full"
                                            />
                                        </div>

                                        <div className="space-y-2 md:col-span-2">
                                            <Label htmlFor="licenseNumber" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                                <IdCard className="h-4 w-4 text-gray-400" />
                                                Matrícula profesional
                                            </Label>
                                            <Input
                                                id="licenseNumber"
                                                value={profileForm.licenseNumber}
                                                onChange={(e) => setProfileForm({ ...profileForm, licenseNumber: e.target.value })}
                                                className="w-full"
                                                placeholder="Ej: MP-12345"
                                            />
                                        </div>
                                    </div>

                                    {/* Botones apilables en móvil */}
                                    <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-4 mt-4 border-t">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setIsEditing(false)}
                                            className="w-full sm:w-auto sm:px-6"
                                        >
                                            Cancelar
                                        </Button>
                                        <Button
                                            type="submit"
                                            disabled={updateProfile.isPending}
                                            className="w-full sm:w-auto sm:px-8 gap-2 bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-700 hover:to-green-800 text-white shadow-lg shadow-emerald-200/50 hover:shadow-emerald-300/50 transition-all duration-200 disabled:opacity-50"
                                        >
                                            {updateProfile.isPending ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                    Guardando...
                                                </>
                                            ) : (
                                                <>
                                                    <Save className="h-4 w-4" />
                                                    Guardar Cambios
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </form>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-gray-50 rounded-xl p-4 space-y-1">
                                        <p className="text-xs text-gray-500 flex items-center gap-1.5">
                                            <User className="h-3 w-3" /> Nombre completo
                                        </p>
                                        <p className="text-gray-900 font-medium break-words">{profileForm.name || '-'}</p>
                                    </div>
                                    <div className="bg-gray-50 rounded-xl p-4 space-y-1">
                                        <p className="text-xs text-gray-500 flex items-center gap-1.5">
                                            <Mail className="h-3 w-3" /> Correo electrónico
                                        </p>
                                        <p className="text-gray-900 font-medium truncate">{profileForm.email || '-'}</p>
                                    </div>
                                    <div className="bg-gray-50 rounded-xl p-4 space-y-1">
                                        <p className="text-xs text-gray-500 flex items-center gap-1.5">
                                            <Phone className="h-3 w-3" /> Teléfono
                                        </p>
                                        <p className="text-gray-900 font-medium">{profileForm.phoneNumber || '-'}</p>
                                    </div>
                                    <div className="bg-gray-50 rounded-xl p-4 space-y-1">
                                        <p className="text-xs text-gray-500 flex items-center gap-1.5">
                                            <Stethoscope className="h-3 w-3" /> Especialidad
                                        </p>
                                        <p className="text-gray-900 font-medium">{profileForm.specialty || '-'}</p>
                                    </div>
                                    <div className="bg-gray-50 rounded-xl p-4 space-y-1 md:col-span-2">
                                        <p className="text-xs text-gray-500 flex items-center gap-1.5">
                                            <IdCard className="h-3 w-3" /> Matrícula profesional
                                        </p>
                                        <p className="text-gray-900 font-medium">{profileForm.licenseNumber || '-'}</p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Formulario de cambio de contraseña */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Key className="h-5 w-5 text-primary-600 shrink-0" />
                                <span className="truncate">Cambiar Contraseña</span>
                            </CardTitle>
                            <p className="text-sm text-gray-500 mt-1">
                                Actualiza tu contraseña de acceso
                            </p>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handlePasswordSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="currentPassword" className="text-sm font-medium text-gray-700">
                                        Contraseña actual
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            id="currentPassword"
                                            type={showCurrentPassword ? 'text' : 'password'}
                                            value={passwordForm.currentPassword}
                                            onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                                            placeholder="Ingresa tu contraseña actual"
                                            className={cn(
                                                "pr-10",
                                                passwordErrors.currentPassword && "border-red-500 focus-visible:ring-red-500"
                                            )}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                            tabIndex={-1}
                                        >
                                            {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                    {passwordErrors.currentPassword && (
                                        <p className="text-sm text-red-500 flex items-center gap-1">
                                            <AlertCircle className="h-3.5 w-3.5" />
                                            {passwordErrors.currentPassword}
                                        </p>
                                    )}
                                </div>

                                <div className="relative py-1">
                                    <div className="absolute inset-0 flex items-center">
                                        <span className="w-full border-t" />
                                    </div>
                                    <div className="relative flex justify-center text-xs uppercase">
                                        <span className="bg-background px-2 text-muted-foreground">
                                            Nueva contraseña
                                        </span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="newPassword" className="text-sm font-medium text-gray-700">
                                            Nueva contraseña
                                        </Label>
                                        <div className="relative">
                                            <Input
                                                id="newPassword"
                                                type={showNewPassword ? 'text' : 'password'}
                                                value={passwordForm.newPassword}
                                                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                                placeholder="Mínimo 6 caracteres"
                                                className={cn(
                                                    "pr-10",
                                                    passwordErrors.newPassword && "border-red-500 focus-visible:ring-red-500"
                                                )}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowNewPassword(!showNewPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                                tabIndex={-1}
                                            >
                                                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        </div>
                                        {passwordErrors.newPassword && (
                                            <p className="text-sm text-red-500 flex items-center gap-1">
                                                <AlertCircle className="h-3.5 w-3.5" />
                                                {passwordErrors.newPassword}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                                            Confirmar nueva contraseña
                                        </Label>
                                        <div className="relative">
                                            <Input
                                                id="confirmPassword"
                                                type={showConfirmPassword ? 'text' : 'password'}
                                                value={passwordForm.confirmPassword}
                                                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                                placeholder="Repite la nueva contraseña"
                                                className={cn(
                                                    "pr-10",
                                                    passwordErrors.confirmPassword && "border-red-500 focus-visible:ring-red-500",
                                                    passwordsMatch && "border-green-400 focus-visible:ring-green-300"
                                                )}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                                tabIndex={-1}
                                            >
                                                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        </div>
                                        {passwordErrors.confirmPassword && (
                                            <p className="text-sm text-red-500 flex items-center gap-1">
                                                <AlertCircle className="h-3.5 w-3.5" />
                                                {passwordErrors.confirmPassword}
                                            </p>
                                        )}
                                        {passwordsMatch && !passwordErrors.confirmPassword && (
                                            <p className="text-sm text-green-600 flex items-center gap-1">
                                                <CheckCircle2 className="h-3.5 w-3.5" />
                                                Las contraseñas coinciden
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex justify-end pt-4 border-t">
                                    <Button
                                        type="submit"
                                        disabled={changePassword.isPending}
                                        className="w-full sm:w-auto sm:px-8 gap-2 bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-700 hover:to-green-800 text-white shadow-lg shadow-emerald-200/50 hover:shadow-emerald-300/50 transition-all duration-200 disabled:opacity-50"
                                    >
                                        {changePassword.isPending ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                Cambiando...
                                            </>
                                        ) : (
                                            <>
                                                <Key className="h-4 w-4" />
                                                Cambiar Contraseña
                                            </>
                                        )}
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