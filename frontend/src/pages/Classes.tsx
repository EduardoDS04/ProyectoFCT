import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import classService from '../services/classService';
import bookingService from '../services/bookingService';
import paymentService from '../services/paymentService';
import { getErrorMessage, isNetworkError } from '../utils/errorHandler';
import type { Class } from '../types';
import { ClassStatus } from '../types';
import '../styles/Classes.css';

// Pagina que muestra todas las clases disponibles con opciones de filtrado y reserva
const Classes = () => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [myBookings, setMyBookings] = useState<string[]>([]); // IDs de clases ya reservadas
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<ClassStatus | 'all' | 'today'>('all');
  const [bookingClass, setBookingClass] = useState<string | null>(null);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Cargar clases y reservas cuando cambia el filtro
  useEffect(() => {
    loadClasses();
    loadMyBookings();
    if (user?.role === 'socio') {
      checkSubscription();
    }
  }, [filter, user?.role]);

  // Verificar suscripción activa
  const checkSubscription = async () => {
    try {
      const hasActive = await paymentService.checkActiveSubscription();
      setHasActiveSubscription(hasActive);
    } catch (error) {
      console.warn('Error al verificar suscripción:', error);
      setHasActiveSubscription(false);
    }
  };

  // Cargar clases segun el filtro seleccionado
  const loadClasses = async () => {
    try {
      setLoading(true);
      setError('');
      
      let data: Class[] = [];
      
      if (filter === 'today') {
        // Obtener clases del día actual
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        data = await classService.getAllClasses({
          fromDate: today.toISOString(),
          toDate: tomorrow.toISOString()
        });
      } else if (filter === 'all') {
        if (user?.role === 'socio') {
          // Para socios: todas las clases activas, canceladas de la última semana, y solo sus reservas completadas de la última semana
          const allBookings = await bookingService.getMyBookings();
          const completedBookingClassIds = allBookings
            .filter(b => b.status === 'completed')
            .map(b => typeof b.classId === 'object' ? b.classId._id : b.classId);
          
          // Obtener todas las clases activas (confirmadas/futuras)
          const activeClasses = await classService.getAllClasses({ status: 'active' });
          
          // Obtener clases canceladas y filtrar solo las de la última semana
          const allCancelledClasses = await classService.getAllClasses({ status: 'cancelled' });
          const oneWeekAgo = new Date();
          oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
          const cancelledClasses = allCancelledClasses.filter(c => {
            const classDate = new Date(c.schedule);
            return classDate >= oneWeekAgo;
          });
          
          // Obtener clases completadas y filtrar solo las que el socio ha reservado y de la última semana
          const allCompletedClasses = await classService.getAllClasses({ status: 'completed' });
          const myCompletedClasses = allCompletedClasses.filter(c => {
            const classDate = new Date(c.schedule);
            return completedBookingClassIds.includes(c._id) && classDate >= oneWeekAgo;
          });
          
          // Combinar y eliminar duplicados
          const allClassesMap = new Map<string, Class>();
          [...activeClasses, ...cancelledClasses, ...myCompletedClasses].forEach(c => {
            allClassesMap.set(c._id, c);
          });
          
          data = Array.from(allClassesMap.values());
        } else {
          // Para admin/monitor: todas las clases (canceladas, completadas, activas)
          const cancelledClasses = await classService.getAllClasses({ status: 'cancelled' });
          const completedClasses = await classService.getAllClasses({ status: 'completed' });
          const activeClasses = await classService.getAllClasses({ status: 'active' });
          
          // Combinar y eliminar duplicados
          const allClassesMap = new Map<string, Class>();
          [...activeClasses, ...cancelledClasses, ...completedClasses].forEach(c => {
            allClassesMap.set(c._id, c);
          });
          
          data = Array.from(allClassesMap.values());
        }
      } else {
        // Filtro por estado específico
        if (user?.role === 'socio') {
          if (filter === ClassStatus.CANCELLED) {
            // Para socios: mostrar clases canceladas de la última semana
            const allCancelledClasses = await classService.getAllClasses({ status: filter });
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
            data = allCancelledClasses.filter(c => {
              const classDate = new Date(c.schedule);
              return classDate >= oneWeekAgo;
            });
          } else if (filter === ClassStatus.COMPLETED) {
            // Para socios: solo mostrar clases completadas que hayan reservado y de la última semana
            const allBookings = await bookingService.getMyBookings();
            const completedBookingClassIds = allBookings
              .filter(b => b.status === 'completed')
              .map(b => typeof b.classId === 'object' ? b.classId._id : b.classId);
            
            const allCompletedClasses = await classService.getAllClasses({ status: filter });
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
            data = allCompletedClasses.filter(c => {
              const classDate = new Date(c.schedule);
              return completedBookingClassIds.includes(c._id) && classDate >= oneWeekAgo;
            });
          } else if (filter === ClassStatus.ACTIVE) {
            // Para socios: mostrar solo clases activas (confirmadas/vigentes)
            data = await classService.getAllClasses({ status: filter });
          } else {
            // Otros estados: mostrar todas
            data = await classService.getAllClasses({ status: filter });
          }
        } else {
          // Para admin/monitor: mostrar todas las clases con ese estado
          data = await classService.getAllClasses({ status: filter });
        }
      }
      
      // Ordenar clases por fecha
      const sortedClasses = data.sort((a, b) => 
        new Date(a.schedule).getTime() - new Date(b.schedule).getTime()
      );
      
      setClasses(sortedClasses);
    } catch (err) {
      console.error('Error al cargar clases:', err);
      
      if (isNetworkError(err)) {
        setError('No se puede conectar con el servidor. Asegúrate de que el Class Service esté corriendo en el puerto 3002.');
      } else {
        setError(getErrorMessage(err, 'Error al cargar las clases. Por favor, intenta de nuevo.'));
        setClasses([]);
      }
    } finally {
      setLoading(false);
    }
  };

  // Cargar las reservas confirmadas del usuario actual
  const loadMyBookings = async () => {
    try {
      const bookings = await bookingService.getMyBookings('confirmed');
      // Extraer los IDs de las clases reservadas
      const classIds = bookings.map(booking => {
        if (typeof booking.classId === 'object' && booking.classId !== null) {

          const populatedClass = booking.classId as { _id?: string };
          return String(populatedClass._id || booking.classId);

        }
        return String(booking.classId);
      });
      setMyBookings(classIds);
    } catch (err) {
      console.error('Error al cargar mis reservas:', err);
      // No mostrar error, solo no cargar las reservas
      setMyBookings([]);
    }
  };

  // Manejar la reserva de una clase
  const handleBookClass = async (classId: string) => {
    try {
      setBookingClass(classId);
      await bookingService.createBooking({ classId });
      // Recargar clases y reservas sin mostrar alert
      await loadClasses();
      await loadMyBookings();
    } catch (err) {
      // Solo mostrar error si no es porque ya tiene reserva
      const errorMessage = getErrorMessage(err, 'Error al hacer la reserva');
      if (!errorMessage.includes('Ya tienes una reserva activa')) {
        alert(errorMessage);
      } else {
        // Recargar reservas para actualizar el estado
        await loadMyBookings();
      }
    } finally {
      setBookingClass(null);
    }
  };

  // Manejar la cancelación de una clase
  const handleCancelClass = async (id: string, name: string) => {
    if (window.confirm(`¿Seguro que quieres cancelar la clase "${name}"?\n\nSe cancelarán todas las reservas asociadas.`)) {
      try {
        await classService.cancelClass(id);
        alert('Clase cancelada exitosamente');
        loadClasses();
      } catch (err) {
        alert(getErrorMessage(err, 'Error al cancelar la clase'));
      }
    }
  };

  // Formatear fecha para mostrar en la interfaz
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Verificar si la clase esta llena
  const isClassFull = (classItem: Class) => {
    return classItem.currentParticipants >= classItem.maxParticipants;
  };

  // Verificar si la clase ya paso
  const isClassPast = (classItem: Class) => {
    return new Date(classItem.schedule) < new Date();
  };

  // Verificar si el usuario puede reservar la clase
  const canBook = (classItem: Class) => {
    // Solo los socios pueden reservar clases
    if (user?.role !== 'socio') {
      return false;
    }
    // debe tener suscripción activa
    if (!hasActiveSubscription) {
      return false;
    }
    return classItem.status !== 'cancelled' && 
           classItem.status !== 'completed' &&
           !isClassFull(classItem) && 
           !isClassPast(classItem);
  };

  // Verificar si el usuario ya tiene una reserva para esta clase
  const hasBooking = (classId: string) => {
    return myBookings.some(id => String(id) === String(classId));
  };

  // Verificar si la clase puede ser editada
  const canEdit = (classItem: Class) => {
    return classItem.status !== 'cancelled' && 
           classItem.status !== 'completed' &&
           !isClassPast(classItem);
  };

  if (loading) {
    return <div className="classes-container"><p className="loading">Cargando clases...</p></div>;
  }

  return (
    <div className="classes-container">
      <div className="classes-header">
        <div className="classes-title-container">
          <h1>Clases Disponibles</h1>
          <img src="/clases.png" alt="Clases" className="classes-image" />
        </div>
        
        {/* boton de crear clase solo visible para administradores y monitores */}
        {(user?.role === 'monitor' || user?.role === 'admin') && (
          <button 
            onClick={() => navigate('/classes/create')}
            className="btn-primary"
          >
            Crear Nueva Clase
          </button>
        )}
      </div>

      {/* Botones de filtrado para mostrar clases por estado o todas las clases */}
      <div className="classes-filters">
        <button 
          className={filter === 'all' ? 'filter-btn active' : 'filter-btn'}
          onClick={() => setFilter('all')}
        >
          Todas
        </button>
        <button 
          className={filter === ClassStatus.ACTIVE ? 'filter-btn active' : 'filter-btn'}
          onClick={() => setFilter(ClassStatus.ACTIVE)}
        >
          Confirmadas
        </button>
        <button 
          className={filter === 'today' ? 'filter-btn active' : 'filter-btn'}
          onClick={() => setFilter('today')}
        >
          Hoy
        </button>
        <button 
          className={filter === ClassStatus.CANCELLED ? 'filter-btn active' : 'filter-btn'}
          onClick={() => setFilter(ClassStatus.CANCELLED)}
        >
          Canceladas
        </button>
        <button 
          className={filter === ClassStatus.COMPLETED ? 'filter-btn active' : 'filter-btn'}
          onClick={() => setFilter(ClassStatus.COMPLETED)}
        >
          Completadas
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Mostrar advertencia a socios sin suscripcion activa para informarles que necesitan suscripción */}
      {user?.role === 'socio' && !hasActiveSubscription && (
        <div className="warning-message" style={{ 
          background: '#fff3cd', 
          color: '#856404', 
          padding: '1rem', 
          borderRadius: '8px', 
          marginBottom: '1rem',
          borderLeft: '4px solid rgb(143, 114, 26)'
        }}>
          <strong>Suscripción requerida:</strong> Necesitas una suscripción activa para reservar clases.
        </div>
      )}

      {/* Mostrar mensaje cuando no hay clases disponibles, con opción de crear para admin/monitor */}
      {classes.length === 0 ? (
        <div className="no-classes">
          <p>No hay clases disponibles</p>
          {(user?.role === 'monitor' || user?.role === 'admin') && (
            <button onClick={() => navigate('/classes/create')} className="btn-primary">
              Crear Primera Clase
            </button>
          )}
        </div>
      ) : (
        <div className="classes-grid">
          {/* Grid de tarjetas de clases con información detallada de cada una */}
          {classes.map((classItem) => (
            <div key={classItem._id} className={`class-card ${classItem.status}`}>
              <div className="class-card-header">
                {/* Limpiar etiquetas de estado del nombre de la clase para mostrar solo el nombre */}
                <h3>{classItem.name.replace(/\s*\[CANCELADA\]/gi, '').replace(/\s*\[COMPLETADA\]/gi, '')}</h3>
                {/* Mostrar badge de estado solo para clases completadas */}
                {classItem.status === 'completed' && (
                  <span className={`class-status ${classItem.status}`}>
                    Completada
                  </span>
                )}
              </div>

              <p className="class-description">{classItem.description}</p>

              {/* Detalles de la clase: monitor, fecha, duración, sala y cupos disponibles */}
              <div className="class-details">
                <div className="detail-item">
                  <span>Monitor: {classItem.monitorName}</span>
                </div>
                <div className="detail-item">
                  <span>Fecha: {formatDate(classItem.schedule)}</span>
                </div>
                <div className="detail-item">
                  <span>Duración: {classItem.duration} minutos</span>
                </div>
                <div className="detail-item">
                  <span>Sala: {classItem.room}</span>
                </div>
                <div className="detail-item">
                  <span>
                    Cupos: {classItem.currentParticipants}/{classItem.maxParticipants}
                    {isClassFull(classItem) && ' (COMPLETA)'}
                  </span>
                </div>
              </div>

              {/* Acciones disponibles según el rol del usuario: reservar para socios, editar/cancelar para admin/monitor */}
              <div className="class-actions">
                {user?.role === 'socio' ? (
                  <>
                    {/* Mostrar estado de reserva: ya reservada, disponible para reservar, o no disponible con motivo */}
                    {hasBooking(classItem._id) ? (
                      <div className="booking-reserved">
                        Reservado
                      </div>
                    ) : canBook(classItem) ? (
                      // Botón para reservar clase, deshabilitado mientras se procesa la reserva
                      <button
                        onClick={() => handleBookClass(classItem._id)}
                        disabled={bookingClass === classItem._id}
                        className="btn-book"
                      >
                        {bookingClass === classItem._id ? 'Reservando...' : 'Reservar'}
                      </button>
                    ) : (
                      // mostrar motivo por el cual no se puede reservar
                      <div className="booking-disabled">
                        {!hasActiveSubscription && 'Necesitas suscripción activa'}
                        {hasActiveSubscription && isClassFull(classItem) && 'Clase completa'}
                        {hasActiveSubscription && classItem.status === 'completed' && 'Completada'}
                        {hasActiveSubscription && classItem.status === 'cancelled' && 'Clase cancelada'}
                        {hasActiveSubscription && isClassPast(classItem) && classItem.status !== 'completed' && classItem.status !== 'cancelled' && !isClassFull(classItem) && 'Clase finalizada'}
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {/* Botones para admin y monitor */}
                    {((user?.role === 'monitor' && classItem.monitorId === user.id) ||
                      user?.role === 'admin') && (
                      <>
                        {canEdit(classItem) && (
                          <button
                            onClick={() => navigate(`/classes/edit/${classItem._id}`)}
                            className="btn-secondary"
                          >
                            Editar
                          </button>
                        )}
                        {classItem.status !== 'cancelled' && 
                         classItem.status !== 'completed' && 
                         !isClassPast(classItem) && (
                          <button
                            onClick={() => handleCancelClass(classItem._id, classItem.name)}
                            className="btn-cancel"
                          >
                            Cancelar
                          </button>
                        )}
                        <button
                          onClick={() => navigate(`/bookings/class/${classItem._id}`)}
                          className="btn-view"
                        >
                          Ver Reservas
                        </button>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Classes;
