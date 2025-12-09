import { Response } from 'express';
import UserRoutine from '../models/UserRoutine';
import Exercise from '../models/Exercise';
import { AuthRequest, ApiResponse } from '../types';

// Obtener mi rutina personalizada
export const getMyRoutine = async (
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    const userRoutine = await UserRoutine.findOne({ userId: req.userId })
      .populate('exercises.exerciseId', 'title description youtubeVideoId muscleGroup difficulty thumbnailUrl')
      .select('-__v');

    if (!userRoutine) {
      res.status(404).json({
        success: false,
        message: 'No tienes una rutina personalizada'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: userRoutine
    });
  } catch (error) {
    console.error('Error al obtener rutina personalizada:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener tu rutina personalizada'
    });
  }
};

// Crear o actualizar mi rutina personalizada
export const createOrUpdateMyRoutine = async (
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    const { routineName, exercises } = req.body;

    // Validaciones
    if (!routineName) {
      res.status(400).json({
        success: false,
        message: 'El nombre de la rutina es obligatorio'
      });
      return;
    }

    if (!exercises || !Array.isArray(exercises) || exercises.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Debes añadir al menos un ejercicio'
      });
      return;
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

    // Validar estructura de ejercicios
    for (const exercise of exercises) {
      if (!exercise.exerciseId || !exercise.dayOfWeek || !exercise.sets || !exercise.reps) {
        res.status(400).json({
          success: false,
          message: 'Cada ejercicio debe tener exerciseId, dayOfWeek, sets y reps'
        });
        return;
      }
      if (exercise.sets < 1) {
        res.status(400).json({
          success: false,
          message: 'Cada ejercicio debe tener al menos 1 serie'
        });
        return;
      }
    }

    // Buscar si ya existe una rutina para este usuario
    let userRoutine = await UserRoutine.findOne({ userId: req.userId });
    const isNew = !userRoutine;

    if (userRoutine) {
      // actualizar rutina existente
      userRoutine.routineName = routineName;
      userRoutine.exercises = exercises;
      await userRoutine.save();
    } else {
      // Crear nueva rutina
      userRoutine = new UserRoutine({
        userId: req.userId!,
        routineName,
        exercises
      });
      await userRoutine.save();
    }

    // obtener ejercicios para la respuesta
    await userRoutine.populate('exercises.exerciseId', 'title description youtubeVideoId muscleGroup difficulty thumbnailUrl');

    res.status(200).json({
      success: true,
      data: userRoutine,
      message: isNew ? 'Rutina creada correctamente' : 'Rutina actualizada correctamente'
    });
  } catch (error: any) {
    console.error('Error al crear/actualizar rutina personalizada:', error);
    
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
      message: 'Error al guardar la rutina personalizada'
    });
  }
};

// añadir ejercicio a mi rutina personalizada
export const addExerciseToMyRoutine = async (
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    const { exerciseId, dayOfWeek, sets, reps, weight, notes } = req.body;

    // Validaciones
    if (!exerciseId || !dayOfWeek || !sets || !reps) {
      res.status(400).json({
        success: false,
        message: 'exerciseId, dayOfWeek, sets y reps son obligatorios'
      });
      return;
    }

    if (sets < 1) {
      res.status(400).json({
        success: false,
        message: 'Debe haber al menos 1 serie'
      });
      return;
    }

    // verificar que el ejercicio exista
    const exercise = await Exercise.findById(exerciseId);
    if (!exercise) {
      res.status(404).json({
        success: false,
        message: 'Ejercicio no encontrado'
      });
      return;
    }

    // Buscar o crear rutina del usuario
    let userRoutine = await UserRoutine.findOne({ userId: req.userId });

    if (!userRoutine) {
      userRoutine = new UserRoutine({
        userId: req.userId!,
        routineName: 'Mi Rutina',
        exercises: []
      });
    }

    // añadir ejercicio a la rutina
    const exerciseData: any = {
      exerciseId: exercise._id,
      dayOfWeek: dayOfWeek.toLowerCase(),
      sets,
      reps,
      notes: notes || ''
    };
    
    // solo añadir weight si es mayor que 0
    if (weight !== undefined && weight !== null && weight > 0) {
      exerciseData.weight = weight;
    }
    
    userRoutine.exercises.push(exerciseData);

    await userRoutine.save();
    await userRoutine.populate('exercises.exerciseId', 'title description youtubeVideoId muscleGroup difficulty thumbnailUrl');

    res.status(200).json({
      success: true,
      data: userRoutine,
      message: 'Ejercicio añadido a tu rutina correctamente'
    });
  } catch (error: any) {
    console.error('Error al añadir ejercicio a rutina:', error);
    
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
      message: 'Error al añadir ejercicio a la rutina'
    });
  }
};

