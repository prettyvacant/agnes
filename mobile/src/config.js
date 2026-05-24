import { Platform } from 'react-native';

// For local development:
//   iOS Simulator    → localhost funciona directo
//   Android Emulator → usa 10.0.2.2 en lugar de localhost
//   Dispositivo real → ponés la IP de tu computadora (ej: http://192.168.1.50:5000)
// Para producción: reemplazá con tu URL desplegada (ej: https://agnes.tudominio.com)

const LOCAL_URL =
  Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000';

export const API_BASE_URL = LOCAL_URL;
