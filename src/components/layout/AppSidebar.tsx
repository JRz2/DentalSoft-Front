import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Calendar,
  FileText,
  Settings,
  LogOut,
  Activity,
  Menu,
  UserCircle,
  Shield
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

// Menú base para todos los usuarios
const baseMenuItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'RECEPTIONIST'] },
  { path: '/users', icon: Shield, label: 'Usuarios', roles: ['SUPER_ADMIN'] },
  { path: '/clinics', icon: Activity, label: 'Clinicas', roles: ['SUPER_ADMIN'] },
  { path: '/patients', icon: Users, label: 'Pacientes', roles: ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'RECEPTIONIST'] },
  { path: '/profile', icon: UserCircle, label: 'Perfil', roles: ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'RECEPTIONIST'] },
  { path: '/appointments', icon: Calendar, label: 'Citas', roles: ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'RECEPTIONIST'] },
  { path: '/clinical-history', icon: FileText, label: 'Historia Clínica', roles: ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'RECEPTIONIST'] },
  { path: '/settings', icon: Settings, label: 'Configuración', roles: ['SUPER_ADMIN', 'ADMIN'] },
];

interface AppSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function AppSidebar({ isOpen, onToggle }: AppSidebarProps) {
  const location = useLocation();
  const { logout, user } = useAuth();

  // Filtrar menús según el rol del usuario
  const menuItems = baseMenuItems.filter(item =>
    item.roles.includes(user?.role || '')
  );

  return (
    <>
      {/* Sidebar desktop */}
      <div className={cn(
        "fixed left-0 top-0 h-full bg-gradient-to-b from-slate-800 to-slate-900 text-white transition-all duration-300 z-40 shadow-xl",
        isOpen ? "w-64" : "w-20"
      )}>
        {/* Logo y botón toggle */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <Activity className="w-8 h-8 text-blue-400" />
            {isOpen && <span className="text-xl font-bold">DentalClinic</span>}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="text-white hover:bg-slate-700 hidden lg:flex"
          >
            <Menu className="w-5 h-5" />
          </Button>
        </div>

        {/* Menú de navegación */}
        <nav className="mt-8">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center mx-2 mb-2 px-4 py-3 rounded-lg transition-all",
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-slate-300 hover:bg-slate-700"
                )}
              >
                <Icon className="w-5 h-5" />
                {isOpen && <span className="ml-3">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Botón de logout */}
        <div className="absolute bottom-8 w-full px-4">
          <button
            onClick={logout}
            className="flex items-center w-full px-4 py-3 text-slate-300 hover:bg-slate-700 rounded-lg transition-all"
          >
            <LogOut className="w-5 h-5" />
            {isOpen && <span className="ml-3">Cerrar Sesión</span>}
          </button>
        </div>
      </div>
    </>
  );
}