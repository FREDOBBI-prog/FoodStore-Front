import { saveSession } from '../../../utils/auth';
import { go } from '../../../utils/navigate';
import { post } from '../../../utils/api';
import type { IUser } from '../../../types/IUser';

const FS_USERS = 'FS_USERS';
const DEFAULT_USERS = [
  { email: 'admin@food.com', password: 'food123' },
  { email: 'cliente@food.com', password: 'cliente123' },
  { email: 'adrianfredes12@gmail.com', password: 'adrian123' },
];
const ADMIN_COMBOS = DEFAULT_USERS.filter((u) =>
  ['admin@food.com', 'adrianfredes12@gmail.com'].includes(u.email.toLowerCase())
);

// ============================================
// GOOGLE OAUTH INTEGRATION
// ============================================

// importante: reemplaza este client id con el tuyo de google cloud console
const GOOGLE_CLIENT_ID = '409968892025-7m4qjqgn3pq0hmsgb6dfj2md8ck12p9q.apps.googleusercontent.com';

// inicializo google sign-in cuando la libreria este lista
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: unknown) => void;
          prompt: () => void;
        };
        oauth2: {
          initTokenClient: (config: unknown) => {
            requestAccessToken: () => void;
          };
        };
      };
    };
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

// callback cuando google devuelve la respuesta
async function handleGoogleCredentialResponse(response: { credential: string }) {
  try {
    // decodifico el jwt que manda google
    const credential = response.credential;
    const payload = parseJwt(credential);
    
    console.log('Google user data:', payload);

    if (!payload.email) {
      alert('No se pudo obtener el email de Google');
      return;
    }

    // veo si es el admin por email
    const isAdmin = payload.email.toLowerCase() === 'adrianfredes12@gmail.com';
    
    try {
      // Intento hacer login primero
      const user = await post<IUser, { email: string; password: string }>(
        '/api/auth/login',
        { email: payload.email, password: `google_${payload.email}` }
      );
      
      // Si el login funciona, guardo la sesión
      saveSession(user);
      if (user.role === 'admin') {
        go('../../admin/adminHome/adminHome.html');
      } else {
        go('../../store/home/home.html');
      }
    } catch (loginError) {
      // Si el login falla, intento registrar el usuario
      try {
        const newUser = await post<IUser, { name: string; email: string; password: string; role: string }>(
          '/api/auth/register',
          {
            name: payload.name || payload.email,
            email: payload.email,
            password: `google_${payload.email}`, // Contraseña temporal para usuarios de Google
            role: isAdmin ? 'admin' : 'cliente'
          }
        );
        
        saveSession(newUser);
        if (newUser.role === 'admin') {
          go('../../admin/adminHome/adminHome.html');
        } else {
          go('../../store/home/home.html');
        }
      } catch (registerError) {
        console.error('Error al registrar usuario de Google:', registerError);
        alert('Error al iniciar sesión con Google. Intentá de nuevo.');
      }
    }
  } catch (error) {
    console.error('Error processing Google login:', error);
    alert('Error al iniciar sesión con Google. Intentá de nuevo.');
  }
}

// funcion para decodificar el jwt de google
function parseJwt(token: string): { name?: string; email?: string } {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload) as { name?: string; email?: string };
  } catch (e) {
    console.error('Error parsing JWT:', e);
    return {};
  }
}

