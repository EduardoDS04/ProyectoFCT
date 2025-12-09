import { useState, useEffect, useCallback } from 'react';
import feedbackService from '../services/feedbackService';
import { getErrorMessage } from '../utils/errorHandler';
import type { Feedback } from '../types';
import { FeedbackType } from '../types';
import '../styles/Notifications.css';

interface NotificationsProps {
  onClose: () => void;
  onMarkAsRead?: () => void;
}

// Componente que muestra las notificaciones del socio
const Notifications = ({ onClose, onMarkAsRead }: NotificationsProps) => {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedFeedbacks, setExpandedFeedbacks] = useState<Set<string>>(new Set());
  const [responseText, setResponseText] = useState<Record<string, string>>({});
  const [isResponding, setIsResponding] = useState<Record<string, boolean>>({});

  // Cargar feedbacks del usuario
  const loadFeedbacks = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await feedbackService.getMyFeedbacks();
      const feedbacksWithMessages = data.filter(f => f.messages && f.messages.length > 0);
      setFeedbacks(feedbacksWithMessages);
      
      // Marcar todos los feedbacks como leidos
      for (const feedback of feedbacksWithMessages) {
        await feedbackService.markAsRead(feedback._id);
      }
      
      // Actualizar el contador en el Navbar
      if (onMarkAsRead) {
        onMarkAsRead();
      }
    } catch (err) {
      console.error('Error al cargar notificaciones:', err);
      
      const errorMessage = getErrorMessage(err, 'Error al cargar las notificaciones. Por favor, intenta de nuevo.');
      if (errorMessage.includes('administrador') || errorMessage.includes('permisos')) {
        setFeedbacks([]);
        setError('');
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  }, [onMarkAsRead]);

  // Cargar feedbacks al montar el componente
  useEffect(() => {
    loadFeedbacks();
  }, [loadFeedbacks]);

  // Formatear fecha en formato español
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

  // Obtener etiqueta del tipo de feedback
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

  // Expandir o colapsar una conversacion
  const toggleExpand = (feedbackId: string) => {
    setExpandedFeedbacks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(feedbackId)) {
        newSet.delete(feedbackId);
      } else {
        newSet.add(feedbackId);
      }
      return newSet;
    });
  };

  // Enviar respuesta a un feedback
  const handleSubmitResponse = async (e: React.FormEvent, feedbackId: string) => {
    e.preventDefault();
    const text = responseText[feedbackId];
    if (!text || !text.trim()) {
      return;
    }

    try {
      setIsResponding(prev => ({ ...prev, [feedbackId]: true }));
      setError('');
      const updatedFeedback = await feedbackService.respondToFeedback(
        feedbackId,
        text.trim()
      );
      
      // Actualizar el feedback en la lista
      setFeedbacks(prevFeedbacks =>
        prevFeedbacks.map(f =>
          f._id === updatedFeedback._id
            ? { ...f, messages: updatedFeedback.messages }
            : f
        )
      );
      
      // Limpiar el formulario
      setResponseText(prev => ({ ...prev, [feedbackId]: '' }));
    } catch (err) {
      console.error('Error al responder:', err);
      setError(getErrorMessage(err, 'Error al enviar la respuesta. Por favor, intenta de nuevo.'));
    } finally {
      setIsResponding(prev => ({ ...prev, [feedbackId]: false }));
    }
  };

  // Estado de carga
  if (loading) {
    return (
      <div className="notifications-overlay" onClick={onClose}>
        <div className="notifications-modal" onClick={(e) => e.stopPropagation()}>
          <div className="notifications-header">
            <h2>Notificaciones</h2>
            <button className="notifications-close" onClick={onClose}>×</button>
          </div>
          <div className="notifications-content">
            <p className="notifications-loading">Cargando notificaciones...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="notifications-overlay" onClick={onClose}>
      <div className="notifications-modal" onClick={(e) => e.stopPropagation()}>
        <div className="notifications-header">
          <h2>Notificaciones</h2>
          <button className="notifications-close" onClick={onClose}>×</button>
        </div>
        <div className="notifications-content">
          {/* Mensaje de error */}
          {error && (
            <div className="notifications-error">
              <p>{error}</p>
              <button onClick={loadFeedbacks} className="btn-retry">
                Reintentar
              </button>
            </div>
          )}

          {/* Lista vacia o con notificaciones */}
          {feedbacks.length === 0 ? (
            <div className="notifications-empty">
              <p>No tienes notificaciones nuevas</p>
            </div>
          ) : (
            <div className="notifications-list">
              {feedbacks.map((feedback) => {
                const isExpanded = expandedFeedbacks.has(feedback._id);
                const hasMessages = feedback.messages && feedback.messages.length > 0;
                
                return (
                  <div 
                    key={feedback._id} 
                    className="notification-item"
                  >
                    {/* Encabezado de la notificacion */}
                    <div className="notification-header">
                      <div className="notification-header-left">
                        <span className="notification-type">{getTypeLabel(feedback.type)}</span>
                        <span className="notification-date">{formatDate(feedback.createdAt)}</span>
                      </div>
                      {hasMessages && (
                        <button
                          className={`notification-expand-btn ${isExpanded ? 'expanded' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleExpand(feedback._id);
                          }}
                          aria-label={isExpanded ? 'Contraer' : 'Expandir'}
                        >
                          ▼
                        </button>
                      )}
                    </div>
                    {/* Mensaje inicial del feedback */}
                    <div className="notification-message">
                      <p><strong>Tu mensaje:</strong> {feedback.message}</p>
                    </div>
                    {/* Respuestas y formulario cuando esta expandido */}
                    {hasMessages && isExpanded && (
                      <>
                        <div className="notification-responses">
                          {feedback.messages.map((msg, index) => (
                            <div key={index} className={`notification-response ${msg.senderRole === 'admin' ? 'admin-response' : 'socio-response'}`}>
                              <div className="response-header">
                                <strong>{msg.senderName}</strong>
                                <span className="response-date">{formatDate(msg.createdAt)}</span>
                              </div>
                              <p>{msg.message}</p>
                            </div>
                          ))}
                        </div>
                        {/* Formulario de respuesta */}
                        <div className="notification-response-form-inline">
                          <form onSubmit={(e) => handleSubmitResponse(e, feedback._id)}>
                            <div className="form-group">
                              <textarea
                                value={responseText[feedback._id] || ''}
                                onChange={(e) => {
                                  setResponseText(prev => ({ ...prev, [feedback._id]: e.target.value }));
                                  setError('');
                                }}
                                placeholder="Escribe tu respuesta aquí (máximo 3000 caracteres)..."
                                rows={3}
                                required
                                maxLength={3000}
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>
                            {error && (
                              <div className="response-error">
                                <p>{error}</p>
                              </div>
                            )}
                            <div className="response-form-actions">
                              <button
                                type="submit"
                                disabled={isResponding[feedback._id] || !responseText[feedback._id] || responseText[feedback._id].trim().length === 0}
                                className="btn-submit"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {isResponding[feedback._id] ? 'Enviando...' : 'Responder'}
                              </button>
                            </div>
                          </form>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Notifications;

