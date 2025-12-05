import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import paymentService from '../services/paymentService';
import { getErrorMessage } from '../utils/errorHandler';
import { SubscriptionType, SubscriptionStatus } from '../types';
import type { Subscription } from '../types';
import '../styles/Payment.css';

// Componente para gestionar suscripciones y pagos del gimnasio
const Payment = () => {
  const [subscriptionType, setSubscriptionType] = useState<SubscriptionType>(SubscriptionType.MONTHLY);
  const [bankDetails, setBankDetails] = useState({
    cardNumber: '',
    cardHolder: '',
    expiryDate: '',
    cvv: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [activeSubscription, setActiveSubscription] = useState<Subscription | null>(null);
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(true);
  const [showCancelModal, setShowCancelModal] = useState(false);
  
  const navigate = useNavigate();

  // Carga las suscripciones del usuario al montar el componente
  useEffect(() => {
    const loadSubscriptions = async () => {
      try {
        setIsLoadingSubscription(true);
        const subscriptions = await paymentService.getMySubscriptions();
        const active = subscriptions.find(
          sub => sub.status === SubscriptionStatus.ACTIVE
        ) || null;
        setActiveSubscription(active);
      } catch (err) {
        console.warn('Error al cargar suscripciones:', err);
        setActiveSubscription(null);
      } finally {
        setIsLoadingSubscription(false);
      }
    };

    loadSubscriptions();
  }, []);

  // Maneja los cambios en los campos de datos bancarios con validacion y formato
  const handleBankDetailsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (error) {
      setError('');
    }
    
    if (name === 'cardNumber') {
      const cleaned = value.replace(/\s/g, '').replace(/\D/g, '');
      const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
      setBankDetails({ ...bankDetails, [name]: formatted });
      return;
    }
    
    if (name === 'expiryDate') {
      const cleaned = value.replace(/\D/g, '');
      let formatted = cleaned;
      if (cleaned.length >= 2) {
        formatted = cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4);
      }
      setBankDetails({ ...bankDetails, [name]: formatted });
      return;
    }
    
    if (name === 'cvv') {
      const cleaned = value.replace(/\D/g, '');
      setBankDetails({ ...bankDetails, [name]: cleaned });
      return;
    }
    
    setBankDetails({ ...bankDetails, [name]: value });
  };

  // Procesa el formulario de suscripcion con validaciones completas
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    const cardNumber = bankDetails.cardNumber.replace(/\s/g, '');
    if (cardNumber.length !== 16) {
      setError('El número de tarjeta debe tener 16 dígitos');
      return;
    }

    if (!/^\d{2}\/\d{2}$/.test(bankDetails.expiryDate)) {
      setError('La fecha de expiración debe tener el formato MM/YY');
      return;
    }

    const [month, year] = bankDetails.expiryDate.split('/').map(Number);
    
    if (month < 1 || month > 12) {
      setError('El mes debe estar entre 01 y 12');
      return;
    }
    
    const currentDate = new Date();
    const fullYear = year < 50 ? 2000 + year : 1900 + year;
    const expiryDate = new Date(fullYear, month - 1);
    const today = new Date(currentDate.getFullYear(), currentDate.getMonth());

    if (expiryDate < today) {
      setError('La tarjeta está caducada. Por favor, usa una tarjeta válida.');
      return;
    }

    if (!/^\d{3,4}$/.test(bankDetails.cvv)) {
      setError('El CVV debe tener 3 o 4 dígitos');
      return;
    }

    if (bankDetails.cardHolder.trim().length < 3) {
      setError('El nombre del titular debe tener al menos 3 caracteres');
      return;
    }

    setIsLoading(true);

    try {
      const newSubscription = await paymentService.createSubscription({
        subscriptionType,
        bankDetails: {
          ...bankDetails,
          cardNumber: cardNumber
        }
      });
      
      setActiveSubscription(newSubscription);
      setSuccess(true);
      setTimeout(async () => {
        setSuccess(false);
        const subscriptions = await paymentService.getMySubscriptions();
        const active = subscriptions.find(
          sub => sub.status === SubscriptionStatus.ACTIVE
        );
        setActiveSubscription(active || null);
      }, 2000);
    } catch (err) {
      setError(getErrorMessage(err, 'Error al procesar el pago'));
    } finally {
      setIsLoading(false);
    }
  };

  // Obtiene el precio segun el tipo de suscripcion seleccionado
  const getPrice = (type: SubscriptionType): number => {
    switch (type) {
      case SubscriptionType.MONTHLY:
        return 29.99;
      case SubscriptionType.QUARTERLY:
        return 79.99;
      case SubscriptionType.YEARLY:
        return 299.99;
      default:
        return 0;
    }
  };

  // Calcula el ahorro al elegir planes trimestrales o anuales
  const getSavings = (type: SubscriptionType): number => {
    const monthlyPrice = 29.99;
    switch (type) {
      case SubscriptionType.QUARTERLY:
        return (monthlyPrice * 3) - 79.99;
      case SubscriptionType.YEARLY:
        return (monthlyPrice * 12) - 299.99;
      default:
        return 0;
    }
  };

  // Formatea las fechas a formato legible 
  const formatDate = (dateString: string): string => {
    try {
      if (!dateString) {
        return 'No disponible';
      }
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Fecha inválida';
      }
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.warn('Error al formatear fecha:', error);
      return 'No disponible';
    }
  };

  const getPlanName = (type: SubscriptionType): string => {
    switch (type) {
      case SubscriptionType.MONTHLY:
        return '1 Mes';
      case SubscriptionType.QUARTERLY:
        return '3 Meses';
      case SubscriptionType.YEARLY:
        return '1 Año';
      default:
        return '';
    }
  };

  // Muestra el modal de confirmacion para cancelar la suscripcion
  const handleCancelClick = () => {
    setShowCancelModal(true);
  };

  // Confirma y ejecuta la cancelacion de la suscripcion activa
  const handleCancelConfirm = async () => {
    if (!activeSubscription) return;

    setShowCancelModal(false);
    setIsLoading(true);
    setError('');

    try {
      await paymentService.cancelSubscription(activeSubscription._id);
      setActiveSubscription(null);
      const subscriptions = await paymentService.getMySubscriptions();
      const active = subscriptions.find(
        sub => sub.status === SubscriptionStatus.ACTIVE
      );
      setActiveSubscription(active || null);
    } catch (err) {
      setError(getErrorMessage(err, 'Error al cancelar la suscripción'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelCancel = () => {
    setShowCancelModal(false);
  };

  // Muestra mensaje de exito cuando el pago se procesa correctamente
  if (success) {
    return (
      <div className="payment-container">
        <div className="payment-card">
          <div className="payment-success">
            <h2>¡Pago realizado exitosamente!</h2>
            <p>Tu suscripción ha sido activada. Redirigiendo al dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (isLoadingSubscription) {
    return (
      <div className="payment-container">
        <div className="payment-card">
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <p>Cargando información de suscripción...</p>
          </div>
        </div>
      </div>
    );
  }

  if (activeSubscription) {
    return (
      <>
        <div className="payment-container">
          <div className="payment-card">
            <h1 className="payment-title">Mi Suscripción</h1>
            <p className="payment-subtitle">Información de tu suscripción activa</p>
            
            {error && <div className="payment-error">{error}</div>}
            
            <div className="subscription-info">
              <div className="subscription-info-card">
                <h2>Plan Actual</h2>
                <div className="info-row">
                  <span className="info-label">Plan:</span>
                  <span className="info-value">{getPlanName(activeSubscription.subscriptionType)}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Precio pagado:</span>
                  <span className="info-value">€{(activeSubscription.amount || 0).toFixed(2)}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Fecha de inicio y pago:</span>
                  <span className="info-value">
                    {activeSubscription.startDate 
                      ? formatDate(activeSubscription.startDate) 
                      : 'No disponible'}
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-label">Fecha de expiración:</span>
                  <span className="info-value">
                    {activeSubscription.endDate 
                      ? formatDate(activeSubscription.endDate) 
                      : 'No disponible'}
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-label">Estado:</span>
                  <span className={`status-badge status-${activeSubscription.status}`}>
                    {activeSubscription.status === SubscriptionStatus.ACTIVE ? 'Activa' : 
                     activeSubscription.status === SubscriptionStatus.CANCELLED ? 'Cancelada' :
                     activeSubscription.status === SubscriptionStatus.EXPIRED ? 'Expirada' : 'Pendiente'}
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-label">Tarjeta:</span>
                  <span className="info-value">
                    {activeSubscription.bankDetails?.cardNumber || 'No disponible'}
                  </span>
                </div>
              </div>

              <div className="subscription-actions">
                <button
                  type="button"
                  className="payment-button-secondary"
                  onClick={() => navigate('/dashboard')}
                >
                  Volver al Menú Principal
                </button>
                <button
                  type="button"
                  className="payment-button-cancel"
                  onClick={handleCancelClick}
                  disabled={isLoading || activeSubscription.status !== SubscriptionStatus.ACTIVE}
                >
                  {isLoading ? 'Cancelando...' : 'Cancelar Suscripción'}
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {showCancelModal && (
          <>
            <div className="modal-overlay" onClick={handleCancelCancel}></div>
            <div className="modal-container">
              <div className="modal-content">
                <h2 className="modal-title">Cancelar Suscripción</h2>
                <p className="modal-message">
                  ¿Estás seguro de que quieres cancelar tu suscripción?
                </p>
                <div className="modal-actions">
                  <button
                    type="button"
                    className="modal-button modal-button-cancel"
                    onClick={handleCancelCancel}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className="modal-button modal-button-confirm"
                    onClick={handleCancelConfirm}
                  >
                    Aceptar
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </>
    );
  }

  return (
    <div className="payment-container">
      <div className="payment-card">
        <h1 className="payment-title">Suscripción al Gimnasio</h1>
        <p className="payment-subtitle">Elige tu plan de suscripción</p>
        
        <div className="payment-image-container">
          <img src="/money.png" alt="Pago" className="payment-image" />
        </div>
        
        {error && <div className="payment-error">{error}</div>}
        
        <form onSubmit={handleSubmit} className="payment-form">
          <div className="subscription-options">
            <div 
              className={`subscription-option ${subscriptionType === SubscriptionType.MONTHLY ? 'active' : ''}`}
              onClick={() => setSubscriptionType(SubscriptionType.MONTHLY)}
            >
              <h3>1 Mes</h3>
              <div className="subscription-price">€{getPrice(SubscriptionType.MONTHLY).toFixed(2)}</div>
              <p>Acceso mensual</p>
            </div>
            
            <div 
              className={`subscription-option ${subscriptionType === SubscriptionType.QUARTERLY ? 'active' : ''}`}
              onClick={() => setSubscriptionType(SubscriptionType.QUARTERLY)}
            >
              <h3>3 Meses</h3>
              <div className="subscription-price">€{getPrice(SubscriptionType.QUARTERLY).toFixed(2)}</div>
              {getSavings(SubscriptionType.QUARTERLY) > 0 && (
                <div className="subscription-savings">Ahorra €{getSavings(SubscriptionType.QUARTERLY).toFixed(2)}</div>
              )}
              <p>Acceso trimestral</p>
            </div>
            
            <div 
              className={`subscription-option ${subscriptionType === SubscriptionType.YEARLY ? 'active' : ''}`}
              onClick={() => setSubscriptionType(SubscriptionType.YEARLY)}
            >
              <h3>1 Año</h3>
              <div className="subscription-price">€{getPrice(SubscriptionType.YEARLY).toFixed(2)}</div>
              {getSavings(SubscriptionType.YEARLY) > 0 && (
                <div className="subscription-savings">Ahorra €{getSavings(SubscriptionType.YEARLY).toFixed(2)}</div>
              )}
              <p>Acceso anual</p>
            </div>
          </div>

          <div className="payment-section">
            <h2>Datos de Pago</h2>
            
            <div className="form-group">
              <label htmlFor="cardNumber">Número de Tarjeta *</label>
              <input
                type="text"
                id="cardNumber"
                name="cardNumber"
                value={bankDetails.cardNumber}
                onChange={handleBankDetailsChange}
                maxLength={19}
                required
                disabled={isLoading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="cardHolder">Titular de la Tarjeta *</label>
              <input
                type="text"
                id="cardHolder"
                name="cardHolder"
                value={bankDetails.cardHolder}
                onChange={handleBankDetailsChange}
                required
                disabled={isLoading}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="expiryDate">Fecha de Expiración *</label>
                <input
                  type="text"
                  id="expiryDate"
                  name="expiryDate"
                  value={bankDetails.expiryDate}
                  onChange={handleBankDetailsChange}
                  maxLength={5}
                  required
                  disabled={isLoading}
                  placeholder="MM/YY"
                />
              </div>

              <div className="form-group">
                <label htmlFor="cvv">CVV *</label>
                <input
                  type="text"
                  id="cvv"
                  name="cvv"
                  value={bankDetails.cvv}
                  onChange={handleBankDetailsChange}
                  maxLength={4}
                  required
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          <div className="payment-summary">
            <div className="summary-row">
              <span>Plan seleccionado:</span>
              <span>
                {subscriptionType === SubscriptionType.MONTHLY && '1 Mes'}
                {subscriptionType === SubscriptionType.QUARTERLY && '3 Meses'}
                {subscriptionType === SubscriptionType.YEARLY && '1 Año'}
              </span>
            </div>
            <div className="summary-row total">
              <span>Total a pagar:</span>
              <span>€{getPrice(subscriptionType).toFixed(2)}</span>
            </div>
          </div>

          <div className="payment-actions">
            <button 
              type="button" 
              className="payment-button-secondary"
              onClick={() => navigate('/dashboard')}
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="payment-button"
              disabled={isLoading}
            >
              {isLoading ? 'Procesando...' : `Pagar €${getPrice(subscriptionType).toFixed(2)}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Payment;
