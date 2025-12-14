import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { UserRole } from '../types';

// Interfaz que define las propiedades del componente ProtectedRoute
interface ProtectedRouteProps {
  children: React.ReactNode;     // Componentes hijos que se renderizaran si el usuario tiene acceso
  allowedRoles?: UserRole[];        
}

// Componente que protege rutas requiriendo autenticacion y opcionalmente roles especificos
// Si el usuario no esta autenticado, redirige al login
// Si el usuario no tiene el rol requerido, redirige al dashboard
const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { isAuthenticated, user, isLoading } = useAuth();

  // Mostrar mensaje de carga mientras se verifica la autenticacion
  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <p>Cargando...</p>
      </div>
    );
  }

  // Si el usuario no esta autenticado, redirigir al login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Si se especificaron roles permitidos y el usuario no tiene uno de esos roles, redirigir al dashboard
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  // Si pasa todas las validaciones, renderizar los componentes hijos
  return <>{children}</>;
};

export default ProtectedRoute;

