import api from './api';

// Interfaz para los datos del QR
export interface QRData {
  userId: string;
  qrToken: string;
  role: string;
  expiresAt: string;
}

// Interfaz para la respuesta del QR
export interface QRResponse {
  qrSVG: string;
  qrData: QRData;
  expiresAt: string;
}

// Obtener el QR del usuario autenticado
export const getMyQR = async (): Promise<QRResponse> => {
  try {
    const response = await api.get<{ success: boolean; data: QRResponse }>('/api/qr/me');
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error('Error al obtener QR');
  } catch (error) {
    console.error('Error al obtener QR:', error);
    throw error;
  }
};


