import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getErrorMessage } from '../utils/errorHandler';
import { UserRole } from '../types';
import '../styles/Auth.css';

// Pagina de registro para nuevos usuarios
const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    dni: '',
    phone: '',
    role: UserRole.SOCIO
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  // Manejar cambios en los campos del formulario
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    let value = e.target.value;
    
    // Si es el campo DNI, convertir a mayúsculas y limitar a 9 caracteres
    if (e.target.name === 'dni') {
      value = value.toUpperCase().replace(/[^0-9A-Z]/g, '').slice(0, 9);
    }
    
    setFormData({
      ...formData,
      [e.target.name]: value
    });
  };

  // Manejar el envio del formulario de registro
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    // Validar contraseñas
    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setIsLoading(true);

    try {
      const registerData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        dni: formData.dni.toUpperCase().trim(),
        phone: formData.phone,
        role: UserRole.SOCIO
      };
      await register(registerData);
      navigate('/dashboard');
    } catch (err) {
      setError(getErrorMessage(err, 'Error al registrar usuario'));
      // Limpiar todos los campos en caso de error
      setFormData({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        dni: '',
        phone: '',
        role: UserRole.SOCIO
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">Crear Cuenta</h1>
        <p className="auth-subtitle">Únete a nuestro gimnasio</p>
        
        {error && <div className="auth-error">{error}</div>}
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="name">Nombre Completo *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              minLength={2}
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email *</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="dni">DNI *</label>
            <input
              type="text"
              id="dni"
              name="dni"
              value={formData.dni}
              onChange={handleChange}
              required
              pattern="[0-9]{8}[A-Za-z]"
              placeholder="12345678A"
              maxLength={9}
              disabled={isLoading}
            />
            <small>Formato: 8 dígitos y 1 letra</small>
          </div>

          <div className="form-group">
            <label htmlFor="phone">Teléfono (opcional)</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              pattern="[0-9]{9,15}"
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña *</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={6}
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirmar Contraseña *</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              minLength={6}
              disabled={isLoading}
            />
          </div>

          <button 
            type="submit" 
            className="auth-button"
            disabled={isLoading}
          >
            {isLoading ? 'Registrando...' : 'Registrarse'}
          </button>
        </form>

        <p className="auth-footer">
          ¿Ya tienes cuenta? <Link to="/login">Inicia sesión aquí</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;

