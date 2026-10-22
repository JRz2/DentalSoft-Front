import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile, useUpdateProfile, useChangePassword } from '@/hooks/useUser';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    User, Mail, Phone, Stethoscope, Key, Save, Camera, Shield, Loader2,
    Pencil, Eye, EyeOff, CheckCircle2, AlertCircle, IdCard, Lock, ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import api from '@/services/api';
import { cn } from '@/lib/utils';
import { usePageHeader } from '@/contexts/PageHeaderContext';

const getImageUrl = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
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
        name: '', email: '', phoneNumber: '', specialty: '', licenseNumber: '',
    });

    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '', newPassword: '', confirmPassword: '',
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

    usePageHeader('Mi Perfil', 'Gestiona tu información personal y seguridad.');

    const handleProfileSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await updateProfile.mutateAsync(profileForm);
        setIsEditing(false);
    };

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) return toast.error('Solo se permiten imágenes');
        if (file.size > 5 * 1024 * 1024) return toast.error('La imagen no puede superar los 5MB');

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            await api.post('/uploads/user/photo', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            toast.success('Foto de perfil actualizada exitosamente');
            refetch();
        } catch (error) {
            const err = error as any;
            toast.error(err.response?.data?.message || 'Error al subir la foto');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordErrors({});
        const errors: { [key: string]: string } = {};

        if (!passwordForm.currentPassword) errors.currentPassword = 'Ingresa tu contraseña actual';
        if (!passwordForm.newPassword) errors.newPassword = 'Ingresa una nueva contraseña';
        else if (passwordForm.newPassword.length < 6) errors.newPassword = 'Mínimo 6 caracteres';
        if (passwordForm.newPassword !== passwordForm.confirmPassword) errors.confirmPassword = 'Las contraseñas no coinciden';

        if (Object.keys(errors).length > 0) return setPasswordErrors(errors);

        try {
            await changePassword.mutateAsync(passwordForm);
            setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
            setShowCurrentPassword(false);
            setShowNewPassword(false);
            setShowConfirmPassword(false);
        } catch (error) {
            console.error('Error al cambiar contraseña:', error);
        }
    };

    const getInitials = (name: string) => {
        return name.split(' ').map(word => word[0]).slice(0, 2).join('').toUpperCase();
    };

    const passwordsMatch = passwordForm.newPassword.length >= 6 && passwordForm.newPassword === passwordForm.confirmPassword;
    
    // Validaciones visuales para el panel derecho
    const hasMinLength = passwordForm.newPassword.length >= 6;
    const hasNumber = /\d/.test(passwordForm.newPassword);
    const hasLetter = /[a-zA-Z]/.test(passwordForm.newPassword);

    const roleValue = profile?.role || user?.role || '';
    const roleLabel = roleLabels[roleValue] || roleValue;

    if (isLoading) {
        return (
            <div className="space-y-6 max-w-5xl mx-auto">
                <Skeleton className="h-48 w-full rounded-2xl" />
                <Skeleton className="h-96 w-full rounded-2xl" />
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-12">
            {/* ═══════════ HERO: Avatar + Datos Básicos ═══════════ */}
            <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-200/60 p-6 sm:p-8 relative overflow-hidden">
                {/* Fondo decorativo con gradiente y patrón */}
                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-teal-50/80 to-transparent" />
                
                <div className="relative flex flex-col sm:flex-row items-center sm:items-end gap-5 -mb-2">
                    {/* Avatar */}
                    <div className="relative shrink-0">
                        <div
                            className="cursor-pointer group"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <Avatar className="h-28 w-28 md:h-32 md:w-32 border-4 border-white shadow-lg ring-1 ring-gray-100 transition-opacity group-hover:opacity-90">
                                {profile?.photoUrl && (
                                    <AvatarImage src={getImageUrl(profile.photoUrl)} className="object-cover" />
                                )}
                                <AvatarFallback className="bg-teal-100 text-teal-700 text-3xl font-bold">
                                    {getInitials(profile?.name || user?.name || 'U')}
                                </AvatarFallback>
                            </Avatar>
                            <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                {isUploading ? <Loader2 className="h-8 w-8 text-white animate-spin" /> : <Camera className="h-8 w-8 text-white" />}
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                            className="absolute bottom-1 right-1 h-9 w-9 rounded-full bg-gray-900 hover:bg-gray-800 flex items-center justify-center shadow-lg ring-2 ring-white transition-transform hover:scale-105"
                        >
                            <Camera className="h-4 w-4 text-white" strokeWidth={2.5} />
                        </button>
                        <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                    </div>

                    {/* Info Básica */}
                    <div className="text-center sm:text-left flex-1 min-w-0 sm:pb-2">
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 truncate">
                            {profile?.name || user?.name}
                        </h1>
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-2">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 text-teal-700 text-xs font-semibold border border-teal-100 shadow-sm">
                                <Shield className="h-3.5 w-3.5" />
                                {roleLabel}
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-gray-600 text-xs font-medium border border-gray-200 shadow-sm">
                                <Mail className="h-3.5 w-3.5" />
                                {profile?.email || user?.email}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ═══════════ TABS ═══════════ */}
            <Tabs defaultValue="personal" className="w-full flex flex-col">
                <TabsList className="w-full max-w-md mx-auto grid grid-cols-2 h-auto p-1.5 gap-1 bg-gray-100/80 rounded-xl mb-6 ring-1 ring-gray-200/50">
                    <TabsTrigger
                        value="personal"
                        className={cn(
                            'flex flex-row items-center justify-center gap-2',
                            'py-2.5 px-3 rounded-lg',
                            'text-xs sm:text-sm font-medium',
                            'transition-all duration-200',
                            'data-[state=active]:bg-white data-[state=active]:text-teal-700',
                            'data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-teal-100'
                        )}
                    >
                        <User className="h-4 w-4 shrink-0" />
                        <span className="leading-tight text-center">Información Personal</span>
                    </TabsTrigger>

                    <TabsTrigger
                        value="security"
                        className={cn(
                            'flex flex-row items-center justify-center gap-2',
                            'py-2.5 px-3 rounded-lg',
                            'text-xs sm:text-sm font-medium',
                            'transition-all duration-200',
                            'data-[state=active]:bg-white data-[state=active]:text-teal-700',
                            'data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-teal-100'
                        )}
                    >
                        <Lock className="h-4 w-4 shrink-0" />
                        <span className="leading-tight text-center">Seguridad</span>
                    </TabsTrigger>
                </TabsList>

                {/* ─── TAB 1: Información Personal ─── */}
                <TabsContent value="personal" className="mt-0">
                    <Card className="border-0 shadow-sm ring-1 ring-gray-200/60 overflow-hidden">
                        <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-gray-100 bg-gray-50/30">
                            <div>
                                <CardTitle className="text-lg text-gray-900">Datos Personales</CardTitle>
                                <p className="text-sm text-gray-500 mt-1">Actualiza tu información de contacto.</p>
                            </div>
                            {!isEditing && (
                                <Button
                                    onClick={() => setIsEditing(true)}
                                    className="gap-2 bg-amber-500 hover:bg-amber-600 text-white shadow-sm transition-all"
                                >
                                    <Pencil className="h-4 w-4" />
                                    Editar
                                </Button>
                            )}
                        </CardHeader>
                        <CardContent className="pt-6">
                            {isEditing ? (
                                <form onSubmit={handleProfileSubmit} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Inputs con íconos para verse más Pro */}
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium text-gray-700">Nombre completo</Label>
                                            <div className="relative">
                                                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                <Input className="pl-10" value={profileForm.name} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium text-gray-700">Correo electrónico</Label>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                <Input className="pl-10" type="email" value={profileForm.email} onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })} />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium text-gray-700">Teléfono</Label>
                                            <div className="relative">
                                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                <Input className="pl-10" value={profileForm.phoneNumber} onChange={(e) => setProfileForm({ ...profileForm, phoneNumber: e.target.value })} />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium text-gray-700">Especialidad</Label>
                                            <div className="relative">
                                                <Stethoscope className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                <Input className="pl-10" value={profileForm.specialty} onChange={(e) => setProfileForm({ ...profileForm, specialty: e.target.value })} />
                                            </div>
                                        </div>
                                        <div className="space-y-2 md:col-span-2">
                                            <Label className="text-sm font-medium text-gray-700">Matrícula profesional</Label>
                                            <div className="relative">
                                                <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                <Input className="pl-10" value={profileForm.licenseNumber} onChange={(e) => setProfileForm({ ...profileForm, licenseNumber: e.target.value })} placeholder="Ej: MP-12345" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-6 border-t border-gray-100">
                                        <Button type="button" variant="ghost" onClick={() => setIsEditing(false)}>Cancelar</Button>
                                        <Button type="submit" disabled={updateProfile.isPending} className="bg-teal-600 hover:bg-teal-700 text-white gap-2 shadow-sm">
                                            {updateProfile.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                            Guardar Cambios
                                        </Button>
                                    </div>
                                </form>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-8">
                                    <div className="group">
                                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                            <User className="h-3.5 w-3.5 text-teal-500" /> Nombre completo
                                        </p>
                                        <p className="text-gray-900 font-medium text-base">{profileForm.name || '-'}</p>
                                    </div>
                                    <div className="group">
                                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                            <Mail className="h-3.5 w-3.5 text-teal-500" /> Correo electrónico
                                        </p>
                                        <p className="text-gray-900 font-medium text-base">{profileForm.email || '-'}</p>
                                    </div>
                                    <div className="group">
                                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                            <Phone className="h-3.5 w-3.5 text-teal-500" /> Teléfono
                                        </p>
                                        <p className="text-gray-900 font-medium text-base">{profileForm.phoneNumber || '-'}</p>
                                    </div>
                                    <div className="group">
                                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                            <Stethoscope className="h-3.5 w-3.5 text-teal-500" /> Especialidad
                                        </p>
                                        <p className="text-gray-900 font-medium text-base">{profileForm.specialty || '-'}</p>
                                    </div>
                                    <div className="group sm:col-span-2">
                                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                            <IdCard className="h-3.5 w-3.5 text-teal-500" /> Matrícula profesional
                                        </p>
                                        <p className="text-gray-900 font-medium text-base">{profileForm.licenseNumber || '-'}</p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ─── TAB 2: Seguridad (Rediseñado en 2 columnas) ─── */}
                <TabsContent value="security" className="mt-0">
                    <Card className="border-0 shadow-sm ring-1 ring-gray-200/60 overflow-hidden">
                        <div className="grid grid-cols-1 lg:grid-cols-12">
                            
                            {/* Columna Izquierda: Formulario (Ocupa 7/12) */}
                            <div className="lg:col-span-7 p-6 sm:p-8">
                                <div className="mb-6">
                                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                        <Lock className="h-5 w-5 text-teal-600" />
                                        Cambiar Contraseña
                                    </h3>
                                    <p className="text-sm text-gray-500 mt-1">Asegúrate de usar una contraseña larga y segura.</p>
                                </div>
                                
                                <form onSubmit={handlePasswordSubmit} className="space-y-5">
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium text-gray-700">Contraseña actual</Label>
                                        <div className="relative">
                                            <Input
                                                type={showCurrentPassword ? 'text' : 'password'}
                                                value={passwordForm.currentPassword}
                                                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                                                className={cn("pr-10", passwordErrors.currentPassword && "border-red-500 focus-visible:ring-red-500")}
                                            />
                                            <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                                {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        </div>
                                        {passwordErrors.currentPassword && (
                                            <p className="text-xs text-red-500 flex items-center gap-1 mt-1"><AlertCircle className="h-3 w-3" /> {passwordErrors.currentPassword}</p>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium text-gray-700">Nueva contraseña</Label>
                                            <div className="relative">
                                                <Input
                                                    type={showNewPassword ? 'text' : 'password'}
                                                    value={passwordForm.newPassword}
                                                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                                    className={cn("pr-10", passwordErrors.newPassword && "border-red-500 focus-visible:ring-red-500")}
                                                />
                                                <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                </button>
                                            </div>
                                            {passwordErrors.newPassword && (
                                                <p className="text-xs text-red-500 flex items-center gap-1 mt-1"><AlertCircle className="h-3 w-3" /> {passwordErrors.newPassword}</p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium text-gray-700">Confirmar contraseña</Label>
                                            <div className="relative">
                                                <Input
                                                    type={showConfirmPassword ? 'text' : 'password'}
                                                    value={passwordForm.confirmPassword}
                                                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                                    className={cn(
                                                        "pr-10",
                                                        passwordErrors.confirmPassword && "border-red-500 focus-visible:ring-red-500",
                                                        passwordsMatch && "border-green-500 focus-visible:ring-green-500"
                                                    )}
                                                />
                                                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                </button>
                                            </div>
                                            {passwordErrors.confirmPassword && (
                                                <p className="text-xs text-red-500 flex items-center gap-1 mt-1"><AlertCircle className="h-3 w-3" /> {passwordErrors.confirmPassword}</p>
                                            )}
                                            {passwordsMatch && !passwordErrors.confirmPassword && (
                                                <p className="text-xs text-green-600 flex items-center gap-1 mt-1"><CheckCircle2 className="h-3 w-3" /> Coinciden</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="pt-6 mt-6 border-t border-gray-100 flex justify-end">
                                        <Button type="submit" disabled={changePassword.isPending} className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700 text-white gap-2 shadow-sm">
                                            {changePassword.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Key className="h-4 w-4" />}
                                            Actualizar Contraseña
                                        </Button>
                                    </div>
                                </form>
                            </div>

                            {/* Columna Derecha: Consejos de Seguridad (Ocupa 5/12) */}
                            <div className="lg:col-span-5 bg-gray-50/80 border-t lg:border-t-0 lg:border-l border-gray-100 p-6 sm:p-8 flex flex-col justify-center">
                                <div className="bg-white rounded-xl p-5 shadow-sm ring-1 ring-gray-200/50">
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="p-2 bg-teal-50 rounded-lg">
                                            <ShieldCheck className="h-5 w-5 text-teal-600" />
                                        </div>
                                        <h4 className="font-semibold text-gray-900 text-sm">Requisitos de seguridad</h4>
                                    </div>
                                    
                                    <ul className="space-y-3 text-sm">
                                        <li className="flex items-center gap-2">
                                            <CheckCircle2 className={cn("h-4 w-4", hasMinLength ? "text-green-500" : "text-gray-300")} />
                                            <span className={hasMinLength ? "text-gray-800" : "text-gray-500"}>Mínimo 6 caracteres</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <CheckCircle2 className={cn("h-4 w-4", hasNumber ? "text-green-500" : "text-gray-300")} />
                                            <span className={hasNumber ? "text-gray-800" : "text-gray-500"}>Al menos un número</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <CheckCircle2 className={cn("h-4 w-4", hasLetter ? "text-green-500" : "text-gray-300")} />
                                            <span className={hasLetter ? "text-gray-800" : "text-gray-500"}>Al menos una letra</span>
                                        </li>
                                    </ul>
                                    <p className="text-[11px] text-gray-400 mt-5 leading-relaxed">
                                        Te recomendamos no usar contraseñas que utilices en otros sitios web o redes sociales.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}