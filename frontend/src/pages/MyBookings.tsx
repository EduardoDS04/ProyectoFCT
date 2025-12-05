import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import bookingService from '../services/bookingService';
import { getErrorMessage, isNetworkError } from '../utils/errorHandler';
import type { Booking } from '../types';
import { BookingStatus } from '../types';
import '../styles/MyBookings.css';

// Pagina donde los socios pueden ver y gestionar sus reservas de clases
const MyBookings = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<BookingStatus | 'all'>('all');
  const navigate = useNavigate();

  useEffect(() => {
    loadBookings();
  }, [filter]);

  const loadBookings = async () => {
    try {
      setLoading(true);
      setError(''); // Limpiar error previo
      const status = filter !== 'all' ? filter : undefined;
      const data = await bookingService.getMyBookings(status);
      
      // Ordenar por fecha de reserva (más reciente primero)
      const sortedBookings = data.sort((a, b) => 
        new Date(b.bookingDate).getTime() - new Date(a.bookingDate).getTime()
      );
      
      setBookings(sortedBookings);
    } catch (err) {
      console.error('Error al cargar reservas:', err);
      
      if (isNetworkError(err)) {
        setError('No se puede conectar con el servidor. Asegúrate de que el Class Service esté corriendo en el puerto 3002.');
      } else {
        setError(getErrorMessage(err, 'Error al cargar tus reservas. Por favor, intenta de nuevo.'));
        setBookings([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (id: string, className: string) => {
    if (window.confirm(`¿Seguro que quieres cancelar tu reserva para "${className}"?`)) {
      try {
        await bookingService.cancelBooking(id);
        alert('Reserva cancelada exitosamente');
        loadBookings();
      } catch (err) {
        alert(getErrorMessage(err, 'Error al cancelar la reserva'));
      }
    }
  };

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

  const getClassSchedule = (booking: Booking): Date | null => {
    if (typeof booking.classId === 'object' && booking.classId.schedule) {
      return new Date(booking.classId.schedule);
    }
    return null;
  };

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

  const canCancel = (booking: Booking): boolean => {
    if (booking.status !== 'confirmed') return false;
    
    const classSchedule = getClassSchedule(booking);
    if (!classSchedule) return false;

    // Permitir cancelar hasta 1 hora antes
    const oneHourBefore = new Date(classSchedule);
    oneHourBefore.setHours(oneHourBefore.getHours() - 1);
    
    return new Date() < oneHourBefore;
  };

  if (loading) {
    return <div className="my-bookings-container"><p className="loading">Cargando...</p></div>;
  }

  return (
    <div className="my-bookings-container">
      <div className="my-bookings-header">
        <div className="my-bookings-title-container">
          <h1>Mis Reservas</h1>
          <img src="/reserva.png" alt="Reservas" className="my-bookings-image" />
        </div>
        <button onClick={() => navigate('/classes')} className="btn-primary">
          Ver Clases Disponibles
        </button>
      </div>

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
          <p>No tienes reservas {filter !== 'all' && getStatusLabel(filter) ? `(${getStatusLabel(filter)})` : ''}</p>
          <button onClick={() => navigate('/classes')} className="btn-primary">
            Explorar Clases
          </button>
        </div>
      ) : (
        <div className="bookings-grid">
          {bookings.map((booking) => {
            const classSchedule = getClassSchedule(booking);
            const classItem = typeof booking.classId === 'object' ? booking.classId : null;

            return (
              <div key={booking._id} className={`booking-card ${booking.status}`}>
                <div className="booking-header">
                  <h3>{booking.className?.replace(/\s*\[CANCELADA\]/gi, '').replace(/\s*\[COMPLETADA\]/gi, '') || 'Clase'}</h3>
                  <span className={`booking-status ${booking.status}`}>
                    {booking.status === 'confirmed' ? 'Confirmada' :
                     booking.status === 'cancelled' ? 'Cancelada' :
                     'Completada'}
                  </span>
                </div>

                <div className="booking-details">
                  {classItem && (
                    <>
                      <div className="detail-item">
                        <span className="detail-label">Descripción:</span>
                        <span>{classItem.description}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Monitor:</span>
                        <span>{classItem.monitorName}</span>
                      </div>
                      {classSchedule && (
                        <div className="detail-item">
                          <span className="detail-label">Fecha de la clase:</span>
                          <span>{formatDate(classSchedule.toISOString())}</span>
                        </div>
                      )}
                      <div className="detail-item">
                        <span className="detail-label">Duración:</span>
                        <span>{classItem.duration} minutos</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Sala:</span>
                        <span>{classItem.room}</span>
                      </div>
                    </>
                  )}

                  <div className="detail-item">
                    <span className="detail-label">Reservada:</span>
                    <span>{formatDate(booking.bookingDate)}</span>
                  </div>
                </div>

                {canCancel(booking) && (
                  <div className="booking-actions">
                    <button
                      onClick={() => handleCancelBooking(booking._id, booking.className)}
                      className="btn-cancel"
                    >
                      Cancelar Reserva
                    </button>
                  </div>
                )}

                {booking.status === 'confirmed' && !canCancel(booking) && classSchedule && (
                  <div className="booking-info">
                    No se puede cancelar (menos de 1 hora para la clase)
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyBookings;

