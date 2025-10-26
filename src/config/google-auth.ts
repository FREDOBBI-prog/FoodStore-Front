// Configuración de Google OAuth
// IMPORTANTE: Reemplazá este Client ID con el tuyo propio de Google Cloud Console
// Instrucciones: https://console.cloud.google.com/apis/credentials

export const GOOGLE_CLIENT_ID = 'TU_CLIENT_ID_AQUI.apps.googleusercontent.com';

// Si estás en desarrollo local, usa:
// export const GOOGLE_CLIENT_ID = '1234567890-abcdefghijklmnop.apps.googleusercontent.com';

// Configuración adicional
export const GOOGLE_AUTH_CONFIG = {
  client_id: GOOGLE_CLIENT_ID,
  callback: handleGoogleCallback,
  auto_select: false,
  cancel_on_tap_outside: true,
};

// Callback que maneja la respuesta de Google
export function handleGoogleCallback(response: any) {
  console.log('Google response:', response);
  // Este callback se ejecuta automáticamente cuando Google devuelve los datos
}

