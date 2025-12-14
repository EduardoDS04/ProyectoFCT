# Implementación

Voy a detallar las partes más críticas del código del proyecto, explicando su funcionamiento y la importancia de cada componente en la arquitectura de microservicios.

## 1. Middleware de Autenticación JWT (Auth Service)

El middleware de autenticación JWT es el componente central de seguridad del sistema. Se encuentra en el Auth Service y valida los tokens JWT que se generan durante el login.

```typescript
import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest, JWTPayload, UserRole } from '../types';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error('Error: JWT_SECRET no está definida en las variables de entorno');
  console.error('Por favor, configura JWT_SECRET en tu archivo .env');
  process.exit(1);
}

const jwtSecret: string = JWT_SECRET;

export const verifyToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const token = req.headers.authorization?.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({ 
        success: false,
        message: 'No se proporcionó token de autenticación' 
      });
      return;
    }

    const decoded = jwt.verify(token, jwtSecret) as JWTPayload;
    
    // Agregar información del usuario al request
    req.userId = decoded.id;
    req.userRole = decoded.role;
    
    next();
  } catch (error) {
    res.status(401).json({ 
      success: false,
      message: 'Token inválido o expirado' 
    });
  }
};
```

**Explicación:** Este middleware valida los tokens JWT que se envían en el header `Authorization` con formato `Bearer TOKEN`. Extrae el token, lo verifica usando `jwt.verify()` para validar su firma y expiración, y luego inyecta los datos del usuario (`userId` y `userRole`) en el objeto `req` para que los controladores puedan acceder a ellos. Si el token es inválido o no se proporciona, responde con un error 401.

## 2. Comunicación entre Microservicios

En una arquitectura de microservicios, cada servicio debe validar la autenticación consultando al Auth Service. Este ejemplo muestra cómo el Payment Service se comunica con el Auth Service para verificar tokens.

```typescript
import { Response, NextFunction } from 'express';
import axios from 'axios';
import { AuthRequest, UserRole, AuthServiceUserResponse } from '../types';

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL;

if (!AUTH_SERVICE_URL) {
  console.error('Error: AUTH_SERVICE_URL no está definida en las variables de entorno');
  console.error('Por favor, configura AUTH_SERVICE_URL en tu archivo .env');
  process.exit(1);
}

export const verifyToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'No se proporcionó token de autenticación'
      });
      return;
    }

    // Llamar al Auth Service para verificar el token y obtener datos del usuario
    const response = await axios.get<AuthServiceUserResponse>(
      `${AUTH_SERVICE_URL}/api/auth/profile`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    if (!response.data.success || !response.data.data) {
      res.status(401).json({
        success: false,
        message: 'Token inválido'
      });
      return;
    }

    // Agregar informacion del usuario al request
    const user = response.data.data;
    req.userId = user._id;
    req.userRole = user.role;
    req.userEmail = user.email;
    req.userName = user.name;

    next();
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        res.status(401).json({
          success: false,
          message: 'Token inválido o expirado'
        });
        return;
      }
    }

    console.error('Error al verificar token:', error);
    res.status(500).json({
      success: false,
      message: 'Error al verificar autenticación'
    });
  }
};
```

**Explicación:** A diferencia del Auth Service que valida tokens localmente, los demás microservicios hacen una petición HTTP al Auth Service usando Axios. El token recibido se reenvía al endpoint `/api/auth/profile` del Auth Service, que valida el token y retorna los datos del usuario. Si la respuesta es exitosa, se extraen los datos (`_id`, `role`, `email`, `name`) y se agregan al objeto `req`. Este patrón centraliza la autenticación en un solo servicio, evitando duplicar lógica y facilitando el mantenimiento.

## 3. Helpers y Utilidades (Refactorización)

Durante el desarrollo se identificó código duplicado en múltiples controladores. Se crearon funciones helper reutilizables para eliminar esta duplicación y mejorar la mantenibilidad.

