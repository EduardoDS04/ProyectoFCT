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
  const [filter, setFilter] = useState<FeedbackType | 'all' | 'archived'>('all');
  const [isExpanded, setIsExpanded] = useState(false); // Estado para controlar el desplegable
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null); // Feedback seleccionado para responder
  const [showResponseModal, setShowResponseModal] = useState(false); // Estado para mostrar/ocultar el modal
  const [responseText, setResponseText] = useState(''); // Texto de la respuesta
  const [isResponding, setIsResponding] = useState(false); // Estado de carga al responder
  const [responseError, setResponseError] = useState(''); // Error al responder
  const [archivedUnreadCount, setArchivedUnreadCount] = useState(0); // Contador de archivados sin leer

  // Carga todos los feedbacks al montar el componente y cuando cambia el filtro
  useEffect(() => {
    loadFeedbacks();
  }, [filter]);

  // Recargar cuando se vuelve a esta página (para actualizar contadores)
  useEffect(() => {
    const handleFocus = () => {
      loadFeedbacks();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  // Funcion para cargar todos los feedbacks desde el backend
  const loadFeedbacks = async () => {
    try {
      setLoading(true);
      setError('');
      // Solo marcar como vistos si no estamos viendo archivados
      if (filter !== 'archived') {
        await feedbackService.markAllAsReadByAdmin();
        // Disparar evento para actualizar el contador en el Dashboard
        window.dispatchEvent(new Event('feedback-responded'));
      } else {
        // Si estamos viendo archivados, marcar como leídos
        await feedbackService.markArchivedAsRead();
        setArchivedUnreadCount(0);
      }
      const showArchived = filter === 'archived';
      const data = await feedbackService.getAllFeedbacks(showArchived);
      setFeedbacks(data);
    } catch (err) {
      console.error('Error al cargar feedbacks:', err);
      setError(getErrorMessage(err, 'Error al cargar los feedbacks. Por favor, intenta de nuevo.'));
      setFeedbacks([]);
    } finally {
      setLoading(false);
    }
  };

  // Cargar contador de archivados sin leer
  useEffect(() => {
    const loadArchivedUnreadCount = async () => {
      try {
        const count = await feedbackService.getArchivedUnreadCount();
        setArchivedUnreadCount(count);
      } catch (error) {
        console.error('Error al cargar contador de archivados:', error);
      }
    };

    // Cargar inmediatamente y luego cada 30 segundos
    loadArchivedUnreadCount();
    const interval = setInterval(loadArchivedUnreadCount, 30000);
    
    // Escuchar eventos cuando se responde a un feedback archivado
    const handleFeedbackResponded = () => {
      loadArchivedUnreadCount();
    };
    window.addEventListener('feedback-responded', handleFeedbackResponded);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('feedback-responded', handleFeedbackResponded);
    };
  }, []);

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
    : filter === 'archived'
    ? feedbacks
    : feedbacks.filter(feedback => feedback.type === filter);

  // Estadisticas de feedbacks para mostrar en el panel maestro
  const stats = {
    total: feedbacks.length,
    quejas: feedbacks.filter(f => f.type === FeedbackType.QUEJA).length,
    valoraciones: feedbacks.filter(f => f.type === FeedbackType.VALORACION).length,
    dudas: feedbacks.filter(f => f.type === FeedbackType.DUDA).length
  };

  // Maneja el envio de la respuesta
  const handleOpenResponseModal = (feedback: Feedback) => {
    setSelectedFeedback(feedback);
    setResponseText('');
    setResponseError('');
    setShowResponseModal(true);
  };

  const handleCloseResponseModal = () => {
    setShowResponseModal(false);
    setSelectedFeedback(null);
    setResponseText('');
    setResponseError('');
  };

  const handleSubmitResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFeedback || !responseText.trim()) {
      return;
    }

    try {
      setIsResponding(true);
      setResponseError('');
      const updatedFeedback = await feedbackService.respondToFeedback(
        selectedFeedback._id,
        responseText.trim()
      );
      
      // Actualizar el feedback en la lista
      setFeedbacks(prevFeedbacks =>
        prevFeedbacks.map(f =>
          f._id === updatedFeedback._id
            ? { ...f, messages: updatedFeedback.messages }
            : f
        )
      );
      
      // Cerrar el modal y limpiar
      handleCloseResponseModal();
      
      // Disparar evento para actualizar el contador en el Dashboard
      window.dispatchEvent(new Event('feedback-responded'));
    } catch (err) {
      console.error('Error al responder feedback:', err);
      setResponseError(getErrorMessage(err, 'Error al enviar la respuesta. Por favor, intenta de nuevo.'));
    } finally {
      setIsResponding(false);
    }
  };

  const handleArchiveFeedback = async (feedbackId: string, archive: boolean) => {
    try {
      const updatedFeedback = await feedbackService.archiveFeedback(feedbackId, archive);
      // Verificar que se actualizó correctamente
      if (updatedFeedback && updatedFeedback.archived === archive) {
        // Remover el feedback de la lista actual ya que cambió de estado
        setFeedbacks(prevFeedbacks => prevFeedbacks.filter(f => f._id !== feedbackId));
      } else {
        // Si algo salió mal, recargar la lista completa
        await loadFeedbacks();
      }
    } catch (err) {
      console.error('Error al archivar/desarchivar feedback:', err);
      // Recargar la lista en caso de error para asegurar consistencia
      await loadFeedbacks();
    }
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
                {filter !== 'archived' && (
                  <span className="master-item-count">{stats.total}</span>
                )}
              </div>
            </div>
            <div
              className={`master-item ${filter === FeedbackType.QUEJA ? 'active' : ''}`}
              onClick={() => setFilter(FeedbackType.QUEJA)}
            >
              <div className="master-item-content">
                <span className="master-item-label">Quejas</span>
                {filter !== 'archived' && (
                  <span className="master-item-count">{stats.quejas}</span>
                )}
              </div>
            </div>
            <div
              className={`master-item ${filter === FeedbackType.VALORACION ? 'active' : ''}`}
              onClick={() => setFilter(FeedbackType.VALORACION)}
            >
              <div className="master-item-content">
                <span className="master-item-label">Valoraciones</span>
                {filter !== 'archived' && (
                  <span className="master-item-count">{stats.valoraciones}</span>
                )}
              </div>
            </div>
            <div
              className={`master-item ${filter === FeedbackType.DUDA ? 'active' : ''}`}
              onClick={() => setFilter(FeedbackType.DUDA)}
            >
              <div className="master-item-content">
                <span className="master-item-label">Dudas</span>
                {filter !== 'archived' && (
                  <span className="master-item-count">{stats.dudas}</span>
                )}
              </div>
            </div>
            <div
              className={`master-item ${filter === 'archived' ? 'active' : ''}`}
              onClick={() => setFilter('archived')}
            >
              <div className="master-item-content">
                <span className="master-item-label">Archivados</span>
                {archivedUnreadCount > 0 && (
                  <img src="/sinLeer.png" alt="Sin leer" className="archived-unread-icon" />
                )}
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
                : filter === 'archived'
                ? 'Feedbacks Archivados'
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
            <>
              <div className="feedbacks-list">
                {filteredFeedbacks.map((feedback) => (
                  <div 
                    key={feedback._id} 
                    className={`feedback-card ${selectedFeedback?._id === feedback._id ? 'selected' : ''}`}
                    onClick={() => setSelectedFeedback(feedback)}
                  >
                    <div className="feedback-card-header">
                      <div className="feedback-user-info">
                        <h3>{feedback.userName}</h3>
                        <span className="feedback-user-id">ID: {feedback.userId}</span>
                      </div>
                      <span className={`feedback-type-badge ${getTypeClass(feedback.type)}`}>
                        {getTypeLabel(feedback.type)}
                      </span>
                      {feedback.messages && feedback.messages.length > 0 && (
                        <span className="feedback-has-messages">
                          {feedback.messages.length} mensaje{feedback.messages.length > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                    <div className="feedback-message">
                      <p><strong>Mensaje inicial:</strong> {feedback.message}</p>
                    </div>
                    {feedback.messages && feedback.messages.length > 0 && (
                      <div className="feedback-conversation">
                        <h4>Conversación:</h4>
                        {feedback.messages.map((msg, index) => (
                          <div key={index} className={`conversation-message ${msg.senderRole === 'admin' ? 'admin-message' : 'socio-message'}`}>
                            <div className="message-header">
                              <strong>{msg.senderName}</strong>
                              <span className="message-role">{msg.senderRole === 'admin' ? 'Admin' : 'Socio'}</span>
                              <span className="message-date">{formatDate(msg.createdAt)}</span>
                            </div>
                            <p>{msg.message}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="feedback-footer">
                      <span className="feedback-date">
                        {formatDate(feedback.createdAt)}
                      </span>
                      <div className="feedback-footer-actions">
                        {filter !== 'archived' && (
                          <button
                            className="btn-respond-feedback"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenResponseModal(feedback);
                            }}
                          >
                            Responder
                          </button>
                        )}
                        <button
                          className="btn-archive-feedback"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleArchiveFeedback(feedback._id, filter !== 'archived');
                          }}
                          title={filter === 'archived' ? 'Desarchivar conversación' : 'Archivar conversación'}
                        >
                          <img src="/archivar.png" alt={filter === 'archived' ? 'Desarchivar' : 'Archivar'} className="archive-icon" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Modal de respuesta */}
              {showResponseModal && selectedFeedback && (
                <div className="response-modal-overlay" onClick={handleCloseResponseModal}>
                  <div className="response-modal" onClick={(e) => e.stopPropagation()}>
                    <div className="response-modal-header">
                      <h3>Responder a {selectedFeedback.userName}</h3>
                      <button className="response-modal-close" onClick={handleCloseResponseModal}>×</button>
                    </div>
                    <form onSubmit={handleSubmitResponse} className="response-form">
                      <div className="form-group">
                        <label htmlFor="response">Tu respuesta:</label>
                        <textarea
                          id="response"
                          value={responseText}
                          onChange={(e) => {
                            setResponseText(e.target.value);
                            setResponseError('');
                          }}
                          placeholder="Escribe tu respuesta aquí..."
                          rows={5}
                          required
                        />
                      </div>
                      {responseError && (
                        <div className="response-error">
                          <p>{responseError}</p>
                        </div>
                      )}
                      <div className="response-form-actions">
                        <button
                          type="button"
                          onClick={handleCloseResponseModal}
                          className="btn-cancel"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          disabled={isResponding || !responseText.trim()}
                          className="btn-submit"
                        >
                          {isResponding ? 'Enviando...' : 'Enviar Respuesta'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminFeedback;

