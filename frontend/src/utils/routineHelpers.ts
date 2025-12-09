import type { MuscleGroup, Difficulty, Exercise } from '../types';
import { MuscleGroup as MuscleGroupEnum, Difficulty as DifficultyEnum, DayOfWeek as DayOfWeekEnum } from '../types';

// Mapeo de etiquetas para grupos musculares
const MUSCLE_GROUP_LABELS: Record<MuscleGroup, string> = {
  [MuscleGroupEnum.PECHO]: 'Pecho',
  [MuscleGroupEnum.ESPALDA]: 'Espalda',
  [MuscleGroupEnum.HOMBROS]: 'Hombros',
  [MuscleGroupEnum.BICEPS]: 'Bíceps',
  [MuscleGroupEnum.TRICEPS]: 'Tríceps',
  [MuscleGroupEnum.ANTEBRAZOS]: 'Antebrazos',
  [MuscleGroupEnum.CUADRICEPS]: 'Cuádriceps',
  [MuscleGroupEnum.ISQUIOTIBIALES]: 'Isquiotibiales',
  [MuscleGroupEnum.GEMELO]: 'Gemelo',
  [MuscleGroupEnum.GLUTEOS]: 'Glúteos',
  [MuscleGroupEnum.LUMBARES]: 'Lumbares',
  [MuscleGroupEnum.ABDOMINALES]: 'Abdominales',
  [MuscleGroupEnum.CARDIO]: 'Cardio',
  [MuscleGroupEnum.FULL_BODY]: 'Cuerpo Completo'
};

// Mapeo de etiquetas para dificultad
const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  [DifficultyEnum.PRINCIPIANTE]: 'Principiante',
  [DifficultyEnum.INTERMEDIO]: 'Intermedio',
  [DifficultyEnum.AVANZADO]: 'Avanzado'
};

// Mapeo de etiquetas para días de la semana
const DAY_LABELS: Record<string, string> = {
  [DayOfWeekEnum.LUNES]: 'Lunes',
  [DayOfWeekEnum.MARTES]: 'Martes',
  [DayOfWeekEnum.MIERCOLES]: 'Miércoles',
  [DayOfWeekEnum.JUEVES]: 'Jueves',
  [DayOfWeekEnum.VIERNES]: 'Viernes',
  [DayOfWeekEnum.SABADO]: 'Sábado',
  [DayOfWeekEnum.DOMINGO]: 'Domingo'
};

// obtener la etiqueta legible de un grupo muscular
export const getMuscleGroupLabel = (group: MuscleGroup): string => {
  return MUSCLE_GROUP_LABELS[group] || group;
};

// obtener la etiqueta legible de un nivel de dificultad
export const getDifficultyLabel = (difficulty: Difficulty): string => {
  return DIFFICULTY_LABELS[difficulty] || difficulty;
};

// obtener la etiqueta legible de un día de la semana
export const getDayLabel = (day: string): string => {
  return DAY_LABELS[day.toLowerCase()] || day;
};

// normalizar grupos musculares a un array
export const normalizeMuscleGroups = (groups: MuscleGroup[] | MuscleGroup | undefined | null): MuscleGroup[] => {
  if (!groups) return [];
  if (typeof groups === 'string') return [groups as MuscleGroup];
  if (Array.isArray(groups)) return groups;
  return [];
};

// obtener las etiquetas legibles de múltiples grupos musculares separadas por coma
export const getMuscleGroupsLabel = (groups: MuscleGroup[] | MuscleGroup | undefined | null): string => {
  if (!groups) return '';
  if (typeof groups === 'string') return getMuscleGroupLabel(groups as MuscleGroup);
  if (Array.isArray(groups)) return groups.map(group => getMuscleGroupLabel(group)).join(', ');
  return '';
};

// alternar un elemento en un Set: si el elemento existe lo elimina, si no existe lo agrega
export const toggleSetItem = <T>(set: Set<T>, item: T): Set<T> => {
  const newSet = new Set(set);
  if (newSet.has(item)) {
    newSet.delete(item);
  } else {
    newSet.add(item);
  }
  return newSet;
};

// obtener la URL de la miniatura del ejercicio (usar la del ejercicio o generar una de YouTube)
export const getThumbnailUrl = (exercise: Exercise): string => {
  return exercise.thumbnailUrl || `https://img.youtube.com/vi/${exercise.youtubeVideoId}/mqdefault.jpg`;
};