```typescript
import { Response } from 'express';
import Exercise from '../models/Exercise';
import { ApiResponse, MuscleGroup } from '../types';

// se especifican solo los campos necesarios para mostrar el ejercicio (excluye campos internos como createdBy, createdAt, updatedAt, __v)
// esto optimiza el tamaño de la respuesta y mejora el rendimiento al evitar cargar datos innecesarios
export const EXERCISE_POPULATE_FIELDS = 'title description youtubeVideoId muscleGroup difficulty thumbnailUrl';

// manejar errores de validación de mongoose
export const handleValidationError = (error: any, res: Response<ApiResponse>): boolean => {
  if (error.name === 'ValidationError' && error.errors) {
    const firstError = Object.values(error.errors)[0] as { message?: string };
    res.status(400).json({
      success: false,
      message: firstError?.message || 'Error de validación'
    });
    return true;
  }
  return false;
};

// validar que los grupos musculares sean validos
export const validateMuscleGroups = (muscleGroup: any): { valid: boolean; groups: MuscleGroup[] } => {
  if (!Array.isArray(muscleGroup) || muscleGroup.length === 0) {
    return { valid: false, groups: [] };
  }

  const validGroups = muscleGroup.filter((group: string) =>
    Object.values(MuscleGroup).includes(group as MuscleGroup)
  ) as MuscleGroup[];

  return { valid: validGroups.length > 0, groups: validGroups };
};

// verificar que todos los ejercicios existan
export const validateExercisesExist = async (exerciseIds: string[]): Promise<boolean> => {
  const existingExercises = await Exercise.find({ _id: { $in: exerciseIds } });
  return existingExercises.length === exerciseIds.length;
};

// validar indice de ejercicio en array
export const validateExerciseIndex = (index: number, arrayLength: number): boolean => {
  return !isNaN(index) && index >= 0 && index < arrayLength;
};
```

**Explicación:** Estas funciones helper eliminan código duplicado y garantizan consistencia en las validaciones. `EXERCISE_POPULATE_FIELDS` optimiza las consultas definiendo qué campos incluir al hacer `populate()`. `handleValidationError()` maneja errores de validación de Mongoose de forma centralizada. `validateMuscleGroups()` valida y filtra grupos musculares según el enum. `validateExercisesExist()` verifica que todos los IDs existan usando `$in` de MongoDB. `validateExerciseIndex()` previene errores de acceso fuera de rango en arrays.

## 4. Modelo con Validaciones (Exercise)

Los modelos de Mongoose definen la estructura de los datos y las validaciones que se aplican automáticamente. Este ejemplo muestra el modelo `Exercise` con validaciones complejas.

```typescript
import mongoose, { Schema, Document } from 'mongoose';
import { MuscleGroup, Difficulty } from '../types';

// Interfaz que define la estructura de un ejercicio
export interface IExerciseDocument extends Document {
  title: string; // nombre del ejercicio
  description: string; // descripcion detallada del ejercicio
  youtubeVideoId: string; // ID del video de YouTube
  muscleGroup: MuscleGroup[]; // Array de grupos musculares 
  difficulty: Difficulty; // Nivel de dificultad del ejercicio 
  thumbnailUrl?: string; // URL opcional de la miniatura del video (se genera automáticamente si no se proporciona)
  createdBy: mongoose.Types.ObjectId; // ID del usuario administrador que creó el ejercicio
  createdAt: Date; 
  updatedAt: Date; 
}

// Esquema de Mongoose para ejercicios
const ExerciseSchema = new Schema<IExerciseDocument>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: [200, 'El título no puede exceder 200 caracteres']
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: [2000, 'La descripción no puede exceder 2000 caracteres']
    },
    youtubeVideoId: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: function(v: string) {
          // Validar formato básico de ID de YouTube (11 caracteres alfanuméricos)
          return /^[a-zA-Z0-9_-]{11}$/.test(v);
        },
        message: 'El ID del video de YouTube no es válido'
      }
    },
    muscleGroup: {
      type: [String],
      enum: Object.values(MuscleGroup),
      required: true,
      validate: {
        validator: function(v: string[]) {
          return Array.isArray(v) && v.length > 0;
        },
        message: 'Debe seleccionar al menos un grupo muscular'
      }
    },
    difficulty: {
      type: String,
      enum: Object.values(Difficulty),
      required: true
    },
    thumbnailUrl: {
      type: String,
      default: function(this: IExerciseDocument) {
        // Generar URL de miniatura de YouTube automáticamente
        return `https://img.youtube.com/vi/${this.youtubeVideoId}/mqdefault.jpg`;
      }
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
);

