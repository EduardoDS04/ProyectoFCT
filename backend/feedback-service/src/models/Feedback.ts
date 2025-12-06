import mongoose, { Schema, Document } from 'mongoose';
import { FeedbackType } from '../types';

// Interfaz que define la estructura de un documento de feedback en la base de datos
export interface IFeedbackDocument extends Document {
  userId: mongoose.Types.ObjectId; // ID del usuario que envio el feedback
  userName: string; // Nombre del usuario que envio el feedback
  message: string; // Contenido del mensaje (queja, valoracion o duda)
  type: FeedbackType; // Tipo de feedback (queja, valoracion, duda)
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
      minlength: [10, 'El mensaje debe tener al menos 10 caracteres'],
      maxlength: [1000, 'El mensaje no puede exceder 1000 caracteres']
    },
    // Tipo de feedback seleccionado por el usuario
    type: {
      type: String,
      enum: Object.values(FeedbackType),
      required: true
    }
  },
  {
    timestamps: true // Habilita createdAt y updatedAt automaticamente
  }
);

// Indice compuesto para optimizar busquedas frecuentes
FeedbackSchema.index({ userId: 1, createdAt: -1 });
FeedbackSchema.index({ type: 1, createdAt: -1 });

// Modelo de Mongoose para la coleccion de feedbacks
const Feedback = mongoose.model<IFeedbackDocument>('Feedback', FeedbackSchema);

export default Feedback;

