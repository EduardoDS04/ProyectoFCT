import { Response } from 'express';
import mongoose from 'mongoose';
import Feedback from '../models/Feedback';
import { AuthRequest, ApiResponse, CreateFeedbackDTO, RespondFeedbackDTO, FeedbackType } from '../types';

// Constantes para campos seleccionados en consultas
const FEEDBACK_FULL_FIELDS = 'userId userName message type messages lastReadByAdmin lastReadArchivedByAdmin archived createdAt updatedAt';
const FEEDBACK_SOCIO_FIELDS = 'userId userName message type messages lastReadBySocio lastReadByAdmin createdAt updatedAt';
const FEEDBACK_MESSAGES_FIELDS = 'messages lastReadByAdmin';
const FEEDBACK_ARCHIVED_FIELDS = 'messages lastReadArchivedByAdmin';

// Función helper para obtener la fecha del último mensaje o createdAt
const getLastMessageDate = (feedback: any): Date => {
  if (feedback.messages && feedback.messages.length > 0) {
    const lastMessage = feedback.messages[feedback.messages.length - 1];
    return new Date(lastMessage.createdAt);
  }
  return new Date(feedback.createdAt);
};

// Función helper para ordenar feedbacks por fecha  (mensaje más reciente)
const sortFeedbacksByLastMessage = (feedbacks: any[]): void => {
  feedbacks.sort((a, b) => getLastMessageDate(b).getTime() - getLastMessageDate(a).getTime());
};

// Función helper para validar mensaje
const validateMessage = (message: string | undefined, res: Response<ApiResponse>): boolean => {
  if (!message || message.trim().length === 0) {
    res.status(400).json({ success: false, message: 'El mensaje no puede estar vacío' });
    return false;
  }
  if (message.trim().length > 3000) {
    res.status(400).json({ success: false, message: 'El mensaje no puede exceder 3000 caracteres' });
    return false;
  }
  return true;
};

// Función helper para verificar si hay mensajes nuevos de un rol específico
const hasNewMessages = (messages: any[], senderRole: 'admin' | 'socio', lastReadDate: Date | null | undefined): boolean => {
  if (!messages || messages.length === 0) return false;
  if (!lastReadDate) {
    return messages.some((msg: any) => msg.senderRole === senderRole);
  }
  const lastRead = new Date(lastReadDate);
  return messages.some((msg: any) => msg.senderRole === senderRole && new Date(msg.createdAt) > lastRead);
};

// Función helper para contar mensajes sin leer de un rol específico
const countUnreadMessages = (messages: any[], senderRole: 'admin' | 'socio', lastReadDate: Date | null | undefined): number => {
  if (!messages || messages.length === 0) return 0;
  if (!lastReadDate) {
    return messages.filter((msg: any) => msg.senderRole === senderRole).length;
  }
  const lastRead = new Date(lastReadDate);
  return messages.filter((msg: any) => msg.senderRole === senderRole && new Date(msg.createdAt) > lastRead).length;
};

// Crear un nuevo feedback (solo para socios)
export const createFeedback = async (
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    if (!req.userId || !req.userName) {
      res.status(401).json({ success: false, message: 'Usuario no autenticado' });
      return;
    }

    const { message, type }: CreateFeedbackDTO = req.body;

    // Validar que el mensaje existe y tiene contenido
    if (!validateMessage(message, res)) return;

    // Validar que el tipo es valido
    if (!type || !Object.values(FeedbackType).includes(type)) {
      res.status(400).json({ success: false, message: 'Tipo de feedback inválido' });
      return;
    }

    // Crear el feedback con array de mensajes vacio
    const feedback = new Feedback({
      userId: req.userId,
      userName: req.userName,
      message: message.trim(),
      type,
      messages: [] // Inicializar array de mensajes vacio
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
    res.status(500).json({ success: false, message: 'Error al crear el feedback' });
  }
};

// Obtener todos los feedbacks (solo para admin)
export const getAllFeedbacks = async (
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    // Obtener el parámetro de query para filtrar archivados
    const showArchived = req.query.archived === 'true';
    
    // Construir el filtro según si queremos ver archivados o no
    const filter: any = showArchived 
      ? { archived: true }
      : { $or: [{ archived: { $exists: false } }, { archived: false }] };

    // Obtener todos los feedbacks y ordenarlos por el mensaje más reciente
    // Si hay mensajes usar la fecha del último mensaje y si no usar createdAt
    const feedbacks = await Feedback.find(filter)
      .select(FEEDBACK_FULL_FIELDS)
      .lean();

    // Ordenar por la fecha del mensaje más reciente (o createdAt si no hay mensajes)
    sortFeedbacksByLastMessage(feedbacks);

    res.status(200).json({ success: true, data: feedbacks });
  } catch (error) {
    console.error('Error al obtener feedbacks:', error);
    res.status(500).json({ success: false, message: 'Error al obtener los feedbacks' });
  }
};

