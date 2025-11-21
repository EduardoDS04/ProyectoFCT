/**
 * Script para resetear la contraseña del administrador por defecto
 * 
 * Uso: npm run reset-admin-password
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../models/User';
import { UserRole } from '../types';

dotenv.config();

const resetAdminPassword = async () => {
  try {
    // Conectar a MongoDB
    const mongoUri = process.env.MONGODB_URI;
    
    if (!mongoUri) {
      console.error('Error: MONGODB_URI no está definida en las variables de entorno');
      console.error('Por favor, configura MONGODB_URI en tu archivo .env');
      process.exit(1);
      return;
    }
    
    await mongoose.connect(mongoUri);
    console.log('Conectado a MongoDB\n');

    // Buscar el admin por defecto
    if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
      console.error('Error: ADMIN_EMAIL o ADMIN_PASSWORD no están definidas en las variables de entorno');
      console.error('Por favor, configura estas variables en tu archivo .env');
      await mongoose.connection.close();
      process.exit(1);
      return;
    }

    const adminEmail = process.env.ADMIN_EMAIL;
    const admin = await User.findOne({ email: adminEmail });

    if (!admin) {
      console.log(`No se encontró el administrador con email: ${adminEmail}`);
      console.log('Ejecuta: npm run init-admin para crear el administrador inicial.\n');
      await mongoose.connection.close();
      process.exit(1);
      return;
    }

    // Nueva contraseña
    const newPassword = process.env.ADMIN_PASSWORD;
    
    // Hash de la nueva contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Actualizar contraseña
    admin.password = hashedPassword;
    admin.isActive = true; 
    await admin.save();

    console.log('='.repeat(70));
    console.log('CONTRASEÑA DEL ADMINISTRADOR RESETEADA');
    console.log('='.repeat(70));
    console.log(`Email:       ${adminEmail}`);
    console.log(`Contraseña:  ${newPassword}`);
    console.log(`Nombre:      ${admin.name}`);
    console.log(`Rol:         ${admin.role}`);
    console.log(`Activo:      ${admin.isActive ? 'Sí' : 'No'}`);
    console.log('='.repeat(70));
    console.log('\nAhora puedes iniciar sesión con estas credenciales.\n');
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Ejecutar
resetAdminPassword();

