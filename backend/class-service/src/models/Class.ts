import mongoose, { Schema, Document } from 'mongoose';
import { ClassStatus } from '../types';

export interface IClassDocument extends Document {
  name: string;
  description: string;
  monitorId: string;
  monitorName: string;
  schedule: Date;
  duration: number;
  maxParticipants: number;
  currentParticipants: number;
  room: string;
  status: ClassStatus;
}

const ClassSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'El nombre de la clase es obligatorio'],
      trim: true,
      minlength: [3, 'El nombre debe tener al menos 3 caracteres']
    },
    description: {
      type: String,
      required: [true, 'La descripción es obligatoria'],
      trim: true,
      minlength: [10, 'La descripción debe tener al menos 10 caracteres']
    },
    monitorId: {
      type: String,
      required: [true, 'El ID del monitor es obligatorio'],
      index: true
    },
    monitorName: {
      type: String,
      required: [true, 'El nombre del monitor es obligatorio']
    },
    schedule: {
      type: Date,
      required: [true, 'La fecha y hora son obligatorias'],
      index: true
    },
    duration: {
      type: Number,
      required: [true, 'La duración es obligatoria'],
      min: [15, 'La duración mínima es 15 minutos'],
      max: [180, 'La duración máxima es 180 minutos']
    },
    maxParticipants: {
      type: Number,
      required: [true, 'El número máximo de participantes es obligatorio'],
      min: [1, 'Debe haber al menos 1 participante'],
      max: [50, 'El máximo es 50 participantes']
    },
    currentParticipants: {
      type: Number,
      default: 0,
      min: [0, 'No puede haber participantes negativos']
    },
    room: {
      type: String,
      required: [true, 'La sala es obligatoria'],
      trim: true
    },
    status: {
      type: String,
      enum: Object.values(ClassStatus),
      default: ClassStatus.ACTIVE,
      required: true
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

// Índices compuestos para optimizar búsquedas
ClassSchema.index({ schedule: 1, status: 1 });
ClassSchema.index({ monitorId: 1, schedule: 1 });
ClassSchema.index({ status: 1, schedule: 1 });

// Validación personalizada: currentParticipants no puede exceder maxParticipants
ClassSchema.pre('save', function(next) {
  const doc = this as any;
  if (doc.currentParticipants > doc.maxParticipants) {
    next(new Error('El número de participantes actuales no puede exceder el máximo'));
  } else {
    next();
  }
});

// Método para verificar si hay cupo disponible
ClassSchema.methods.hasAvailableSlots = function(): boolean {
  return this.currentParticipants < this.maxParticipants;
};

// Método para verificar si la clase está en el futuro
ClassSchema.methods.isFuture = function(): boolean {
  return new Date(this.schedule) > new Date();
};

export default mongoose.model<IClassDocument>('Class', ClassSchema);

