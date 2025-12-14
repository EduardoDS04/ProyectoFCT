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
