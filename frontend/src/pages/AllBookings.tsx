import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import bookingService from '../services/bookingService';
import { getErrorMessage, isNetworkError } from '../utils/errorHandler';
import type { Booking } from '../types';
import { BookingStatus } from '../types';
import '../styles/AllBookings.css';

// Pagina donde el admin puede ver todas las reservas del sistema
const AllBookings = () => {
  // Estado para almacenar todas las reservas cargadas desde la API
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // Filtro para mostrar todas las reservas o solo las de un estado específico
  const [filter, setFilter] = useState<BookingStatus | 'all'>('all');
  const navigate = useNavigate();

  // useCallback para memorizar la función y evitar recrearla en cada render
  // se ejecuta cuando cambia el filtro para recargar las reservas filtradas
  const loadBookings = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      // Convertir 'all' a undefined para que la API devuelva todas las reservas
      const status = filter !== 'all' ? filter : undefined;
      const data = await bookingService.getAllBookings(status);
      
      // Ordenar por fecha de reserva (más reciente primero)
      const sortedBookings = data.sort((a, b) => 
        new Date(b.bookingDate).getTime() - new Date(a.bookingDate).getTime()
      );
      
      setBookings(sortedBookings);
    } catch (err) {
      console.error('Error al cargar reservas:', err);
      
      // Manejo específico para errores de red con mensaje informativo
      if (isNetworkError(err)) {
        setError('No se puede conectar con el servidor. Asegúrate de que el Class Service esté corriendo en el puerto 3002.');
      } else {
        setError(getErrorMessage(err, 'Error al cargar las reservas. Por favor, intenta de nuevo.'));
        setBookings([]); // Limpiar reservas en caso de error
      }
    } finally {
      setLoading(false);
    }
  }, [filter]);

  // Ejecutar loadBookings cuando cambie el filtro o la función se recree
  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  // Formatear fecha a formato legible en español con día de la semana, fecha y hora
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

  // Extraer la fecha de la clase desde el objeto classId populado, retorna null si no está disponible
  const getClassSchedule = (booking: Booking): Date | null => {
    if (typeof booking.classId === 'object' && booking.classId.schedule) {
      return new Date(booking.classId.schedule);
    }
    return null;
  };

  // Convertir el estado de la reserva a texto legible en español para mostrar en mensajes
  const getStatusLabel = (status: BookingStatus | 'all'): string => {
    switch (status) {
      case BookingStatus.CONFIRMED:
        return 'confirmadas';
      case BookingStatus.CANCELLED:
        return 'canceladas';
      case BookingStatus.COMPLETED:
        return 'completadas';
      default:
        return '';
    }
  };

  if (loading) {
    return <div className="all-bookings-container"><p className="loading">Cargando...</p></div>;
  }

  return (
    <div className="all-bookings-container">
      <div className="all-bookings-header">
        <div className="all-bookings-title-container">
          <h1>Todas las Reservas</h1>
          <img src="/reserva.png" alt="Reservas" className="all-bookings-image" />
        </div>
        <button onClick={() => navigate('/dashboard')} className="btn-primary">
          Volver al Dashboard
        </button>
      </div>

      {/* Botones de filtrado para mostrar reservas por estado o todas */}
      <div className="bookings-filters">
        <button 
          className={filter === 'all' ? 'filter-btn active' : 'filter-btn'}
          onClick={() => setFilter('all')}
        >
          Todas
        </button>
        <button 
          className={filter === BookingStatus.CONFIRMED ? 'filter-btn active' : 'filter-btn'}
          onClick={() => setFilter(BookingStatus.CONFIRMED)}
        >
          Confirmadas
        </button>
        <button 
          className={filter === BookingStatus.CANCELLED ? 'filter-btn active' : 'filter-btn'}
          onClick={() => setFilter(BookingStatus.CANCELLED)}
        >
          Canceladas
        </button>
        <button 
          className={filter === BookingStatus.COMPLETED ? 'filter-btn active' : 'filter-btn'}
          onClick={() => setFilter(BookingStatus.COMPLETED)}
        >
          Completadas
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {bookings.length === 0 ? (
        <div className="no-bookings">
          <p>No hay reservas {filter !== 'all' && getStatusLabel(filter) ? `con estado ${getStatusLabel(filter)}` : ''}</p>
        </div>
      ) : (
        <div className="bookings-table-container">
          <table className="bookings-table">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Clase</th>
                <th>Fecha de la Clase</th>
                <th>Fecha de Reserva</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => {
                const classSchedule = getClassSchedule(booking);

                return (
                  <tr key={booking._id}>
                    <td>
                      <div>
                        <strong>{booking.userName}</strong>
                        {booking.userEmail && <div className="user-email">{booking.userEmail}</div>}
                      </div>
                    </td>
                    {/* Limpiar etiquetas de estado del nombre de la clase para mostrar solo el nombre */}
                    <td>{booking.className?.replace(/\s*\[CANCELADA\]/gi, '').replace(/\s*\[COMPLETADA\]/gi, '') || 'Clase'}</td>
                    <td>{classSchedule ? formatDate(classSchedule.toISOString()) : '-'}</td>
                    <td>{formatDate(booking.bookingDate)}</td>
                    {/* Mostrar el estado de la reserva con un badge estilizado según el estado */}
                    <td>
                      <span className={`booking-status-badge ${booking.status}`}>
                        {booking.status === 'confirmed' ? 'Confirmada' :
                         booking.status === 'cancelled' ? 'Cancelada' : 'Completada'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AllBookings;

