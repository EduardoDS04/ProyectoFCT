// Tipos compartidos para el microservicio de pagos
import { Request } from 'express';

export enum UserRole {
  SOCIO = 'socio',
  MONITOR = 'monitor',
  ADMIN = 'admin'
}

// Tipos de suscripcion disponibles
export enum SubscriptionType {
  MONTHLY = 'monthly',      // 1 mes
  QUARTERLY = 'quarterly',  // 3 meses
  YEARLY = 'yearly'         // 1 año
}

// Estado de la suscripcion
export enum SubscriptionStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
  PENDING = 'pending'
}

// Estado del pago
export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded'
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
    _id: string;
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

// Datos bancarios del usuario
export interface BankDetails {
  cardNumber: string;
  cardHolder: string;
  expiryDate: string;  // MM/YY
  cvv: string;
}

// DTO para crear una suscripcion
export interface CreateSubscriptionDTO {
  subscriptionType: SubscriptionType;
  bankDetails: BankDetails;
}

// DTO para actualizar suscripcion
export interface UpdateSubscriptionDTO {
  subscriptionType?: SubscriptionType;
  bankDetails?: BankDetails;
}

