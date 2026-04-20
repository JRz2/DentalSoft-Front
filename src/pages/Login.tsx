import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, LogIn, AlertCircle, Building2 } from 'lucide-react';

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
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            await login({ email, password });
            navigate('/dashboard');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Error al iniciar sesión');
        }
    };

    const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
        e.currentTarget.style.display = 'none';
        const fallback = document.getElementById('logo-fallback');
        if (fallback) fallback.style.display = 'flex';
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 via-primary-100 to-primary-200 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
                    <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-8 py-8 text-center">
                        {/* Logo */}
                        <img
                            src={clinicConfig.logoUrl}
                            alt={clinicConfig.commercialName}
                            className="h-40 w-auto mx-auto mb-4 rounded-full shadow-md bg-white p-2 object-contain"
                            onError={handleImageError}
                        />
                        {/* Fallback si no carga la imagen */}
                        <div 
                            id="logo-fallback"
                            className="w-20 h-20 mx-auto mb-4 bg-black/20 rounded-2xl flex items-center justify-center"
                            style={{ display: 'none' }}
                        >
                            <Building2 className="h-10 w-10 text-black" />
                        </div>
                        <h1 className="text-2xl font-bold text-black">
                            {clinicConfig.commercialName}
                        </h1>
                        <p className="text-primary-100 mt-1 text-sm">
                            {clinicConfig.businessName}
                        </p>
                    </div>

                    <div className="px-8 py-8">
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {error && (
                                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg flex items-start gap-3">
                                    <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                                    <div className="text-sm text-red-700">{error}</div>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
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
                                        className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                                        placeholder="doctor@clinica.com"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Contraseña
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-black font-semibold py-2.5 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                            >
                                <LogIn className="h-5 w-5" />
                                Iniciar Sesión
                            </button>
                        </form>

                        {clinicConfig.footerText && (
                            <div className="mt-6 pt-4 border-t border-gray-100 text-center">
                                <p className="text-xs text-gray-400">
                                    {clinicConfig.footerText}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="text-center mt-6 text-sm text-gray-500">
                    {clinicConfig.address && <p className="mb-1">{clinicConfig.address}</p>}
                    {clinicConfig.mobile && <p className="mb-1">Tel: {clinicConfig.mobile}</p>}
                    {clinicConfig.email && <p className="mb-1">Email: {clinicConfig.email}</p>}
                </div>
            </div>
        </div>
    );
};