// Indices para optimizar búsquedas
ExerciseSchema.index({ muscleGroup: 1, difficulty: 1 }); // Índice para búsquedas por grupo muscular
ExerciseSchema.index({ createdBy: 1, createdAt: -1 });
ExerciseSchema.index({ title: 'text', description: 'text' }); // Búsqueda por texto

// Modelo de Mongoose
const Exercise = mongoose.model<IExerciseDocument>('Exercise', ExerciseSchema);

export default Exercise;
```

**Explicación:** Este modelo define validaciones robustas que se ejecutan automáticamente antes de guardar. Los campos `title` y `description` tienen límites de caracteres con `maxlength`. `youtubeVideoId` valida el formato de 11 caracteres alfanuméricos. `muscleGroup` y `difficulty` usan `enum` para restringir valores válidos. `thumbnailUrl` se genera automáticamente desde el ID de YouTube. Los índices optimizan búsquedas por grupo muscular, dificultad, creador y texto completo. `createdBy` es una referencia a `User` que permite usar `populate()`.

## 5. Controlador con Validaciones y Helpers (Payment Controller)

Este ejemplo muestra cómo se utiliza un controlador para crear suscripciones, combinando validaciones manuales, helpers y lógica de negocio.

```typescript
export const createSubscription = async (
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    if (!checkAuth(req, res)) return;

    const { subscriptionType, bankDetails }: CreateSubscriptionDTO = req.body;

    // Validar tipo de suscripcion
    if (!Object.values(SubscriptionType).includes(subscriptionType)) {
      res.status(400).json({
        success: false,
        message: 'Tipo de suscripcion inválido'
      });
      return;
    }

    // Validar datos bancarios
    if (!bankDetails || !bankDetails.cardNumber || !bankDetails.cardHolder || !bankDetails.expiryDate || !bankDetails.cvv) {
      res.status(400).json({
        success: false,
        message: 'Datos bancarios incompletos'
      });
      return;
    }

    // Validar formato de tarjeta (solo numeros, 16 digitos)
    const cardNumber = bankDetails.cardNumber.replace(/\s/g, '');
    if (!/^\d{16}$/.test(cardNumber)) {
      res.status(400).json({
        success: false,
        message: 'Número de tarjeta inválido (debe tener 16 dígitos)'
      });
      return;
    }

    // Validar formato de fecha de expiracion (MM/YY)
    if (!/^\d{2}\/\d{2}$/.test(bankDetails.expiryDate)) {
      res.status(400).json({
        success: false,
        message: 'Fecha de expiración inválida (formato: MM/YY)'
      });
      return;
    }

    // Validar CVV (3 o 4 digitos)
    if (!/^\d{3,4}$/.test(bankDetails.cvv)) {
      res.status(400).json({
        success: false,
        message: 'CVV inválido (debe tener 3 o 4 dígitos)'
      });
      return;
    }

    // Verificar si el usuario ya tiene una suscripcion activa
    const activeSubscription = await Subscription.findOne({
      userId: req.userId,
      status: SubscriptionStatus.ACTIVE
    });

    if (activeSubscription) {
      res.status(400).json({
        success: false,
        message: 'Ya tienes una suscripcion activa. Cancela la actual antes de crear una nueva.'
      });
      return;
    }

    // Calcular fechas y precio
    const startDate = new Date();
    const endDate = calculateEndDate(startDate, subscriptionType);
    const amount = getSubscriptionPrice(subscriptionType);

    // Simular procesamiento de pago (en produccion esto se haria con una pasarela real)
    const paymentStatus = PaymentStatus.COMPLETED;
    const subscriptionStatus = SubscriptionStatus.ACTIVE;

    // Crear suscripcion (guardar solo ultimos 4 digitos de la tarjeta por seguridad)
    const userIdObjectId = mongoose.Types.ObjectId.isValid(req.userId!) 
      ? new mongoose.Types.ObjectId(req.userId!) 
      : req.userId!;

    const subscription = new Subscription({
      userId: userIdObjectId,
      subscriptionType,
      startDate,
      endDate,
      status: subscriptionStatus,
      paymentStatus,
      amount,
      bankDetails: {
        cardNumber: cardNumber.slice(-4), // Solo guardar ultimos 4 digitos
        cardHolder: bankDetails.cardHolder,
        expiryDate: bankDetails.expiryDate
      }
    });

    await subscription.save();

    const safeSubscription = formatSafeSubscription(subscription.toObject());

    res.status(201).json({
      success: true,
      message: 'Suscripcion creada exitosamente',
      data: {
        ...safeSubscription,
        hasActiveSubscription: true
      }
    });
  } catch (error) {
    console.error('Error al crear suscripcion:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear suscripcion'
    });
  }
};
```

**Explicación:** Este controlador combina validaciones, lógica de negocio y seguridad. Utiliza `checkAuth()` para verificar autenticación y valida el tipo de suscripción con el enum. Valida datos bancarios con expresiones regulares (tarjeta de 16 dígitos, fecha MM/YY, CVV de 3-4 dígitos). Verifica que el usuario no tenga una suscripción activa para prevenir duplicados, con mensaje que indica cancelar la actual primero. Usa `calculateEndDate()` y `getSubscriptionPrice()` del modelo para calcular fechas y precios. Simula el procesamiento de pago (en producción se usaría una pasarela real). Por seguridad, solo guarda los últimos 4 dígitos de la tarjeta y formatea la respuesta de forma segura incluyendo `hasActiveSubscription: true` en la respuesta.

## 6. Función de Cálculo de Fechas (Subscription Model)

Las funciones auxiliares en los modelos encapsulan lógica de negocio reutilizable. Esta función calcula la fecha de finalización de una suscripción según su tipo.

```typescript
// Funcion auxiliar para calcular la fecha de finalizacion segun el tipo de suscripcion
// Recibe la fecha de inicio y el tipo de suscripcion, retorna la fecha de finalizacion
export const calculateEndDate = (startDate: Date, type: SubscriptionType): Date => {
  const endDate = new Date(startDate);
  
  switch (type) {
    case SubscriptionType.MONTHLY:
      // Suscripcion mensual
      endDate.setMonth(endDate.getMonth() + 1);
      break;
    case SubscriptionType.QUARTERLY:
      // Suscripcion trimestral
      endDate.setMonth(endDate.getMonth() + 3);
      break;
    case SubscriptionType.YEARLY:
      // Suscripcion anual
      endDate.setFullYear(endDate.getFullYear() + 1);
      break;
  }
  
  return endDate;
};
```

**Explicación:** Esta función calcula la fecha de finalización de una suscripción según su tipo. Crea una nueva instancia de `Date` para no modificar la fecha original (los objetos `Date` son mutables). Usa un `switch` para añadir el período correspondiente: `setMonth()` para mensuales y trimestrales (maneja cambios de año automáticamente) y `setFullYear()` para anuales (respeta años bisiestos). Se exporta para uso en modelos y controladores, garantizando consistencia en el cálculo de fechas en toda la aplicación.

## 7. Función de Precio de Suscripción (Subscription Model)

Esta función centraliza la lógica de precios, facilitando su mantenimiento y permitiendo aplicar descuentos según el tipo de suscripción.

```typescript
// Funcion para obtener el precio segun el tipo de suscripcion
// Retorna el monto a pagar para cada tipo de suscripcion
export const getSubscriptionPrice = (type: SubscriptionType): number => {
  switch (type) {
    case SubscriptionType.MONTHLY:
      return 29.99; // Precio mensual
    case SubscriptionType.QUARTERLY:
      return 79.99;  //ahorro de ~10 euros vs mensual
    case SubscriptionType.YEARLY:
      return 299.99; //(ahorro de ~60 euros vs mensual
    default:
      return 0;
  }
};
```

**Explicación:** Esta función centraliza todos los precios en un solo lugar, facilitando su mantenimiento. Los precios están diseñados para incentivar suscripciones de mayor duración: mensual (29.99€), trimestral (79.99€, ahorro de ~10€) y anual (299.99€, ahorro de ~60€). Si se proporciona un tipo inválido, retorna 0 en lugar de lanzar un error. Al estar en el modelo, garantiza que todos los controladores y servicios utilicen los mismos precios, evitando inconsistencias.

## 8. Manejo de Errores en Registro (Auth Controller)

El registro de usuarios requiere manejar múltiples tipos de errores: validaciones, duplicados, y errores del servidor. Este ejemplo muestra un manejo robusto de errores.

```typescript
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, name, dni, role, phone, birthDate }: RegisterDTO = req.body;

    // Verificar si el teléfono ya existe (solo si se proporciona)
    if (phone) {
      const existingPhone = await User.findOne({ phone: phone.trim() });
      if (existingPhone) {
        res.status(400).json({
          success: false,
          message: 'El número de teléfono ya está registrado'
        });
        return;
      }
    }

    // Verificar si el DNI ya existe (solo si se proporciona)
    if (dni) {
      const existingDni = await User.findOne({ dni: dni.toUpperCase().trim() });
      if (existingDni) {
        res.status(400).json({
          success: false,
          message: 'El DNI ya está registrado'
        });
        return;
      }
    }

    // Hash de la contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Crear nuevo usuario
    // En el registro público, todos los usuarios se crean como SOCIO por defecto
    // Los roles de MONITOR y ADMIN solo pueden ser asignados por administradores
    const newUser = new User({
      email: email.toLowerCase(),
      password: hashedPassword,
      name,
      dni: dni ? dni.toUpperCase().trim() : undefined,
      role: UserRole.SOCIO, // Siempre SOCIO en registro público
      phone: phone ? phone.trim() : undefined,
      birthDate: birthDate ? new Date(birthDate) : undefined,
      isActive: true
    });

    await newUser.save();

    // Generar token JWT
    const payload: JWTPayload = {
      id: String(newUser._id),
      email: newUser.email,
      role: newUser.role
    };

    const token = jwt.sign(payload, jwtSecret, { expiresIn: JWT_EXPIRES_IN });

    const response: AuthResponse = {
      token,
      user: {
        id: String(newUser._id),
        email: newUser.email,
        name: newUser.name,
        role: newUser.role
      }
    };

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      data: response
    });
  } catch (error: any) {
    // Manejar errores de validación de Mongoose (unicidad, etc.)
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      let message = 'Error de validación';
      if (field === 'email') {
        message = 'El email ya está registrado';
      } else if (field === 'phone') {
        message = 'El número de teléfono ya está registrado';
      } else if (field === 'dni') {
        message = 'El DNI ya está registrado';
      }
      res.status(400).json({
        success: false,
        message
      });
      return;
    }

    // Manejar errores de validación de Mongoose
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err: any) => err.message);
      res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
      return;
    }

    console.error('Error en registro:', error);
    res.status(500).json({
      success: false,
      message: 'Error al registrar usuario'
    });
  }
};
```

**Explicación:** Este controlador maneja el registro de usuarios con validaciones previas (teléfono y DNI), normalización de datos (email a minúsculas, DNI a mayúsculas, `trim()`), y seguridad (contraseñas hasheadas con `bcrypt`). Todos los usuarios se crean como `SOCIO` en registro público para prevenir escalación de privilegios. Después de crear el usuario, se genera un token JWT para login automático. Maneja errores de duplicado con mensajes específicos, combina errores de validación de Mongoose, y captura errores genéricos sin exponer información sensible.

## 9. Validación de Reservas con Comunicación entre Servicios (Booking Controller)

Las reservas de clases requieren validar múltiples condiciones y comunicarse con otros microservicios. Este ejemplo muestra cómo se integran estas validaciones.

```typescript
export const createBooking = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Solo los socios pueden reservar clases
    if (req.userRole !== UserRole.SOCIO) {
      res.status(403).json({
        success: false,
        message: 'Solo los socios pueden reservar clases'
      });
      return;
    }

    const { classId }: CreateBookingDTO = req.body;

    if (!classId) {
      res.status(400).json({
        success: false,
        message: 'El ID de la clase es obligatorio'
      });
      return;
    }

    // Verificar que la clase existe
    const classData = await Class.findById(classId);

    if (!classData) {
      res.status(404).json({
        success: false,
        message: 'Clase no encontrada'
      });
      return;
    }

    // Verificar que la clase no esta cancelada o completada
    if (classData.status === ClassStatus.CANCELLED) {
      res.status(400).json({
        success: false,
        message: 'No se puede reservar una clase cancelada'
      });
      return;
    }

    if (classData.status === ClassStatus.COMPLETED) {
      res.status(400).json({
        success: false,
        message: 'No se puede reservar una clase completada'
      });
      return;
    }

    // Verificar que la clase es futura
    if (new Date(classData.schedule) <= new Date()) {
      res.status(400).json({
        success: false,
        message: 'No se puede reservar una clase que ya ha pasado'
      });
      return;
    }

    // Verificar que hay cupo disponible
    if (classData.currentParticipants >= classData.maxParticipants) {
      res.status(400).json({
        success: false,
        message: 'La clase está completa. No hay cupos disponibles.'
      });
      return;
    }

    // Verificar que el usuario esta autenticado y tiene datos
    if (!req.userId || !req.userName) {
      res.status(401).json({
        success: false,
        message: 'Usuario no autenticado correctamente'
      });
      return;
    }

    // Verificar que el usuario tiene una suscripción activa
    try {
      const token = req.headers.authorization?.split(' ')[1];
      const subscriptionResponse = await axios.get(
        `${PAYMENT_SERVICE_URL}/api/payments/me/active`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (subscriptionResponse.data.success && subscriptionResponse.data.data) {
        const hasActiveSubscription = subscriptionResponse.data.data.hasActiveSubscription;
        if (!hasActiveSubscription) {
          res.status(403).json({
            success: false,
            message: 'Necesitas una suscripción activa para reservar clases'
          });
          return;
        }
      }
    } catch (error: any) {
      // Si el servicio de pagos no está disponible, denegar la reserva por seguridad
      res.status(503).json({
        success: false,
        message: 'No se pudo verificar tu suscripción. Por favor, intenta más tarde.'
      });
      return;
    }

    // Verificar que el usuario no tiene ya una reserva activa para esta clase
    const existingBooking = await Booking.findOne({
      userId: req.userId,
      classId,
      status: BookingStatus.CONFIRMED
    });

    if (existingBooking) {
      res.status(400).json({
        success: false,
        message: 'Ya tienes una reserva activa para esta clase'
      });
      return;
    }

    // Crear la reserva
    const newBooking = new Booking({
      userId: req.userId,
      userName: req.userName,
      classId,
      className: classData.name,
      bookingDate: new Date(),
      status: BookingStatus.CONFIRMED
    });

    await newBooking.save();

    // Incrementar el contador de participantes
    classData.currentParticipants += 1;
    await classData.save();

    res.status(201).json({
      success: true,
      data: newBooking,
      message: 'Reserva creada exitosamente'
    });
  } catch (error) {
    console.error('Error al crear reserva:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear la reserva'
    });
  }
};
```

**Explicación:** Este controlador integra múltiples validaciones: solo socios pueden reservar, verifica existencia y estado de la clase, valida que sea futura y haya cupo disponible y verifica que el usuario esté autenticado correctamente.

 Se comunica con el Payment Service vía HTTP para verificar que el usuario tenga una suscripción activa, mostrando cómo los microservicios se comunican entre sí. Valida que no exista una reserva duplicada antes de crear. Maneja errores de comunicación apropiadamente: si el servicio de pagos no está disponible, retorna 503 en lugar de permitir la reserva por seguridad. Después de crear la reserva incrementa el contador de participantes de la clase para mantener consistencia de datos.

## 10. Estructura de Rutas con Middlewares (Exercise Routes)

Las rutas definen los endpoints de la API y aplican middlewares para autenticación y autorización. Este ejemplo muestra cómo se organizan las rutas con middlewares agrupados.

```typescript
import { Router } from 'express';
import {
  getAllExercises,
  getExerciseById,
  createExercise,
  updateExercise,
  deleteExercise
} from '../controllers/exerciseController';
import { verifyToken, isAdmin } from '../middleware/authMiddleware';