// Obtener un feedback por ID (solo para admin)
export const getFeedbackById = async (
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    const { id } = req.params;
    const feedback = await Feedback.findById(id).select(FEEDBACK_FULL_FIELDS).lean();

    if (!feedback) {
      res.status(404).json({ success: false, message: 'Feedback no encontrado' });
      return;
    }

    res.status(200).json({ success: true, data: feedback });
  } catch (error) {
    console.error('Error al obtener feedback:', error);
    res.status(500).json({ success: false, message: 'Error al obtener el feedback' });
  }
};

// Obtener feedbacks del usuario actual (solo para socios)
export const getMyFeedbacks = async (
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ success: false, message: 'Usuario no autenticado' });
      return;
    }

    // Obtener todos los feedbacks del usuario y ordenarlos por el mensaje más reciente
    const feedbacks = await Feedback.find({ userId: req.userId })
      .select(FEEDBACK_SOCIO_FIELDS)
      .lean();

    // Ordenar por la fecha del mensaje más reciente (o createdAt si no hay mensajes)
    sortFeedbacksByLastMessage(feedbacks);

    res.status(200).json({ success: true, data: feedbacks });
  } catch (error) {
    console.error('Error al obtener feedbacks del usuario:', error);
    res.status(500).json({ success: false, message: 'Error al obtener tus feedbacks' });
  }
};

// Responder a un feedback (admin o socio)
export const respondToFeedback = async (
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    if (!req.userId || !req.userName || !req.userRole) {
      res.status(401).json({ success: false, message: 'Usuario no autenticado' });
      return;
    }

    const { id } = req.params;
    const { message }: RespondFeedbackDTO = req.body;

    // Determinar el rol del remitente antes de validar
    const senderRole: 'admin' | 'socio' = req.userRole === 'admin' ? 'admin' : 'socio';

    // Validar que el mensaje existe y tiene contenido
    if (!validateMessage(message, res)) return;

    // Buscar el feedback
    const feedback = await Feedback.findById(id);
    if (!feedback) {
      res.status(404).json({ success: false, message: 'Feedback no encontrado' });
      return;
    }

    // Verificar permisos: solo el admin o el socio que creo el feedback puede responder
    if (senderRole === 'socio' && String(feedback.userId) !== req.userId) {
      res.status(403).json({ success: false, message: 'No tienes permiso para responder este feedback' });
      return;
    }

    // Añadir el nuevo mensaje al array de mensajes
    feedback.messages.push({
      senderId: new mongoose.Types.ObjectId(req.userId),
      senderName: req.userName,
      senderRole: senderRole,
      message: message.trim(),
      createdAt: new Date()
    });

    // Si el admin responde, actualizar lastReadByAdmin para que sepa que vio los mensajes
    if (senderRole === 'admin') {
      feedback.lastReadByAdmin = new Date();
    }

    await feedback.save();

    // Recargar el feedback para obtener todos los datos actualizados
    const updatedFeedback = await Feedback.findById(id).select(FEEDBACK_FULL_FIELDS).lean();

    res.status(200).json({
      success: true,
      message: 'Mensaje enviado exitosamente',
      data: updatedFeedback
    });
  } catch (error) {
    console.error('Error al responder feedback:', error);
    res.status(500).json({ success: false, message: 'Error al responder el feedback' });
  }
};

