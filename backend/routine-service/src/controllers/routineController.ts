import { Response } from 'express';
import Routine from '../models/Routine';
import Exercise from '../models/Exercise';
import { AuthRequest, ApiResponse } from '../types';

// Obtener todas las rutinas predefinidas con ejercicios
export const getAllRoutines = async (
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    const routines = await Routine.find()
    //Reemplaza los IDs de ejercicios por sus datos completos (solo los campos especificados)
      .populate('exercises.exerciseId', 'title description youtubeVideoId muscleGroup difficulty thumbnailUrl')
      .select('-__v')
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      data: routines
    });
  } catch (error) {
    console.error('Error al obtener rutinas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener las rutinas'
    });
  }
};

// Obtener rutina por ID con ejercicios
export const getRoutineById = async (
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    const { id } = req.params;

    const routine = await Routine.findById(id)
      .populate('exercises.exerciseId', 'title description youtubeVideoId muscleGroup difficulty thumbnailUrl')
      .select('-__v')
      .lean();

    if (!routine) {
      res.status(404).json({
        success: false,
        message: 'Rutina no encontrada'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: routine
    });
  } catch (error) {
    console.error('Error al obtener rutina:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener la rutina'
    });
  }
};

// Crear rutina predefinida (Admin)
export const createRoutine = async (
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    const { title, description, exercises } = req.body;

    // Validaciones
    if (!title || !description || !exercises || !Array.isArray(exercises) || exercises.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Título, descripción y al menos un ejercicio son obligatorios'
      });
      return;
    }

    // Validar estructura de ejercicios
    for (const exercise of exercises) {
      if (!exercise.exerciseId || !exercise.dayOfWeek || !exercise.sets || !exercise.reps) {
        res.status(400).json({
          success: false,
          message: 'Cada ejercicio debe tener exerciseId, dayOfWeek, sets y reps'
        });
        return;
      }
    }

    // Verificar que todos los ejercicios existan
    const exerciseIds = exercises.map((ex: any) => ex.exerciseId);
    const existingExercises = await Exercise.find({ _id: { $in: exerciseIds } });
    if (existingExercises.length !== exerciseIds.length) {
      res.status(400).json({
        success: false,
        message: 'Uno o más ejercicios no existen'
      });
      return;
    }

    const routine = new Routine({
      title,
      description,
      exercises,
      createdBy: req.userId
    });

    await routine.save();

    // obtener ejercicios para la respuesta
    await routine.populate('exercises.exerciseId', 'title description youtubeVideoId muscleGroup difficulty thumbnailUrl');

    res.status(201).json({
      success: true,
      data: routine,
      message: 'Rutina creada correctamente'
    });
  } catch (error: any) {
    console.error('Error al crear rutina:', error);
    
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
      message: 'Error al crear la rutina'
    });
  }
};

// Actualizar rutina predefinida (Admin)
export const updateRoutine = async (
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, description, exercises } = req.body;

    const routine = await Routine.findById(id);

    if (!routine) {
      res.status(404).json({
        success: false,
        message: 'Rutina no encontrada'
      });
      return;
    }

    // Actualizar campos
    if (title) routine.title = title;
    if (description) routine.description = description;
    if (exercises && Array.isArray(exercises)) {
      // Validar estructura de ejercicios
      for (const exercise of exercises) {
        if (!exercise.exerciseId || !exercise.sets || !exercise.reps) {
          res.status(400).json({
            success: false,
            message: 'Cada ejercicio debe tener exerciseId, sets y reps'
          });
          return;
        }
      }
      
      // Verificar que todos los ejercicios existan
      const exerciseIds = exercises.map((ex: any) => ex.exerciseId);
      const existingExercises = await Exercise.find({ _id: { $in: exerciseIds } });
      if (existingExercises.length !== exerciseIds.length) {
        res.status(400).json({
          success: false,
          message: 'Uno o más ejercicios no existen'
        });
        return;
      }
      routine.exercises = exercises;
    }

    await routine.save();
    await routine.populate('exercises.exerciseId', 'title description youtubeVideoId muscleGroup difficulty thumbnailUrl');

    res.status(200).json({
      success: true,
      data: routine,
      message: 'Rutina actualizada correctamente'
    });
  } catch (error: any) {
    console.error('Error al actualizar rutina:', error);
    
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
      message: 'Error al actualizar la rutina'
    });
  }
};

// Eliminar rutina predefinida (Admin)
export const deleteRoutine = async (
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    const { id } = req.params;

    const routine = await Routine.findByIdAndDelete(id);

    if (!routine) {
      res.status(404).json({
        success: false,
        message: 'Rutina no encontrada'
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Rutina eliminada correctamente'
    });
  } catch (error) {
    console.error('Error al eliminar rutina:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar la rutina'
    });
  }
};

