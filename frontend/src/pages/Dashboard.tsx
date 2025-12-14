import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { UserRole } from '../types';
import paymentService from '../services/paymentService';
import feedbackService from '../services/feedbackService';
import '../styles/Dashboard.css';

// Pagina principal del dashboard que muestra diferentes opciones segun el rol del usuario
const Dashboard = () => {
  const { user, isLoading: authLoading } = useAuth();
  const location = useLocation();
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [isCheckingSubscription, setIsCheckingSubscription] = useState(true);
  const [unansweredFeedbacksCount, setUnansweredFeedbacksCount] = useState(0);

  // Verificar si el socio tiene suscripcion activa
  useEffect(() => {
    const checkSubscription = async () => {
      if (user?.role === UserRole.SOCIO) {
        try {
          setIsCheckingSubscription(true);
          const hasActive = await paymentService.checkActiveSubscription();
          setHasActiveSubscription(hasActive);
        } catch (error) {
          console.warn('Error al verificar suscripcion:', error);
          setHasActiveSubscription(false);
        } finally {
          setIsCheckingSubscription(false);
        }
      } else {
        setIsCheckingSubscription(false);
      }
    };

    // Solo verificar suscripcion si el usuario ya esta cargado
    if (!authLoading && user) {
      checkSubscription();
    }
  }, [user?.role, authLoading, user]);

  // Cargar contador de feedbacks sin responder para admin
  useEffect(() => {
    const loadUnansweredCount = async () => {
      if (user?.role === UserRole.ADMIN) {
        try {
          const count = await feedbackService.getUnansweredFeedbacksCount();
          setUnansweredFeedbacksCount(count);
        } catch (error) {
          console.error('Error al cargar contador de feedbacks:', error);
        }
      }
    };

    if (!authLoading && user) {
      loadUnansweredCount();
      // Actualizar cada 30 segundos
      const interval = setInterval(loadUnansweredCount, 30000);
      
      // Escuchar eventos de respuesta a feedbacks
      const handleFeedbackResponded = () => {
        loadUnansweredCount();
      };
      window.addEventListener('feedback-responded', handleFeedbackResponded);
      
      return () => {
        clearInterval(interval);
        window.removeEventListener('feedback-responded', handleFeedbackResponded);
      };
    }
  }, [user?.role, authLoading, user, location.pathname]);

  // Funcion auxiliar para obtener el mensaje de bienvenida segun el rol
  const getWelcomeMessage = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return 'Bienvenido Admin. Tienes acceso completo al sistema.';
      case UserRole.MONITOR:
        return 'Bienvenido Monitor. Aquí podrás gestionar tus clases.';
      case UserRole.SOCIO:
        return 'Bienvenido. Explora las clases disponibles y realiza tus reservas.';
      default:
        return 'Bienvenido';
    }
  };

  // Mostrar estado de carga mientras se verifica la autenticacion
  if (authLoading || !user) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1>Menú Principal</h1>
        </div>
        <div className="welcome-card">
          <p>Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Menú Principal</h1>
      </div>

      <div className="welcome-card">
        <h2>Hola, {user?.name}</h2>
        <p>{user && getWelcomeMessage(user.role)}</p>
      </div>

      <div className="dashboard-grid">
        {/* Opciones para socios */}
        {user?.role === UserRole.SOCIO && (
          <>
            <div className="dashboard-card clickable" onClick={() => window.location.href = '/bookings'}>
              <img src="/reserva.png" alt="Reservas" className="dashboard-card-image" />
              <h3>Mis Reservas</h3>
              <p>Ver y gestionar tus reservas</p>
              <button className="card-button">Ver Reservas</button>
            </div>

            <div className="dashboard-card clickable" onClick={() => window.location.href = '/classes'}>
              <img src="/clases.png" alt="Clases" className="dashboard-card-image" />
              <h3>Clases Disponibles</h3>
              <p>Explora y reserva clases</p>
              <button className="card-button">Ver Clases</button>
            </div>

            <div className="dashboard-card clickable" onClick={() => window.location.href = '/payment'}>
              <img src="/money.png" alt="Suscripción" className="dashboard-card-image" />
              <h3>Suscripción</h3>
              <p>Gestiona tu suscripción al gimnasio</p>
              <button className="card-button">Ver Suscripción</button>
            </div>

            <div className="dashboard-card clickable" onClick={() => window.location.href = '/feedback'}>
              <img src="/feedback.png" alt="Feedback" className="dashboard-card-image" />
              <h3>Feedback</h3>
              <p>Envía tu opinión, queja o duda</p>
              <button className="card-button">Enviar Feedback</button>
            </div>

            <div className="dashboard-card clickable" onClick={() => window.location.href = '/routines'}>
              <img src="/rutinas.png" alt="Rutinas" className="dashboard-card-image" />
              <h3>Rutinas</h3>
              <p>Explora rutinas de ejercicios y crea la tuya</p>
              <button className="card-button">Ver Rutinas</button>
            </div>

            {/* Card de Acceso solo visible si tiene suscripcion activa */}
            {!isCheckingSubscription && hasActiveSubscription && (
              <div className="dashboard-card clickable" onClick={() => window.location.href = '/qr'}>
                <img src="/acceso.png" alt="Acceso" className="dashboard-card-image" />
                <h3>Acceso</h3>
                <p>Muestra tu código QR para acceder al gimnasio</p>
                <button className="card-button">Ver QR</button>
              </div>
            )}
          </>
        )}

        {/* Opciones para monitores */}
        {user?.role === UserRole.MONITOR && (
          <>
            <div className="dashboard-card clickable" onClick={() => window.location.href = '/classes/my-classes'}>
              <img src="/clases.png" alt="Mis Clases" className="dashboard-card-image" />
              <h3>Mis Clases</h3>
              <p>Gestiona tus clases</p>
              <button className="card-button">Ver Mis Clases</button>
            </div>

            <div className="dashboard-card clickable" onClick={() => window.location.href = '/classes'}>
              <img src="/clases.png" alt="Todas las Clases" className="dashboard-card-image" />
              <h3>Todas las Clases</h3>
              <p>Ver todas las clases del gimnasio</p>
              <button className="card-button">Ver Clases</button>
            </div>

            {/* Card de Acceso siempre visible para monitores */}
            <div className="dashboard-card clickable" onClick={() => window.location.href = '/qr'}>
              <img src="/acceso.png" alt="Acceso" className="dashboard-card-image" />
              <h3>Acceso</h3>
              <p>Muestra tu código QR para acceder al gimnasio</p>
              <button className="card-button">Ver QR</button>
            </div>
          </>
        )}

        {/* Opciones para administradores */}
        {user?.role === UserRole.ADMIN && (
          <>
            <div className="dashboard-card clickable" onClick={() => window.location.href = '/classes'}>
              <img src="/clases.png" alt="Gestión de Clases" className="dashboard-card-image" />
              <h3>Gestión de Clases</h3>
              <p>Ver y administrar todas las clases</p>
              <button className="card-button">Ver Clases</button>
            </div>

            <div className="dashboard-card clickable" onClick={() => window.location.href = '/classes/create'}>
              <img src="/clases.png" alt="Crear Clase" className="dashboard-card-image" />
              <h3>Crear Clase</h3>
              <p>Añadir nueva clase al sistema</p>
              <button className="card-button">Crear Clase</button>
            </div>

            <div className="dashboard-card clickable" onClick={() => window.location.href = '/admin/bookings'}>
              <img src="/reserva.png" alt="Todas las Reservas" className="dashboard-card-image" />
              <h3>Todas las Reservas</h3>
              <p>Ver y gestionar todas las reservas del sistema</p>
              <button className="card-button">Ver Reservas</button>
            </div>

            <div className="dashboard-card clickable" onClick={() => window.location.href = '/admin/users'}>
              <img src="/usuario.png" alt="Gestión de Usuarios" className="dashboard-card-image" />
              <h3>Gestión de Usuarios</h3>
              <p>Ver y administrar todos los usuarios</p>
              <button className="card-button">Ver Usuarios</button>
            </div>

            <div className="dashboard-card clickable" onClick={() => window.location.href = '/admin/feedback'}>
              <img src="/feedback.png" alt="Gestión de Feedback" className="dashboard-card-image" />
              <h3>Gestión de Feedback</h3>
              <p>Ver todos los feedbacks recibidos</p>
              {unansweredFeedbacksCount > 0 && (
                <span className="dashboard-badge">{unansweredFeedbacksCount}</span>
              )}
              <button className="card-button">Ver Feedbacks</button>
            </div>

            <div className="dashboard-card clickable" onClick={() => window.location.href = '/admin/routines'}>
              <img src="/rutinas.png" alt="Gestión de Rutinas" className="dashboard-card-image" />
              <h3>Gestión de Rutinas</h3>
              <p>Gestionar ejercicios y rutinas predefinidas</p>
              <button className="card-button">Ver Rutinas</button>
            </div>

            {/* Card de Acceso siempre visible para administradores */}
            <div className="dashboard-card clickable" onClick={() => window.location.href = '/qr'}>
              <img src="/acceso.png" alt="Acceso" className="dashboard-card-image" />
              <h3>Acceso</h3>
              <p>Muestra tu código QR para acceder al gimnasio</p>
              <button className="card-button">Ver QR</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
