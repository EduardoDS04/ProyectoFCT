import { useState, useEffect } from 'react';
import adminService from '../services/adminService';
import { getErrorMessage, isNetworkError } from '../utils/errorHandler';
import type { User } from '../types';
import { UserRole } from '../types';
import '../styles/AdminUsers.css';

// Pagina de administracion donde los admins pueden gestionar todos los usuarios del sistema
const AdminUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<UserRole | 'all'>('all');
  const [isExpanded, setIsExpanded] = useState(false); // Estado para controlar el desplegable (oculto por defecto)

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await adminService.getAllUsers();
      setUsers(data);
    } catch (err) {
      console.error('Error al cargar usuarios:', err);
      
      if (isNetworkError(err)) {
        setError('No se puede conectar con el servidor. Asegúrate de que el Auth Service esté corriendo en el puerto 3001.');
      } else {
        setError(getErrorMessage(err, 'Error al cargar usuarios. Por favor, intenta de nuevo.'));
        setUsers([]);
      }
    } finally {
      setLoading(false);
    }
  };

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

  const filteredUsers = filter === 'all' 
    ? users 
    : users.filter(user => user.role === filter);

  const stats = {
    total: users.length,
    admins: users.filter(u => u.role === UserRole.ADMIN).length,
    monitors: users.filter(u => u.role === UserRole.MONITOR).length,
    socios: users.filter(u => u.role === UserRole.SOCIO).length,
    active: users.filter(u => u.isActive).length
  };

  if (loading) {
    return <div className="admin-users-container"><p className="loading">Cargando usuarios...</p></div>;
  }

  return (
    <div className="admin-users-container">
      <div className="admin-users-header">
        <h1>Gestión de Usuarios</h1>
      </div>

      <div className="master-detail-layout">
        {/* Panel Maestro (Lateral) */}
        <div className="master-panel">
          <h2 
            className="master-panel-title"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            Filtrar por Rol
            <span className={`dropdown-arrow ${isExpanded ? 'expanded' : ''}`}>
              ▼
            </span>
          </h2>
          {isExpanded && (
            <div className="master-list">
            <button 
              className={`master-item ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              <div className="master-item-content">
                <span className="master-item-label">Todos</span>
                <span className="master-item-count">{stats.total}</span>
              </div>
            </button>
            <button 
              className={`master-item ${filter === UserRole.ADMIN ? 'active' : ''}`}
              onClick={() => setFilter(UserRole.ADMIN)}
            >
              <div className="master-item-content">
                <span className="master-item-label">Administradores</span>
                <span className="master-item-count">{stats.admins}</span>
              </div>
            </button>
            <button 
              className={`master-item ${filter === UserRole.MONITOR ? 'active' : ''}`}
              onClick={() => setFilter(UserRole.MONITOR)}
            >
              <div className="master-item-content">
                <span className="master-item-label">Monitores</span>
                <span className="master-item-count">{stats.monitors}</span>
              </div>
            </button>
            <button 
              className={`master-item ${filter === UserRole.SOCIO ? 'active' : ''}`}
              onClick={() => setFilter(UserRole.SOCIO)}
            >
              <div className="master-item-content">
                <span className="master-item-label">Socios</span>
                <span className="master-item-count">{stats.socios}</span>
              </div>
            </button>
          </div>
          )}
        </div>

        {/* Panel Detalle (Principal) */}
        <div className="detail-panel">
          <div className="detail-header">
            <h2>
              {filter === 'all' && 'Todos los Usuarios'}
              {filter === UserRole.ADMIN && 'Administradores'}
              {filter === UserRole.MONITOR && 'Monitores'}
              {filter === UserRole.SOCIO && 'Socios'}
            </h2>
          </div>

          {error && <div className="error-message">{error}</div>}

          {filteredUsers.length === 0 ? (
            <div className="no-users">
              <p>No hay usuarios {filter !== 'all' ? `con rol "${getRoleBadge(filter as UserRole)}"` : 'disponibles'}</p>
            </div>
          ) : (
            <div className="users-table-container">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Email</th>
                    <th>Teléfono</th>
                    <th>Rol</th>
                    <th>Estado</th>
                    <th>Fecha de Registro</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id}>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td>{user.phone || '-'}</td>
                      <td>
                        <span className={`role-badge ${user.role}`}>
                          {getRoleBadge(user.role)}
                        </span>
                      </td>
                      <td>
                        <span className={user.isActive ? 'status-active' : 'status-inactive'}>
                          {user.isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td>
                        {user.createdAt 
                          ? new Date(user.createdAt).toLocaleDateString('es-ES')
                          : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminUsers;

