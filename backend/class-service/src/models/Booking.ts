import mongoose, { Schema, Document } from 'mongoose';
import { BookingStatus } from '../types';

export interface IBookingDocument extends Document {
  userId: string;
  userName: string;
  classId: mongoose.Types.ObjectId;
  className: string;
  bookingDate: Date;
  status: BookingStatus;
}

const BookingSchema: Schema = new Schema(
  {
    userId: {
      type: String,
      required: [true, 'El ID del usuario es obligatorio'],
      index: true
    },
    userName: {
      type: String,
      required: [true, 'El nombre del usuario es obligatorio']
    },
    classId: {
      type: Schema.Types.ObjectId,
      ref: 'Class',
      required: [true, 'El ID de la clase es obligatorio'],
      index: true
    },
    className: {
      type: String,
      required: [true, 'El nombre de la clase es obligatorio']
    },
    bookingDate: {
      type: Date,
      default: Date.now,
      required: true
    },
    status: {
      type: String,
      enum: Object.values(BookingStatus),
      default: BookingStatus.CONFIRMED,
      required: true
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

// Índices compuestos para optimizar búsquedas
BookingSchema.index({ userId: 1, status: 1 });
BookingSchema.index({ classId: 1, status: 1 });
BookingSchema.index({ userId: 1, classId: 1 }); // Evitar reservas duplicadas

// Índice unico para evitar que un usuario reserve la misma clase multiples veces
BookingSchema.index(
  { userId: 1, classId: 1, status: 1 },
  { 
    unique: true,
    partialFilterExpression: { status: BookingStatus.CONFIRMED }
  }
);

export default mongoose.model<IBookingDocument>('Booking', BookingSchema);