// Contar notificaciones sin leer del socio (feedbacks con mensajes nuevos del admin)
export const getUnreadNotificationsCount = async (
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ success: false, message: 'Usuario no autenticado' });
      return;
    }

    // Obtener todos los feedbacks del usuario que tienen mensajes
    const feedbacks = await Feedback.find({ userId: req.userId })
      .select('messages lastReadBySocio')
      .lean();

    let unreadCount = 0;
    feedbacks.forEach(feedback => {
      if (feedback.messages && feedback.messages.length > 0) {
        unreadCount += countUnreadMessages(feedback.messages, 'admin', feedback.lastReadBySocio);
      }
    });

    res.status(200).json({ success: true, data: { count: unreadCount } });
  } catch (error) {
    console.error('Error al contar notificaciones sin leer:', error);
    res.status(500).json({ success: false, message: 'Error al contar notificaciones' });
  }
};

// Contar feedbacks sin responder (admin) - feedbacks nuevos o con mensajes nuevos del socio
export const getUnansweredFeedbacksCount = async (
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    // Obtener todos los feedbacks que no están archivados
    const feedbacks = await Feedback.find({
      $or: [{ archived: { $exists: false } }, { archived: false }]
    })
      .select('messages lastReadByAdmin createdAt')
      .lean();

    let count = 0;
    feedbacks.forEach(feedback => {
      // Si no tiene mensajes y no ha sido visto por el admin, contar como nuevo
      if ((!feedback.messages || feedback.messages.length === 0) && !feedback.lastReadByAdmin) {
        count++;
      } else if (hasNewMessages(feedback.messages || [], 'socio', feedback.lastReadByAdmin)) {
        // Si tiene mensajes nuevos del socio, contar
        count++;
      }
    });

    res.status(200).json({ success: true, data: { count } });
  } catch (error) {
    console.error('Error al contar feedbacks sin responder:', error);
    res.status(500).json({ success: false, message: 'Error al contar feedbacks sin responder' });
  }
};

// Marcar mensajes como leídos (socio)
export const markAsRead = async (
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ success: false, message: 'Usuario no autenticado' });
      return;
    }

    const { id } = req.params;
    const feedback = await Feedback.findById(id);

    if (!feedback) {
      res.status(404).json({ success: false, message: 'Feedback no encontrado' });
      return;
    }

    // Verificar que el feedback pertenece al usuario
    if (String(feedback.userId) !== req.userId) {
      res.status(403).json({ success: false, message: 'No tienes permiso para marcar este feedback como leído' });
      return;
    }

    // Actualizar la fecha de última lectura
    feedback.lastReadBySocio = new Date();
    await feedback.save();

    res.status(200).json({ success: true, message: 'Mensajes marcados como leídos' });
  } catch (error) {
    console.error('Error al marcar como leído:', error);
    res.status(500).json({ success: false, message: 'Error al marcar como leído' });
  }
};

// Marcar todos los feedbacks como vistos por el admin (cuando entra a la página)
export const markAllAsReadByAdmin = async (
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    // Obtener todos los feedbacks que necesitan ser marcados como vistos
    const feedbacks = await Feedback.find().select(FEEDBACK_MESSAGES_FIELDS).lean();

    const now = new Date();
    const feedbacksToUpdate: mongoose.Types.ObjectId[] = [];

    feedbacks.forEach(feedback => {
      // Si no tiene mensajes y no ha sido visto, marcar
      if ((!feedback.messages || feedback.messages.length === 0) && !feedback.lastReadByAdmin) {
        feedbacksToUpdate.push(feedback._id as mongoose.Types.ObjectId);
      } else if (hasNewMessages(feedback.messages || [], 'socio', feedback.lastReadByAdmin)) {
        // Si tiene mensajes nuevos del socio, marcar
        feedbacksToUpdate.push(feedback._id as mongoose.Types.ObjectId);
      }
    });

    // Actualizar todos los feedbacks que necesitan ser marcados
    if (feedbacksToUpdate.length > 0) {
      await Feedback.updateMany(
        { _id: { $in: feedbacksToUpdate } },
        { $set: { lastReadByAdmin: now } }
      );
    }

    res.status(200).json({ success: true, message: 'Feedbacks marcados como vistos' });
  } catch (error) {
    console.error('Error al marcar feedbacks como vistos:', error);
    res.status(500).json({ success: false, message: 'Error al marcar feedbacks como vistos' });
  }
};

