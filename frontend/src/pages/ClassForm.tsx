import { useState, useEffect, useCallback, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import classService from '../services/classService';
import { getErrorMessage } from '../utils/errorHandler';
import type { CreateClassData, User } from '../types';
import '../styles/ClassForm.css';

// Formulario para crear o editar una clase
const ClassForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEdit = !!id;

  const [formData, setFormData] = useState<CreateClassData>({
    name: '',
    description: '',
    schedule: '',
    duration: 60,
    maxParticipants: 15,
    room: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Cargar datos de la clase para edicion
  const loadClass = useCallback(async () => {
    try {
      if (!user || !id) {
        return;
      }

      const classData = await classService.getClassById(id);
      
      // Verificar permisos - normalizar ambos IDs para comparación segura
      // Manejar tanto id como _id por compatibilidad
      const userWithId = user as User & { _id?: string };
      const userId = user.id || userWithId._id || '';
      const monitorIdStr = String(classData.monitorId || '').trim().toLowerCase();
      const userIdStr = String(userId).trim().toLowerCase();
      
      if (user.role !== 'admin' && monitorIdStr !== userIdStr) {
        alert('No tienes permisos para editar esta clase');
        navigate('/classes');
        return;
      }

      // Verificar que la clase no esté cancelada o completada
      if (classData.status === 'cancelled' || classData.status === 'completed') {
        alert('No se pueden editar clases canceladas o completadas');
        navigate('/classes');
        return;
      }

      // Verificar que la clase no haya pasado
      if (new Date(classData.schedule) < new Date()) {
        alert('No se pueden editar clases que ya han finalizado');
        navigate('/classes');
        return;
      }

      // Formatear fecha para input datetime-local
      const scheduleDate = new Date(classData.schedule);
      const formattedDate = scheduleDate.toISOString().slice(0, 16);

      setFormData({
        name: classData.name,
        description: classData.description,
        schedule: formattedDate,
        duration: classData.duration,
        maxParticipants: classData.maxParticipants,
        room: classData.room
      });
    } catch (err) {
      setError('Error al cargar la clase');
      console.error(err);
    }
  }, [user, id, navigate]);

  // Cargar datos de la clase si estamos en modo edicion
  useEffect(() => {
    if (isEdit && id && user) {
      loadClass();
    }
  }, [isEdit, id, user, loadClass]);

  // Manejar cambios en los campos del formulario
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'duration' || name === 'maxParticipants' ? parseInt(value) || 0 : value
    }));
  };

  // Manejar el envio del formulario
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validar fecha futura
      const scheduleDate = new Date(formData.schedule);
      if (scheduleDate <= new Date()) {
        setError('La fecha debe ser futura');
        setLoading(false);
        return;
      }

      const dataToSend = {
        ...formData,
        schedule: scheduleDate.toISOString()
      };

      if (isEdit) {
        await classService.updateClass(id!, dataToSend);
      } else {
        await classService.createClass(dataToSend);
      }

      navigate('/classes/my-classes');
    } catch (err) {
      setError(getErrorMessage(err, 'Error al guardar la clase'));
    } finally {
      setLoading(false);
    }
  };

  // Manejar la cancelacion del formulario
  const handleCancel = () => {
    if (window.confirm('¿Seguro que quieres cancelar? Los cambios no se guardarán.')) {
      navigate(-1);
    }
  };

  // Obtener fecha minima (ahora + 1 hora)
  const getMinDateTime = () => {
    const now = new Date();
    now.setHours(now.getHours() + 1);
    return now.toISOString().slice(0, 16);
  };

  return (
    <div className="class-form-container">
      <div className="class-form-card">
        <h1>{isEdit ? 'Editar Clase' : 'Crear Nueva Clase'}</h1>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="class-form">
          <div className="form-group">
            <label htmlFor="name">Nombre de la Clase *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Ej: Spinning Intenso"
              required
              minLength={3}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Descripción</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe la clase, nivel de dificultad, etc. (opcional)"
              rows={4}
              disabled={loading}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="schedule">Fecha y Hora *</label>
              <input
                type="datetime-local"
                id="schedule"
                name="schedule"
                value={formData.schedule}
                onChange={handleChange}
                min={getMinDateTime()}
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="duration">Duración (minutos) *</label>
              <input
                type="number"
                id="duration"
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                min={15}
                max={180}
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="maxParticipants">Cupo Máximo *</label>
              <input
                type="number"
                id="maxParticipants"
                name="maxParticipants"
                value={formData.maxParticipants}
                onChange={handleChange}
                min={1}
                max={50}
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="room">Sala *</label>
              <input
                type="text"
                id="room"
                name="room"
                value={formData.room}
                onChange={handleChange}
                placeholder="Ej: Sala 1, Studio Principal"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
            >
              {loading ? 'Guardando...' : isEdit ? 'Actualizar Clase' : ' Crear Clase'}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="btn-secondary"
              disabled={loading}
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClassForm;

