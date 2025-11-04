// configuracion de google oauth
// importante: reemplaza este client id con el tuyo de google cloud console
// instrucciones: https://console.cloud.google.com/apis/credentials

export const GOOGLE_CLIENT_ID = 'TU_CLIENT_ID_AQUI.apps.googleusercontent.com';

// si estas en desarrollo local, usa:
// export const GOOGLE_CLIENT_ID = '1234567890-abcdefghijklmnop.apps.googleusercontent.com';

// config adicional
export const GOOGLE_AUTH_CONFIG = {
  client_id: GOOGLE_CLIENT_ID,
  callback: handleGoogleCallback,
  auto_select: false,
  cancel_on_tap_outside: true,
};

// callback que maneja la respuesta de google
export function handleGoogleCallback(response: unknown): void {
  console.log('Google response:', response);
  // este callback se ejecuta automaticamente cuando google devuelve los datos
}

