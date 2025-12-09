import mongoose, { Schema, Document } from 'mongoose';
import { MuscleGroup, Difficulty } from '../types';

// Interfaz que define la estructura de un ejercicio
export interface IExerciseDocument extends Document {
  title: string;
  description: string;
  youtubeVideoId: string;
  muscleGroup: MuscleGroup[];
  difficulty: Difficulty;
  thumbnailUrl?: string;
  createdBy: mongoose.Types.ObjectId;
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
      ref: 'User',
      index: true
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

