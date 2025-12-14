// configuración de conexión a mongodb para el servicio de autenticación
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async (): Promise<void> => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    
    if (!mongoUri) {
      console.error('Error: MONGODB_URI no está definida en las variables de entorno');
      console.error('Por favor, configura MONGODB_URI en tu archivo .env');
      process.exit(1);
      return;
    }
    
    const conn = await mongoose.connect(mongoUri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Error conectando a MongoDB:', error);
    process.exit(1);
  }
};

export default connectDB;