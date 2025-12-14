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