// archivar/desarchivar un feedback (solo para admin)
export const archiveFeedback = async (
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    const { id } = req.params;
    const { archived } = req.body; // recibir el estado deseado (true para archivar, false para desarchivar)

    // Buscar el feedback
    const feedback = await Feedback.findById(id);
    if (!feedback) {
      res.status(404).json({ success: false, message: 'Feedback no encontrado' });
      return;
    }

    // Actualizar el estado de archivado
    feedback.archived = archived !== undefined ? archived : !feedback.archived;
    await feedback.save();

    // Recargar el feedback para obtener todos los datos actualizados
    const updatedFeedback = await Feedback.findById(id)
      .select('userId userName message type messages lastReadByAdmin archived createdAt updatedAt')
      .lean();

    res.status(200).json({
      success: true,
      message: feedback.archived ? 'Feedback archivado exitosamente' : 'Feedback desarchivado exitosamente',
      data: updatedFeedback
    });
  } catch (error) {
    console.error('Error al archivar/desarchivar feedback:', error);
    res.status(500).json({ success: false, message: 'Error al archivar/desarchivar el feedback' });
  }
};

// Contar feedbacks archivados con mensajes nuevos (admin)
export const getArchivedUnreadCount = async (
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    // Obtener todos los feedbacks archivados
    const feedbacks = await Feedback.find({ archived: true })
      .select(FEEDBACK_ARCHIVED_FIELDS)
      .lean();

    let unreadCount = 0;
    feedbacks.forEach(feedback => {
      if (feedback.messages && feedback.messages.length > 0) {
        if (hasNewMessages(feedback.messages, 'socio', feedback.lastReadArchivedByAdmin)) {
          unreadCount++;
        }
      }
    });

    res.status(200).json({ success: true, data: { count: unreadCount } });
  } catch (error) {
    console.error('Error al contar archivados sin leer:', error);
    res.status(500).json({ success: false, message: 'Error al contar archivados sin leer' });
  }
};

// Marcar archivados como leídos (admin)
export const markArchivedAsRead = async (
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    // Obtener todos los feedbacks archivados con mensajes nuevos
    const feedbacks = await Feedback.find({ archived: true })
      .select(FEEDBACK_ARCHIVED_FIELDS)
      .lean();

    const now = new Date();
    const feedbacksToUpdate: mongoose.Types.ObjectId[] = [];

    feedbacks.forEach(feedback => {
      if (feedback.messages && feedback.messages.length > 0) {
        if (hasNewMessages(feedback.messages, 'socio', feedback.lastReadArchivedByAdmin)) {
          feedbacksToUpdate.push(feedback._id as mongoose.Types.ObjectId);
        }
      }
    });

    // Actualizar todos los feedbacks que necesitan ser marcados
    if (feedbacksToUpdate.length > 0) {
      await Feedback.updateMany(
        { _id: { $in: feedbacksToUpdate } },
        { $set: { lastReadArchivedByAdmin: now } }
      );
    }

    res.status(200).json({ success: true, message: 'Archivados marcados como leídos' });
  } catch (error) {
    console.error('Error al marcar archivados como leídos:', error);
    res.status(500).json({ success: false, message: 'Error al marcar archivados como leídos' });
  }
};
