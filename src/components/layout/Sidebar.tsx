import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, LayoutDashboard, Users, Calendar, FileText, Settings,LogOut, Activity } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const menuItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/patients', icon: Users, label: 'Pacientes' },
    { path: '/appointments', icon: Calendar, label: 'Citas' },
    { path: '/clinical-history', icon: FileText, label: 'Historia Clínica' },
    { path: '/settings', icon: Settings, label: 'Configuración' },
];

export const Sidebar = () => {
    const [isOpen, setIsOpen] = useState(true);
    const location = useLocation();
    const { logout } = useAuth();

    return (
        <>
        {/* Mobile menu button */}
        <button 
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden fixed top-4 left-4 z-50 p2 bg-primary-600 text-white rounded-lg"
        >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Sidebar */}
        <div className={`
            fixed top-0 left-0 h-full bg-gradient-to-b from-primary-700 to primary-900
            text-white transition-all duration-300 z-40
            ${isOpen ? 'w-64' : 'w-16'}
            ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
            {/* Logo */}
            <div className="flex items-center justify-center h-20 border-b border-primary-600">
                <Activity  className="w-8 h-8" />
                {isOpen && <span className="ml-2 text-xl font-bold">Dental Clinic</span>}
            </div>

            {/* Navigation */}
            <nav className="mt-8">
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`
                                flex items-center px-4 py-3 mx-2 mb-2 rounded-lg transition-all
                                ${isActive
                                    ? 'bg-primary-600 text-white'
                                    : 'text-gray-100 hover:bg-primary-800'
                                }
                            `}
                        >
                            <Icon className="w-5 h-5" />
                            {isOpen && <span className="ml-3">{item.label}</span>}
                        </Link>        
                    );
                })}
            </nav>

            {/* Logout bottton*/}
            <div className="absolute bottom-8 w-full px-4">
                <button
                    onClick={logout}
                    className="flex items-center w-full px-4 py-3 text-primary-100 hover:bg-primary-800 rounded-lg transition-all">
                    <LogOut className="w-5 h-5" />
                    {isOpen && <span className="ml-3">Cerrar sesión</span>}
                </button>
            </div>
        </div>

        {/* Overlay for mobile when sidebar is open */}
        {isOpen && (
            <div 
                className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden" 
                onClick={() => setIsOpen(false)} 
            />
        )}
        </>
    );
};