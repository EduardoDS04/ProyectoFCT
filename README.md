# ProyectoFCT - Sistema de Gestión de Gimnasio

Aplicación web desarrollada con arquitectura de microservicios para la gestión de un gimnasio. Incluye sistema de autenticación, gestión de clases y reservas, pagos y suscripciones, feedback y notificaciones, códigos QR de acceso, y rutinas y ejercicios personalizados.

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

El proyecto está organizado en seis partes principales: cinco microservicios backend y una aplicación frontend.

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

**`backend/feedback-service/`** - Microservicio de feedback, quejas y valoraciones
- `src/config/` - Configuración de base de datos
- `src/controllers/` - Controladores de feedback
- `src/middleware/` - Middleware de autenticación y autorización
- `src/models/` - Modelos (Feedback)
- `src/routes/` - Definición de rutas de la API
- `src/types/` - Definiciones de tipos TypeScript

**`backend/routine-service/`** - Microservicio de rutinas y ejercicios
- `src/config/` - Configuración de base de datos
- `src/controllers/` - Controladores de ejercicios, rutinas y rutinas de usuario
- `src/middleware/` - Middleware de autenticación y autorización
- `src/models/` - Modelos (Exercise, Routine, UserRoutine)
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

- **Feedback Service (Puerto 3004)**: Gestiona feedback, quejas y valoraciones de los socios
  - Base de datos: `gimnasio_feedback`

- **Routine Service (Puerto 3005)**: Gestiona rutinas de ejercicios y ejercicios personalizados
  - Base de datos: `gimnasio_routines`

La comunicación entre servicios se realiza mediante JWT tokens que contienen la información del usuario.

## Roles de Usuario

- **Socio**: 
  - Ver clases disponibles y realizar reservas (requiere suscripción activa)
  - Gestionar suscripciones y pagos
  - Enviar feedback y recibir respuestas
  - Acceder con código QR (solo con suscripción activa)
  - Crear y gestionar rutinas personalizadas
  - Ver sus reservas con filtros (Todas, Confirmadas, Canceladas, Completadas)
  - Las reservas completadas se ocultan después de 7 días

- **Monitor**: 
  - Crear y gestionar sus propias clases
  - Editar y cancelar sus clases
  - Ver reservas de sus clases
  - Acceder con código QR desde el registro

- **Admin**: 
  - Acceso completo al sistema
  - Gestión completa de usuarios
  - Ver todas las clases y reservas del sistema
  - Crear, editar, cancelar y eliminar cualquier clase
  - Gestionar ejercicios y rutinas predefinidas
  - Responder a feedbacks y gestionar notificaciones
  - Ver todas las suscripciones
  - Acceder con código QR desde el registro

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

# Payment Service URL (para validación de suscripciones)
PAYMENT_SERVICE_URL=http://localhost:3003

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

#### Feedback Service (`backend/feedback-service/.env`)

```env
# Puerto del servicio
PORT=3004

# MongoDB Connection String
MONGODB_URI=mongodb://admin:password1234@localhost:27017/gimnasio_feedback?authSource=admin

# Auth Service URL (para comunicación entre microservicios)
AUTH_SERVICE_URL=http://localhost:3001

# CORS Origins (separados por comas)
CORS_ORIGINS=http://localhost:5173,http://localhost:3000,http://localhost:3001
```

#### Routine Service (`backend/routine-service/.env`)

```env
# Puerto del servicio
PORT=3005

# MongoDB Connection String
MONGODB_URI=mongodb://admin:password1234@localhost:27017/gimnasio_routines?authSource=admin

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

# Feedback Service URL
VITE_FEEDBACK_SERVICE_URL=http://localhost:3004

# Routine Service URL
VITE_ROUTINE_SERVICE_URL=http://localhost:3005
```

#### Docker Compose (`backend/.env`)

```env
# MongoDB Configuration
MONGO_PORT=27017
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=password1234
MONGO_INITDB_DATABASE=gimnasio_auth

# Referencia de bases de datos (se crean automáticamente en mongo-init.js)
MONGO_CLASS_DATABASE=gimnasio_classes
MONGO_PAYMENT_DATABASE=gimnasio_payments
MONGO_FEEDBACK_DATABASE=gimnasio_feedback
MONGO_ROUTINE_DATABASE=gimnasio_routines
```

