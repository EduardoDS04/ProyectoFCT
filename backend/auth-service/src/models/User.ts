import mongoose, { Schema, Document } from 'mongoose';
import { UserRole } from '../types';

// Interfaz que define la estructura del documento de usuario en MongoDB
export interface IUserDocument extends Document {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  phone?: string;
  birthDate?: Date;
  isActive: boolean;
}

// Esquema de Mongoose para el modelo User
const UserSchema: Schema = new Schema(
  {
    // Email del usuario, debe ser unico y valido
    email: {
      type: String,
      required: [true, 'El email es obligatorio'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Por favor ingresa un email válido']
    },
    // Contrasena hasheada del usuario
    password: {
      type: String,
      required: [true, 'La contraseña es obligatoria'],
      minlength: [6, 'La contraseña debe tener al menos 6 caracteres']
    },
    // Nombre completo del usuario
    name: {
      type: String,
      required: [true, 'El nombre es obligatorio'],
      trim: true,
      minlength: [2, 'El nombre debe tener al menos 2 caracteres']
    },
    // Rol del usuario: SOCIO, MONITOR o ADMIN
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.SOCIO,
      required: true
    },
    // Telefono del usuario
    phone: {
      type: String,
      trim: true,
      match: [/^[0-9]{9,15}$/, 'Por favor ingresa un teléfono válido']
    },
    // Fecha de nacimiento del usuario
    birthDate: {
      type: Date
    },
    // Estado activo del usuario, por defecto true
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    // Agregar campos createdAt y updatedAt automaticamente
    timestamps: true,
    versionKey: false
  }
);

// Indice compuesto para optimizar busquedas por rol y estado activo
UserSchema.index({ role: 1, isActive: 1 });

// Metodo personalizado para excluir la contrasena al convertir a JSON
UserSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  return user;
};

// Exportar el modelo de Mongoose
export default mongoose.model<IUserDocument>('User', UserSchema);

