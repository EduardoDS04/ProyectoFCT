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

// Interfaces de Usuario
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  birthDate?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Interfaces de Clase
export interface Class {
  _id: string;
  name: string;
  description: string;
  monitorId: string;
  monitorName: string;
  schedule: string;
  duration: number;
  maxParticipants: number;
  currentParticipants: number;
  room: string;
  status: ClassStatus;
  createdAt?: string;
  updatedAt?: string;
}

// Interfaces de Reserva
export interface Booking {
  _id: string;
  userId: string;
  userName: string;
  userEmail?: string;
  classId: string | Class;
  className: string;
  bookingDate: string;
  status: BookingStatus;
  createdAt?: string;
  updatedAt?: string;
}

// DTOs para requests de autenticación
export interface RegisterData {
  email: string;
  password: string;
  name: string;
  role?: UserRole;
  phone?: string;
  birthDate?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface UpdateProfileData {
  name?: string;
  email?: string;
  phone?: string;
  birthDate?: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

// DTOs para requests de clases
export interface CreateClassData {
  name: string;
  description: string;
  schedule: string;
  duration: number;
  maxParticipants: number;
  room: string;
}

export interface UpdateClassData {
  name?: string;
  description?: string;
  schedule?: string;
  duration?: number;
  maxParticipants?: number;
  room?: string;
  status?: ClassStatus;
}

// DTOs para requests de reservas
export interface CreateBookingData {
  classId: string;
}

// Responses de la API
export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    user: {
      id: string;
      email: string;
      name: string;
      role: UserRole;
    };
  };
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  count?: number;
}

// Context
export interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
}

