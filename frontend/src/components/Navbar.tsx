import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import '../styles/Navbar.css';

// Componente de navegacion principal de la aplicacion
// Muestra diferentes enlaces segun el estado de autenticacion y el rol del usuario
const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  // Funcion para cerrar sesion y redirigir al login
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          Gimnasio App
        </Link>
        
        <div className="navbar-menu">
          {/* Menu para usuarios autenticados */}
          {isAuthenticated ? (
            <>
              {/* Enlace al dashboard, visible para todos los usuarios autenticados */}
              <Link to="/dashboard" className="navbar-link">
                Dashboard
              </Link>
              {/* Enlace a las clases disponibles, visible para todos */}
              <Link to="/classes" className="navbar-link">
                Clases
              </Link>
              {/* Enlace a mis clases, solo visible para monitores y administradores */}
              {(user?.role === 'monitor' || user?.role === 'admin') && (
                <Link to="/classes/my-classes" className="navbar-link">
                  Mis Clases
                </Link>
              )}
              {/* Enlace a mis reservas, solo visible para socios */}
              {user?.role === 'socio' && (
                <Link to="/bookings" className="navbar-link">
                  Mis Reservas
                </Link>
              )}
              {/* Enlace al perfil del usuario */}
              <Link to="/profile" className="navbar-link">
                Perfil
              </Link>
              {/* Informacion del usuario autenticado */}
              <span className="navbar-user">
                {user?.name} ({user?.role})
              </span>
              {/* Boton para cerrar sesion */}
              <button onClick={handleLogout} className="navbar-button">
                Cerrar Sesión
              </button>
            </>
          ) : (
            <>
              {/* Menu para usuarios no autenticados */}
              <Link to="/login" className="navbar-link">
                Iniciar Sesión
              </Link>
              <Link to="/register" className="navbar-button">
                Registrarse
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

