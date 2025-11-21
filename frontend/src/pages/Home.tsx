import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import '../styles/Home.css';

// Pagina de inicio que muestra la bienvenida y opciones de acceso
const Home = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="home-container">
      <div className="bienvenida-section">
        <h1 className="bienvenida-title"> Bienvenido a Gimnasio App</h1>
        <p className="bienvenida-subtitle">
          Sistema de gestión integral del gimnasio
        </p>
        
        {!isAuthenticated ? (
          <div className="bienvenida-buttons">
            <Link to="/register" className="bienvenida-button primary">
              Comenzar Ahora
            </Link>
            <Link to="/login" className="bienvenida-button secondary">
              Iniciar Sesión
            </Link>
          </div>
        ) : (
          <div className="bienvenida-buttons">
            <Link to="/dashboard" className="bienvenida-button primary">
              Ir al Dashboard
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;

