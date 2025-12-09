import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import feedbackService from '../services/feedbackService';
import { getErrorMessage } from '../utils/errorHandler';
import { FeedbackType } from '../types';
import '../styles/Feedback.css';

// Pagina para que los socios envien feedback (quejas, valoraciones o dudas)
const Feedback = () => {
  const [message, setMessage] = useState('');
  const [type, setType] = useState<FeedbackType>(FeedbackType.DUDA);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const navigate = useNavigate();

  // Maneja el envio del formulario de feedback
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    // Validar que el mensaje no esté vacío
    if (message.trim().length === 0) {
      setError('El mensaje no puede estar vacío');
      return;
    }

    // Validar máximo de caracteres (3000)
    if (message.trim().length > 3000) {
      setError('El mensaje no puede exceder 3000 caracteres');
      return;
    }

    try {
      setIsLoading(true);
      await feedbackService.createFeedback({
        message: message.trim(),
        type
      });
      setSuccess(true);
      setMessage('');
      
      // Redirigir al dashboard despues de 2 segundos
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (err) {
      setError(getErrorMessage(err, 'Error al enviar el feedback. Por favor, intenta de nuevo.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="feedback-container">
      <div className="feedback-card">
        <h1>Enviar Feedback</h1>
        <p className="feedback-subtitle">
          Comparte tu opinión, queja o duda con nosotros. Tu feedback nos ayuda a mejorar.
        </p>

        {success && (
          <div className="feedback-success">
            <p>¡Feedback enviado exitosamente! Redirigiendo al menú principal...</p>
          </div>
        )}

        {error && (
          <div className="feedback-error">
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="feedback-form">
          <div className="form-group">
            <label htmlFor="type">Tipo de feedback</label>
            <select
              id="type"
              value={type}
              onChange={(e) => setType(e.target.value as FeedbackType)}
              className="form-select"
              required
            >
              <option value={FeedbackType.DUDA}>Duda</option>
              <option value={FeedbackType.VALORACION}>Valoración</option>
              <option value={FeedbackType.QUEJA}>Queja</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="message">Mensaje</label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="form-textarea"
              rows={6}
              placeholder="Escribe tu mensaje aquí (máximo 3000 caracteres)..."
              required
              maxLength={3000}
            />
            <span className="form-helper">
              {message.length}/3000 caracteres
            </span>
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="btn-primary"
              disabled={isLoading || message.trim().length === 0}
            >
              {isLoading ? 'Enviando...' : 'Enviar Feedback'}
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => navigate('/dashboard')}
              disabled={isLoading}
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Feedback;