**Nota**: Solo `MONGO_INITDB_DATABASE` se usa en docker-compose.yml. Las demás variables son solo para referencia/documentación. Todas las bases de datos se crean automáticamente mediante `mongo-init.js`.

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

# Feedback Service
cd ../feedback-service
npm install

# Routine Service
cd ../routine-service
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

**Restaurar contraseña del administrador:**

Si necesitas restaurar la contraseña del administrador (usando las credenciales definidas en `.env`):

```bash
cd backend/auth-service
npm run reset-admin-password
```

Este comando restablecerá la contraseña del administrador con el email y contraseña definidos en las variables de entorno `ADMIN_EMAIL` y `ADMIN_PASSWORD`.

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

# Terminal 4 - Feedback Service
cd backend/feedback-service
npm run dev

# Terminal 5 - Routine Service
cd backend/routine-service
npm run dev

# Terminal 6 - Frontend
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
- `GET /api/admin/users` - Listar todos los usuarios
- `PUT /api/admin/users/:id/role` - Actualizar rol de usuario
- `PUT /api/admin/users/:id/toggle-active` - Activar/desactivar usuario
- `DELETE /api/admin/users/:id` - Eliminar usuario

#### QR de Acceso
- `GET /api/qr/me` - Obtener mi código QR (regenera automáticamente si expiró)

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
- `GET /api/bookings` - Obtener todas las reservas (Admin)

### Payment Service (http://localhost:3003)

#### Suscripciones (Socio)
- `GET /api/payments/my-subscriptions` - Obtener mis suscripciones
- `GET /api/payments/my-subscriptions/:id` - Obtener suscripción por ID
- `GET /api/payments/me/active` - Verificar si tengo suscripción activa
- `POST /api/payments/subscribe` - Crear nueva suscripción
- `PUT /api/payments/cancel/:id` - Cancelar suscripción

#### Admin
- `GET /api/payments/all` - Obtener todas las suscripciones


### Feedback Service (http://localhost:3004)

#### Feedback (Socio)
- `POST /api/feedback` - Crear nuevo feedback (queja, valoración o duda)
- `GET /api/feedback/my-feedbacks` - Obtener mis feedbacks con conversaciones
- `POST /api/feedback/:id/respond` - Responder a un feedback (continuar conversación)
- `POST /api/feedback/:id/mark-read` - Marcar feedback como leído
- `GET /api/feedback/notifications/count` - Obtener contador de mensajes no leídos

#### Admin
- `GET /api/feedback` - Obtener todos los feedbacks (con filtro de archivados)
- `GET /api/feedback/:id` - Obtener feedback por ID
- `POST /api/feedback/:id/respond` - Responder a un feedback
- `POST /api/feedback/:id/archive` - Archivar/desarchivar feedback
- `GET /api/feedback/unanswered/count` - Contador de feedbacks sin responder
- `POST /api/feedback/mark-all-read-admin` - Marcar todos los feedbacks como leídos
- `GET /api/feedback/archived/unread/count` - Contador de mensajes no leídos en archivados
- `POST /api/feedback/mark-archived-read` - Marcar archivados como leídos

### Routine Service (http://localhost:3005)

#### Ejercicios (Públicos para ver, Admin para gestionar)
- `GET /api/exercises` - Listar todos los ejercicios (con filtros: muscleGroup, difficulty, search)
- `GET /api/exercises/:id` - Obtener ejercicio por ID
- `POST /api/exercises` - Crear ejercicio (Admin)
- `PUT /api/exercises/:id` - Actualizar ejercicio (Admin)
- `DELETE /api/exercises/:id` - Eliminar ejercicio (Admin)

