import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import connectDB from './config/database';
import authRoutes from './routes/auth.routes';
import adminRoutes from './routes/admin.routes';
import qrRoutes from './routes/qr.routes';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Conectar a MongoDB
connectDB();

// Middleware de seguridad
app.use(helmet());

// CORS configurado para permitir frontend
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
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/qr', qrRoutes);

// Ruta de health check
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    service: 'auth-service',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Ruta principal
app.get('/', (req, res) => {
  res.json({ 
    message: 'Auth Service API',
    endpoints: {
      auth: {
        health: 'GET /health',
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        profile: 'GET /api/auth/profile (protected)',
        updateProfile: 'PUT /api/auth/profile (protected)',
        changePassword: 'PUT /api/auth/change-password (protected)'
      },
      admin: {
        users: 'GET /api/admin/users (admin only)',
        updateRole: 'PUT /api/admin/users/:id/role (admin only)',
        toggleActive: 'PUT /api/admin/users/:id/toggle-active (admin only)',
        deleteUser: 'DELETE /api/admin/users/:id (admin only)'
      },
      qr: {
        getMyQR: 'GET /api/qr/me (protected)',
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
║       AUTH SERVICE INICIADO                           ║
╠═══════════════════════════════════════════════════════╣
║  Servidor:    http://localhost:${port}                   
║  Health:      http://localhost:${port}/health            
║  API Docs:    http://localhost:${port}/                  
╚═══════════════════════════════════════════════════════
  `);
});