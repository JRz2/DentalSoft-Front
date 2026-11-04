import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface RoleRouteProps {
    allowedRoles: string[];
    children: React.ReactNode;
}

export const RoleRoute = ({ allowedRoles, children }: RoleRouteProps) => {
    const { user } = useAuth();

    if (!user || !allowedRoles.includes(user.role)) {
        // Si es SUPER_ADMIN, lo mandamos a /clinics. Si no, a /dashboard.
        return <Navigate to={user?.role === 'SUPER_ADMIN' ? '/clinics' : '/dashboard'} replace />;
    }

    return <>{children}</>;
};