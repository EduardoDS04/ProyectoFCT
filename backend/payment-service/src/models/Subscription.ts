import mongoose, { Schema, Document } from 'mongoose';
import { SubscriptionType, SubscriptionStatus, PaymentStatus } from '../types';

// Interfaz que define la estructura de un documento de suscripcion en la base de datos
export interface ISubscriptionDocument extends Document {
  userId: mongoose.Types.ObjectId; // ID del usuario que tiene la suscripcion
  subscriptionType: SubscriptionType; // Tipo de suscripcion (mensual, trimestral, anual)
  startDate: Date; // Fecha de inicio de la suscripcion
  endDate: Date; // Fecha de finalizacion de la suscripcion
  status: SubscriptionStatus; // Estado de la suscripcion (activa, expirada, cancelada, pendiente)
  paymentStatus: PaymentStatus; // Estado del pago (pendiente, completado, fallido, reembolsado)
  amount: number; // Monto pagado por la suscripcion
  bankDetails: {
    cardNumber: string; // Ultimos 4 digitos de la tarjeta de credito
    cardHolder: string; // Nombre del titular de la tarjeta
    expiryDate: string; // Fecha de expiracion de la tarjeta (formato MM/YY)
  };
  createdAt: Date; // Fecha de creacion del registro
  updatedAt: Date; // Fecha de ultima actualizacion del registro
}

// Esquema de Mongoose que define la estructura de la coleccion de suscripciones
const SubscriptionSchema = new Schema<ISubscriptionDocument>(
  {
    // Referencia al usuario propietario de la suscripcion
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true // Indice para busquedas rapidas por usuario
    },
    // Tipo de suscripcion seleccionada por el usuario
    subscriptionType: {
      type: String,
      enum: Object.values(SubscriptionType),
      required: true
    },
    // Fecha de inicio de la suscripcion
    startDate: {
      type: Date,
      required: true,
      default: Date.now // Por defecto es la fecha actual
    },
    // Fecha de finalizacion de la suscripcion
    endDate: {
      type: Date,
      required: true
    },
    // Estado actual de la suscripcion
    status: {
      type: String,
      enum: Object.values(SubscriptionStatus),
      default: SubscriptionStatus.PENDING // Por defecto esta pendiente
    },
    // Estado del pago asociado
    paymentStatus: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.PENDING // Por defecto el pago esta pendiente
    },
    // Monto total pagado por la suscripcion
    amount: {
      type: Number,
      required: true
    },
    // Datos bancarios de la tarjeta utilizada para el pago
    bankDetails: {
      // Solo se guardan los ultimos 4 digitos por seguridad
      cardNumber: {
        type: String,
        required: true
      },
      // Nombre del titular de la tarjeta
      cardHolder: {
        type: String,
        required: true
      },
      // Fecha de expiracion de la tarjeta
      expiryDate: {
        type: String,
        required: true
      }
    }
  },
  {
    timestamps: true // Habilita createdAt y updatedAt automaticamente
  }
);

// Indices compuestos para optimizar busquedas frecuentes
SubscriptionSchema.index({ userId: 1, status: 1 });
SubscriptionSchema.index({ endDate: 1, status: 1 });

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

// Funcion para obtener el precio segun el tipo de suscripcion
// Retorna el monto a pagar para cada tipo de suscripcion
export const getSubscriptionPrice = (type: SubscriptionType): number => {
  switch (type) {
    case SubscriptionType.MONTHLY:
      return 29.99; // Precio mensual
    case SubscriptionType.QUARTERLY:
      return 79.99;  // Precio trimestral (ahorro de ~10 euros vs mensual)
    case SubscriptionType.YEARLY:
      return 299.99; // Precio anual (ahorro de ~60 euros vs mensual)
    default:
      return 0;
  }
};

// Modelo de Mongoose para la coleccion de suscripciones
const Subscription = mongoose.model<ISubscriptionDocument>('Subscription', SubscriptionSchema);

export default Subscription;

