import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import connectDB from './config/database';
import paymentRoutes from './routes/payment.routes';

dotenv.config();

const app = express();
const port = process.env.PORT || 3003;

// Conectar a MongoDB
connectDB();

// Middleware de seguridad
app.use(helmet());

// CORS configurado para permitir frontend y otros microservicios
if (!process.env.CORS_ORIGINS) {
  console.error('Error: CORS_ORIGINS no está definida en las variables de entorno');
  console.error('Por favor, configura CORS_ORIGINS en tu archivo .env');
  process.exit(1);
}

const corsOrigins = process.env.CORS_ORIGINS.split(',').map(origin => origin.trim());

app.use(cors({
  origin: corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas
app.use('/api/payments', paymentRoutes);

// Ruta de health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    service: 'payment-service',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Ruta principal
app.get('/', (req, res) => {
  res.json({
    message: 'Payment Service API',
    endpoints: {
      health: 'GET /health',
      payments: {
        getMySubscriptions: 'GET /api/payments/my-subscriptions (socio)',
        getSubscriptionById: 'GET /api/payments/my-subscriptions/:id (socio)',
        createSubscription: 'POST /api/payments/subscribe (socio)',
        cancelSubscription: 'PUT /api/payments/cancel/:id (socio)',
        getAllSubscriptions: 'GET /api/payments/all (admin)'
      }
    }
  });
});

// Manejo de rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada'
  });
});

// Manejo de errores global
app.use((err: unknown, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  const status = (err as { status?: number })?.status || 500;
  const message = (err instanceof Error ? err.message : String(err)) || 'Error interno del servidor';
  
  res.status(status).json({
    success: false,
    message
  });
});

app.listen(port, () => {
  console.log(`
╔═══════════════════════════════════════════════════════╗
║       PAYMENT SERVICE INICIADO                        ║
╠═══════════════════════════════════════════════════════╣
║  Servidor:    http://localhost:${port}                   
║  Health:      http://localhost:${port}/health             
║  API Docs:    http://localhost:${port}/                  
║  Auth Service: ${process.env.AUTH_SERVICE_URL}                      
╚═══════════════════════════════════════════════════════╝
  `);
});

