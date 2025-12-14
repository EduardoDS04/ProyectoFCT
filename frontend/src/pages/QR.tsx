import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import QRCode from 'react-qr-code';
import { getMyQR, type QRData } from '../services/qrService';
import { getErrorMessage } from '../utils/errorHandler';
import '../styles/QR.css';

// Pagina que muestra el QR de acceso del usuario
const QR = () => {
  const [qrData, setQrData] = useState<QRData | null>(null);
  const [expiresAt, setExpiresAt] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadQR();
  }, []);

  // Carga el QR del usuario desde el backend
  const loadQR = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await getMyQR();
      setQrData(response.qrData);
      setExpiresAt(response.expiresAt);
    } catch (err) {
      console.error('Error al cargar QR:', err);
      setError(getErrorMessage(err, 'Error al cargar el QR. Por favor, intenta de nuevo.'));
    } finally {
      setLoading(false);
    }
  };

  // Formatea la fecha de expiracion
  const formatExpirationDate = (dateString: string): string => {
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

  if (loading) {
    return (
      <div className="qr-container">
        <div className="qr-card">
          <div className="qr-loading">
            <p>Cargando QR...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="qr-container">
        <div className="qr-card">
          <div className="qr-error">
            <p>{error}</p>
            <button onClick={loadQR} className="qr-button-retry">
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="qr-container">
      <div className="qr-card">
        <h1 className="qr-title">Mi Código QR de Acceso</h1>
        <p className="qr-subtitle">Escanea este código para acceder al gimnasio</p>

        {qrData && (
          <div className="qr-content">
            <div className="qr-code-wrapper">
              <QRCode
                value={JSON.stringify(qrData)}
                size={180}
                level="H"
                style={{ height: 'auto', maxWidth: '100%', width: '100%' }}
                viewBox={`0 0 180 180`}
              />
            </div>

            <div className="qr-info">
              <div className="qr-info-item">
                <span className="qr-info-label">Expira el:</span>
                <span className="qr-info-value">{formatExpirationDate(expiresAt)}</span>
              </div>
              <p className="qr-info-note">
                Este código QR es válido por 24 horas. Se renovará automáticamente cuando lo vuelvas a consultar.
              </p>
            </div>
          </div>
        )}

        <div className="qr-actions">
          <button onClick={() => navigate('/dashboard')} className="qr-button-back">
            Volver al Menú Principal
          </button>
        </div>
      </div>
    </div>
  );
};

export default QR;

