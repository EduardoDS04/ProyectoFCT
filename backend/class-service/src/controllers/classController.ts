import { Response } from 'express';
import Class from '../models/Class';
import Booking from '../models/Booking';
import { AuthRequest, CreateClassDTO, UpdateClassDTO, ClassStatus, UserRole, BookingStatus } from '../types';

// helpers para respuestas
const sendError = (res: Response, status: number, message: string) => {
  res.status(status).json({ success: false, message });
};

const sendNotFound = (res: Response, entity: string) => sendError(res, 404, `${entity} no encontrada`);

const sendForbidden = (res: Response, message: string) => sendError(res, 403, message);

// marcar clases pasadas como completadas y sus reservas
const markCompletedClasses = async () => {
  const now = new Date();
  const classesToComplete = await Class.find({
    status: ClassStatus.ACTIVE,
    $expr: { $lt: [{ $add: ['$schedule', { $multiply: ['$duration', 60000] }] }, now] }
  }).select('_id');
  
  const classIds = classesToComplete.map(c => c._id);
  if (classIds.length > 0) {
    await Class.updateMany({ _id: { $in: classIds } }, { status: ClassStatus.COMPLETED });
    await Booking.updateMany({ classId: { $in: classIds }, status: BookingStatus.CONFIRMED }, { status: BookingStatus.COMPLETED });
  }
};

// verificar permisos de clase
const canModifyClass = (req: AuthRequest, classData: any): boolean => {
  return req.userRole === UserRole.ADMIN || classData.monitorId === req.userId;
};

// verificar conflicto de horario del monitor
const hasScheduleConflict = async (monitorId: string, schedule: Date, excludeId?: string) => {
  const filter: any = { monitorId, schedule, status: { $ne: ClassStatus.CANCELLED } };
  if (excludeId) filter._id = { $ne: excludeId };
  return await Class.findOne(filter);
};

// obtener todas las clases con filtros opcionales
export const getAllClasses = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, monitorId, fromDate, toDate } = req.query;
    const filter: any = {};
    if (status) filter.status = status;
    if (monitorId) filter.monitorId = monitorId;
    if (fromDate || toDate) {
      filter.schedule = {};
      if (fromDate) filter.schedule.$gte = new Date(fromDate as string);
      if (toDate) filter.schedule.$lte = new Date(toDate as string);
    }

    // marcar automáticamente clases pasadas como completadas antes de filtrar
    await markCompletedClasses();
    const classes = await Class.find(filter).sort({ schedule: 1 });
    res.status(200).json({ success: true, data: classes, count: classes.length });
  } catch (error) {
    console.error('Error al obtener clases:', error);
    sendError(res, 500, 'Error al obtener clases');
  }
};

// obtener una clase específica por ID
export const getClassById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const classData = await Class.findById(req.params.id);
    if (!classData) return sendNotFound(res, 'Clase');
    res.status(200).json({ success: true, data: classData });
  } catch (error) {
    console.error('Error al obtener clase:', error);
    sendError(res, 500, 'Error al obtener clase');
  }
};

// crear una nueva clase (solo Monitor o Admin)
export const createClass = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, description, schedule, duration, maxParticipants, room }: CreateClassDTO = req.body;
    if (!name || !schedule || !duration || !maxParticipants || !room) {
      return sendError(res, 400, 'Todos los campos son obligatorios excepto la descripción');
    }

    // validar que la fecha sea futura
    const classDate = new Date(schedule);
    if (classDate <= new Date()) return sendError(res, 400, 'La fecha de la clase debe ser futura');

    // verificar que el monitor no tenga otra clase en el mismo horario
    if (await hasScheduleConflict(req.userId!, classDate)) {
      return sendError(res, 400, 'Ya tienes una clase programada en esta fecha y hora. No puedes estar en dos lugares al mismo tiempo.');
    }

    const newClass = await Class.create({
      name, 
      description: description || '', 
      monitorId: req.userId!, 
      monitorName: req.userName!,
      schedule: classDate, 
      duration, 
      maxParticipants, 
      currentParticipants: 0, 
      room,
      status: ClassStatus.ACTIVE
    });

    res.status(201).json({ success: true, message: 'Clase creada exitosamente', data: newClass });
  } catch (error) {
    console.error('Error al crear clase:', error);
    sendError(res, 500, 'Error al crear clase');
  }
};

