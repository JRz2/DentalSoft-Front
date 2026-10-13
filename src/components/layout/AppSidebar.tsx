import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, Calendar, FileText, Settings, LogOut, Activity,
  Menu, UserCircle, Shield, X
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useMyClinic } from '@/hooks/useMyClinic';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const baseMenuItems = [
  { path: '/clinics', icon: Activity, label: 'Clinicas', roles: ['SUPER_ADMIN'] },
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['ADMIN', 'DOCTOR', 'RECEPTIONIST'] },
  { path: '/users', icon: Shield, label: 'Usuarios', roles: ['SUPER_ADMIN'] },
  { path: '/profile', icon: UserCircle, label: 'Perfil', roles: ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'RECEPTIONIST'] },
  { path: '/patients', icon: Users, label: 'Pacientes', roles: ['ADMIN', 'DOCTOR', 'RECEPTIONIST'] },
  { path: '/treatments', icon: FileText, label: 'Tratamientos', roles: ['ADMIN', 'DOCTOR', 'RECEPTIONIST'] },
  { path: '/appointments', icon: Calendar, label: 'Citas', roles: ['ADMIN', 'DOCTOR', 'RECEPTIONIST'] },
  { path: '/settings', icon: Settings, label: 'Configuración', roles: ['ADMIN'] },
];

interface AppSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  isMobile?: boolean;
}

const getImageUrl = (path?: string | null) => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  const cleanBaseUrl = baseUrl.replace(/\/api$/, '');
  if (path.startsWith('/')) return `${cleanBaseUrl}${path}`;
  return `${cleanBaseUrl}/${path}`;
};

export function AppSidebar({ isOpen, onToggle, isMobile = false }: AppSidebarProps) {
  const location = useLocation();
  const { logout, user } = useAuth();
  const { clinic } = useMyClinic();

  const menuItems = baseMenuItems.filter((item) =>
    item.roles.includes(user?.role || '')
  );

  const showLabel = isMobile || isOpen;

  const clinicName = clinic?.name?.trim() || 'DentalClinic';
  const logoUrl = getImageUrl(clinic?.logoUrl);

  const handleNavClick = () => {
    if (isMobile && isOpen) onToggle();
  };

  return (
    <aside
      className={cn(
        'h-screen text-white transition-all duration-300 z-40 shadow-xl overflow-hidden',
        'bg-gradient-to-b from-teal-900 via-teal-900 to-slate-900',
        'border-r border-teal-800/50',
        !isMobile && 'relative shrink-0',
        !isMobile && (isOpen ? 'w-64' : 'w-20'),
        isMobile && 'fixed top-0 left-0 w-72 z-50',
        isMobile && (isOpen ? 'translate-x-0' : '-translate-x-full'),
      )}
    >
      {/* Logo + nombre */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-teal-800/50">
        <div className="flex items-center gap-2 overflow-hidden min-w-0">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={clinicName}
              className="w-9 h-9 rounded-lg object-cover shrink-0 ring-2 ring-teal-500/30"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const sibling = e.currentTarget.nextElementSibling as HTMLElement | null;
                if (sibling) sibling.classList.remove('hidden');
              }}
            />
          ) : null}
          <div
            className={cn(
              'w-9 h-9 rounded-lg bg-teal-500/20 flex items-center justify-center shrink-0',
              logoUrl && 'hidden',
            )}
          >
            <Activity className="w-5 h-5 text-teal-400" />
          </div>

          {showLabel && (
            <span className="text-base font-bold whitespace-nowrap truncate">
              {clinicName}
            </span>
          )}
        </div>

        {!isMobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="text-teal-200 hover:bg-teal-800/50 hover:text-white shrink-0"
            aria-label="Colapsar menú"
          >
            <Menu className="w-5 h-5" />
          </Button>
        )}

        {isMobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="text-teal-200 hover:bg-teal-800/50 hover:text-white shrink-0"
            aria-label="Cerrar menú"
          >
            <X className="w-5 h-5" />
          </Button>
        )}
      </div>

      {/* Menú */}
      <nav
        className="mt-6 overflow-y-auto"
        style={{ maxHeight: 'calc(100vh - 160px)' }}
      >
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={handleNavClick}
              className={cn(
                'flex items-center mx-2 mb-1.5 px-3 py-2.5 rounded-lg transition-all overflow-hidden',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-inset',
                isActive
                  ? 'bg-teal-500 text-white shadow-md shadow-teal-500/30'
                  : 'text-teal-100/80 hover:bg-teal-800/50 hover:text-white',
              )}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {showLabel && (
                <span className="ml-3 whitespace-nowrap truncate">{item.label}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="absolute bottom-6 left-0 right-0 px-3">
        <button
          onClick={logout}
          className={cn(
            'flex items-center w-full px-3 py-2.5 rounded-lg transition-all overflow-hidden',
            'text-teal-100/80 hover:bg-red-500/15 hover:text-red-300',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-inset',
          )}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {showLabel && <span className="ml-3 whitespace-nowrap">Cerrar Sesión</span>}
        </button>
      </div>
    </aside>
  );
}