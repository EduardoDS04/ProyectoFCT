import { Response } from 'express';
import Feedback from '../models/Feedback';
import { AuthRequest, ApiResponse, CreateFeedbackDTO, FeedbackType } from '../types';

// Crear un nuevo feedback (solo para socios)
export const createFeedback = async (
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    if (!req.userId || !req.userName) {
      res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
      return;
    }

    const { message, type }: CreateFeedbackDTO = req.body;

    // Validar que el mensaje existe y tiene contenido
    if (!message || message.trim().length < 10) {
      res.status(400).json({
        success: false,
        message: 'El mensaje debe tener al menos 10 caracteres'
      });
      return;
    }

    // Validar que el tipo es valido
    if (!type || !Object.values(FeedbackType).includes(type)) {
      res.status(400).json({
        success: false,
        message: 'Tipo de feedback inválido'
      });
      return;
    }

    // Crear el feedback
    const feedback = new Feedback({
      userId: req.userId,
      userName: req.userName,
      message: message.trim(),
      type
    });

    await feedback.save();

    res.status(201).json({
      success: true,
      message: 'Feedback enviado exitosamente',
      data: {
        _id: feedback._id,
        message: feedback.message,
        type: feedback.type,
        createdAt: feedback.createdAt
      }
    });
  } catch (error) {
    console.error('Error al crear feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear el feedback'
    });
  }
};

// Obtener todos los feedbacks (solo para admin)
export const getAllFeedbacks = async (
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    // Obtener todos los feedbacks ordenados por fecha de creacion (mas recientes primero)
    const feedbacks = await Feedback.find()
      .sort({ createdAt: -1 })
      .select('userId userName message type createdAt')
      .lean();

    res.status(200).json({
      success: true,
      data: feedbacks
    });
  } catch (error) {
    console.error('Error al obtener feedbacks:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener los feedbacks'
    });
  }
};

// Obtener un feedback por ID (solo para admin)
export const getFeedbackById = async (
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    const { id } = req.params;

    const feedback = await Feedback.findById(id)
      .select('userId userName message type createdAt updatedAt')
      .lean();

    if (!feedback) {
      res.status(404).json({
        success: false,
        message: 'Feedback no encontrado'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: feedback
    });
  } catch (error) {
    console.error('Error al obtener feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el feedback'
    });
  }
};

