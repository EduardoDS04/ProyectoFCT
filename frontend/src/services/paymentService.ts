import type {
  Subscription,
  CreateSubscriptionData
} from '../types';
import { SubscriptionType, SubscriptionStatus, PaymentStatus } from '../types';

// Servicio para gestionar suscripciones usando localStorage como simulacion
class PaymentService {
  // Clave para almacenar las suscripciones en localStorage
  private readonly STORAGE_KEY = 'mock_subscriptions';

  // Obtiene el ID del usuario desde localStorage
  private getUserId(): string {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        return user.id || user._id || 'default_user';
      }
    } catch (error) {
      console.warn('Error al obtener userId:', error);
    }
    return 'default_user';
  }

  // Crea una nueva suscripcion simulada y la guarda en localStorage
  private async createMockSubscription(data: CreateSubscriptionData): Promise<Subscription> {
    const userId = this.getUserId();
    const startDate = new Date();
    const endDate = new Date(startDate);
    
    // Calcula la fecha de finalizacion segun el tipo de suscripcion
    switch (data.subscriptionType) {
      case SubscriptionType.MONTHLY:
        endDate.setMonth(endDate.getMonth() + 1);
        break;
      case SubscriptionType.QUARTERLY:
        endDate.setMonth(endDate.getMonth() + 3);
        break;
      case SubscriptionType.YEARLY:
        endDate.setFullYear(endDate.getFullYear() + 1);
        break;
    }
    
    // Simula un delay de procesamiento de 1 segundo
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Crea el objeto de suscripcion con los datos proporcionados
    const mockSubscription: Subscription = {
      _id: `mock_${Date.now()}_${userId}`,
      userId: userId,
      subscriptionType: data.subscriptionType,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      status: SubscriptionStatus.ACTIVE,
      paymentStatus: PaymentStatus.COMPLETED,
      amount: data.subscriptionType === SubscriptionType.MONTHLY ? 29.99 : data.subscriptionType === SubscriptionType.QUARTERLY ? 79.99 : 299.99,
      bankDetails: {
        cardNumber: `**** **** **** ${data.bankDetails.cardNumber.slice(-4)}`,
        cardHolder: data.bankDetails.cardHolder,
        expiryDate: data.bankDetails.expiryDate
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Cancela cualquier suscripcion activa previa del usuario antes de crear la nueva
    const subscriptions = this.getMockSubscriptions();
    const updatedSubscriptions = subscriptions.map(sub => 
      sub.status === SubscriptionStatus.ACTIVE && sub.userId === userId
        ? { ...sub, status: SubscriptionStatus.CANCELLED, updatedAt: new Date().toISOString() }
        : sub
    );
    updatedSubscriptions.push(mockSubscription);
    this.saveMockSubscriptions(updatedSubscriptions);
    
    return mockSubscription;
  }

  // Obtiene todas las suscripciones almacenadas en localStorage
  private getMockSubscriptions(): Subscription[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) {
        return [];
      }
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.warn('Error al leer suscripciones del localStorage:', error);
      return [];
    }
  }

  // Guarda las suscripciones en localStorage
  private saveMockSubscriptions(subscriptions: Subscription[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(subscriptions));
    } catch (error) {
      console.warn('Error al guardar suscripciones en localStorage:', error);
    }
  }

  // Obtiene todas las suscripciones del usuario actual
  async getMySubscriptions(): Promise<Subscription[]> {
    const userId = this.getUserId();
    const allSubscriptions = this.getMockSubscriptions();
    return allSubscriptions.filter(sub => sub.userId === userId);
  }

  // Obtiene una suscripcion especifica por su ID
  async getSubscriptionById(id: string): Promise<Subscription> {
    const userId = this.getUserId();
    const subscriptions = this.getMockSubscriptions();
    const subscription = subscriptions.find(sub => sub._id === id && sub.userId === userId);
    if (!subscription) {
      throw new Error('Suscripción no encontrada');
    }
    return subscription;
  }

  // Crea una nueva suscripcion para el usuario actual
  async createSubscription(data: CreateSubscriptionData): Promise<Subscription> {
    return await this.createMockSubscription(data);
  }

  // Cancela una suscripcion existente cambiando su estado a CANCELLED
  async cancelSubscription(id: string): Promise<Subscription> {
    await new Promise(resolve => setTimeout(resolve, 500));
    const userId = this.getUserId();
    const subscriptions = this.getMockSubscriptions();
    const subscriptionIndex = subscriptions.findIndex(sub => sub._id === id && sub.userId === userId);
    
    if (subscriptionIndex === -1) {
      throw new Error('Suscripción no encontrada');
    }
    
    const updatedSubscription = {
      ...subscriptions[subscriptionIndex],
      status: SubscriptionStatus.CANCELLED,
      updatedAt: new Date().toISOString()
    };
    
    subscriptions[subscriptionIndex] = updatedSubscription;
    this.saveMockSubscriptions(subscriptions);
    
    return updatedSubscription;
  }
}

export default new PaymentService();
