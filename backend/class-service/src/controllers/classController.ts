import { Response } from 'express';
import Class from '../models/Class';
import Booking from '../models/Booking';
import { AuthRequest, CreateClassDTO, UpdateClassDTO, ClassStatus, UserRole, BookingStatus } from '../types';

/**
 * Obtener todas las clases
 * GET /api/classes
 */
export const getAllClasses = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, monitorId, fromDate, toDate } = req.query;

    // Construir filtro dinámico
    const filter: any = {};

    if (status) {
      filter.status = status;
    }

    if (monitorId) {
      filter.monitorId = monitorId;
    }

    // Filtro por rango de fechas
    if (fromDate || toDate) {
      filter.schedule = {};
      if (fromDate) {
        filter.schedule.$gte = new Date(fromDate as string);
      }
      if (toDate) {
        filter.schedule.$lte = new Date(toDate as string);
      }
    }

    // Marcar automáticamente TODAS las clases pasadas como completadas (si no estan canceladas)
    // Esto se hace antes de aplicar el filtro para asegurar que todas las clases pasadas se marquen
    const now = new Date();
    await Class.updateMany(
      {
        status: ClassStatus.ACTIVE,
        $expr: {
          $lt: [
            { $add: ['$schedule', { $multiply: ['$duration', 60000] }] },
            now
          ]
        }
      },
      { status: ClassStatus.COMPLETED }
    );

    // Ahora obtener las clases con el filtro aplicado
    let classes = await Class.find(filter).sort({ schedule: 1 });

    res.status(200).json({
      success: true,
      data: classes,
      count: classes.length
    });
  } catch (error) {
    console.error('Error al obtener clases:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener clases'
    });
  }
};

/**
 * Obtener una clase por ID
 * GET /api/classes/:id
 */
export const getClassById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const classData = await Class.findById(id);

    if (!classData) {
      res.status(404).json({
        success: false,
        message: 'Clase no encontrada'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: classData
    });
  } catch (error) {
    console.error('Error al obtener clase:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener clase'
    });
  }
};

/**
 * Crear nueva clase (Solo Monitor o Admin)
 * POST /api/classes
 */
export const createClass = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, description, schedule, duration, maxParticipants, room }: CreateClassDTO = req.body;

    // Validar campos requeridos
    if (!name || !description || !schedule || !duration || !maxParticipants || !room) {
      res.status(400).json({
        success: false,
        message: 'Todos los campos son obligatorios'
      });
      return;
    }

    // Validar que la fecha sea futura
    const classDate = new Date(schedule);
    if (classDate <= new Date()) {
      res.status(400).json({
        success: false,
        message: 'La fecha de la clase debe ser futura'
      });
      return;
    }

    // Validar que el monitor no tenga otra clase en el mismo día y hora
    const monitorId = req.userId!;
    const existingClass = await Class.findOne({
      monitorId,
      schedule: classDate,
      status: { $ne: ClassStatus.CANCELLED } // No considerar clases canceladas
    });

    if (existingClass) {
      res.status(400).json({
        success: false,
        message: 'Ya tienes una clase programada en esta fecha y hora. No puedes estar en dos lugares al mismo tiempo.'
      });
      return;
    }

    // Crear la clase
    const newClass = new Class({
      name,
      description,
      monitorId: req.userId!,
      monitorName: req.userName!,
      schedule: classDate,
      duration,
      maxParticipants,
      currentParticipants: 0,
      room,
      status: ClassStatus.ACTIVE
    });

    await newClass.save();

    res.status(201).json({
      success: true,
      message: 'Clase creada exitosamente',
      data: newClass
    });
  } catch (error) {
    console.error('Error al crear clase:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear clase'
    });
  }
};

/**
 * Actualizar clase (Solo el monitor creador o admin)
 * PUT /api/classes/:id
 */
