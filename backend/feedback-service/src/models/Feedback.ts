import mongoose, { Schema, Document } from 'mongoose';
import { FeedbackType } from '../types';

// Interfaz para los mensajes de la conversacion
export interface IFeedbackMessage {
  _id?: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId; // ID del remitente
  senderName: string; // Nombre del remitente
  senderRole: 'admin' | 'socio'; // Rol del remitente
  message: string; // Contenido del mensaje
  createdAt: Date; // Fecha de creacion del mensaje
}

// Interfaz que define la estructura de un documento de feedback en la base de datos
export interface IFeedbackDocument extends Document {
  userId: mongoose.Types.ObjectId; // ID del usuario que envio el feedback inicial
  userName: string; // Nombre del usuario que envio el feedback inicial
  message: string; // Contenido del mensaje inicial (queja, valoracion o duda)
  type: FeedbackType; // Tipo de feedback (queja, valoracion, duda)
  messages: IFeedbackMessage[]; // Array de mensajes de la conversacion
  lastReadBySocio?: Date; // Fecha en que el socio leyo por ultima vez los mensajes
  lastReadByAdmin?: Date; // Fecha en que el admin vio por ultima vez el feedback
  archived?: boolean; // Indica si el feedback ha sido archivado por el admin
  lastReadArchivedByAdmin?: Date; // Fecha en que el admin vio por ultima vez los mensajes nuevos en archivados
  createdAt: Date; // Fecha de creacion del feedback
  updatedAt: Date; // Fecha de ultima actualizacion
}

// Esquema de Mongoose que define la estructura de la coleccion de feedbacks
const FeedbackSchema = new Schema<IFeedbackDocument>(
  {
    // Referencia al usuario que envio el feedback
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true // Indice para busquedas rapidas por usuario
    },
    // Nombre del usuario que envio el feedback
    userName: {
      type: String,
      required: true
    },
    // Contenido del mensaje de feedback
    message: {
      type: String,
      required: true,
      trim: true, // Elimina espacios en blanco al inicio y final
      maxlength: [3000, 'El mensaje no puede exceder 3000 caracteres']
    },
    // Tipo de feedback seleccionado por el usuario
    type: {
      type: String,
      enum: Object.values(FeedbackType),
      required: true
    },
    // Array de mensajes de la conversacion (respuestas del admin y del socio)
    messages: [{
      senderId: {
        type: Schema.Types.ObjectId,
        required: true
      },
      senderName: {
        type: String,
        required: true
      },
      senderRole: {
        type: String,
        enum: ['admin', 'socio'],
        required: true
      },
      message: {
        type: String,
        required: true,
        trim: true,
        maxlength: [3000, 'El mensaje no puede exceder 3000 caracteres']
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }],
    // Fecha en que el socio leyo por ultima vez los mensajes
    lastReadBySocio: {
      type: Date
    },
    // Fecha en que el admin vio por ultima vez el feedback (para ocultar el contador)
    lastReadByAdmin: {
      type: Date
    },
    // Indica si el feedback ha sido archivado por el admin
    archived: {
      type: Boolean,
      default: false
    },
    // Fecha en que el admin vio por ultima vez los mensajes nuevos en feedbacks archivados
    lastReadArchivedByAdmin: {
      type: Date
    }
  },
  {
    timestamps: true // Habilita createdAt y updatedAt automaticamente
  }
);

// Indice compuesto para optimizar busquedas frecuentes
FeedbackSchema.index({ userId: 1, createdAt: -1 });
FeedbackSchema.index({ type: 1, createdAt: -1 });
// Indice para buscar feedbacks con mensajes sin leer
FeedbackSchema.index({ 'messages.createdAt': -1 });

// Modelo de Mongoose para la coleccion de feedbacks
const Feedback = mongoose.model<IFeedbackDocument>('Feedback', FeedbackSchema);

export default Feedback;

