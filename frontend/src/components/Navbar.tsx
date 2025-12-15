import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import feedbackService from '../services/feedbackService';
import axios from 'axios';
import '../styles/Navbar.css';

// Componente de navegacion principal de la aplicacion
// Muestra diferentes enlaces segun el estado de autenticacion y el rol del usuario
const Navbar = () => {
  const { isAuthenticated, user, logout, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);

  // Cargar contador de notificaciones para socios
  useEffect(() => {
    // Solo cargar si el usuario está completamente autenticado y cargado, y es socio
    if (!isLoading && isAuthenticated && user?.role === 'socio' && user?.id) {
      loadUnreadCount();
      
      // Actualizar cada 30 segundos
      const interval = setInterval(() => {
        loadUnreadCount();
      }, 30000);
      
      // Escuchar eventos de actualización de notificaciones
      const handleNotificationsUpdate = () => {
        loadUnreadCount();
      };
      window.addEventListener('notifications-opened', handleNotificationsUpdate);
      window.addEventListener('notifications-updated', handleNotificationsUpdate);
      
      return () => {
        clearInterval(interval);
        window.removeEventListener('notifications-opened', handleNotificationsUpdate);
        window.removeEventListener('notifications-updated', handleNotificationsUpdate);
      };
    }
  }, [isAuthenticated, user, isLoading, location.pathname]);

  const loadUnreadCount = async () => {
    try {
      const count = await feedbackService.getUnreadNotificationsCount();
      setUnreadCount(count);
    } catch (error) {
      // Solo loguear si no es un error 401 (esperado para usuarios nuevos)
      if (axios.isAxiosError(error) && error.response?.status !== 401) {
        console.warn('Error al cargar contador de notificaciones:', error);
      }
    }
  };

  // Funcion para cerrar sesion y redirigir al login
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <img src="/adn.png" alt="GYM10 Logo" className="navbar-logo-img" />
          GYM10
        </Link>
        
        <div className="navbar-menu">
          {/* Menu para usuarios autenticados */}
          {isAuthenticated ? (
            <>
              {/* Enlace al dashboard, visible para todos los usuarios autenticados */}
              <Link to="/dashboard" className="navbar-link">
                Menú Principal
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
              {/* Enlace a notificaciones, solo visible para socios */}
              {user?.role === 'socio' && (
                <Link 
                  to="/notifications" 
                  className="navbar-link navbar-link-with-badge"
                  onClick={loadUnreadCount}
                >
                  Notificaciones
                  {unreadCount > 0 && (
                    <span className="navbar-badge">{unreadCount}</span>
                  )}
                </Link>
              )}
              {/* Enlace al perfil del usuario */}
              <Link to="/profile" className="navbar-link">
                Perfil
              </Link>
              {/* Boton para cerrar sesion */}
              <button onClick={handleLogout} className="navbar-button">
                Cerrar Sesión
              </button>
            </>
          ) : (
            <>
              {/* Menu para usuarios no autenticados */}
              <Link 
                to="/login" 
                className={`navbar-link ${location.pathname === '/login' ? 'active' : ''}`}
              >
                Iniciar Sesión
              </Link>
              <Link 
                to="/register" 
                className={`navbar-link ${location.pathname === '/register' ? 'active' : ''}`}
              >
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

