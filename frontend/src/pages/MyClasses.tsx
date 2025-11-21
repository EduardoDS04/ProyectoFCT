import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import classService from '../services/classService';
import { getErrorMessage, isNetworkError } from '../utils/errorHandler';
import type { Class } from '../types';
import '../styles/MyClasses.css';

// Pagina donde monitores y administradores pueden gestionar las clases que han creado
const MyClasses = () => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Cargar clases al montar el componente
  useEffect(() => {
    loadMyClasses();
  }, []);

  // Cargar las clases creadas por el usuario actual
  const loadMyClasses = async () => {
    try {
      setLoading(true);
      setError(''); // Limpiar error previo
      const data = await classService.getMyClasses();
      const sortedClasses = data.sort((a, b) => 
        new Date(b.schedule).getTime() - new Date(a.schedule).getTime()
      );
      setClasses(sortedClasses);
    } catch (err) {
      console.error('Error al cargar clases:', err);
      
      if (isNetworkError(err)) {
        setError('No se puede conectar con el servidor. Asegúrate de que el Class Service esté corriendo en el puerto 3002.');
      } else {
        setError(getErrorMessage(err, 'Error al cargar tus clases. Por favor, intenta de nuevo.'));
        setClasses([]);
      }
    } finally {
      setLoading(false);
    }
  };

  // Manejar la cancelacion de una clase
  const handleCancelClass = async (id: string, name: string) => {
    if (window.confirm(`¿Seguro que quieres cancelar la clase "${name}"?\n\nSe cancelarán todas las reservas asociadas.`)) {
      try {
        await classService.cancelClass(id);
        alert('Clase cancelada exitosamente');
        loadMyClasses();
      } catch (err) {
        alert(getErrorMessage(err, 'Error al cancelar la clase'));
      }
    }
  };

  // Manejar la eliminacion permanente de una clase
  const handleDeleteClass = async (id: string, name: string) => {
    if (window.confirm(`¿Seguro que quieres ELIMINAR permanentemente la clase "${name}"?\n\nEsta acción no se puede deshacer.`)) {
      try {
        await classService.deleteClass(id);
        alert('Clase eliminada exitosamente');
        loadMyClasses();
      } catch (err) {
        alert(getErrorMessage(err, 'Error al eliminar la clase'));
      }
    }
  };

  // Formatear fecha para mostrar en la tabla
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Verificar si una fecha ya paso
  const isPast = (dateString: string) => {
    return new Date(dateString) < new Date();
  };

  if (loading) {
    return <div className="my-classes-container"><p className="loading">Cargando...</p></div>;
  }

  return (
    <div className="my-classes-container">
      <div className="my-classes-header">
        <h1>Mis Clases</h1>
        <button onClick={() => navigate('/classes/create')} className="btn-primary">
          Crear Nueva Clase
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {classes.length === 0 ? (
        <div className="no-classes">
          <p>No tienes clases creadas aún</p>
          <button onClick={() => navigate('/classes/create')} className="btn-primary">
            Crear Mi Primera Clase
          </button>
        </div>
      ) : (
        <div className="classes-table-container">
          <table className="classes-table">
            <thead>
              <tr>
                <th>Clase</th>
                <th>Fecha y Hora</th>
                <th>Duración</th>
                <th>Sala</th>
                <th>Participantes</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {classes.map((classItem) => (
                <tr key={classItem._id} className={isPast(classItem.schedule) ? 'past-class' : ''}>
                  <td>
                    <div className="class-name-cell">
                      <strong>{classItem.name.replace(/\s*\[CANCELADA\]/gi, '').replace(/\s*\[COMPLETADA\]/gi, '')}</strong>
                      <small>{classItem.description.substring(0, 50)}...</small>
                    </div>
                  </td>
                  <td>{formatDate(classItem.schedule)}</td>
                  <td>{classItem.duration} min</td>
                  <td>{classItem.room}</td>
                  <td>
                    <span className={classItem.currentParticipants >= classItem.maxParticipants ? 'full' : ''}>
                      {classItem.currentParticipants}/{classItem.maxParticipants}
                    </span>
                  </td>
                  <td>
                    {(classItem.status === 'cancelled' || classItem.status === 'completed') && (
                      <span className={`status-badge ${classItem.status}`}>
                        {classItem.status === 'cancelled' ? 'Cancelada' : 'Completada'}
                      </span>
                    )}
                  </td>
                  <td className="actions-cell">
                    {classItem.status !== 'cancelled' && 
                     classItem.status !== 'completed' && 
                     !isPast(classItem.schedule) && (
                      <>
                        <button
                          onClick={() => navigate(`/classes/edit/${classItem._id}`)}
                          className="btn-action edit"
                          title="Editar"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleCancelClass(classItem._id, classItem.name)}
                          className="btn-action cancel"
                          title="Cancelar"
                        >
                          Cancelar
                        </button>
                      </>
                    )}
                    {classItem.status === 'cancelled' && classItem.currentParticipants === 0 && (
                      <button
                        onClick={() => handleDeleteClass(classItem._id, classItem.name)}
                        className="btn-action delete"
                        title="Eliminar"
                      >
                        Eliminar
                      </button>
                    )}
                    <button
                      onClick={() => navigate(`/bookings/class/${classItem._id}`)}
                      className="btn-action view"
                      title="Ver Reservas"
                    >
                      Ver Reservas
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default MyClasses;