// actualizar una clase existente (solo el monitor creador o admin)
export const updateClass = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updates: UpdateClassDTO = req.body;
    const classData = await Class.findById(id);
    
    if (!classData) return sendNotFound(res, 'Clase');
    if (!canModifyClass(req, classData)) return sendForbidden(res, 'Solo el monitor de la clase o un administrador pueden actualizarla');
    if (classData.status === ClassStatus.CANCELLED || classData.status === ClassStatus.COMPLETED) {
      return sendError(res, 400, 'No se pueden editar clases canceladas o completadas');
    }
    if (new Date(classData.schedule) < new Date()) return sendError(res, 400, 'No se pueden editar clases que ya han finalizado');

    // si se actualiza la fecha, validar conflictos de horario
    if (updates.schedule) {
      const newDate = new Date(updates.schedule);
      if (newDate <= new Date()) return sendError(res, 400, 'La fecha de la clase debe ser futura');
      const monitorId = req.userRole === UserRole.ADMIN ? classData.monitorId : req.userId!;
      if (await hasScheduleConflict(monitorId, newDate, id)) {
        return sendError(res, 400, 'El monitor ya tiene una clase programada en esta fecha y hora. No puede estar en dos lugares al mismo tiempo.');
      }
      updates.schedule = newDate;
    }

    // validar que no se reduzca el aforo por debajo de participantes actuales
    if (updates.maxParticipants !== undefined && updates.maxParticipants < classData.currentParticipants) {
      return sendError(res, 400, `No puedes reducir el aforo por debajo del número actual de participantes (${classData.currentParticipants})`);
    }

    Object.assign(classData, updates);
    await classData.save();
    res.status(200).json({ success: true, message: 'Clase actualizada exitosamente', data: classData });
  } catch (error) {
    console.error('Error al actualizar clase:', error);
    sendError(res, 500, 'Error al actualizar clase');
  }
};

// cancelar una clase (solo el monitor creador o admin)
export const cancelClass = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const classData = await Class.findById(id);
    if (!classData) return sendNotFound(res, 'Clase');
    if (!canModifyClass(req, classData)) return sendForbidden(res, 'Solo el monitor de la clase o un administrador pueden cancelarla');
    if (classData.status === ClassStatus.CANCELLED) return sendError(res, 400, 'La clase ya está cancelada');

    classData.status = ClassStatus.CANCELLED;
    await classData.save();
    // cancelar automáticamente todas las reservas confirmadas de la clase
    await Booking.updateMany({ classId: id, status: BookingStatus.CONFIRMED }, { status: BookingStatus.CANCELLED });

    res.status(200).json({ success: true, message: 'Clase cancelada exitosamente. Se han cancelado todas las reservas.', data: classData });
  } catch (error) {
    console.error('Error al cancelar clase:', error);
    sendError(res, 500, 'Error al cancelar clase');
  }
};

// eliminar una clase permanentemente (solo admin)
export const deleteClass = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const classData = await Class.findById(id);
    if (!classData) return sendNotFound(res, 'Clase');
    
    // verificar que no tenga reservas activas antes de eliminar
    const activeBookings = await Booking.countDocuments({ classId: id, status: BookingStatus.CONFIRMED });
    if (activeBookings > 0) {
      return sendError(res, 400, `No se puede eliminar la clase porque tiene ${activeBookings} reserva(s) activa(s). Cancela la clase primero.`);
    }

    // eliminar primero todas las reservas asociadas (para evitar reservas huérfanas)
    await Booking.deleteMany({ classId: id });
    // luego eliminar la clase
    await Class.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: 'Clase eliminada exitosamente' });
  } catch (error) {
    console.error('Error al eliminar clase:', error);
    sendError(res, 500, 'Error al eliminar clase');
  }
};

// obtener las clases creadas por el monitor autenticado
export const getMyClasses = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const classes = await Class.find({ monitorId: req.userId }).sort({ schedule: 1 });
    res.status(200).json({ success: true, data: classes, count: classes.length });
  } catch (error) {
    console.error('Error al obtener mis clases:', error);
    sendError(res, 500, 'Error al obtener clases');
  }
};

