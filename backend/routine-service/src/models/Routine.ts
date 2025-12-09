import mongoose, { Schema, Document } from 'mongoose';

// Interfaz para ejercicios dentro de una rutina predefinida
export interface IRoutineExercise {
  exerciseId: mongoose.Types.ObjectId;
  dayOfWeek: string;
  sets: number;
  reps: string;
  weight?: number;
}

// Interfaz que define la estructura de una rutina predefinida
export interface IRoutineDocument extends Document {
  title: string;
  description: string;
  exercises: IRoutineExercise[];
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// Esquema de Mongoose para rutinas predefinidas
const RoutineSchema = new Schema<IRoutineDocument>(
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
    exercises: [{
      exerciseId: {
        type: Schema.Types.ObjectId,
        ref: 'Exercise',
        required: true
      },
      dayOfWeek: {
        type: String,
        required: true,
        enum: ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'],
        lowercase: true
      },
      sets: {
        type: Number,
        required: true,
        min: [1, 'Debe tener al menos 1 serie']
      },
      reps: {
        type: String,
        required: true,
        trim: true
      },
      weight: {
        type: Number,
        min: [0, 'El peso no puede ser negativo']
      }
    }],
    createdBy: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'User',
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Indices
RoutineSchema.index({ createdBy: 1, createdAt: -1 });
RoutineSchema.index({ title: 'text', description: 'text' });

// Modelo de Mongoose
const Routine = mongoose.model<IRoutineDocument>('Routine', RoutineSchema);

export default Routine;

