# ProyectoFCT - Sistema de Gestión de Gimnasio

Aplicación web desarrollada con arquitectura de microservicios para la gestión de un gimnasio. Incluye sistema de autenticación, gestión de clases y reservas.

## Tecnologías Utilizadas

### Backend
- Node.js + Express
- TypeScript
- MongoDB con Mongoose
- JWT para autenticación
- Docker para contenedores

### Frontend
- React 18
- TypeScript
- Vite
- React Router DOM
- Axios para peticiones HTTP

## Estructura del Proyecto

El proyecto está organizado en tres partes principales: dos microservicios backend y una aplicación frontend.

### Backend

**`backend/auth-service/`** - Microservicio de autenticación y gestión de usuarios
- `src/config/` - Configuración de base de datos
- `src/controllers/` - Controladores de autenticación y administración
- `src/middleware/` - Middleware de autenticación JWT y validación
- `src/models/` - Modelos (User)
- `src/routes/` - Definición de rutas de la API
- `src/scripts/` - Scripts de inicialización y utilidades
- `src/types/` - Definiciones de tipos TypeScript

**`backend/class-service/`** - Microservicio de clases y reservas
- `src/config/` - Configuración de base de datos
- `src/controllers/` - Controladores de clases y reservas
- `src/middleware/` - Middleware de autenticación y autorización
- `src/models/` - Modelos (Class, Booking)
- `src/routes/` - Definición de rutas de la API
- `src/types/` - Definiciones de tipos TypeScript

**`backend/payment-service/`** - Microservicio de pagos y suscripciones (simulado)
- `src/config/` - Configuración de base de datos
- `src/controllers/` - Controladores de pagos y suscripciones
- `src/middleware/` - Middleware de autenticación y autorización
- `src/models/` - Modelos (Subscription)
- `src/routes/` - Definición de rutas de la API
- `src/types/` - Definiciones de tipos TypeScript

**Archivos de configuración backend:**
- `backend/docker-compose.yml` - Configuración de MongoDB con Docker
- `backend/mongo-init.js` - Script de inicialización de MongoDB

### Frontend

**`frontend/src/`** - Aplicación React
- `components/` - Componentes reutilizables (Navbar, ProtectedRoute)
- `contexts/` - Context API para gestión de estado global (AuthContext)
- `hooks/` - Custom hooks (useAuth)
- `pages/` - Páginas de la aplicación (Login, Register, Dashboard, etc.)
- `services/` - Servicios para comunicación con APIs (authService, classService, etc.)
- `styles/` - Archivos CSS por componente
- `types/` - Definiciones de tipos TypeScript compartidos
- `utils/` - Utilidades y helpers (errorHandler)

## Arquitectura de Microservicios

El proyecto utiliza una arquitectura de microservicios donde cada servicio tiene su propia base de datos:

- **Auth Service (Puerto 3001)**: Gestiona usuarios, autenticación y autorización
  - Base de datos: `gimnasio_auth`
  
- **Class Service (Puerto 3002)**: Gestiona clases y reservas
  - Base de datos: `gimnasio_classes`

- **Payment Service (Puerto 3003)**: Gestiona pagos y suscripciones
  - Base de datos: `gimnasio_payments`

La comunicación entre servicios se realiza mediante JWT tokens que contienen la información del usuario.

## Roles de Usuario

- **Socio**: Puede ver clases y realizar reservas
- **Monitor**: Puede crear y gestionar sus clases
- **Admin**: Acceso completo al sistema

## Requisitos Previos

- Node.js >= 18.x
- Docker y Docker Compose
- npm o yarn

## Instalación y Configuración

### 1. Clonar el repositorio

```bash
git clone https://github.com/EduardoDS04/ProyectoFCT.git
cd ProyectoFCT
```

### 2. Iniciar MongoDB con Docker

```bash
cd backend
docker-compose up -d
```

