// Tipos compartidos para el microservicio de feedback
import { Request } from 'express';

export enum UserRole {
  SOCIO = 'socio',
  MONITOR = 'monitor',
  ADMIN = 'admin'
}

// Tipo de feedback
export enum FeedbackType {
  QUEJA = 'queja',
  VALORACION = 'valoracion',
  DUDA = 'duda'
}

// Request con informacion de autenticacion
export interface AuthRequest extends Request {
  userId?: string;
  userRole?: UserRole;
  userEmail?: string;
  userName?: string;
}

// Respuesta del Auth Service con datos del usuario
export interface AuthServiceUserResponse {
  success: boolean;
  data?: {
    id?: string;  // El auth-service devuelve 'id'
    _id?: string; // Fallback por compatibilidad
    name: string;
    email: string;
    role: UserRole;
    phone?: string;
    isActive: boolean;
  };
  message?: string;
}

// Respuesta de la API
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
}

// DTO para crear un feedback
export interface CreateFeedbackDTO {
  message: string;
  type: FeedbackType;
}

// DTO para responder a un feedback
export interface RespondFeedbackDTO {
  message: string;
}

