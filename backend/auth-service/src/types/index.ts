import { Request } from 'express';

// Enum que define los roles disponibles en el sistema
// Cada rol tiene permisos diferentes: SOCIO puede reservar clases,
// MONITOR puede crear y gestionar clases, ADMIN tiene acceso completo
export enum UserRole {
  SOCIO = 'socio',
  MONITOR = 'monitor',
  ADMIN = 'admin'
}

// Interfaz que extiende Request de Express para incluir informacion del usuario autenticado
// Se usa en los middlewares y controladores para acceder a los datos del usuario
export interface AuthRequest extends Request {
  userId?: string;           
  userRole?: UserRole;       
}

// Interfaz que define los datos que se codifican dentro del token JWT
// El payload se decodifica en cada peticion para identificar al usuario
export interface JWTPayload {
  id: string;               
  email: string;             
  role: UserRole;           
}

// DTO para el registro de nuevos usuarios
// Define la estructura de datos que debe enviar el cliente al endpoint de registro
export interface RegisterDTO {
  email: string;             
  password: string;          
  name: string;              
  dni?: string;         
  role?: UserRole;           
  phone?: string;            
  birthDate?: string;        
}

// Define la estructura de datos que debe enviar el cliente al endpoint de login
// Solo requiere las credenciales basicas para autenticarse
export interface LoginDTO {
  email: string;             
  password: string;          
}

// Interfaz que define la estructura de la respuesta cuando un usuario se autentica
// Se devuelve tanto en registro como en login exitoso
// Incluye el token JWT y los datos basicos del usuario sin informacion sensible
export interface AuthResponse {
  token: string;             // Token JWT que el cliente debe guardar y enviar en peticiones futuras
  user: {                    
    id: string;              
    email: string;           
    name: string;            
    role: UserRole;         
  };
}

// Interfaz para respuestas estandarizadas de la API
export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
}