### 3. Configurar variables de entorno

 Crea los archivos `.env` antes de iniciar los servicios. Todas las variables son obligatorias y no hay valores por defecto.

Crea archivos `.env` en cada servicio con las siguientes variables:

#### Auth Service (`backend/auth-service/.env`)

```env
# Puerto del servicio
PORT=3001

# MongoDB Connection String
MONGODB_URI=mongodb://admin:password1234@localhost:27017/gimnasio_auth?authSource=admin

# JWT Configuration
JWT_SECRET=tu_clave_super_secreta_cambiar_en_produccion
JWT_EXPIRES_IN=24h

# Admin inicial (solo para scripts de inicialización)
ADMIN_EMAIL=admin@gimnasio.com
ADMIN_PASSWORD=Admin2024!
ADMIN_NAME=Administrador Principal

# CORS Origins (separados por comas)
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

#### Class Service (`backend/class-service/.env`)

```env
# Puerto del servicio
PORT=3002

# MongoDB Connection String
MONGODB_URI=mongodb://admin:password1234@localhost:27017/gimnasio_classes?authSource=admin

# Auth Service URL (para comunicación entre microservicios)
AUTH_SERVICE_URL=http://localhost:3001

# CORS Origins (separados por comas)
CORS_ORIGINS=http://localhost:5173,http://localhost:3000,http://localhost:3001
```

#### Payment Service (`backend/payment-service/.env`)

```env
# Puerto del servicio
PORT=3003

# MongoDB Connection String
MONGODB_URI=mongodb://admin:password1234@localhost:27017/gimnasio_payments?authSource=admin

# Auth Service URL (para comunicación entre microservicios)
AUTH_SERVICE_URL=http://localhost:3001

# CORS Origins (separados por comas)
CORS_ORIGINS=http://localhost:5173,http://localhost:3000,http://localhost:3001
```

#### Frontend (`frontend/.env`)

```env
# Auth Service URL
VITE_API_URL=http://localhost:3001

# Class Service URL
VITE_CLASS_SERVICE_URL=http://localhost:3002

# Payment Service URL
VITE_PAYMENT_SERVICE_URL=http://localhost:3003
```

#### Docker Compose (`backend/.env`)

```env
# MongoDB Configuration
MONGO_PORT=27017
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=password1234
MONGO_INITDB_DATABASE=gimnasio_auth
MONGO_CLASS_DATABASE=gimnasio_classes
```

**CONFIGURACIÓN OBLIGATORIA**: 
- Todas las variables son obligatorias - sin valores por defecto
- En producción, usa contraseñas y secretos seguros
- No subas los archivos `.env` al repositorio (están en `.gitignore`)
- Si falta alguna variable, el sistema mostrará un error indicando qué falta

### 4. Instalar dependencias

```bash
# Auth Service
cd backend/auth-service
npm install

# Class Service
cd ../class-service
npm install

# Payment Service
cd ../payment-service
npm install

# Frontend
cd ../../frontend
npm install
```

### 5. Crear el administrador inicial

Este paso es necesario solo la primera vez:

```bash
cd backend/auth-service
npm run init-admin
```

Este comando creará el usuario administrador inicial con las credenciales definidas en las variables de entorno.

### 6. Iniciar los servicios

En terminales separadas:

```bash
# Terminal 1 - Auth Service
cd backend/auth-service
npm run dev

# Terminal 2 - Class Service
cd backend/class-service
npm run dev

# Terminal 3 - Payment Service
cd backend/payment-service
npm run dev