#### Rutinas Predefinidas (Públicas para ver, Admin para gestionar)
- `GET /api/routines` - Listar todas las rutinas predefinidas
- `GET /api/routines/:id` - Obtener rutina por ID con ejercicios
- `POST /api/routines` - Crear rutina predefinida (Admin)
- `PUT /api/routines/:id` - Actualizar rutina predefinida (Admin)
- `DELETE /api/routines/:id` - Eliminar rutina predefinida (Admin)

#### Rutinas Personalizadas (Socio)
- `GET /api/user-routines/me` - Obtener mi rutina personalizada
- `POST /api/user-routines/me` - Crear o actualizar mi rutina personalizada
- `POST /api/user-routines/me/exercises` - Añadir ejercicio a mi rutina
- `PUT /api/user-routines/me/exercises/:exerciseIndex` - Actualizar ejercicio en mi rutina
- `POST /api/user-routines/me/exercises/reorder` - Reordenar ejercicios en mi rutina
- `DELETE /api/user-routines/me/exercises/:exerciseIndex` - Eliminar ejercicio de mi rutina
- `DELETE /api/user-routines/me` - Eliminar mi rutina personalizada completa

## Características Principales
### Autenticación y Autorización
- Registro de usuarios con validación completa
- Email único por usuario
- DNI único por usuario (obligatorio, formato: 8 dígitos + 1 letra)
- Teléfono único por usuario (opcional)
- Todos los usuarios se registran como SOCIO por defecto (seguridad)
- Login con JWT
- Middleware de protección de rutas
- Roles de usuario (Socio, Monitor, Admin)
- Cambio de rol de usuario por administradores (con validaciones)

### Gestión de Clases
- Crear clases (Monitor/Admin)
- Editar y cancelar clases (Monitor solo sus propias clases, Admin todas)
- Eliminar clases (solo Admin)
- Descripción de clase opcional
- Ver todas las clases disponibles
- Filtrar por estado (Activa, Cancelada, Completada)
- Para socios: clases canceladas y completadas se ocultan después de 7 días
- Marcado automático de clases pasadas como completadas
- Cancelación automática de reservas al cancelar una clase

### Sistema de Reservas
- Reservar plazas en clases (requiere suscripción activa)
- Cancelar reservas
- Control de cupos disponibles
- Validación de reservas duplicadas
- Deduplicación automática: si un usuario reserva, cancela y vuelve a reservar, solo se muestra la reserva confirmada
- Para socios: reservas completadas se ocultan después de 7 días
- Ver reservas de una clase (Monitor/Admin)
- Ver todas las reservas del sistema (Admin)

### Panel de Administración
- Gestión completa de usuarios
- Visualización de DNI de usuarios
- Cambio de rol de usuario (con validaciones)
  - No se puede cambiar el rol si el usuario tiene reservas activas
  - Un administrador no puede cambiar su propio rol
- Activar/desactivar usuarios
- Eliminar usuarios


### Sistema de Pagos y Suscripciones
- Suscripciones mensuales, trimestrales y anuales
- Gestión de datos bancarios (simulado)
- Historial de suscripciones
- Cancelación de suscripciones
- Validación de suscripción activa requerida para reservar clases
- Verificación automática de suscripción antes de permitir reservas

### Sistema de Feedback y Notificaciones
- **Envío de Feedback**: Los socios pueden enviar feedback (quejas, valoraciones o dudas) con mensajes de hasta 3000 caracteres
- **Conversaciones Bidireccionales**: Sistema de mensajería bidireccional entre socios y administradores
- **Notificaciones para Socios**:
  - Badge en el Navbar con contador de mensajes no leídos
  - Página de notificaciones con todas las conversaciones
  - Conversaciones colapsadas por defecto con botón para expandir/colapsar
  - Formulario de respuesta inline dentro de cada conversación expandida
  - Marcado automático como leído al abrir las notificaciones
- **Gestión para Administradores**:
  - Badge en el Dashboard con contador de feedbacks sin responder
  - Vista de todos los feedbacks con filtros por tipo (queja, valoración, duda)
  - Sistema de archivado de conversaciones
  - Sección de archivados con indicador de mensajes nuevos
  - Modal de respuesta para cada feedback
  - Marcado automático como leído al entrar a la sección
