import { Response } from 'express';
import axios from 'axios';
import Booking from '../models/Booking';
import Class from '../models/Class';
import { AuthRequest, CreateBookingDTO, BookingStatus, ClassStatus, UserRole } from '../types';

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL;
const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL || 'http://localhost:3003';

if (!AUTH_SERVICE_URL) {
  console.error('Error: AUTH_SERVICE_URL no está definida en las variables de entorno');
  console.error('Por favor, configura AUTH_SERVICE_URL en tu archivo .env');
  process.exit(1);
}

/**
 * Crear reserva (Cualquier usuario autenticado)
 * POST /api/bookings
 */
export const createBooking = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Solo los socios pueden reservar clases
    if (req.userRole !== UserRole.SOCIO) {
      res.status(403).json({
        success: false,
        message: 'Solo los socios pueden reservar clases'
      });
      return;
    }

    const { classId }: CreateBookingDTO = req.body;

    if (!classId) {
      res.status(400).json({
        success: false,
        message: 'El ID de la clase es obligatorio'
      });
      return;
    }

    // Verificar que la clase existe
    const classData = await Class.findById(classId);

    if (!classData) {
      res.status(404).json({
        success: false,
        message: 'Clase no encontrada'
      });
      return;
    }

    // Verificar que la clase no esta cancelada o completada
    if (classData.status === ClassStatus.CANCELLED) {
      res.status(400).json({
        success: false,
        message: 'No se puede reservar una clase cancelada'
      });
      return;
    }

    if (classData.status === ClassStatus.COMPLETED) {
      res.status(400).json({
        success: false,
        message: 'No se puede reservar una clase completada'
      });
      return;
    }

    // Verificar que la clase es futura
    if (new Date(classData.schedule) <= new Date()) {
      res.status(400).json({
        success: false,
        message: 'No se puede reservar una clase que ya ha pasado'
      });
      return;
    }

    // Verificar que hay cupo disponible
    if (classData.currentParticipants >= classData.maxParticipants) {
      res.status(400).json({
        success: false,
        message: 'La clase está completa. No hay cupos disponibles.'
      });
      return;
    }

    // Verificar que el usuario esta autenticado y tiene datos
    if (!req.userId || !req.userName) {
      res.status(401).json({
        success: false,
        message: 'Usuario no autenticado correctamente'
      });
      return;
    }

    // Verificar que el usuario tiene una suscripción activa
    try {
      const token = req.headers.authorization?.split(' ')[1];
      const subscriptionResponse = await axios.get(
        `${PAYMENT_SERVICE_URL}/api/payments/me/active`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (subscriptionResponse.data.success && subscriptionResponse.data.data) {
        const hasActiveSubscription = subscriptionResponse.data.data.hasActiveSubscription;
        if (!hasActiveSubscription) {
          res.status(403).json({
            success: false,
            message: 'Necesitas una suscripción activa para reservar clases'
          });
          return;
        }
      }
    } catch (error: any) {
      // Si el servicio de pagos no está disponible, denegar la reserva por seguridad
      res.status(503).json({
        success: false,
        message: 'No se pudo verificar tu suscripción. Por favor, intenta más tarde.'
      });
      return;
    }

    // Verificar que el usuario no tiene ya una reserva activa para esta clase
    const existingBooking = await Booking.findOne({
      userId: req.userId,
      classId,
      status: BookingStatus.CONFIRMED
    });

    if (existingBooking) {
      res.status(400).json({
        success: false,
        message: 'Ya tienes una reserva activa para esta clase'
      });
      return;
    }

    // Crear la reserva
    const newBooking = new Booking({
      userId: req.userId,
      userName: req.userName,
      classId,
      className: classData.name,
      bookingDate: new Date(),
      status: BookingStatus.CONFIRMED
    });

    await newBooking.save();

    // Incrementar el contador de participantes
    classData.currentParticipants += 1;
    await classData.save();

    res.status(201).json({
      success: true,
      message: 'Reserva creada exitosamente',
      data: newBooking
    });
  } catch (error) {
    console.error('Error al crear reserva:', error);
    
    // Si es un error de validación de Mongoose, devolver mensaje más específico
    if (error instanceof Error) {
      res.status(500).json({
        success: false,
        message: `Error al crear reserva: ${error.message}`
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Error al crear reserva'
      });
    }
  }
};

/**
 * Cancelar reserva
 * PUT /api/bookings/:id/cancel
 */
