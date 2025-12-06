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

    // Validar que el mensaje tenga al menos 10 caracteres
    if (message.trim().length < 10) {
      setError('El mensaje debe tener al menos 10 caracteres');
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
              placeholder="Escribe tu mensaje aquí (mínimo 10 caracteres)..."
              required
              minLength={10}
              maxLength={1000}
            />
            <span className="form-helper">
              {message.length}/1000 caracteres
            </span>
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="btn-primary"
              disabled={isLoading || message.trim().length < 10}
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

