import { useState, useEffect } from 'react';
import feedbackService from '../services/feedbackService';
import { getErrorMessage } from '../utils/errorHandler';
import type { Feedback } from '../types';
import { FeedbackType } from '../types';
import '../styles/AdminFeedback.css';

// Pagina donde el admin puede ver todos los feedbacks recibidos de los socios
const AdminFeedback = () => {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<FeedbackType | 'all'>('all');
  const [isExpanded, setIsExpanded] = useState(false); // Estado para controlar el desplegable (oculto por defecto)

  // Carga todos los feedbacks al montar el componente
  useEffect(() => {
    loadFeedbacks();
  }, []);

  // Funcion para cargar todos los feedbacks desde el backend
  const loadFeedbacks = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await feedbackService.getAllFeedbacks();
      setFeedbacks(data);
    } catch (err) {
      console.error('Error al cargar feedbacks:', err);
      setError(getErrorMessage(err, 'Error al cargar los feedbacks. Por favor, intenta de nuevo.'));
      setFeedbacks([]);
    } finally {
      setLoading(false);
    }
  };

  // Formatea la fecha para mostrarla de forma legible
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Fecha no disponible';
    }
  };

  // Obtiene la etiqueta del tipo de feedback
  const getTypeLabel = (type: FeedbackType): string => {
    switch (type) {
      case FeedbackType.QUEJA:
        return 'Queja';
      case FeedbackType.VALORACION:
        return 'Valoración';
      case FeedbackType.DUDA:
        return 'Duda';
      default:
        return type;
    }
  };

  // Obtiene la clase CSS segun el tipo de feedback
  const getTypeClass = (type: FeedbackType): string => {
    switch (type) {
      case FeedbackType.QUEJA:
        return 'feedback-type-queja';
      case FeedbackType.VALORACION:
        return 'feedback-type-valoracion';
      case FeedbackType.DUDA:
        return 'feedback-type-duda';
      default:
        return '';
    }
  };

  // Filtra los feedbacks segun el tipo seleccionado
  const filteredFeedbacks = filter === 'all' 
    ? feedbacks 
    : feedbacks.filter(feedback => feedback.type === filter);

  // Estadisticas de feedbacks para mostrar en el panel maestro
  const stats = {
    total: feedbacks.length,
    quejas: feedbacks.filter(f => f.type === FeedbackType.QUEJA).length,
    valoraciones: feedbacks.filter(f => f.type === FeedbackType.VALORACION).length,
    dudas: feedbacks.filter(f => f.type === FeedbackType.DUDA).length
  };

  if (loading) {
    return (
      <div className="admin-feedback-container">
        <p className="loading">Cargando feedbacks...</p>
      </div>
    );
  }

  return (
    <div className="admin-feedback-container">
      <div className="admin-feedback-header">
        <h1>Gestión de Feedback</h1>
      </div>

      <div className="master-detail-layout">
        {/* Panel Maestro (Lateral) */}
        <div className="master-panel">
          <h2 
            className="master-panel-title"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            Tipos de Feedback
            <span className={`dropdown-arrow ${isExpanded ? 'expanded' : ''}`}>
              ▼
            </span>
          </h2>
          {isExpanded && (
            <div className="master-list">
            <div
              className={`master-item ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              <div className="master-item-content">
                <span className="master-item-label">Todos</span>
                <span className="master-item-count">{stats.total}</span>
              </div>
            </div>
            <div
              className={`master-item ${filter === FeedbackType.QUEJA ? 'active' : ''}`}
              onClick={() => setFilter(FeedbackType.QUEJA)}
            >
              <div className="master-item-content">
                <span className="master-item-label">Quejas</span>
                <span className="master-item-count">{stats.quejas}</span>
              </div>
            </div>
            <div
              className={`master-item ${filter === FeedbackType.VALORACION ? 'active' : ''}`}
              onClick={() => setFilter(FeedbackType.VALORACION)}
            >
              <div className="master-item-content">
                <span className="master-item-label">Valoraciones</span>
                <span className="master-item-count">{stats.valoraciones}</span>
              </div>
            </div>
            <div
              className={`master-item ${filter === FeedbackType.DUDA ? 'active' : ''}`}
              onClick={() => setFilter(FeedbackType.DUDA)}
            >
              <div className="master-item-content">
                <span className="master-item-label">Dudas</span>
                <span className="master-item-count">{stats.dudas}</span>
              </div>
            </div>
          </div>
          )}
        </div>

        {/* Panel Detalle (Principal) */}
        <div className="detail-panel">
          <div className="detail-header">
            <h2>
              {filter === 'all' 
                ? 'Todos los Feedbacks' 
                : getTypeLabel(filter as FeedbackType)}
            </h2>
          </div>

          {error && (
            <div className="error-message">
              <p>{error}</p>
              <button onClick={loadFeedbacks} className="btn-retry">
                Reintentar
              </button>
            </div>
          )}

          {filteredFeedbacks.length === 0 ? (
            <div className="no-feedbacks">
              <p>
                No hay feedbacks {filter !== 'all' ? `de tipo "${getTypeLabel(filter as FeedbackType)}"` : ''} disponibles.
              </p>
            </div>
          ) : (
            <div className="feedbacks-list">
              {filteredFeedbacks.map((feedback) => (
                <div key={feedback._id} className="feedback-card">
                  <div className="feedback-card-header">
                    <div className="feedback-user-info">
                      <h3>{feedback.userName}</h3>
                      <span className="feedback-user-id">ID: {feedback.userId}</span>
                    </div>
                    <span className={`feedback-type-badge ${getTypeClass(feedback.type)}`}>
                      {getTypeLabel(feedback.type)}
                    </span>
                  </div>
                  <div className="feedback-message">
                    <p><strong>Mensaje:</strong> {feedback.message}</p>
                  </div>
                  <div className="feedback-footer">
                    <span className="feedback-date">
                      {formatDate(feedback.createdAt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminFeedback;

