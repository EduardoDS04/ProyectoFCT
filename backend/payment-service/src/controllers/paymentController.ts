import { Response } from 'express';
import Subscription, { getSubscriptionPrice, calculateEndDate } from '../models/Subscription';
import { AuthRequest, ApiResponse, CreateSubscriptionDTO, SubscriptionType, SubscriptionStatus, PaymentStatus } from '../types';
import mongoose from 'mongoose';

// helper para validar autenticación
const checkAuth = (req: AuthRequest, res: Response<ApiResponse>): boolean => {
  if (!req.userId) {
    res.status(401).json({
      success: false,
      message: 'Usuario no autenticado'
    });
    return false;
  }
  return true;
};

// helper para validar ObjectId
const validateObjectId = (id: string, res: Response<ApiResponse>): boolean => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400).json({
      success: false,
      message: 'ID de suscripcion inválido'
    });
    return false;
  }
  return true;
};

// helper para formatear datos bancarios de una suscripción
const formatSafeSubscription = (subscription: any) => ({
  ...subscription,
  bankDetails: {
    ...subscription.bankDetails,
    cardNumber: `**** **** **** ${subscription.bankDetails.cardNumber}`
  }
});

// helper para verificar que la suscripción pertenece al usuario
const checkSubscriptionOwnership = (subscription: any, userId: string, res: Response<ApiResponse>, action: string): boolean => {
  if (subscription.userId.toString() !== userId) {
    res.status(403).json({
      success: false,
      message: `No tienes permisos para ${action} esta suscripcion`
    });
    return false;
  }
  return true;
};

// Obtener todas las suscripciones del usuario autenticado
export const getMySubscriptions = async (
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    if (!checkAuth(req, res)) return;

    const subscriptions = await Subscription.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .lean();

    const safeSubscriptions = subscriptions.map(formatSafeSubscription);

    res.status(200).json({
      success: true,
      data: safeSubscriptions
    });
  } catch (error) {
    console.error('Error al obtener suscripciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener suscripciones'
    });
  }
};

// Obtener una suscripcion por ID
export const getSubscriptionById = async (
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    if (!checkAuth(req, res)) return;

    const { id } = req.params;
    if (!validateObjectId(id, res)) return;

    const subscription = await Subscription.findById(id).lean();

    if (!subscription) {
      res.status(404).json({
        success: false,
        message: 'Suscripcion no encontrada'
      });
      return;
    }

    if (!checkSubscriptionOwnership(subscription, req.userId!, res, 'ver')) return;

    const safeSubscription = formatSafeSubscription(subscription);

    res.status(200).json({
      success: true,
      data: safeSubscription
    });
  } catch (error) {
    console.error('Error al obtener suscripcion:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener suscripcion'
    });
  }
};

