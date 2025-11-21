import { Request } from 'express';

// Enums
export enum UserRole {
  SOCIO = 'socio',
  MONITOR = 'monitor',
  ADMIN = 'admin'
}

export enum ClassStatus {
  ACTIVE = 'active',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed'
}

export enum BookingStatus {
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed'
}

// Interfaces de Clase
export interface IClass {
  _id?: string;
  name: string;
  description: string;
  monitorId: string;
  monitorName?: string;
  schedule: Date;
  duration: number; // en minutos
  maxParticipants: number;
  currentParticipants: number;
  room: string;
  status: ClassStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

// Interfaces de Reserva
export interface IBooking {
  _id?: string;
  userId: string;
  userName?: string;
  classId: string;
  className?: string;
  bookingDate: Date;
  status: BookingStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

// Request con usuario autenticado (desde Auth Service)
export interface AuthRequest extends Request {
  userId?: string;
  userRole?: UserRole;
  userEmail?: string;
  userName?: string;
}

// DTOs para requests
export interface CreateClassDTO {
  name: string;
  description: string;
  schedule: string | Date;
  duration: number;
  maxParticipants: number;
  room: string;
}

export interface UpdateClassDTO {
  name?: string;
  description?: string;
  schedule?: string | Date;
  duration?: number;
  maxParticipants?: number;
  room?: string;
  status?: ClassStatus;
}

export interface CreateBookingDTO {
  classId: string;
}

// Response del Auth Service
export interface AuthServiceUserResponse {
  success: boolean;
  data: {
    _id: string;
    email: string;
    name: string;
    role: UserRole;
    phone?: string;
    isActive: boolean;
  };
}