// Eliminar ejercicio de mi rutina personalizada
export const removeExerciseFromMyRoutine = async (
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    const { exerciseIndex } = req.params;

    const userRoutine = await UserRoutine.findOne({ userId: req.userId });

    if (!userRoutine) {
      res.status(404).json({
        success: false,
        message: 'No tienes una rutina personalizada'
      });
      return;
    }

    const index = parseInt(exerciseIndex);
    if (isNaN(index) || index < 0 || index >= userRoutine.exercises.length) {
      res.status(400).json({
        success: false,
        message: 'Índice de ejercicio inválido'
      });
      return;
    }

    // Eliminar ejercicio del array
    userRoutine.exercises.splice(index, 1);
    await userRoutine.save();
    await userRoutine.populate('exercises.exerciseId', 'title description youtubeVideoId muscleGroup difficulty thumbnailUrl');

    res.status(200).json({
      success: true,
      data: userRoutine,
      message: 'Ejercicio eliminado de tu rutina correctamente'
    });
  } catch (error) {
    console.error('Error al eliminar ejercicio de rutina:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar ejercicio de la rutina'
    });
  }
};

// actualizar ejercicio en mi rutina personalizada
export const updateExerciseInMyRoutine = async (
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    const { exerciseIndex } = req.params;
    const { dayOfWeek, sets, reps, weight, notes } = req.body;

    const userRoutine = await UserRoutine.findOne({ userId: req.userId });

    if (!userRoutine) {
      res.status(404).json({
        success: false,
        message: 'No tienes una rutina personalizada'
      });
      return;
    }

    const index = parseInt(exerciseIndex);
    if (isNaN(index) || index < 0 || index >= userRoutine.exercises.length) {
      res.status(400).json({
        success: false,
        message: 'Índice de ejercicio inválido'
      });
      return;
    }

    // Actualizar dayOfWeek si se proporciona
    if (dayOfWeek !== undefined) {
      userRoutine.exercises[index].dayOfWeek = dayOfWeek.toLowerCase();
    }
    
    // Actualizar campos del ejercicio
    if (sets !== undefined) {
      if (sets < 1) {
        res.status(400).json({
          success: false,
          message: 'Debe haber al menos 1 serie'
        });
        return;
      }
      userRoutine.exercises[index].sets = sets;
    }
    if (reps !== undefined) {
      userRoutine.exercises[index].reps = reps;
    }
    if (weight !== undefined) {
      // Si weight es null, undefined, o <= 0, eliminar el campo weight
      if (weight === null || weight === undefined || weight <= 0) {
        delete userRoutine.exercises[index].weight;
      } else {
        userRoutine.exercises[index].weight = weight;
      }
    }
    if (notes !== undefined) {
      userRoutine.exercises[index].notes = notes;
    }

    await userRoutine.save();
    await userRoutine.populate('exercises.exerciseId', 'title description youtubeVideoId muscleGroup difficulty thumbnailUrl');

    res.status(200).json({
      success: true,
      data: userRoutine,
      message: 'Ejercicio actualizado correctamente'
    });
  } catch (error) {
    console.error('Error al actualizar ejercicio en rutina:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar el ejercicio'
    });
  }
};

// Reordenar ejercicios en mi rutina personalizada
export const reorderExercisesInMyRoutine = async (
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    const { fromIndex, toIndex } = req.body;

    if (fromIndex === undefined || toIndex === undefined) {
      res.status(400).json({
        success: false,
        message: 'fromIndex y toIndex son obligatorios'
      });
      return;
    }

    const userRoutine = await UserRoutine.findOne({ userId: req.userId });

    if (!userRoutine) {
      res.status(404).json({
        success: false,
        message: 'No tienes una rutina personalizada'
      });
      return;
    }

    const from = parseInt(fromIndex);
    const to = parseInt(toIndex);

    if (isNaN(from) || isNaN(to) || 
        from < 0 || from >= userRoutine.exercises.length ||
        to < 0 || to >= userRoutine.exercises.length) {
      res.status(400).json({
        success: false,
        message: 'Índices inválidos'
      });
      return;
    }

    // Reordenar ejercicios
    const [movedExercise] = userRoutine.exercises.splice(from, 1);
    userRoutine.exercises.splice(to, 0, movedExercise);

    await userRoutine.save();
    await userRoutine.populate('exercises.exerciseId', 'title description youtubeVideoId muscleGroup difficulty thumbnailUrl');

    res.status(200).json({
      success: true,
      data: userRoutine,
      message: 'Ejercicios reordenados correctamente'
    });
  } catch (error) {
    console.error('Error al reordenar ejercicios:', error);
    res.status(500).json({
      success: false,
      message: 'Error al reordenar los ejercicios'
    });
  }
};

// Eliminar mi rutina personalizada completa
export const deleteMyRoutine = async (
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    const userRoutine = await UserRoutine.findOneAndDelete({ userId: req.userId });

    if (!userRoutine) {
      res.status(404).json({
        success: false,
        message: 'No tienes una rutina personalizada'
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Rutina personalizada eliminada correctamente'
    });
  } catch (error) {
    console.error('Error al eliminar rutina personalizada:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar la rutina personalizada'
    });
  }
};

