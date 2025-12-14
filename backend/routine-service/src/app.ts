import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import connectDB from './config/database';
import exerciseRoutes from './routes/exercise.routes';
import routineRoutes from './routes/routine.routes';
import userRoutineRoutes from './routes/userRoutine.routes';

const app = express();
const port = process.env.PORT || 3005;

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
app.use('/api/exercises', exerciseRoutes);
app.use('/api/routines', routineRoutes);
app.use('/api/user-routines', userRoutineRoutes);

// Ruta de health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    service: 'routine-service',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Ruta principal
app.get('/', (req, res) => {
  res.json({
    message: 'Routine Service API',
    endpoints: {
      health: 'GET /health',
      exercises: {
        getAllExercises: 'GET /api/exercises',
        getExerciseById: 'GET /api/exercises/:id',
        createExercise: 'POST /api/exercises (admin)',
        updateExercise: 'PUT /api/exercises/:id (admin)',
        deleteExercise: 'DELETE /api/exercises/:id (admin)'
      },
      routines: {
        getAllRoutines: 'GET /api/routines',
        getRoutineById: 'GET /api/routines/:id',
        createRoutine: 'POST /api/routines (admin)',
        updateRoutine: 'PUT /api/routines/:id (admin)',
        deleteRoutine: 'DELETE /api/routines/:id (admin)'
      },
      userRoutines: {
        getMyRoutine: 'GET /api/user-routines/me (socio)',
        createOrUpdateMyRoutine: 'POST /api/user-routines/me (socio)',
        addExercise: 'POST /api/user-routines/me/exercises (socio)',
        updateExercise: 'PUT /api/user-routines/me/exercises/:exerciseIndex (socio)',
        reorderExercises: 'POST /api/user-routines/me/exercises/reorder (socio)',
        removeExercise: 'DELETE /api/user-routines/me/exercises/:exerciseIndex (socio)',
        deleteMyRoutine: 'DELETE /api/user-routines/me (socio)'
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
║       ROUTINE SERVICE INICIADO                        ║
╠═══════════════════════════════════════════════════════╣
║  Servidor:    http://localhost:${port}                   
║  Health:      http://localhost:${port}/health              
║  API Docs:    http://localhost:${port}/                  
║  Auth Service: ${process.env.AUTH_SERVICE_URL}                      
╚═══════════════════════════════════════════════════════╝
  `);
});
