import { saveSession } from '../../../utils/auth';
import { go } from '../../../utils/navigate';
import type { IUser } from '../../../types/IUser';

const FS_USERS = 'FS_USERS';

// ============================================
// GOOGLE OAUTH INTEGRATION
// ============================================

// IMPORTANTE: Reemplazá este Client ID con el tuyo de Google Cloud Console
const GOOGLE_CLIENT_ID = '409968892025-7m4qjqgn3pq0hmsgb6dfj2md8ck12p9q.apps.googleusercontent.com';

// Inicializar Google Sign-In cuando la librería esté lista
declare global {
  interface Window {
    google: any;
  }
}

function initializeGoogleSignIn() {
  if (!window.google) {
    console.warn('Google Sign-In library not loaded yet');
    return;
  }

  window.google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: handleGoogleCredentialResponse,
    ux_mode: 'redirect',
    login_uri: window.location.href,
    auto_select: false,
    cancel_on_tap_outside: true,
    use_fedcm_for_prompt: false,
  });
}

// Callback que recibe la respuesta de Google
function handleGoogleCredentialResponse(response: any) {
  try {
    // Decodificar el JWT token que Google envía
    const credential = response.credential;
    const payload = parseJwt(credential);
    
    console.log('Google user data:', payload);

    // Verificar si es el email de admin
    const isAdmin = payload.email?.toLowerCase() === 'adrianfredes12@gmail.com';
    
    // Crear usuario con los datos de Google
    const googleUser: IUser = {
      id: Date.now(), // ID único basado en timestamp
      name: payload.name || payload.email,
      email: payload.email,
      role: isAdmin ? 'admin' : 'cliente',
    };

    // Guardar en localStorage (opcional: también guardar en FS_USERS)
    const users = getUsersList();
    const existingUser = users.find(u => u.email.toLowerCase() === googleUser.email.toLowerCase());
    
    if (!existingUser) {
      // Registrar nuevo usuario de Google
      users.push({ email: googleUser.email, password: `google_${Date.now()}` });
      localStorage.setItem(FS_USERS, JSON.stringify(users));
    }

    // Guardar sesión
    saveSession(googleUser);

    // Redirigir según el rol
    if (googleUser.role === 'admin') {
      go('../../admin/adminHome/adminHome.html');
    } else {
      go('../../store/home/home.html');
    }
  } catch (error) {
    console.error('Error processing Google login:', error);
    alert('Error al iniciar sesión con Google. Intentá de nuevo.');
  }
}

// Función para decodificar el JWT de Google
function parseJwt(token: string) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error('Error parsing JWT:', e);
    return {};
  }
}

// Manejar callback cuando Google redirige de vuelta
function handleGoogleRedirect() {
  const hash = window.location.hash;
  if (hash && hash.includes('access_token')) {
    const params = new URLSearchParams(hash.substring(1));
    const accessToken = params.get('access_token');
    
    if (accessToken) {
      // Obtener info del usuario de Google
      fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
      .then(res => res.json())
      .then(userData => {
        // Verificar si es el email de admin
        const isAdmin = userData.email.toLowerCase() === 'adrianfredes12@gmail.com';
        
        const googleUser: IUser = {
          id: Date.now(),
          name: userData.name || userData.email,
          email: userData.email,
          role: isAdmin ? 'admin' : 'cliente',
        };
        
        const users = getUsersList();
        const existing = users.find(u => u.email.toLowerCase() === googleUser.email.toLowerCase());
        if (!existing) {
          users.push({ email: googleUser.email, password: `google_${Date.now()}` });
          localStorage.setItem(FS_USERS, JSON.stringify(users));
        }
        
        saveSession(googleUser);
        window.location.hash = ''; // Limpiar hash
        
        // Redirigir según el rol
        if (googleUser.role === 'admin') {
          go('../../admin/adminHome/adminHome.html');
        } else {
          go('../../store/home/home.html');
        }
      })
      .catch(err => {
        console.error('Error obteniendo datos de Google:', err);
        alert('Error al iniciar sesión con Google');
      });
    }
  }
}

// Cargar Google Sign-In cuando el script esté listo
window.addEventListener('load', () => {
  // Primero verificar si hay callback de Google
  handleGoogleRedirect();
  
  // Esperar a que la librería de Google esté disponible
  const checkGoogleLoaded = setInterval(() => {
    if (window.google) {
      clearInterval(checkGoogleLoaded);
      initializeGoogleSignIn();
    }
  }, 100);
  
  // Timeout después de 5 segundos
  setTimeout(() => clearInterval(checkGoogleLoaded), 5000);
});

// Manejar click en el botón personalizado de Google
const googleBtn = document.getElementById('googleLoginBtn');
googleBtn?.addEventListener('click', () => {
  if (!window.google) {
    alert('Google Sign-In no está disponible. Por favor, recargá la página.');
    return;
  }
  
  try {
    // Crear URL de autenticación de Google manualmente
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${GOOGLE_CLIENT_ID}&` +
      `redirect_uri=${encodeURIComponent(window.location.origin + '/src/pages/auth/login/login.html')}&` +
      `response_type=token&` +
      `scope=openid%20email%20profile&` +
      `state=login`;
    
    // Redirigir a Google (sin popup, más confiable)
    window.location.href = authUrl;
  } catch (e) {
    console.error('Error al iniciar Google Sign-In:', e);
  }
});

function getUsersList(): Array<{ email: string, password: string }> {
  try {
    const data = localStorage.getItem(FS_USERS);
    return data ? JSON.parse(data) : [];
  } catch { return []; }
}

const form = document.getElementById('loginForm') as HTMLFormElement | null;
form?.addEventListener('submit', (e) => {
  e.preventDefault();
  const email = (document.getElementById('email') as HTMLInputElement).value.trim();
  const password = (document.getElementById('password') as HTMLInputElement).value;
  if (!email || !password) {
    alert('Completá email y contraseña');
    return;
  }
  const users = getUsersList();
  const found = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
  if (found) {
    // Si el mail es el del administrador especial
    const isAdminCreds = email.toLowerCase() === 'adrianfredes12@gmail.com' && password === 'adrian123';
    const normalized = {
      id: 0,
      name: email,
      email: email,
      role: isAdminCreds ? 'admin' : 'cliente',
    } as IUser;
    saveSession(normalized);
    if (normalized.role === 'admin') go('../../admin/adminHome/adminHome.html');
    else go('../../store/home/home.html');
  } else {
    // Si no encuentra, redirige a registro
    if (confirm('Usuario no encontrado o contraseña incorrecta. ¿Deseas registrarte?')) {
      go('../register/register.html');
    }
  }
});


