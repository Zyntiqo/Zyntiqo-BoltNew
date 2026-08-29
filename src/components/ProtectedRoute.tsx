import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, isStaff, type UserRole } from '@/lib/auth';
import { Loader2 } from 'lucide-react';

type Props = {
  children: React.ReactNode;
  requireStaff?: boolean;
  requireRoles?: UserRole[];
};

export default function ProtectedRoute({ children, requireStaff = false, requireRoles }: Props) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-ink-950">
        <Loader2 className="h-8 w-8 animate-spin text-brand-400" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (requireStaff && !isStaff(user.role)) {
    return <Navigate to="/portal" replace />;
  }

  if (requireRoles && !requireRoles.includes(user.role)) {
    return <Navigate to={isStaff(user.role) ? '/app' : '/portal'} replace />;
  }

  return <>{children}</>;
}
