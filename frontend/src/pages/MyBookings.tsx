import { useState, useEffect, useCallback } from 'react';
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

  const getClassSchedule = (booking: Booking): Date | null => {
    if (typeof booking.classId === 'object' && booking.classId !== null && 'schedule' in booking.classId) {
      return new Date((booking.classId as { schedule: string }).schedule);
    }
    return null;
  };

  const loadBookings = useCallback(async () => {
    try {
      setLoading(true);
      setError(''); // Limpiar error previo
      
      // Obtener todas las reservas sin filtrar por estado
      const data = await bookingService.getMyBookings();
      
      // Eliminar duplicados antes de filtrar: si hay múltiples reservas para la misma clase,
      // mantener solo la más reciente (priorizando confirmadas sobre canceladas)
      const bookingsByClass = new Map<string, Booking>();
      
      data.forEach(booking => {
        // Obtener el ID de la clase de forma consistente
        let classId: string;
        if (typeof booking.classId === 'object' && booking.classId !== null) {
          const classObj = booking.classId as { _id?: string };
          classId = String(classObj._id || booking.classId);
        } else {
          classId = String(booking.classId);
        }
        
        const existing = bookingsByClass.get(classId);
        
        if (!existing) {
          bookingsByClass.set(classId, booking);
        } else {
          // Prioridad: CONFIRMED > CANCELLED > COMPLETED
          // Si la nueva reserva es confirmada y la existente es cancelada o completada, reemplazar
          if (booking.status === BookingStatus.CONFIRMED && 
              (existing.status === BookingStatus.CANCELLED || existing.status === BookingStatus.COMPLETED)) {
            bookingsByClass.set(classId, booking);
          }
          // Si la nueva es cancelada y la existente es confirmada, mantener la confirmada (no hacer nada)
          else if (booking.status === BookingStatus.CANCELLED && existing.status === BookingStatus.CONFIRMED) {
            // No hacer nada, mantener la confirmada
          }
          // Si ambas son del mismo estado, mantener la más reciente
          else if (booking.status === existing.status) {
            const bookingDate = new Date(booking.bookingDate).getTime();
            const existingDate = new Date(existing.bookingDate).getTime();
            if (bookingDate > existingDate) {
              bookingsByClass.set(classId, booking);
            }
          }
          // Si la nueva es completada y la existente es confirmada, mantener la confirmada
          else if (booking.status === BookingStatus.COMPLETED && existing.status === BookingStatus.CONFIRMED) {
            // No hacer nada, mantener la confirmada
          }
        }
      });
      
      // convertir el map a array
      let uniqueBookings = Array.from(bookingsByClass.values());
      
      // Si el filtro no es "all", filtrar por estado despues de deduplicar
      if (filter !== 'all') {
        if (filter === BookingStatus.COMPLETED) {
          // para completadas, filtrar solo las de la ultima semana
          const oneWeekAgo = new Date();
          oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
          
          uniqueBookings = uniqueBookings.filter(booking => {
            if (booking.status !== BookingStatus.COMPLETED) return false;
            const classSchedule = getClassSchedule(booking);
            if (!classSchedule) return false;
            return classSchedule >= oneWeekAgo && classSchedule <= new Date();
          });
        } else {
          uniqueBookings = uniqueBookings.filter(booking => booking.status === filter);
        }
      }
      
      // ordenar por fecha de reserva (más reciente primero)
      const sortedBookings = uniqueBookings.sort((a, b) => 
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
  }, [filter]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  const handleCancelBooking = async (id: string) => {
    try {
      await bookingService.cancelBooking(id);
      loadBookings();
    } catch (err) {
      alert(getErrorMessage(err, 'Error al cancelar la reserva'));
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
          <p>
            {filter === BookingStatus.COMPLETED 
              ? 'No tienes reservas completadas en la última semana' 
              : filter !== 'all' && getStatusLabel(filter) 
                ? `No tienes reservas ${getStatusLabel(filter)}` 
                : 'No tienes reservas'}
          </p>
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
                      onClick={() => handleCancelBooking(booking._id)}
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

