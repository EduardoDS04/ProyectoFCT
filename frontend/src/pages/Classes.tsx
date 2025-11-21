import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import classService from '../services/classService';
import bookingService from '../services/bookingService';
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
  const { user } = useAuth();
  const navigate = useNavigate();

  // Cargar clases y reservas cuando cambia el filtro
  useEffect(() => {
    loadClasses();
    loadMyBookings();
  }, [filter]);

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
          // Para socios: todas las canceladas, solo sus reservas completadas y clases del día actual
          const allBookings = await bookingService.getMyBookings();
          const completedBookingClassIds = allBookings
            .filter(b => b.status === 'completed')
            .map(b => typeof b.classId === 'object' ? b.classId._id : b.classId);
          
          // Obtener clases del dia actual (incluye futuras del dia)
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);
          
          const todayClasses = await classService.getAllClasses({
            fromDate: today.toISOString(),
            toDate: tomorrow.toISOString()
          });
          
          // Obtener todas las clases canceladas 
          const cancelledClasses = await classService.getAllClasses({ status: 'cancelled' });
          
          // Obtener clases completadas y filtrar solo las que el socio ha reservado
          const completedClasses = await classService.getAllClasses({ status: 'completed' });
          const myCompletedClasses = completedClasses.filter(c => completedBookingClassIds.includes(c._id));
          
          // Combinar y eliminar duplicados
          const allClassesMap = new Map<string, Class>();
          [...todayClasses, ...cancelledClasses, ...myCompletedClasses].forEach(c => {
            allClassesMap.set(c._id, c);
          });
          
          data = Array.from(allClassesMap.values());
        } else {
          // Para admin/monitor: canceladas, completadas y del día actual
          const cancelledClasses = await classService.getAllClasses({ status: 'cancelled' });
          const completedClasses = await classService.getAllClasses({ status: 'completed' });
          
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);
          
          const todayClasses = await classService.getAllClasses({
            fromDate: today.toISOString(),
            toDate: tomorrow.toISOString()
          });
          
          // Combinar y eliminar duplicados
          const allClassesMap = new Map<string, Class>();
          [...todayClasses, ...cancelledClasses, ...completedClasses].forEach(c => {
            allClassesMap.set(c._id, c);
          });
          
          data = Array.from(allClassesMap.values());
        }
      } else {
        // Filtro por estado específico
        if (user?.role === 'socio') {
          if (filter === ClassStatus.CANCELLED) {
            // Para socios: mostrar TODAS las clases canceladas (aunque no las hayan reservado)
            data = await classService.getAllClasses({ status: filter });
          } else if (filter === ClassStatus.COMPLETED) {
            // Para socios: solo mostrar clases completadas que hayan reservado
            const allBookings = await bookingService.getMyBookings();
            const completedBookingClassIds = allBookings
              .filter(b => b.status === 'completed')
              .map(b => typeof b.classId === 'object' ? b.classId._id : b.classId);
            
            const allCompletedClasses = await classService.getAllClasses({ status: filter });
            data = allCompletedClasses.filter(c => completedBookingClassIds.includes(c._id));
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
        <h1>Clases Disponibles</h1>
        
        {(user?.role === 'monitor' || user?.role === 'admin') && (
          <button 
            onClick={() => navigate('/classes/create')}
            className="btn-primary"
          >
            Crear Nueva Clase
          </button>
        )}
      </div>

      <div className="classes-filters">
        <button 
          className={filter === 'all' ? 'filter-btn active' : 'filter-btn'}
          onClick={() => setFilter('all')}
        >
          Todas
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
          {classes.map((classItem) => (
            <div key={classItem._id} className={`class-card ${classItem.status}`}>
              <div className="class-card-header">
                <h3>{classItem.name.replace(/\s*\[CANCELADA\]/gi, '').replace(/\s*\[COMPLETADA\]/gi, '')}</h3>
                {(classItem.status === 'cancelled' || classItem.status === 'completed') && (
                  <span className={`class-status ${classItem.status}`}>
                    {classItem.status === 'cancelled' ? 'Cancelada' : 'Completada'}
                  </span>
                )}
              </div>

              <p className="class-description">{classItem.description}</p>

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

              <div className="class-actions">
                {hasBooking(classItem._id) ? (
                  <div className="booking-reserved">
                    Reservado
                  </div>
                ) : canBook(classItem) ? (
                  <button
                    onClick={() => handleBookClass(classItem._id)}
                    disabled={bookingClass === classItem._id}
                    className="btn-book"
                  >
                    {bookingClass === classItem._id ? 'Reservando...' : 'Reservar'}
                  </button>
                ) : (
                  <div className="booking-disabled">
                    {isClassFull(classItem) && 'Clase completa'}
                    {classItem.status === 'completed' && 'Completada'}
                    {classItem.status === 'cancelled' && 'Clase cancelada'}
                    {isClassPast(classItem) && classItem.status !== 'completed' && classItem.status !== 'cancelled' && !isClassFull(classItem) && 'Clase finalizada'}
                  </div>
                )}

                {((user?.role === 'monitor' && classItem.monitorId === user.id) ||
                 user?.role === 'admin') && canEdit(classItem) ? (
                  <button
                    onClick={() => navigate(`/classes/edit/${classItem._id}`)}
                    className="btn-secondary"
                  >
                    Editar
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Classes;
