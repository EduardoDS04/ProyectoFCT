import { Response } from 'express';
import QRCode from 'qrcode';
import crypto from 'crypto';
import User from '../models/User';
import { AuthRequest, ApiResponse } from '../types';

// Obtener o generar QR del usuario autenticado
export const getMyQR = async (
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
      return;
    }

    const user = await User.findById(req.userId);

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
      return;
    }

    // Verificar si el QR existe y no ha expirado (24 horas)
    const QR_EXPIRATION_HOURS = 24;
    const now = new Date();
    let needsNewQR = false;

    if (!user.qrToken || !user.qrGeneratedAt) {
      needsNewQR = true;
    } else {
      const expirationTime = new Date(user.qrGeneratedAt);
      expirationTime.setHours(expirationTime.getHours() + QR_EXPIRATION_HOURS);
      
      if (now >= expirationTime) {
        needsNewQR = true;
      }
    }

    // Generar nuevo QR si es necesario
    if (needsNewQR) {
      const qrToken = crypto.randomBytes(32).toString('hex');
      user.qrToken = qrToken;
      user.qrGeneratedAt = now;
      await user.save();
    }

    // Preparar datos para el QR
    const qrData = {
      userId: String(user._id),
      qrToken: user.qrToken!,
      role: user.role,
      expiresAt: new Date(user.qrGeneratedAt!.getTime() + QR_EXPIRATION_HOURS * 60 * 60 * 1000).toISOString()
    };

    // Generar QR como SVG
    const qrSVG = await QRCode.toString(JSON.stringify(qrData), {
      type: 'svg',
      width: 300,
      margin: 2
    });

    res.status(200).json({
      success: true,
      data: {
        qrSVG,
        qrData,
        expiresAt: qrData.expiresAt
      }
    });
  } catch (error) {
    console.error('Error al generar QR:', error);
    res.status(500).json({
      success: false,
      message: 'Error al generar QR'
    });
  }
};

// Validar QR escaneado (para uso futuro con lectores de QR)
export const validateQR = async (
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    const { qrToken } = req.body;

    if (!qrToken) {
      res.status(400).json({
        success: false,
        message: 'Token QR requerido'
      });
      return;
    }

    const user = await User.findOne({ qrToken });

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'QR inválido'
      });
      return;
    }

    // Verificar expiración
    if (!user.qrGeneratedAt) {
      res.status(400).json({
        success: false,
        message: 'QR no válido'
      });
      return;
    }

    const QR_EXPIRATION_HOURS = 24;
    const expirationTime = new Date(user.qrGeneratedAt);
    expirationTime.setHours(expirationTime.getHours() + QR_EXPIRATION_HOURS);
    
    if (new Date() >= expirationTime) {
      res.status(400).json({
        success: false,
        message: 'QR expirado'
      });
      return;
    }

    // Verificar que el usuario esté activo
    if (!user.isActive) {
      res.status(403).json({
        success: false,
        message: 'Usuario inactivo'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        userId: String(user._id),
        name: user.name,
        role: user.role,
        isValid: true
      }
    });
  } catch (error) {
    console.error('Error al validar QR:', error);
    res.status(500).json({
      success: false,
      message: 'Error al validar QR'
    });
  }
};

