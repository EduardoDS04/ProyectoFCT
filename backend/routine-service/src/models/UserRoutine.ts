import mongoose, { Schema, Document } from 'mongoose';

// Interfaz para ejercicios personalizados en la rutina del usuario
export interface IUserRoutineExercise {
  exerciseId: mongoose.Types.ObjectId;
  dayOfWeek: string; // lunes, martes, miércoles, jueves, viernes, sábado, domingo
  sets: number;
  reps: string; // Ej: "10-12", "15", "hasta el fallo"
  weight?: number; // Peso en kg (opcional)
  notes?: string; // Notas adicionales del usuario
}

// Interfaz que define la estructura de una rutina personalizada del usuario
export interface IUserRoutineDocument extends Document {
  userId: mongoose.Types.ObjectId;
  routineName: string;
  exercises: IUserRoutineExercise[];
  createdAt: Date;
  updatedAt: Date;
}

// Esquema de Mongoose para rutinas personalizadas de usuarios
const UserRoutineSchema = new Schema<IUserRoutineDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'User',
      index: true
    },
    routineName: {
      type: String,
      required: true,
      trim: true,
      maxlength: [200, 'El nombre de la rutina no puede exceder 200 caracteres']
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
        min: [1, 'Debe haber al menos 1 serie']
      },
      reps: {
        type: String,
        required: true,
        trim: true,
        maxlength: [50, 'Las repeticiones no pueden exceder 50 caracteres']
      },
      weight: {
        type: Number,
        min: [0, 'El peso no puede ser negativo']
      },
      notes: {
        type: String,
        trim: true,
        maxlength: [500, 'Las notas no pueden exceder 500 caracteres']
      }
    }],
  },
  {
    timestamps: true
  }
);

// Indice compuesto para búsquedas por usuario
UserRoutineSchema.index({ userId: 1, createdAt: -1 });
UserRoutineSchema.index({ userId: 1, routineName: 1 });

// Modelo de Mongoose
const UserRoutine = mongoose.model<IUserRoutineDocument>('UserRoutine', UserRoutineSchema);

export default UserRoutine;

