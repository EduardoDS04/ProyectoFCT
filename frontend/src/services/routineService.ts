import axios from 'axios';
import type {
  Exercise,
  Routine,
  RoutineExercise,
  UserRoutine,
  CreateExerciseData,
  CreateRoutineData,
  AddExerciseToRoutineData,
  ApiResponse,
  MuscleGroup
} from '../types';

const ROUTINE_SERVICE_URL = import.meta.env.VITE_ROUTINE_SERVICE_URL;

if (!ROUTINE_SERVICE_URL) {
  console.error('Error: VITE_ROUTINE_SERVICE_URL no está definida en las variables de entorno');
  console.error('Por favor, configura VITE_ROUTINE_SERVICE_URL en tu archivo .env');
  throw new Error('VITE_ROUTINE_SERVICE_URL no está configurada. Por favor, configura las variables de entorno.');
}

// Crear instancia de axios para el servicio de rutinas
const routineApi = axios.create({
  baseURL: ROUTINE_SERVICE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para agregar token a las peticiones
routineApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Funciones helper para normalizar muscleGroup a array (compatibilidad con datos antiguos)
const normalizeExercise = (exercise: Exercise | Record<string, unknown>): Exercise => {
  const ex = exercise as Exercise;
  if (ex && ex.muscleGroup) {
    // Si muscleGroup no es un array, convertirlo a array
    if (!Array.isArray(ex.muscleGroup)) {
      ex.muscleGroup = [ex.muscleGroup as MuscleGroup];
    }
  }
  return ex;
};

// Función helper para normalizar arrays de ejercicios
const normalizeExercises = (exercises: (Exercise | Record<string, unknown>)[]): Exercise[] => {
  return exercises.map(ex => normalizeExercise(ex));
};

// Función helper para normalizar rutinas (normalizar exerciseId dentro de cada RoutineExercise)
const normalizeRoutine = (routine: Routine | Record<string, unknown>): Routine => {
  const r = routine as Routine;
  if (r && r.exercises && Array.isArray(r.exercises)) {
    r.exercises = r.exercises.map((routineExercise: RoutineExercise | Record<string, unknown>) => {
      const re = routineExercise as RoutineExercise;
      // Si exerciseId es un objeto Exercise, normalizarlo
      if (re.exerciseId && typeof re.exerciseId === 'object' && '_id' in re.exerciseId) {
        re.exerciseId = normalizeExercise(re.exerciseId as Exercise) as Exercise;
      }
      return re;
    });
  }
  return r;
};

const normalizeRoutines = (routines: (Routine | Record<string, unknown>)[]): Routine[] => {
  return routines.map(r => normalizeRoutine(r));
};

class RoutineService {
  // obtener todos los ejercicios
  async getAllExercises(filters?: { muscleGroup?: string; difficulty?: string; search?: string }): Promise<Exercise[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.muscleGroup) params.append('muscleGroup', filters.muscleGroup);
      if (filters?.difficulty) params.append('difficulty', filters.difficulty);
      if (filters?.search) params.append('search', filters.search);

      const response = await routineApi.get<ApiResponse<Exercise[]>>(`/api/exercises?${params.toString()}`);
      if (response.data.success && response.data.data) {
        return normalizeExercises(response.data.data);
      }
      throw new Error(response.data.message || 'Error al obtener los ejercicios');
    } catch (error) {
      console.error('Error al obtener ejercicios:', error);
      throw error;
    }
  }

  // obtener ejercicio por ID
  async getExerciseById(id: string): Promise<Exercise> {
    try {
      const response = await routineApi.get<ApiResponse<Exercise>>(`/api/exercises/${id}`);
      if (response.data.success && response.data.data) {
        return normalizeExercise(response.data.data);
      }
      throw new Error(response.data.message || 'Error al obtener el ejercicio');
    } catch (error) {
      console.error('Error al obtener ejercicio:', error);
      throw error;
    }
  }

  // crear ejercicio (Admin)
  async createExercise(data: CreateExerciseData): Promise<Exercise> {
    try {
      const response = await routineApi.post<ApiResponse<Exercise>>('/api/exercises', data);
      if (response.data.success && response.data.data) {
        return normalizeExercise(response.data.data);
      }
      throw new Error(response.data.message || 'Error al crear el ejercicio');
    } catch (error) {
      console.error('Error al crear ejercicio:', error);
      throw error;
    }
  }

  // actualizar ejercicio (Admin)
  async updateExercise(id: string, data: Partial<CreateExerciseData>): Promise<Exercise> {
    try {
      const response = await routineApi.put<ApiResponse<Exercise>>(`/api/exercises/${id}`, data);
      if (response.data.success && response.data.data) {
        return normalizeExercise(response.data.data);
      }
      throw new Error(response.data.message || 'Error al actualizar el ejercicio');
    } catch (error) {
      console.error('Error al actualizar ejercicio:', error);
      throw error;
    }
  }

  // Eliminar ejercicio (Admin)
  async deleteExercise(id: string): Promise<void> {
    try {
      const response = await routineApi.delete<ApiResponse>(`/api/exercises/${id}`);
      if (!response.data.success) {
        throw new Error(response.data.message || 'Error al eliminar el ejercicio');
      }
    } catch (error) {
      console.error('Error al eliminar ejercicio:', error);
      throw error;
    }
  }

  // obtener todas las rutinas predefinidas
  async getAllRoutines(): Promise<Routine[]> {
    try {
      const response = await routineApi.get<ApiResponse<Routine[]>>('/api/routines');
      if (response.data.success && response.data.data) {
        return normalizeRoutines(response.data.data);
      }
      throw new Error(response.data.message || 'Error al obtener las rutinas');
    } catch (error) {
      console.error('Error al obtener rutinas:', error);
      throw error;
    }
  }

  // Obtener rutina por ID
  async getRoutineById(id: string): Promise<Routine> {
    try {
      const response = await routineApi.get<ApiResponse<Routine>>(`/api/routines/${id}`);
      if (response.data.success && response.data.data) {
        return normalizeRoutine(response.data.data);
      }
      throw new Error(response.data.message || 'Error al obtener la rutina');
    } catch (error) {
      console.error('Error al obtener rutina:', error);
      throw error;
    }
  }

  // crear rutina predefinida (Admin)
  async createRoutine(data: CreateRoutineData): Promise<Routine> {
    try {
      const response = await routineApi.post<ApiResponse<Routine>>('/api/routines', data);
      if (response.data.success && response.data.data) {
        return normalizeRoutine(response.data.data);
      }
      throw new Error(response.data.message || 'Error al crear la rutina');
    } catch (error) {
      console.error('Error al crear rutina:', error);
      throw error;
    }
  }

  // actualizar rutina predefinida (Admin)
  async updateRoutine(id: string, data: Partial<CreateRoutineData>): Promise<Routine> {
    try {
      const response = await routineApi.put<ApiResponse<Routine>>(`/api/routines/${id}`, data);
      if (response.data.success && response.data.data) {
        return normalizeRoutine(response.data.data);
      }
      throw new Error(response.data.message || 'Error al actualizar la rutina');
    } catch (error) {
      console.error('Error al actualizar rutina:', error);
      throw error;
    }
  }

  // eliminar rutina predefinida (Admin)
  async deleteRoutine(id: string): Promise<void> {
    try {
      const response = await routineApi.delete<ApiResponse>(`/api/routines/${id}`);
      if (!response.data.success) {
        throw new Error(response.data.message || 'Error al eliminar la rutina');
      }
    } catch (error) {
      console.error('Error al eliminar rutina:', error);
      throw error;
    }
  }
  // Obtener mi rutina personalizada
  async getMyRoutine(): Promise<UserRoutine | null> {
    try {
      const response = await routineApi.get<ApiResponse<UserRoutine>>('/api/user-routines/me');
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      // Si no tiene rutina, devolver null en lugar de error
      if (response.data.message?.includes('No tienes')) {
        return null;
      }
      throw new Error(response.data.message || 'Error al obtener tu rutina');
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null;
      }
      console.error('Error al obtener mi rutina:', error);
      throw error;
    }
  }

  // crear o actualizar mi rutina personalizada
  async createOrUpdateMyRoutine(routineName: string, exercises: AddExerciseToRoutineData[]): Promise<UserRoutine> {
    try {
      const response = await routineApi.post<ApiResponse<UserRoutine>>('/api/user-routines/me', {
        routineName,
        exercises
      });
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Error al guardar tu rutina');
    } catch (error) {
      console.error('Error al guardar rutina:', error);
      throw error;
    }
  }

  // añadir ejercicio a mi rutina personalizada
  async addExerciseToMyRoutine(data: AddExerciseToRoutineData): Promise<UserRoutine> {
    try {
      const response = await routineApi.post<ApiResponse<UserRoutine>>('/api/user-routines/me/exercises', data);
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Error al añadir ejercicio a tu rutina');
    } catch (error) {
      console.error('Error al añadir ejercicio:', error);
      throw error;
    }
  }

  // Actualizar ejercicio en mi rutina personalizada
  async updateExerciseInMyRoutine(exerciseIndex: number, data: Partial<AddExerciseToRoutineData>): Promise<UserRoutine> {
    try {
      const response = await routineApi.put<ApiResponse<UserRoutine>>(`/api/user-routines/me/exercises/${exerciseIndex}`, data);
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Error al actualizar ejercicio');
    } catch (error) {
      console.error('Error al actualizar ejercicio:', error);
      throw error;
    }
  }

  // Reordenar ejercicios en mi rutina personalizada
  async reorderExercisesInMyRoutine(fromIndex: number, toIndex: number): Promise<UserRoutine> {
    try {
      const response = await routineApi.post<ApiResponse<UserRoutine>>('/api/user-routines/me/exercises/reorder', {
        fromIndex,
        toIndex
      });
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Error al reordenar ejercicios');
    } catch (error) {
      console.error('Error al reordenar ejercicios:', error);
      throw error;
    }
  }

  // eliminar ejercicio de mi rutina personalizada
  async removeExerciseFromMyRoutine(exerciseIndex: number): Promise<UserRoutine> {
    try {
      const response = await routineApi.delete<ApiResponse<UserRoutine>>(`/api/user-routines/me/exercises/${exerciseIndex}`);
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Error al eliminar ejercicio de tu rutina');
    } catch (error) {
      console.error('Error al eliminar ejercicio:', error);
      throw error;
    }
  }

  // eliminar mi rutina personalizada completa
  async deleteMyRoutine(): Promise<void> {
    try {
      const response = await routineApi.delete<ApiResponse>('/api/user-routines/me');
      if (!response.data.success) {
        throw new Error(response.data.message || 'Error al eliminar tu rutina');
      }
    } catch (error) {
      console.error('Error al eliminar rutina:', error);
      throw error;
    }
  }
}

const routineService = new RoutineService();
export default routineService;

