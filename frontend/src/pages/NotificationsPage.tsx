import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Notifications from '../components/Notifications';
import '../styles/NotificationsPage.css';

// Página de notificaciones para socios
const NotificationsPage = () => {
  const navigate = useNavigate();

  // Forzar recarga del contador cuando se monta el componente
  useEffect(() => {
    // Disparar un evento personalizado para que el Navbar actualice el contador
    window.dispatchEvent(new Event('notifications-opened'));
  }, []);

  return (
    <div className="notifications-page-container">
      <Notifications 
        onClose={() => navigate('/dashboard')} 
        onMarkAsRead={() => {
          // Disparar evento para actualizar el contador
          window.dispatchEvent(new Event('notifications-updated'));
        }}
      />
    </div>
  );
};

export default NotificationsPage;