// manejo el callback cuando google redirige de vuelta
async function handleGoogleRedirect() {
  const hash = window.location.hash;
  if (hash && hash.includes('access_token')) {
    const params = new URLSearchParams(hash.substring(1));
    const accessToken = params.get('access_token');
    
    if (accessToken) {
      try {
        // traigo la info del usuario de google
        const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        const userData: { name?: string; email: string } = await res.json();
        
        if (!userData.email) {
          alert('No se pudo obtener el email de Google');
          return;
        }

        // veo si es admin por email
        const isAdmin = userData.email.toLowerCase() === 'adrianfredes12@gmail.com';
        
        try {
          // Intento hacer login primero
          const user = await post<IUser, { email: string; password: string }>(
            '/api/auth/login',
            { email: userData.email, password: `google_${userData.email}` }
          );
          
          saveSession(user);
          window.location.hash = '';
          if (user.role === 'admin') {
            go('../../admin/adminHome/adminHome.html');
          } else {
            go('../../store/home/home.html');
          }
        } catch (loginError) {
          // Si el login falla, intento registrar el usuario
          try {
            const newUser = await post<IUser, { name: string; email: string; password: string; role: string }>(
              '/api/auth/register',
              {
                name: userData.name || userData.email,
                email: userData.email,
                password: `google_${userData.email}`,
                role: isAdmin ? 'admin' : 'cliente'
              }
            );
            
            saveSession(newUser);
            window.location.hash = '';
            if (newUser.role === 'admin') {
              go('../../admin/adminHome/adminHome.html');
            } else {
              go('../../store/home/home.html');
            }
          } catch (registerError) {
            console.error('Error al registrar usuario de Google:', registerError);
            alert('Error al iniciar sesión con Google');
          }
        }
      } catch (err) {
        console.error('Error obteniendo datos de Google:', err);
        alert('Error al iniciar sesión con Google');
      }
    }
  }
}

// cargo google sign-in cuando el script este listo
window.addEventListener('load', () => {
  // primero verifico si hay callback de google
  handleGoogleRedirect();
  
  // espero a que la libreria de google este disponible
  const checkGoogleLoaded = setInterval(() => {
    if (window.google) {
      clearInterval(checkGoogleLoaded);
      initializeGoogleSignIn();
    }
  }, 100);
  
  // timeout despues de 5 segundos
  setTimeout(() => clearInterval(checkGoogleLoaded), 5000);
});

// manejo el click en el boton de google
const googleBtn = document.getElementById('googleLoginBtn');
googleBtn?.addEventListener('click', () => {
  if (!window.google) {
    alert('Google Sign-In no está disponible. Por favor, recargá la página.');
    return;
  }
  
  try {
    // creo la url de autenticacion de google manualmente
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${GOOGLE_CLIENT_ID}&` +
      `redirect_uri=${encodeURIComponent(window.location.origin + '/src/pages/auth/login/login.html')}&` +
      `response_type=token&` +
      `scope=openid%20email%20profile&` +
      `state=login`;
    
    // redirijo a google sin popup porque es mas confiable
    window.location.href = authUrl;
  } catch (e) {
    console.error('Error al iniciar Google Sign-In:', e);
  }
});

function getUsersList(): Array<{ email: string, password: string }> {
  try {
    const data = localStorage.getItem(FS_USERS);
    const list: Array<{ email: string, password: string }> = data ? JSON.parse(data) : [];
    DEFAULT_USERS.forEach((user) => {
      if (!list.some((u) => u.email.toLowerCase() === user.email.toLowerCase())) {
        list.push(user);
      }
    });
    localStorage.setItem(FS_USERS, JSON.stringify(list));
    return list;
  } catch {
    localStorage.setItem(FS_USERS, JSON.stringify(DEFAULT_USERS));
    return [...DEFAULT_USERS];
  }
}

const form = document.getElementById('loginForm') as HTMLFormElement | null;
form?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const emailEl = document.getElementById('email') as HTMLInputElement | null;
  const passwordEl = document.getElementById('password') as HTMLInputElement | null;
  if (!emailEl || !passwordEl) return;
  const email = emailEl.value.trim();
  const password = passwordEl.value;
  if (!email || !password) {
    alert('Completá email y contraseña');
    return;
  }

  try {
    // Llamo al backend para autenticar
    const user = await post<IUser, { email: string; password: string }>(
      '/api/auth/login',
      { email, password }
    );
    
    // Guardo la sesión y redirijo
    saveSession(user);
    if (user.role === 'admin') {
      go('../../admin/adminHome/adminHome.html');
    } else {
      go('../../store/home/home.html');
    }
  } catch (error: unknown) {
    console.error('Error al iniciar sesión:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error al iniciar sesión';
    if (errorMessage.includes('401') || errorMessage.includes('Credenciales inválidas')) {
      if (confirm('Usuario no encontrado o contraseña incorrecta. ¿Deseas registrarte?')) {
        go('../register/register.html');
      }
    } else {
      alert(`Error: ${errorMessage}`);
    }
  }
});


