import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import bookingService from '../services/bookingService';
import classService from '../services/classService';
import { getErrorMessage, isNetworkError } from '../utils/errorHandler';
import type { Booking, Class } from '../types';
import { BookingStatus } from '../types';
import '../styles/ClassBookings.css';

// Pagina que muestra todas las reservas de una clase especifica
const ClassBookings = () => {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [classData, setClassData] = useState<Class | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<BookingStatus | 'all'>('all');

  // Cargar datos de la clase y reservas cuando cambia el filtro o el ID
  useEffect(() => {
    if (classId) {
      loadClassData();
      loadBookings();
    }
  }, [classId, filter]);

  // Cargar informacion de la clase
  const loadClassData = async () => {
    try {
      const data = await classService.getClassById(classId!);
      setClassData(data);
    } catch (err) {
      console.error('Error al cargar clase:', err);
      setError(getErrorMessage(err, 'Error al cargar la información de la clase'));
    }
  };

  // Cargar reservas de la clase con el filtro aplicado
  const loadBookings = async () => {
    try {
      setLoading(true);
      setError('');
      const status = filter !== 'all' ? filter : undefined;
      const data = await bookingService.getClassBookings(classId!, status);
      
      // Ordenar por fecha de reserva (mas reciente primero)
      const sortedBookings = data.sort((a, b) => 
        new Date(b.bookingDate).getTime() - new Date(a.bookingDate).getTime()
      );
      
      setBookings(sortedBookings);
    } catch (err) {
      console.error('Error al cargar reservas:', err);
      
      if (isNetworkError(err)) {
        setError('No se puede conectar con el servidor. Asegúrate de que el Class Service esté corriendo en el puerto 3002.');
      } else {
        setError(getErrorMessage(err, 'Error al cargar las reservas. Por favor, intenta de nuevo.'));
        setBookings([]);
      }
    } finally {
      setLoading(false);
    }
  };

  // Formatear fecha para mostrar en la interfaz
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

  // Obtener etiqueta en español para el estado de la reserva
  const getStatusLabel = (status: BookingStatus | 'all'): string => {
    switch (status) {
      case BookingStatus.CONFIRMED:
        return 'confirmado';
      case BookingStatus.CANCELLED:
        return 'cancelado';
      case BookingStatus.COMPLETED:
        return 'completado';
      default:
        return '';
    }
  };

  if (loading) {
    return <div className="class-bookings-container"><p className="loading">Cargando reservas...</p></div>;
  }

  return (
    <div className="class-bookings-container">
      <div className="class-bookings-header">
        <button onClick={() => navigate(-1)} className="btn-back">
          ← Volver
        </button>
        <h1>Reservas de la Clase</h1>
      </div>

      {classData && (
        <div className="class-info-card">
          <h2>{classData.name.replace(/\s*\[CANCELADA\]/gi, '').replace(/\s*\[COMPLETADA\]/gi, '')}</h2>
          <div className="class-info-details">
            <p><strong>Fecha:</strong> {formatDate(classData.schedule)}</p>
            <p><strong>Sala:</strong> {classData.room}</p>
            <p><strong>Duración:</strong> {classData.duration} minutos</p>
            <p><strong>Participantes:</strong> {classData.currentParticipants}/{classData.maxParticipants}</p>
          </div>
        </div>
      )}

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
          <p>No hay reservas para esta clase{filter !== 'all' ? ` con estado ${getStatusLabel(filter)}` : ''}.</p>
          <button onClick={() => navigate('/classes')} className="btn-primary">
            Ver Todas las Clases
          </button>
        </div>
      ) : (
        <div className="bookings-table-container">
          <table className="bookings-table">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Email</th>
                <th>Fecha de Reserva</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => (
                <tr key={booking._id}>
                  <td>{booking.userName}</td>
                  <td>{booking.userEmail || '-'}</td>
                  <td>{formatDate(booking.bookingDate)}</td>
                  <td>
                    <span className={`booking-status-badge ${booking.status}`}>
                      {booking.status === 'confirmed' ? 'Confirmada' :
                       booking.status === 'cancelled' ? 'Cancelada' : 'Completada'}
                    </span>
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

export default ClassBookings;

