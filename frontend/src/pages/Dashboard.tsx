import { useAuth } from '../hooks/useAuth';
import { UserRole } from '../types';
import '../styles/Dashboard.css';

// Pagina principal del dashboard que muestra diferentes opciones segun el rol del usuario
const Dashboard = () => {
  const { user } = useAuth();

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return 'Administrador';
      case UserRole.MONITOR:
        return 'Monitor';
      case UserRole.SOCIO:
        return 'Socio';
      default:
        return role;
    }
  };

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

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <div className="user-badge">
          {user && getRoleBadge(user.role)}
        </div>
      </div>

      <div className="welcome-card">
        <h2>Hola, {user?.name}</h2>
        <p>{user && getWelcomeMessage(user.role)}</p>
      </div>

      <div className="dashboard-grid">
        {/* Información del perfil del usuario */}
        <div className="dashboard-card">
          <h3>Mi Perfil</h3>
          <p>Email: {user?.email}</p>
          {user?.phone && <p>Teléfono: {user.phone}</p>}
          <p className="card-status">
            Estado: <span className="status-active">Activo</span>
          </p>
        </div>

        {/* Opciones para socios */}
        {user?.role === UserRole.SOCIO && (
          <>
            <div className="dashboard-card clickable" onClick={() => window.location.href = '/bookings'}>
              <h3>Mis Reservas</h3>
              <p>Ver y gestionar tus reservas</p>
              <button className="card-button">Ver Reservas</button>
            </div>

            <div className="dashboard-card clickable" onClick={() => window.location.href = '/classes'}>
              <h3>Clases Disponibles</h3>
              <p>Explora y reserva clases</p>
              <button className="card-button">Ver Clases</button>
            </div>
          </>
        )}

        {/* Opciones para monitores */}
        {user?.role === UserRole.MONITOR && (
          <>
            <div className="dashboard-card clickable" onClick={() => window.location.href = '/classes/my-classes'}>
              <h3>Mis Clases</h3>
              <p>Gestiona tus clases</p>
              <button className="card-button">Ver Mis Clases</button>
            </div>

            <div className="dashboard-card clickable" onClick={() => window.location.href = '/classes/create'}>
              <h3>Crear Clase</h3>
              <p>Añade una nueva clase</p>
              <button className="card-button">Crear Clase</button>
            </div>

            <div className="dashboard-card clickable" onClick={() => window.location.href = '/classes'}>
              <h3>Todas las Clases</h3>
              <p>Ver todas las clases del gimnasio</p>
              <button className="card-button">Ver Clases</button>
            </div>
          </>
        )}

        {/* Opciones para administradores */}
        {user?.role === UserRole.ADMIN && (
          <>
            <div className="dashboard-card clickable" onClick={() => window.location.href = '/classes'}>
              <h3>Gestión de Clases</h3>
              <p>Ver y administrar todas las clases</p>
              <button className="card-button">Ver Clases</button>
            </div>

            <div className="dashboard-card clickable" onClick={() => window.location.href = '/classes/create'}>
              <h3>Crear Clase</h3>
              <p>Añadir nueva clase al sistema</p>
              <button className="card-button">Crear Clase</button>
            </div>

            <div className="dashboard-card clickable" onClick={() => window.location.href = '/admin/users'}>
              <h3>Gestión de Usuarios</h3>
              <p>Ver y administrar todos los usuarios</p>
              <button className="card-button">Ver Usuarios</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