// Crear una nueva suscripcion
export const createSubscription = async (
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    if (!checkAuth(req, res)) return;

    const { subscriptionType, bankDetails }: CreateSubscriptionDTO = req.body;

    // Validar tipo de suscripcion
    if (!Object.values(SubscriptionType).includes(subscriptionType)) {
      res.status(400).json({
        success: false,
        message: 'Tipo de suscripcion inválido'
      });
      return;
    }

    // Validar datos bancarios
    if (!bankDetails || !bankDetails.cardNumber || !bankDetails.cardHolder || !bankDetails.expiryDate || !bankDetails.cvv) {
      res.status(400).json({
        success: false,
        message: 'Datos bancarios incompletos'
      });
      return;
    }

    // Validar formato de tarjeta (solo numeros, 16 digitos)
    const cardNumber = bankDetails.cardNumber.replace(/\s/g, '');
    if (!/^\d{16}$/.test(cardNumber)) {
      res.status(400).json({
        success: false,
        message: 'Número de tarjeta inválido (debe tener 16 dígitos)'
      });
      return;
    }

    // Validar formato de fecha de expiracion (MM/YY)
    if (!/^\d{2}\/\d{2}$/.test(bankDetails.expiryDate)) {
      res.status(400).json({
        success: false,
        message: 'Fecha de expiración inválida (formato: MM/YY)'
      });
      return;
    }

    // Validar CVV (3 o 4 digitos)
    if (!/^\d{3,4}$/.test(bankDetails.cvv)) {
      res.status(400).json({
        success: false,
        message: 'CVV inválido (debe tener 3 o 4 dígitos)'
      });
      return;
    }

    // Verificar si el usuario ya tiene una suscripcion activa
    const activeSubscription = await Subscription.findOne({
      userId: req.userId,
      status: SubscriptionStatus.ACTIVE
    });

    if (activeSubscription) {
      res.status(400).json({
        success: false,
        message: 'Ya tienes una suscripcion activa. Cancela la actual antes de crear una nueva.'
      });
      return;
    }

    // Calcular fechas y precio
    const startDate = new Date();
    const endDate = calculateEndDate(startDate, subscriptionType);
    const amount = getSubscriptionPrice(subscriptionType);

    // Simular procesamiento de pago (en produccion esto se haria con una pasarela real)
    // Por ahora, siempre se aprueba el pago
    const paymentStatus = PaymentStatus.COMPLETED;
    const subscriptionStatus = SubscriptionStatus.ACTIVE;

    // Crear suscripcion (guardar solo ultimos 4 digitos de la tarjeta por seguridad)
    // Asegurar que userId sea un ObjectId válido
    const userIdObjectId = mongoose.Types.ObjectId.isValid(req.userId!) 
      ? new mongoose.Types.ObjectId(req.userId!) 
      : req.userId!;

    const subscription = new Subscription({
      userId: userIdObjectId,
      subscriptionType,
      startDate,
      endDate,
      status: subscriptionStatus,
      paymentStatus,
      amount,
      bankDetails: {
        cardNumber: cardNumber.slice(-4), // Solo guardar ultimos 4 digitos
        cardHolder: bankDetails.cardHolder,
        expiryDate: bankDetails.expiryDate
      }
    });

    await subscription.save();

    const safeSubscription = formatSafeSubscription(subscription.toObject());

    res.status(201).json({
      success: true,
      message: 'Suscripcion creada exitosamente',
      data: {
        ...safeSubscription,
        hasActiveSubscription: true
      }
    });
  } catch (error) {
    console.error('Error al crear suscripcion:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear suscripcion'
    });
  }
};

// Cancelar una suscripcion
export const cancelSubscription = async (
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    if (!checkAuth(req, res)) return;

    const { id } = req.params;
    if (!validateObjectId(id, res)) return;

    const subscription = await Subscription.findById(id);

    if (!subscription) {
      res.status(404).json({
        success: false,
        message: 'Suscripcion no encontrada'
      });
      return;
    }

    if (!checkSubscriptionOwnership(subscription, req.userId!, res, 'cancelar')) return;

    // Solo se pueden cancelar suscripciones activas
    if (subscription.status !== SubscriptionStatus.ACTIVE) {
      res.status(400).json({
        success: false,
        message: 'Solo se pueden cancelar suscripciones activas'
      });
      return;
    }

    subscription.status = SubscriptionStatus.CANCELLED;
    await subscription.save();

    // Verificar si el usuario tiene otra suscripcion activa
    const hasActiveSubscription = await Subscription.exists({
      userId: req.userId,
      status: SubscriptionStatus.ACTIVE
    });

    res.status(200).json({
      success: true,
      message: 'Suscripcion cancelada exitosamente',
      data: {
        ...subscription.toObject(),
        hasActiveSubscription: !!hasActiveSubscription
      }
    });
  } catch (error) {
    console.error('Error al cancelar suscripcion:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cancelar suscripcion'
    });
  }
};

// Verificar si el usuario tiene una suscripcion activa
export const checkActiveSubscription = async (
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    if (!checkAuth(req, res)) return;

    // Buscar suscripción activa
    const activeSubscription = await Subscription.findOne({
      userId: req.userId,
      status: SubscriptionStatus.ACTIVE
    });

    res.status(200).json({
      success: true,
      data: {
        hasActiveSubscription: !!activeSubscription
      }
    });
  } catch (error) {
    console.error('Error al verificar suscripcion activa:', error);
    res.status(500).json({
      success: false,
      message: 'Error al verificar suscripcion activa'
    });
  }
};

// Obtener todas las suscripciones (solo admin)
export const getAllSubscriptions = async (
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    const subscriptions = await Subscription.find()
      .sort({ createdAt: -1 })
      .lean();

    const safeSubscriptions = subscriptions.map(formatSafeSubscription);

    res.status(200).json({
      success: true,
      data: safeSubscriptions
    });
  } catch (error) {
    console.error('Error al obtener suscripciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener suscripciones'
    });
  }
};
