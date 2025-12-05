import { useState, type FormEvent } from 'react';
import { useAuth } from '../hooks/useAuth';
import authService from '../services/authService';
import { getErrorMessage } from '../utils/errorHandler';
import '../styles/Profile.css';

// Pagina de perfil donde el usuario puede ver y editar sus datos personales
const Profile = () => {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.value
    });
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value
    });
  };

  const handleUpdateProfile = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    try {
      const updatedUser = await authService.updateProfile(profileData);
      updateUser(updatedUser);
      setMessage('Perfil actualizado correctamente');
      setIsEditing(false);
    } catch (err) {
      setError(getErrorMessage(err, 'Error al actualizar perfil'));
    }
  };

  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    try {
      await authService.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      setMessage('Contraseña cambiada correctamente');
      setIsChangingPassword(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setError('');
    } catch (err) {
      const errorMessage = getErrorMessage(err, 'Error al cambiar contraseña');
      setError(errorMessage);
      // Limpiar solo la contraseña actual en caso de error, mantener las nuevas para que el usuario pueda corregir
      setPasswordData({
        ...passwordData,
        currentPassword: ''
      });
    }
  };

  return (
    <div className="profile-container">
      <div className="profile-title-container">
        <h1>Mi Perfil</h1>
        <img src="/usuario.png" alt="Usuario" className="profile-image" />
      </div>

      {message && <div className="profile-success">{message}</div>}
      {error && <div className="profile-error">{error}</div>}

      {/* Información del Perfil */}
      <div className="profile-card">
        <h2>Información Personal</h2>
        
        {!isEditing ? (
          <>
            <div className="profile-info">
              <div className="info-row">
                <span className="info-label">Nombre:</span>
                <span className="info-value">{user?.name}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Email:</span>
                <span className="info-value">{user?.email}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Teléfono:</span>
                <span className="info-value">{user?.phone || 'No especificado'}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Rol:</span>
                <span className="info-value role-badge">{user?.role}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Estado:</span>
                <span className="info-value status-active">Activo</span>
              </div>
            </div>
            <button 
              onClick={() => {
                setProfileData({
                  name: user?.name || '',
                  email: user?.email || '',
                  phone: user?.phone || ''
                });
                setIsEditing(true);
              }}
              className="profile-button"
            >
              Editar Perfil
            </button>
          </>
        ) : (
          <form onSubmit={handleUpdateProfile}>
            <div className="form-group">
              <label htmlFor="name">Nombre</label>
              <input
                type="text"
                id="name"
                name="name"
                value={profileData.name}
                onChange={handleProfileChange}
                required
                minLength={2}
              />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={profileData.email}
                onChange={handleProfileChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="phone">Teléfono</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={profileData.phone}
                onChange={handleProfileChange}
                pattern="[0-9]{9,15}"
              />
            </div>
            <div className="button-group">
              <button type="submit" className="profile-button">
                Guardar
              </button>
              <button 
                type="button" 
                onClick={() => setIsEditing(false)}
                className="profile-button-secondary"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Cambiar Contraseña */}
      <div className="profile-card">
        <h2>Seguridad</h2>
        
        {!isChangingPassword ? (
          <button 
            onClick={() => setIsChangingPassword(true)}
            className="profile-button"
          >
            Cambiar contraseña
          </button>
        ) : (
          <form onSubmit={handleChangePassword}>
            <div className="form-group">
              <label htmlFor="currentPassword">Contraseña Actual</label>
              <input
                type="password"
                id="currentPassword"
                name="currentPassword"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
                required
                minLength={6}
              />
            </div>
            <div className="form-group">
              <label htmlFor="newPassword">Nueva Contraseña</label>
              <input
                type="password"
                id="newPassword"
                name="newPassword"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                required
                minLength={6}
              />
            </div>
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirmar Nueva Contraseña</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                required
                minLength={6}
              />
            </div>
            <div className="button-group">
              <button type="submit" className="profile-button">
                Cambiar Contraseña
              </button>
              <button 
                type="button" 
                onClick={() => {
                  setIsChangingPassword(false);
                  setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                }}
                className="profile-button-secondary"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Profile;

