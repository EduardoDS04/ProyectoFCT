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

// verificar conflicto de horario del monitor (considerando duración y solapamientos)
const hasScheduleConflict = async (monitorId: string, schedule: Date, duration: number, excludeId?: string) => {
  const classStart = new Date(schedule);
  const classEnd = new Date(classStart.getTime() + duration * 60000); // duration en minutos a milisegundos

  // Buscar todas las clases activas del monitor que no estén canceladas
  const filter: any = { 
    monitorId, 
    status: { $ne: ClassStatus.CANCELLED } 
  };
  if (excludeId) filter._id = { $ne: excludeId };

  const existingClasses = await Class.find(filter);

  // Verificar si alguna clase existente se solapa con la nueva clase
  for (const existingClass of existingClasses) {
    const existingStart = new Date(existingClass.schedule);
    const existingEnd = new Date(existingStart.getTime() + existingClass.duration * 60000);

    // Dos clases se solapan si: startA < endB && startB < endA
    if (classStart < existingEnd && existingStart < classEnd) {
      return existingClass;
    }
  }

  return null;
};

// verificar conflicto de sala (dos clases en la misma sala no pueden solaparse)
const hasRoomConflict = async (room: string, schedule: Date, duration: number, excludeId?: string) => {
  const classStart = new Date(schedule);
  const classEnd = new Date(classStart.getTime() + duration * 60000);

  // Buscar todas las clases activas en la misma sala que no estén canceladas
  const filter: any = { 
    room, 
    status: { $ne: ClassStatus.CANCELLED } 
  };
  if (excludeId) filter._id = { $ne: excludeId };

  const existingClasses = await Class.find(filter);

  // Verificar si alguna clase existente en la misma sala se solapa con la nueva clase
  for (const existingClass of existingClasses) {
    const existingStart = new Date(existingClass.schedule);
    const existingEnd = new Date(existingStart.getTime() + existingClass.duration * 60000);

    // Dos clases se solapan si: startA < endB && startB < endA
    if (classStart < existingEnd && existingStart < classEnd) {
      return existingClass;
    }
  }

  return null;
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

    // verificar que el monitor no tenga otra clase que se solape en tiempo
    const monitorConflict = await hasScheduleConflict(req.userId!, classDate, duration);
    if (monitorConflict) {
      const conflictStart = new Date(monitorConflict.schedule);
      const conflictEnd = new Date(conflictStart.getTime() + monitorConflict.duration * 60000);
      return sendError(res, 400, `Ya tienes una clase programada que se solapa con este horario. Clase existente: ${monitorConflict.name} (${conflictStart.toLocaleString('es-ES')} - ${conflictEnd.toLocaleString('es-ES')}). No puedes estar en dos lugares al mismo tiempo.`);
    }

    // verificar que no haya otra clase en la misma sala que se solape en tiempo
    const roomConflict = await hasRoomConflict(room, classDate, duration);
    if (roomConflict) {
      const conflictStart = new Date(roomConflict.schedule);
      const conflictEnd = new Date(conflictStart.getTime() + roomConflict.duration * 60000);
      return sendError(res, 400, `La sala ${room} ya tiene una clase programada que se solapa con este horario. Clase existente: ${roomConflict.name} (${conflictStart.toLocaleString('es-ES')} - ${conflictEnd.toLocaleString('es-ES')}).`);
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

    // determinar la fecha y duración finales para validar conflictos
    const finalSchedule = updates.schedule ? new Date(updates.schedule) : new Date(classData.schedule);
    const finalDuration = updates.duration !== undefined ? updates.duration : classData.duration;
    const finalRoom = updates.room || classData.room;

    // si se actualiza la fecha, validar que sea futura
    if (updates.schedule) {
      if (finalSchedule <= new Date()) return sendError(res, 400, 'La fecha de la clase debe ser futura');
      updates.schedule = finalSchedule;
    }

    // validar conflictos de horario del monitor (si cambió fecha o duración)
    if (updates.schedule || updates.duration !== undefined) {
      const monitorId = req.userRole === UserRole.ADMIN ? classData.monitorId : req.userId!;
      const monitorConflict = await hasScheduleConflict(monitorId, finalSchedule, finalDuration, id);
      if (monitorConflict) {
        const conflictStart = new Date(monitorConflict.schedule);
        const conflictEnd = new Date(conflictStart.getTime() + monitorConflict.duration * 60000);
        return sendError(res, 400, `El monitor ya tiene una clase programada que se solapa con este horario. Clase existente: ${monitorConflict.name} (${conflictStart.toLocaleString('es-ES')} - ${conflictEnd.toLocaleString('es-ES')}). No puede estar en dos lugares al mismo tiempo.`);
      }
    }

    // validar conflictos de sala (si cambió fecha, duración o sala)
    if (updates.schedule || updates.duration !== undefined || updates.room) {
      const roomConflict = await hasRoomConflict(finalRoom, finalSchedule, finalDuration, id);
      if (roomConflict) {
        const conflictStart = new Date(roomConflict.schedule);
        const conflictEnd = new Date(conflictStart.getTime() + roomConflict.duration * 60000);
        return sendError(res, 400, `La sala ${finalRoom} ya tiene una clase programada que se solapa con este horario. Clase existente: ${roomConflict.name} (${conflictStart.toLocaleString('es-ES')} - ${conflictEnd.toLocaleString('es-ES')}).`);
      }
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

