import { Response } from 'express';
import Exercise from '../models/Exercise';
import { AuthRequest, ApiResponse, MuscleGroup } from '../types';

// Obtener todos los ejercicios (público)
export const getAllExercises = async (
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    const { muscleGroup, difficulty, search } = req.query;

    // Construir filtro
    const filter: any = {};
    if (muscleGroup) {
      // Buscar ejercicios que contengan el grupo muscular especificado en el array
      filter.muscleGroup = { $in: [muscleGroup] };
    }
    if (difficulty) filter.difficulty = difficulty;
    if (search) {
      filter.$text = { $search: search as string };
    }

    const exercises = await Exercise.find(filter)
      .select('-__v')
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      data: exercises
    });
  } catch (error) {
    console.error('Error al obtener ejercicios:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener los ejercicios'
    });
  }
};

// Obtener ejercicio por ID
export const getExerciseById = async (
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    const { id } = req.params;

    const exercise = await Exercise.findById(id).select('-__v').lean();

    if (!exercise) {
      res.status(404).json({
        success: false,
        message: 'Ejercicio no encontrado'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: exercise
    });
  } catch (error) {
    console.error('Error al obtener ejercicio:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el ejercicio'
    });
  }
};

// Crear ejercicio (Admin)
export const createExercise = async (
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    const { title, description, youtubeVideoId, muscleGroup, difficulty } = req.body;

    // Validaciones
    if (!title || !description || !youtubeVideoId || !difficulty) {
      res.status(400).json({
        success: false,
        message: 'Todos los campos son obligatorios'
      });
      return;
    }

    // Validar que muscleGroup sea un array con al menos un elemento
    if (!Array.isArray(muscleGroup) || muscleGroup.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Debe seleccionar al menos un grupo muscular'
      });
      return;
    }

    // Verificar que el ejercicio no exista ya con el mismo video
    const existingExercise = await Exercise.findOne({ youtubeVideoId });
    if (existingExercise) {
      res.status(400).json({
        success: false,
        message: 'Ya existe un ejercicio con este video de YouTube'
      });
      return;
    }

    // Validar que todos los grupos musculares sean válidos
    const validGroups = muscleGroup.filter((group: string) => 
      Object.values(MuscleGroup).includes(group as MuscleGroup)
    );
    
    if (validGroups.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Debe seleccionar al menos un grupo muscular válido'
      });
      return;
    }

    const exercise = new Exercise({
      title,
      description,
      youtubeVideoId,
      muscleGroup: validGroups,
      difficulty,
      createdBy: req.userId
    });

    await exercise.save();

    res.status(201).json({
      success: true,
      data: exercise,
      message: 'Ejercicio creado correctamente'
    });
  } catch (error: any) {
    console.error('Error al crear ejercicio:', error);
    
    if (error.name === 'ValidationError' && error.errors) {
      const firstError = Object.values(error.errors)[0] as { message?: string };
      res.status(400).json({
        success: false,
        message: firstError?.message || 'Error de validación'
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Error al crear el ejercicio'
    });
  }
};

// Actualizar ejercicio (Admin)
export const updateExercise = async (
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, description, youtubeVideoId, muscleGroup, difficulty } = req.body;

    const exercise = await Exercise.findById(id);

    if (!exercise) {
      res.status(404).json({
        success: false,
        message: 'Ejercicio no encontrado'
      });
      return;
    }

    // Actualizar campos
    if (title) exercise.title = title;
    if (description) exercise.description = description;
    if (youtubeVideoId) exercise.youtubeVideoId = youtubeVideoId;
    if (muscleGroup) {
      // Validar que muscleGroup sea un array con al menos un elemento
      if (!Array.isArray(muscleGroup) || muscleGroup.length === 0) {
        res.status(400).json({
          success: false,
          message: 'Debe seleccionar al menos un grupo muscular'
        });
        return;
      }
      // Validar que todos los grupos musculares sean válidos
      const validGroups = muscleGroup.filter((group: string) => 
        Object.values(MuscleGroup).includes(group as MuscleGroup)
      );
      if (validGroups.length === 0) {
        res.status(400).json({
          success: false,
          message: 'Debe seleccionar al menos un grupo muscular válido'
        });
        return;
      }
      exercise.muscleGroup = validGroups;
    }
    if (difficulty) exercise.difficulty = difficulty;

    await exercise.save();

    res.status(200).json({
      success: true,
      data: exercise,
      message: 'Ejercicio actualizado correctamente'
    });
  } catch (error: any) {
    console.error('Error al actualizar ejercicio:', error);
    
    if (error.name === 'ValidationError' && error.errors) {
      const firstError = Object.values(error.errors)[0] as { message?: string };
      res.status(400).json({
        success: false,
        message: firstError?.message || 'Error de validación'
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Error al actualizar el ejercicio'
    });
  }
};

// Eliminar ejercicio (Admin)
export const deleteExercise = async (
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    const { id } = req.params;

    const exercise = await Exercise.findByIdAndDelete(id);

    if (!exercise) {
      res.status(404).json({
        success: false,
        message: 'Ejercicio no encontrado'
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Ejercicio eliminado correctamente'
    });
  } catch (error) {
    console.error('Error al eliminar ejercicio:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar el ejercicio'
    });
  }
};

