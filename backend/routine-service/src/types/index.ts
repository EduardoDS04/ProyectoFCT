import { Request } from 'express';

// Enum de roles de usuario
export enum UserRole {
  SOCIO = 'socio',
  MONITOR = 'monitor',
  ADMIN = 'admin'
}

// Tipos para las peticiones autenticadas
export interface AuthRequest extends Request {
  userId?: string;
  userRole?: UserRole;
  userEmail?: string;
  userName?: string;
}

// Respuesta del Auth Service
export interface AuthServiceUserResponse {
  success: boolean;
  data?: {
    _id: string;
    email: string;
    name: string;
    role: UserRole;
  };
  message?: string;
}

// Respuesta estándar de la API
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
}

// Enum de grupos musculares
export enum MuscleGroup {
  PECHO = 'pecho',
  ESPALDA = 'espalda',
  HOMBROS = 'hombros',
  BICEPS = 'biceps',
  TRICEPS = 'triceps',
  ANTEBRAZOS = 'antebrazos',
  CUADRICEPS = 'cuadriceps',
  ISQUIOTIBIALES = 'isquiotibiales',
  GEMELO = 'gemelo',
  GLUTEOS = 'gluteos',
  LUMBARES = 'lumbares',
  ABDOMINALES = 'abdominales',
  CARDIO = 'cardio',
  FULL_BODY = 'full_body'
}

// Enum de dias de la semana
export enum DayOfWeek {
  LUNES = 'lunes',
  MARTES = 'martes',
  MIERCOLES = 'miercoles',
  JUEVES = 'jueves',
  VIERNES = 'viernes',
  SABADO = 'sabado',
  DOMINGO = 'domingo'
}

// Enum de nivel de dificultad
export enum Difficulty {
  PRINCIPIANTE = 'principiante',
  INTERMEDIO = 'intermedio',
  AVANZADO = 'avanzado'
}