export const cancelBooking = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const booking = await Booking.findById(id);

    if (!booking) {
      res.status(404).json({
        success: false,
        message: 'Reserva no encontrada'
      });
      return;
    }

    // Verificar que es el usuario dueño de la reserva
    if (booking.userId !== req.userId) {
      res.status(403).json({
        success: false,
        message: 'Solo puedes cancelar tus propias reservas'
      });
      return;
    }

    // Verificar que la reserva no esté ya cancelada
    if (booking.status === BookingStatus.CANCELLED) {
      res.status(400).json({
        success: false,
        message: 'La reserva ya está cancelada'
      });
      return;
    }

    // Verificar que la clase no haya pasado (permitir cancelación hasta 1 hora antes)
    const classData = await Class.findById(booking.classId);

    if (!classData) {
      res.status(404).json({
        success: false,
        message: 'Clase no encontrada'
      });
      return;
    }

    const oneHourBeforeClass = new Date(classData.schedule);
    oneHourBeforeClass.setHours(oneHourBeforeClass.getHours() - 1);

    if (new Date() > oneHourBeforeClass) {
      res.status(400).json({
        success: false,
        message: 'No se puede cancelar una reserva con menos de 1 hora de antelación'
      });
      return;
    }

    // Cancelar la reserva
    booking.status = BookingStatus.CANCELLED;
    await booking.save();

    // Decrementar el contador de participantes
    classData.currentParticipants = Math.max(0, classData.currentParticipants - 1);
    await classData.save();

    res.status(200).json({
      success: true,
      message: 'Reserva cancelada exitosamente',
      data: booking
    });
  } catch (error) {
    console.error('Error al cancelar reserva:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cancelar reserva'
    });
  }
};

/**
 * Obtener mis reservas
 * GET /api/bookings/my-bookings
 */
export const getMyBookings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status } = req.query;

    const filter: any = { userId: req.userId };

    if (status) {
      filter.status = status;
    }

    const bookings = await Booking.find(filter)
      .populate({
        path: 'classId',
        options: { strictPopulate: false }
      })
      .sort({ bookingDate: -1 });

    res.status(200).json({
      success: true,
      data: bookings,
      count: bookings.length
    });
  } catch (error) {
    console.error('Error al obtener mis reservas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener reservas'
    });
  }
};

/**
 * Obtener todas las reservas de una clase (Solo monitor de la clase o admin)
 * GET /api/bookings/class/:classId
 */
export const getClassBookings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { classId } = req.params;
    const { status } = req.query;

    // Verificar que la clase existe
    const classData = await Class.findById(classId);

    if (!classData) {
      res.status(404).json({
        success: false,
        message: 'Clase no encontrada'
      });
      return;
    }

    // Verificar permisos: solo monitor de la clase o admin
    if (req.userRole !== 'admin' && classData.monitorId !== req.userId) {
      res.status(403).json({
        success: false,
        message: 'No tienes permisos para ver las reservas de esta clase'
      });
      return;
    }

    const filter: any = { classId };

    if (status) {
      filter.status = status;
    }

    const bookings = await Booking.find(filter).sort({ bookingDate: -1 });

    // Obtener todos los usuarios de una vez para optimizar
    const token = req.headers.authorization?.split(' ')[1];
    const userIds = [...new Set(bookings.map(b => b.userId))];
    
    let userEmailMap: Record<string, string> = {};
    
    try {
      // Llamar al Auth Service para obtener todos los usuarios
      const usersResponse = await axios.get(
        `${AUTH_SERVICE_URL}/api/admin/users`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (usersResponse.data.success && usersResponse.data.data) {
        usersResponse.data.data.forEach((user: any) => {
          userEmailMap[user._id] = user.email || '-';
        });
      }
    } catch (error) {
    }

    // Agregar emails a las reservas
    const bookingsWithEmails = bookings.map((booking) => ({
      ...booking.toObject(),
      userEmail: userEmailMap[booking.userId] || '-'
    }));

    res.status(200).json({
      success: true,
      data: bookingsWithEmails,
      count: bookingsWithEmails.length,
      classInfo: {
        name: classData.name,
        schedule: classData.schedule,
        currentParticipants: classData.currentParticipants,
        maxParticipants: classData.maxParticipants
      }
    });
  } catch (error) {
    console.error('Error al obtener reservas de la clase:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener reservas'
    });
  }
};

/**
 * Obtener todas las reservas (Solo admin)
 * GET /api/bookings
 */
export const getAllBookings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, userId, classId } = req.query;

    const filter: any = {};

    if (status) filter.status = status;
    if (userId) filter.userId = userId;
    if (classId) filter.classId = classId;

    const bookings = await Booking.find(filter)
      .populate({
        path: 'classId',
        options: { strictPopulate: false }
      })
      .sort({ bookingDate: -1 });

    res.status(200).json({
      success: true,
      data: bookings,
      count: bookings.length
    });
  } catch (error) {
    console.error('Error al obtener reservas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener reservas'
    });
  }
};
