import { saveSession } from '../../../utils/auth';
import { go } from '../../../utils/navigate';
import type { IUser } from '../../../types/IUser';

const FS_USERS = 'FS_USERS';

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
function handleGoogleCredentialResponse(response: { credential: string }) {
  try {
    // decodifico el jwt que manda google
    const credential = response.credential;
    const payload = parseJwt(credential);
    
    console.log('Google user data:', payload);

    // veo si es el admin por email
    const isAdmin = payload.email?.toLowerCase() === 'adrianfredes12@gmail.com';
    
    // creo el usuario con los datos de google
    const googleUser: IUser = {
      id: Date.now(), // id basado en timestamp
      name: payload.name || payload.email,
      email: payload.email,
      role: isAdmin ? 'admin' : 'cliente',
    };

    // guardo en localStorage si no existe
    const users = getUsersList();
    const existingUser = users.find(u => u.email.toLowerCase() === googleUser.email.toLowerCase());
    
    if (!existingUser) {
      // registro el nuevo usuario de google
      users.push({ email: googleUser.email, password: `google_${Date.now()}` });
      localStorage.setItem(FS_USERS, JSON.stringify(users));
    }

    // guardo la sesion
    saveSession(googleUser);

    // redirijo segun el rol
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
function handleGoogleRedirect() {
  const hash = window.location.hash;
  if (hash && hash.includes('access_token')) {
    const params = new URLSearchParams(hash.substring(1));
    const accessToken = params.get('access_token');
    
    if (accessToken) {
      // traigo la info del usuario de google
      fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
      .then(res => res.json())
      .then((userData: { name?: string; email: string }) => {
        // veo si es admin por email
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
        window.location.hash = ''; // limpio el hash
        
        // redirijo segun el rol
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
    return data ? JSON.parse(data) : [];
  } catch { return []; }
}

const form = document.getElementById('loginForm') as HTMLFormElement | null;
form?.addEventListener('submit', (e) => {
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
  const users = getUsersList();
  const found = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
  if (found) {
    // si el mail es el del admin especial
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
    // si no encuentra, redirige a registro
    if (confirm('Usuario no encontrado o contraseña incorrecta. ¿Deseas registrarte?')) {
      go('../register/register.html');
    }
  }
});