- **Características Técnicas**:
  - Almacenamiento persistente de todas las conversaciones en base de datos
  - Ordenamiento automático por fecha del último mensaje
  - Control de mensajes leídos/no leídos por usuario
  - Validación de mensajes (máximo 3000 caracteres, sin mínimo)
  - Historial completo de conversaciones con timestamps

### Sistema de Códigos QR de Acceso
- Generación automática de QR único por usuario
- QR con expiración de 24 horas (se renueva automáticamente)
- Acceso inmediato para Admin y Monitor desde el registro
- Acceso condicional para Socios (solo con suscripción activa)
- El QR desaparece automáticamente si el socio cancela su suscripción
- Validación de QR para uso futuro con lectores de acceso

### Sistema de Rutinas y Ejercicios
- **Ejercicios Base**: Catálogo de ejercicios con videos de YouTube, descripción, grupo muscular y nivel de dificultad
- **Rutinas Predefinidas**: Rutinas creadas por administradores con ejercicios seleccionados y días de la semana asignados
- **Rutinas Personalizadas**: Los socios pueden crear su propia rutina personalizada
- **Personalización de Ejercicios**: Los socios pueden añadir ejercicios a su rutina personalizando series, repeticiones, peso (opcional) y día de la semana
- **Filtrado por Día**: Los socios pueden filtrar ejercicios por día de la semana en su rutina personalizada
- **Integración con YouTube**: Videos embebidos de YouTube para demostración de ejercicios
- **Filtros y Búsqueda**: Filtrado por grupo muscular, dificultad y búsqueda por texto
- **Gestión Completa**: CRUD completo de ejercicios y rutinas para administradores

## Seguridad

- Contraseñas hasheadas con bcryptjs
- Tokens JWT con expiración
- Validación de datos en backend
- Middleware de autenticación en rutas protegidas
- Headers de seguridad con Helmet
- CORS configurado
- Validación de campos únicos (email, DNI, teléfono)
- Registro público solo permite crear usuarios SOCIO
- Validación de suscripción activa para reservar clases

## Validaciones y Reglas de Negocio

### Registro de Usuarios
- Email único y obligatorio
- DNI único y obligatorio (formato: 8 dígitos + 1 letra)
- Teléfono único y opcional (si se proporciona, debe ser único)
- Todos los usuarios se registran como SOCIO por defecto
- Los roles de Monitor y Admin solo pueden ser asignados por administradores

### Gestión de Roles
- Un administrador no puede cambiar su propio rol
- No se puede cambiar el rol de un usuario que tiene reservas activas
- Solo los administradores pueden cambiar roles de usuarios

### Reservas
- Requiere suscripción activa para realizar reservas
- No se pueden reservar clases canceladas o completadas
- No se pueden reservar clases pasadas
- Control de cupos disponibles
- Validación de reservas duplicadas
- Deduplicación automática: si un usuario reserva, cancela y vuelve a reservar la misma clase, solo se muestra la reserva confirmada

### Clases
- Los monitores solo pueden editar/cancelar sus propias clases
- Solo los administradores pueden eliminar clases
- Las clases pasadas se marcan automáticamente como completadas
- Al cancelar una clase, se cancelan automáticamente todas las reservas asociadas
- Descripción de clase es opcional
- Para socios: clases canceladas y completadas se ocultan después de 7 días

### Reservas para Socios
- Las reservas completadas se ocultan después de 7 días
- En el filtro "Todas" se muestran todas las reservas activas, canceladas y completadas de la última semana

## Estado del Proyecto

- **Fase 1: Auth Service + Frontend Básico** - Completado
- **Fase 2: Class Service + Sistema de Reservas** - Completado
- **Fase 3: Funcionalidades Avanzadas** - Completado
  - Payment Service: Sistema de pagos y suscripciones
  - Feedback Service: Sistema de feedback, quejas y notificaciones bidireccionales
  - Sistema de códigos QR de acceso
  - Routine Service: Sistema de rutinas y ejercicios personalizados

## Datos de Prueba
### Usuario Admin
```
Email: admin@gimnasio.com
Password: Admin2024!
```
