import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import connectDB from './config/database';

const app = express();
const port = 3001;

// Conectar a MongoDB
connectDB();

// Middleware 
app.use(helmet());
app.use(cors());
app.use(express.json());

// Ruta de prueba de MongoDB
app.get('/prueba-mongo', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    service: 'auth-service',
    timestamp: new Date().toISOString(),
    database: 'MongoDB conectado correctamente'
  });
});

// Ruta principal
app.get('/', (req, res) => {
  res.json({ message: 'Auth Service funcionando!' });
});

app.listen(port, () => {
  console.log(`Servidor auth en http://localhost:${port}`);
  console.log(`Prueba MongoDB: http://localhost:${port}/prueba-mongo`);
});