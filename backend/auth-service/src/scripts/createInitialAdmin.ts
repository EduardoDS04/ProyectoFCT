/**
 * Script de inicialización del primer administrador
 * 
 * Este script debe ejecutarse solo una vez al configurar el sistema por primera vez.
 * Es equivalente a crear el "usuario root" del sistema.
 * 
 * Uso: npm run init-admin
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../models/User';
import { UserRole } from '../types';

dotenv.config();

const createInitialAdmin = async () => {
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
    console.log('Conectado a MongoDB');

    // Verificar si ya existe algún administrador
    const adminCount = await User.countDocuments({ role: UserRole.ADMIN });

    if (adminCount > 0) {
      console.log('\nYa existe al menos un administrador en el sistema.');
      console.log(`Total de administradores: ${adminCount}`);
      console.log('\nPara crear más administradores, usa la API del panel de administración.');
      await mongoose.connection.close();
      process.exit(0);
      return;
    }

    // Datos del admin inicial
    if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD || !process.env.ADMIN_NAME) {
      console.error('Error: ADMIN_EMAIL, ADMIN_PASSWORD o ADMIN_NAME no estan definidas en las variables de entorno');
      console.error('Por favor, configura estas variables en tu archivo .env');
      await mongoose.connection.close();
      process.exit(1);
      return;
    }

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    const adminName = process.env.ADMIN_NAME;

    // Crear el primer admin
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);

    const admin = new User({
      email: adminEmail,
      password: hashedPassword,
      name: adminName,
      role: UserRole.ADMIN,
      phone: '600000000',
      isActive: true
    });

    await admin.save();

    console.log('\n' + '='.repeat(60));
    console.log('ADMINISTRADOR INICIAL CREADO EXITOSAMENTE');
    console.log('='.repeat(60));
    console.log(`Email:      ${adminEmail}`);
    console.log(`Contraseña: ${adminPassword}`);
    console.log(`Nombre:     ${adminName}`);
    console.log(`Rol:        ADMIN`);
    console.log('='.repeat(60));
    console.log('\nACCIONES REQUERIDAS:');
    console.log('1. Inicia sesion con estas credenciales');
    console.log('2. Cambia la contraseña inmediatamente desde tu perfil');
    console.log('='.repeat(60) + '\n');

    await mongoose.connection.close();
    console.log('Proceso completado\n');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Ejecutar
createInitialAdmin();
