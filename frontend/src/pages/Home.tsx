import { Link } from 'react-router-dom';
import '../styles/Home.css';

// Pagina de inicio que muestra la bienvenida y opciones de acceso
const Home = () => {
  return (
    <div className="home-container">
      <div className="home-images-wrapper">
        <img src="/foto_inicio_izq.PNG" alt="Gimnasio" className="home-image home-image-left" />
        <img src="/foto_inicio_der.PNG" alt="Gimnasio" className="home-image home-image-right" />
      </div>
      <div className="bienvenida-card">
        <h1 className="bienvenida-title">Bienvenido a GYM10</h1>
        <p className="bienvenida-subtitle">
          Sistema de gestión de tu gimnasio
        </p>
        <Link to="/dashboard" className="bienvenida-button">
          Acceder al sistema
        </Link>
      </div>
    </div>
  );
};

export default Home;

