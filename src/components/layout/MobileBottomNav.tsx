import { Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard, Users, Calendar, FileText, Home, CreditCard,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '@/lib/utils';

interface NavItem {
    path: string;
    icon: typeof LayoutDashboard;
    label: string;
    roles: string[];
}

// Orden: Pacientes · Citas · [Centro: Dashboard] · Tratamientos · Perfil
const NAV_ITEMS: NavItem[] = [
    { path: '/patients', icon: Users, label: 'Pacientes', roles: ['ADMIN', 'DOCTOR', 'RECEPTIONIST'] },
    { path: '/appointments', icon: Calendar, label: 'Citas', roles: ['ADMIN', 'DOCTOR', 'RECEPTIONIST'] },
    // El centro se renderiza aparte (elevado)
    { path: '/treatments', icon: FileText, label: 'Tratamientos', roles: ['ADMIN', 'DOCTOR', 'RECEPTIONIST'] },
    { path: '/payments', icon: CreditCard, label: 'Pagos', roles: ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'RECEPTIONIST'] },
];

const CENTER_ITEM = {
    path: '/dashboard',
    icon: Home,
    label: 'Inicio',
    roles: ['ADMIN', 'DOCTOR', 'RECEPTIONIST'],
};

export function MobileBottomNav() {
    const location = useLocation();
    const { user } = useAuth();

    const visibleItems = NAV_ITEMS.filter((item) =>
        item.roles.includes(user?.role || '')
    );
    const showCenter = CENTER_ITEM.roles.includes(user?.role || '');

    const leftItems = visibleItems.slice(0, 2);
    const rightItems = visibleItems.slice(2);

    const renderItem = (item: NavItem) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path;

        return (
            <Link
                key={item.path}
                to={item.path}
                aria-label={item.label}
                className={cn(
                    'flex-1 flex flex-col items-center justify-center gap-0.5 py-2 rounded-2xl',
                    'transition-all duration-200 active:scale-95',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-1',
                    isActive ? 'text-teal-600' : 'text-gray-400 hover:text-gray-600',
                )}
            >
                <Icon
                    className={cn(
                        'h-[22px] w-[22px] transition-transform',
                        isActive && 'scale-110',
                    )}
                    strokeWidth={isActive ? 2.4 : 2}
                />
                <span
                    className={cn(
                        'text-[10px] leading-tight',
                        isActive ? 'font-semibold' : 'font-medium',
                    )}
                >
                    {item.label}
                </span>
            </Link>
        );
    };

    const centerActive = location.pathname === CENTER_ITEM.path;

    return (
        <nav
            className={cn(
                'fixed bottom-0 left-0 right-0 z-40 lg:hidden',
                'px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]',
                'pointer-events-none', // permite clicks solo en la barra y el botón
            )}
        >
            <div className="relative pointer-events-auto">
                {/* Barra flotante */}
                <div
                    className={cn(
                        'bg-white rounded-[26px] h-[68px]',
                        'shadow-[0_10px_30px_-5px_rgba(15,118,110,0.15),0_4px_12px_-2px_rgba(0,0,0,0.08)]',
                        'border border-gray-100',
                        'flex items-center justify-between',
                        'px-2',
                    )}
                >
                    {/* Items izquierda */}
                    <div className="flex-1 flex items-center">
                        {leftItems.map(renderItem)}
                    </div>

                    {/* Espacio central reservado */}
                    <div className="w-[72px] shrink-0" aria-hidden="true" />

                    {/* Items derecha */}
                    <div className="flex-1 flex items-center">
                        {rightItems.map(renderItem)}
                    </div>
                </div>

                {/* Botón central elevado */}
                {showCenter && (
                    <Link
                        to={CENTER_ITEM.path}
                        aria-label={CENTER_ITEM.label}
                        className={cn(
                            'absolute left-1/2 -translate-x-1/2 -top-2',
                            'h-14 w-14 rounded-full',
                            'flex items-center justify-center',
                            'transition-all duration-200 active:scale-95',
                            'focus:outline-none focus-visible:ring-4 focus-visible:ring-teal-300',
                            'bg-gradient-to-br from-teal-400 via-teal-500 to-emerald-500',
                            'shadow-[0_8px_20px_-4px_rgba(13,148,136,0.55),0_4px_8px_-2px_rgba(16,185,129,0.4)]',
                            'border-[3px] border-white',
                            centerActive && 'scale-105',
                        )}
                    >
                        <Home
                            className="h-7 w-7 text-white transition-transform"
                            strokeWidth={2.4}
                            style={{ transform: centerActive ? 'scale(1.05)' : undefined }}
                        />
                    </Link>
                )}
            </div>
        </nav>
    );
}