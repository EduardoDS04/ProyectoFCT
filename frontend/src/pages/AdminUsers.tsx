import { useState, useEffect } from 'react';
import adminService from '../services/adminService';
import { getErrorMessage, isNetworkError } from '../utils/errorHandler';
import { useAuth } from '../hooks/useAuth';
import type { User } from '../types';
import { UserRole } from '../types';
import '../styles/AdminUsers.css';

// Pagina de administracion donde los admins pueden gestionar todos los usuarios del sistema
const AdminUsers = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [filter, setFilter] = useState<UserRole | 'all'>('all');
  const [isExpanded, setIsExpanded] = useState(false); // Estado para controlar el desplegable 
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [userToToggle, setUserToToggle] = useState<{ id: string; name: string; isActive: boolean } | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<{ id: string; name: string } | null>(null);

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

  // helper para mostrar mensajes de éxito
  const showSuccessMessage = (message: string) => {
    setError('');
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  // helper para mostrar mensajes de error
  const showErrorMessage = (err: unknown, defaultMessage: string) => {
    setError(getErrorMessage(err, defaultMessage));
    setSuccessMessage('');
    setTimeout(() => setError(''), 5000);
  };

  // helper para cerrar modales y resetear estados
  const closeModal = () => {
    setShowConfirmModal(false);
    setShowDeleteModal(false);
    setUserToToggle(null);
    setUserToDelete(null);
  };

  // función genérica para manejar acciones con modales
  const handleModalAction = async (
    action: () => Promise<void>,
    successMessage: string,
    errorMessage: string
  ) => {
    try {
      setError('');
      setSuccessMessage('');
      await action();
      showSuccessMessage(successMessage);
      closeModal();
      loadUsers();
    } catch (err) {
      showErrorMessage(err, errorMessage);
      closeModal();
    }
  };

  const handleRoleChange = async (userId: string, newRole: UserRole, userName: string) => {
    await handleModalAction(
      () => adminService.updateUserRole(userId, newRole),
      `Rol de "${userName}" cambiado a "${getRoleBadge(newRole)}" correctamente`,
      'Error al cambiar el rol del usuario'
    );
  };

  const handleCheckboxChange = (userItem: User) => {
    // Solo permitir cambiar estado a monitores y socios
    if (userItem.role === UserRole.ADMIN) {
      return;
    }
    setUserToToggle({
      id: userItem.id,
      name: userItem.name,
      isActive: userItem.isActive
    });
    setShowConfirmModal(true);
  };

  const handleConfirmToggle = async () => {
    if (!userToToggle) return;
    await handleModalAction(
      () => adminService.toggleUserActive(userToToggle.id),
      `Usuario "${userToToggle.name}" ${userToToggle.isActive ? 'desactivado' : 'activado'} correctamente`,
      'Error al cambiar el estado del usuario'
    );
  };

  const handleDeleteClick = (userItem: User) => {
    // Solo permitir eliminar a monitores y socios
    if (userItem.role === UserRole.ADMIN) {
      return;
    }
    setUserToDelete({
      id: userItem.id,
      name: userItem.name
    });
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    await handleModalAction(
      () => adminService.deleteUser(userToDelete.id),
      `Usuario "${userToDelete.name}" eliminado correctamente`,
      'Error al eliminar el usuario'
    );
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
          {successMessage && <div className="success-message">{successMessage}</div>}

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
                    <th>DNI</th>
                    <th>Teléfono</th>
                    <th>Rol</th>
                    <th>Estado</th>
                    <th>Fecha de Registro</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((userItem) => {
                    // Ocultar selector de rol si es el admin actual
                    const isCurrentAdmin = userItem.id === user?.id && user?.role === UserRole.ADMIN;
                    return (
                      <tr key={userItem.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {userItem.role !== UserRole.ADMIN && (
                              <>
                                <button
                                  onClick={() => handleCheckboxChange(userItem)}
                                  className="btn-deactivate-user"
                                  title={userItem.isActive ? 'Dar de baja' : 'Activar cuenta'}
                                >
                                  <img src="/borrar.png" alt="Dar de baja" style={{ width: '20px', height: '20px' }} />
                                </button>
                                <button
                                  onClick={() => handleDeleteClick(userItem)}
                                  className="btn-delete-user"
                                  title="Eliminar usuario definitivamente"
                                >
                                  <img src="/eliminar.png" alt="Eliminar" style={{ width: '20px', height: '20px' }} />
                                </button>
                              </>
                            )}
                            {userItem.name}
                          </div>
                        </td>
                        <td>{userItem.email}</td>
                        <td>{userItem.dni || '-'}</td>
                        <td>{userItem.phone || '-'}</td>
                        <td>
                          {isCurrentAdmin ? (
                            <span className={`role-badge ${userItem.role}`}>
                              {getRoleBadge(userItem.role)}
                            </span>
                          ) : (
                            <select
                              value={userItem.role}
                              onChange={(e) => handleRoleChange(userItem.id, e.target.value as UserRole, userItem.name)}
                              className="role-select"
                            >
                              <option value={UserRole.SOCIO}>Socio</option>
                              <option value={UserRole.MONITOR}>Monitor</option>
                              <option value={UserRole.ADMIN}>Administrador</option>
                            </select>
                          )}
                        </td>
                        <td>
                          <span className={userItem.isActive ? 'status-active' : 'status-inactive'}>
                            {userItem.isActive ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td>
                          {userItem.createdAt 
                            ? new Date(userItem.createdAt).toLocaleDateString('es-ES')
                            : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal de confirmación para dar de baja */}
      {showConfirmModal && userToToggle && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Confirmar acción</h3>
            <p>
              ¿Estás seguro de que quieres {userToToggle.isActive ? 'dar de baja' : 'activar'} al usuario{' '}
              <strong>{userToToggle.name}</strong>?
            </p>
            <div className="modal-actions">
              <button onClick={closeModal} className="btn-cancel-modal">
                Cancelar
              </button>
              <button onClick={handleConfirmToggle} className="btn-confirm-modal">
                {userToToggle.isActive ? 'Dar de Baja' : 'Activar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación para eliminar */}
      {showDeleteModal && userToDelete && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Eliminar usuario</h3>
            <p>
              ¿Estás seguro de que quieres eliminar definitivamente al usuario{' '}
              <strong>{userToDelete.name}</strong>? Esta acción no se puede deshacer.
            </p>
            <div className="modal-actions">
              <button onClick={closeModal} className="btn-cancel-modal">
                Cancelar
              </button>
              <button onClick={handleConfirmDelete} className="btn-confirm-modal">
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;