export const updateClass = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updates: UpdateClassDTO = req.body;

    const classData = await Class.findById(id);

    if (!classData) {
      res.status(404).json({
        success: false,
        message: 'Clase no encontrada'
      });
      return;
    }

    // Verificar permisos: solo el monitor creador o admin
    if (req.userRole !== UserRole.ADMIN && classData.monitorId !== req.userId) {
      res.status(403).json({
        success: false,
        message: 'Solo el monitor de la clase o un administrador pueden actualizarla'
      });
      return;
    }

    // No permitir editar clases canceladas o completadas
    if (classData.status === ClassStatus.CANCELLED || classData.status === ClassStatus.COMPLETED) {
      res.status(400).json({
        success: false,
        message: 'No se pueden editar clases canceladas o completadas'
      });
      return;
    }

    // No permitir editar clases que ya han pasado
    if (new Date(classData.schedule) < new Date()) {
      res.status(400).json({
        success: false,
        message: 'No se pueden editar clases que ya han finalizado'
      });
      return;
    }

    // Si se actualiza la fecha, validar que sea futura y que no haya conflicto
    if (updates.schedule) {
      const newDate = new Date(updates.schedule);
      if (newDate <= new Date()) {
        res.status(400).json({
          success: false,
          message: 'La fecha de la clase debe ser futura'
        });
        return;
      }

      // Validar que el monitor no tenga otra clase en el mismo día y hora (excluyendo la clase actual)
      const monitorId = req.userRole === UserRole.ADMIN ? classData.monitorId : req.userId!;
      const existingClass = await Class.findOne({
        _id: { $ne: id }, // Excluir la clase actual
        monitorId,
        schedule: newDate,
        status: { $ne: ClassStatus.CANCELLED } // No considerar clases canceladas
      });

      if (existingClass) {
        res.status(400).json({
          success: false,
          message: 'El monitor ya tiene una clase programada en esta fecha y hora. No puede estar en dos lugares al mismo tiempo.'
        });
        return;
      }

      updates.schedule = newDate;
    }

    // Si se reduce maxParticipants, verificar que no sea menor a currentParticipants
    if (updates.maxParticipants !== undefined && updates.maxParticipants < classData.currentParticipants) {
      res.status(400).json({
        success: false,
        message: `No puedes reducir el aforo por debajo del número actual de participantes (${classData.currentParticipants})`
      });
      return;
    }

    // Actualizar
    Object.assign(classData, updates);
    await classData.save();

    res.status(200).json({
      success: true,
      message: 'Clase actualizada exitosamente',
      data: classData
    });
  } catch (error) {
    console.error('Error al actualizar clase:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar clase'
    });
  }
};

/**
 * Cancelar clase (Solo el monitor creador o admin)
 * PUT /api/classes/:id/cancel
 */
export const cancelClass = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const classData = await Class.findById(id);

    if (!classData) {
      res.status(404).json({
        success: false,
        message: 'Clase no encontrada'
      });
      return;
    }

    // Verificar permisos
    if (req.userRole !== UserRole.ADMIN && classData.monitorId !== req.userId) {
      res.status(403).json({
        success: false,
        message: 'Solo el monitor de la clase o un administrador pueden cancelarla'
      });
      return;
    }

    // cancelada
    if (classData.status === ClassStatus.CANCELLED) {
      res.status(400).json({
        success: false,
        message: 'La clase ya está cancelada'
      });
      return;
    }

    // Cancelar clase
    classData.status = ClassStatus.CANCELLED;
    await classData.save();

    // Cancelar todas las reservas asociadas
    await Booking.updateMany(
      { classId: id, status: BookingStatus.CONFIRMED },
      { status: BookingStatus.CANCELLED }
    );

    res.status(200).json({
      success: true,
      message: 'Clase cancelada exitosamente. Se han cancelado todas las reservas.',
      data: classData
    });
  } catch (error) {
    console.error('Error al cancelar clase:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cancelar clase'
    });
  }
};

/**
 * Eliminar clase (Solo admin)
 * DELETE /api/classes/:id
 */
export const deleteClass = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const classData = await Class.findById(id);

    if (!classData) {
      res.status(404).json({
        success: false,
        message: 'Clase no encontrada'
      });
      return;
    }

    // Verificar si tiene reservas activas
    const activeBookings = await Booking.countDocuments({
      classId: id,
      status: BookingStatus.CONFIRMED
    });

    if (activeBookings > 0) {
      res.status(400).json({
        success: false,
        message: `No se puede eliminar la clase porque tiene ${activeBookings} reserva(s) activa(s). Cancela la clase primero.`
      });
      return;
    }

    // Eliminar clase y sus reservas canceladas
    await Class.findByIdAndDelete(id);
    await Booking.deleteMany({ classId: id });

    res.status(200).json({
      success: true,
      message: 'Clase eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar clase:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar clase'
    });
  }
};

/**
 * Obtener clases del monitor autenticado
 * GET /api/classes/my-classes
 */
export const getMyClasses = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const classes = await Class.find({ monitorId: req.userId }).sort({ schedule: 1 });

    res.status(200).json({
      success: true,
      data: classes,
      count: classes.length
    });
  } catch (error) {
    console.error('Error al obtener mis clases:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener clases'
    });
  }
};