# Terminal 4 - Frontend
cd frontend
npm run dev
```

El frontend estará disponible en: http://localhost:5173

## Endpoints de la API

### Auth Service (http://localhost:3001)

#### Públicos
- `POST /api/auth/register` - Registrar nuevo usuario
- `POST /api/auth/login` - Iniciar sesión

#### Protegidos (requieren JWT)
- `GET /api/auth/profile` - Obtener perfil de usuario
- `PUT /api/auth/profile` - Actualizar perfil
- `PUT /api/auth/change-password` - Cambiar contraseña

#### Admin
- `GET /api/admin/stats` - Estadísticas del sistema
- `GET /api/admin/users` - Listar todos los usuarios
- `POST /api/admin/users/create-admin` - Crear administrador
- `PUT /api/admin/users/:id/role` - Actualizar rol de usuario
- `PUT /api/admin/users/:id/toggle-active` - Activar/desactivar usuario
- `DELETE /api/admin/users/:id` - Eliminar usuario

#### QR de Acceso
- `GET /api/qr/me` - Obtener mi código QR (regenera automáticamente si expiró)
- `POST /api/qr/validate` - Validar QR escaneado (para uso futuro)

### Class Service (http://localhost:3002)

#### Clases
- `GET /api/classes` - Listar todas las clases
- `GET /api/classes/:id` - Obtener clase por ID
- `GET /api/classes/my-classes` - Mis clases (Monitor/Admin)
- `POST /api/classes` - Crear clase (Monitor/Admin)
- `PUT /api/classes/:id` - Actualizar clase (Monitor/Admin)
- `PUT /api/classes/:id/cancel` - Cancelar clase (Monitor/Admin)
- `DELETE /api/classes/:id` - Eliminar clase (Admin)

#### Reservas
- `POST /api/bookings` - Crear reserva
- `GET /api/bookings/my-bookings` - Mis reservas
- `PUT /api/bookings/:id/cancel` - Cancelar reserva
- `GET /api/bookings/class/:classId` - Reservas de una clase (Monitor/Admin)

### Payment Service (http://localhost:3003)

#### Suscripciones (Socio)
- `GET /api/payments/my-subscriptions` - Obtener mis suscripciones
- `GET /api/payments/my-subscriptions/:id` - Obtener suscripción por ID
- `GET /api/payments/me/active` - Verificar si tengo suscripción activa
- `POST /api/payments/subscribe` - Crear nueva suscripción
- `PUT /api/payments/cancel/:id` - Cancelar suscripción

#### Admin
- `GET /api/payments/all` - Obtener todas las suscripciones


## Características Principales
### Autenticación y Autorización
- Registro de usuarios con validación
- Login con JWT
- Middleware de protección de rutas
- Roles de usuario (Socio, Monitor, Admin)

### Gestión de Clases
- Crear clases (Monitor/Admin)
- Editar y cancelar clases
- Ver todas las clases disponibles
- Filtrar por estado (Activa, Cancelada, Completada)

### Sistema de Reservas
- Reservar plazas en clases
- Cancelar reservas
- Control de cupos disponibles
- Validacion de reservas duplicadas

### Panel de Administración
- Gestión de usuarios
- Estadísticas del sistema
- Control de accesos

### Sistema de Pagos y Suscripciones
- Suscripciones mensuales, trimestrales y anuales
- Gestión de datos bancarios (simulado)
- Historial de suscripciones
- Cancelación de suscripciones

### Sistema de Códigos QR de Acceso
- Generación automática de QR único por usuario
- QR con expiración de 24 horas (se renueva automáticamente)
- Acceso inmediato para Admin y Monitor desde el registro
- Acceso condicional para Socios (solo con suscripción activa)
- El QR desaparece automáticamente si el socio cancela su suscripción
- Validación de QR para uso futuro con lectores de acceso

## Seguridad

- Contraseñas hasheadas con bcryptjs
- Tokens JWT con expiración
- Validación de datos en backend
- Middleware de autenticación en rutas protegidas
- Headers de seguridad con Helmet
- CORS configurado

## Estado del Proyecto

- Fase 1: Auth Service + Frontend Básico - Completado
- Fase 2: Class Service + Sistema de Reservas - Completado
- Fase 3: Funcionalidades Avanzadas - En desarrollo

## Datos de Prueba
### Usuario Admin
```
Email: admin@gimnasio.com
Password: Admin2024!
```