const router = Router();

// middlewares para rutas protegidas de admin
const adminMiddleware = [verifyToken, isAdmin];

// Rutas públicas (no requieren autenticación para ver)
router.get('/', getAllExercises);
router.get('/:id', getExerciseById);

// Rutas protegidas (requieren autenticación y rol admin)
router.post('/', ...adminMiddleware, createExercise);
router.put('/:id', ...adminMiddleware, updateExercise);
router.delete('/:id', ...adminMiddleware, deleteExercise);

export default router;
```

**Explicación:** Se agrupan los middlewares `verifyToken` e `isAdmin` en una constante para mejorar la legibilidad. Las rutas GET son públicas (cualquiera puede ver ejercicios), mientras que POST, PUT y DELETE requieren autenticación y rol admin usando el operador spread. El orden de middlewares es importante: primero se verifica el token y luego el rol. Esto separa responsabilidades (lógica de negocio en controladores, autenticación en middlewares) y permite reutilizar el array de middlewares en múltiples rutas, garantizando consistencia y seguridad.

## 11. Interceptor de Axios (Frontend)

El frontend utiliza interceptores de Axios para manejar automáticamente la autenticación y los errores en todas las peticiones HTTP. Esto centraliza la lógica de autenticación y evita duplicar código en cada componente.

```typescript
import axios, { type AxiosInstance, AxiosError } from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) {
  console.error('Error: VITE_API_URL no está definida en las variables de entorno');
  console.error('Por favor, configura VITE_API_URL en tu archivo .env');
  throw new Error('VITE_API_URL no está configurada. Por favor, configura las variables de entorno.');
}

