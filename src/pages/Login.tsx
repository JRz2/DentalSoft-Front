import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, LogIn, AlertCircle, Eye, EyeOff, Heart } from 'lucide-react';
import clinicBackground from '@/assets/images/clinic-background.jpg';
import logo from '@/assets/images/logoJet.png';

const clinicConfig = {
    commercialName: 'Clínica Dental',
    businessName: 'Sistema de Gestión Odontológica',
    footerText: 'Gracias por confiar en nosotros',
    address: 'Calle Principal #123',
    mobile: '+591 78945612',
    email: 'info@clinica.com',
    logoUrl: 'http://localhost:3000/assets/logo-default.png',
};

export const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            await login({ email, password });
            navigate('/dashboard');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Error al iniciar sesión');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-primary-100/30 to-primary-200/20 p-4">
            <div className="w-full max-w-5xl">
                <div className="bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row">

                    {/* LADO IZQUIERDO - Imagen de la clínica */}
                    <div className="relative md:w-1/2 h-48 md:h-auto bg-gradient-to-br from-primary-600 to-primary-800 overflow-hidden">
                        <img
                            src={clinicBackground}
                            alt="Clínica Dental"
                            className="w-full h-full object-cover opacity-90"
                        />

                        {/* Overlay oscuro para mejorar legibilidad */}
                        <div className="absolute inset-0 bg-black/10" />

                        {/* Logo en la esquina superior izquierda */}
                        <div className="absolute top-6 left-6 z-10">
                            <img
                                src={logo}
                                alt={clinicConfig.commercialName}
                                className="h-24 rounded-full w-auto object-contain drop-shadow-lg"
                            />
                        </div>

                        {/* Frase inspiracional abajo - Todo lo que necesitas en un solo lugar */}
                        <div className="absolute bottom-8 left-0 right-0 flex items-center justify-center gap-3 text-white/90 z-10">
                            <Heart className="h-5 w-5 text-primary-300 fill-primary-300" />
                            <span className="text-base font-medium tracking-wide">
                                Todo lo que necesitas en un solo lugar
                            </span>
                        </div>
                    </div>

                    {/* LADO DERECHO - Formulario */}
                    <div className="flex-1 p-8 md:p-10 bg-white">
                        <div className="max-w-sm mx-auto">
                            {/* Título principal - Sistema de Gestión Odontológica */}
                            <div className="text-center mb-8">
                                <h1 className="text-3xl font-bold text-gray-900 leading-tight">
                                    Sistema de Gestión
                                </h1>
                                <h1 className="text-3xl font-bold text-primary-600 leading-tight">
                                    Odontológica
                                </h1>
                                <p className="text-sm text-gray-500 mt-2">
                                    Gestiona tu clínica dental y potencia tu negocio
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-5">
                                {error && (
                                    <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg flex items-start gap-3 animate-in slide-in-from-top-1 duration-200">
                                        <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                                        <div className="text-sm text-red-700">{error}</div>
                                    </div>
                                )}

                                {/* Email */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        Correo electrónico
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Mail className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all bg-gray-50/50 hover:bg-white"
                                            placeholder="doctor@clinica.com"
                                            required
                                            disabled={isLoading}
                                        />
                                    </div>
                                </div>

                                {/* Contraseña */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        Contraseña
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Lock className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="block w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all bg-gray-50/50 hover:bg-white"
                                            placeholder="••••••••"
                                            required
                                            disabled={isLoading}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                                            disabled={isLoading}
                                        >
                                            {showPassword ? (
                                                <EyeOff className="h-5 w-5" />
                                            ) : (
                                                <Eye className="h-5 w-5" />
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {/* Botón Login */}
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold py-2.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? (
                                        <>
                                            <span className="animate-spin">⏳</span>
                                            Iniciando sesión...
                                        </>
                                    ) : (
                                        <>
                                            <LogIn className="h-5 w-5" />
                                            Iniciar Sesión
                                        </>
                                    )}
                                </button>
                            </form>

                            {/* Footer */}
                            {clinicConfig.footerText && (
                                <div className="mt-6 pt-4 border-t border-gray-100 text-center">
                                    <p className="text-xs text-gray-400">
                                        {clinicConfig.footerText}
                                    </p>
                                </div>

                            )}
                        </div>
                    </div>

                </div>

                {/* Información de contacto */}
                <div className="text-center mt-6 text-xs text-gray-400 space-x-3">
                    {clinicConfig.address && <span>{clinicConfig.address}</span>}
                    {clinicConfig.mobile && <span>• Tel: {clinicConfig.mobile}</span>}
                    {clinicConfig.email && <span>• {clinicConfig.email}</span>}
                </div>
            </div>
        </div>
    );
};