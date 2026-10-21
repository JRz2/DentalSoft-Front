import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { usePageHeaderContext } from '../../contexts/PageHeaderContext';
import { Menu, User, LogOut, Settings, UserCircle, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface HeaderProps {
  onMenuClick: () => void;
}

const getInitials = (name?: string) => {
  if (!name || !name.trim()) return '?';
  return name
    .trim()
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
};

const getImageUrl = (path?: string | null) => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  const cleanBaseUrl = baseUrl.replace(/\/api$/, '');
  if (path.startsWith('/')) return `${cleanBaseUrl}${path}`;
  return `${cleanBaseUrl}/${path}`;
};

const roleLabels: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Administrador',
  DOCTOR: 'Doctor',
  RECEPTIONIST: 'Recepcionista',
};

/* ============================================================
   AVATAR — reutilizable, con fallback a iniciales
   ============================================================ */
function UserAvatar({
  photoUrl,
  name,
  size = 'md',
}: {
  photoUrl?: string | null;
  name?: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const [imageError, setImageError] = useState(false);

  const sizeClass =
    size === 'lg'
      ? 'h-10 w-10 text-sm'
      : size === 'md'
        ? 'h-9 w-9 text-xs'
        : 'h-8 w-8 text-[10px]';

  const url = getImageUrl(photoUrl);
  const hasPhoto = !!url && !imageError;

  return (
    <div
      className={cn(
        sizeClass,
        'rounded-full overflow-hidden shrink-0 ring-2 ring-white shadow-sm',
        'bg-gradient-to-br from-teal-100 to-emerald-100',
        'flex items-center justify-center',
      )}
    >
      {hasPhoto ? (
        <img
          src={url}
          alt={name || 'Usuario'}
          className="h-full w-full object-cover"
          onError={() => setImageError(true)}
        />
      ) : name ? (
        <span className={cn('font-bold text-teal-700', size === 'lg' ? 'text-sm' : 'text-xs')}>
          {getInitials(name)}
        </span>
      ) : (
        <User className="h-5 w-5 text-teal-600" />
      )}
    </div>
  );
}

/* ============================================================
   HEADER
   ============================================================ */
export const Header = ({ onMenuClick }: HeaderProps) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { header } = usePageHeaderContext();

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header
      className={cn(
        'shrink-0 bg-white z-30',
        'border-b border-teal-100',
        'bg-gradient-to-r from-teal-50/40 via-white to-white',
      )}
    >
      <div className="flex h-16 items-center justify-between gap-3 px-4 lg:px-6">
        {/* ═════════ IZQUIERDA: menú (mobile) + título dinámico ═════════ */}
        <div className="flex items-center gap-2 lg:gap-3 min-w-0 flex-1">
          {/* Botón hamburguesa — solo mobile */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="lg:hidden text-gray-600 hover:text-teal-600 hover:bg-teal-50 shrink-0"
            aria-label="Abrir menú"
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Título + descripción dinámicos */}
          <div className="min-w-0 flex flex-col justify-center">
            <h1 className="text-base lg:text-lg font-semibold text-gray-900 truncate leading-tight">
              {header?.title || 'Clínica Dental'}
            </h1>
            {header?.description && (
              <p className="text-xs text-gray-500 truncate leading-tight hidden sm:block">
                {header.description}
              </p>
            )}
          </div>
        </div>

        {/* ═════════ DERECHA: acciones de usuario ═════════ */}
        <div className="flex items-center gap-2 shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={cn(
                  'flex items-center gap-2 pl-1 pr-2 py-1 rounded-full',
                  'hover:bg-teal-50 transition-colors',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-1',
                )}
                aria-label="Menú de usuario"
              >
                {/* Info del usuario (oculta en pantallas chicas) */}
                <div className="hidden sm:flex flex-col items-end mr-1">
                  <span className="text-sm font-medium text-gray-800 leading-tight">
                    {user?.name || 'Usuario'}
                  </span>
                  <span className="text-[11px] text-teal-600 leading-tight">
                    {roleLabels[user?.role || ''] || user?.role || '—'}
                  </span>
                </div>

                {/* Avatar con foto real o fallback a iniciales */}
                <UserAvatar
                  photoUrl={user?.photoUrl}
                  name={user?.name}
                  size="md"
                />

                <ChevronDown className="h-3.5 w-3.5 text-gray-400 hidden sm:block" />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-64">
              {/* Header del dropdown */}
              <DropdownMenuLabel className="font-normal">
                <div className="flex items-center gap-3 py-1">
                  <UserAvatar
                    photoUrl={user?.photoUrl}
                    name={user?.name}
                    size="lg"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {user?.name || 'Usuario'}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {user?.email || ''}
                    </p>
                    <p className="text-[11px] text-teal-600 mt-0.5">
                      {roleLabels[user?.role || ''] || user?.role || '—'}
                    </p>
                  </div>
                </div>
              </DropdownMenuLabel>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={() => navigate('/profile')}
                className="cursor-pointer gap-2 focus:bg-teal-50 focus:text-teal-700"
              >
                <UserCircle className="h-4 w-4" />
                <span>Mi perfil</span>
              </DropdownMenuItem>

              {isAdmin && (
                <DropdownMenuItem
                  onClick={() => navigate('/settings')}
                  className="cursor-pointer gap-2 focus:bg-teal-50 focus:text-teal-700"
                >
                  <Settings className="h-4 w-4" />
                  <span>Configuración</span>
                </DropdownMenuItem>
              )}

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={handleLogout}
                className="cursor-pointer gap-2 text-red-600 focus:bg-red-50 focus:text-red-700"
              >
                <LogOut className="h-4 w-4" />
                <span>Cerrar sesión</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};