// Crear instancia de axios
const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para agregar token a las peticiones
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de respuesta
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      const url = error.config?.url || '';
      // No redirigir si es un error de login o cambio de contraseña
      if (!url.includes('/login') && !url.includes('/change-password')) {
        // Token expirado o inválido - solo redirigir si no estamos en login
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
```

**Explicación:** Se crea una instancia de Axios configurada con la URL base de la API desde variables de entorno. El interceptor de request agrega automáticamente el token JWT almacenado en `localStorage` al header `Authorization` de todas las peticiones, evitando tener que añadirlo manualmente en cada llamada. 

El interceptor de response maneja errores 401 (no autorizado): si el token expira o es inválido, limpia el almacenamiento local y redirige al login, excepto en rutas de login o cambio de contraseña donde el error 401 es esperado. Esto garantiza que el usuario siempre esté autenticado y mejora la experiencia de usuario.

## 12. Configuración de Conexión a Base de Datos

Cada microservicio necesita conectarse a MongoDB de forma independiente. Esta función centraliza la configuración de conexión y maneja errores de forma consistente.

```typescript
// configuración de conexión a mongodb para el servicio de autenticación
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async (): Promise<void> => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    
    if (!mongoUri) {
      console.error('Error: MONGODB_URI no está definida en las variables de entorno');
      console.error('Por favor, configura MONGODB_URI en tu archivo .env');
      process.exit(1);
      return;
    }
    
    const conn = await mongoose.connect(mongoUri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Error conectando a MongoDB:', error);
    process.exit(1);
  }
};

export default connectDB;
```

**Explicación:** Esta función configura la conexión a MongoDB usando Mongoose. Primero carga las variables de entorno con `dotenv.config()`. Valida que `MONGODB_URI` esté definida, deteniendo la aplicación si falta para evitar ejecutarse con configuración incorrecta. Si la conexión falla, registra el error y termina el proceso, ya que sin base de datos el microservicio no puede funcionar. Cada microservicio tiene su propia instancia de esta función, permitiendo que cada uno se conecte a su base de datos independiente, siguiendo el principio de microservicios donde cada servicio tiene su propia persistencia.

