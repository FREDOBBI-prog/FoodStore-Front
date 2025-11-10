import { saveSession } from '../../../utils/auth';
import { go } from '../../../utils/navigate';
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
      id: Date.now(),
      name: payload.name || payload.email,
      email: payload.email,
      role: isAdmin ? 'admin' : 'cliente',
    };

    // guardo el nuevo usuario de google en localStorage
    const users = getUsersList();
    const existingUser = users.find(u => u.email.toLowerCase() === googleUser.email.toLowerCase());
    
    if (!existingUser) {
      users.push({ email: googleUser.email, password: `google_${Date.now()}` });
      localStorage.setItem(FS_USERS, JSON.stringify(users));
    }

    // guardo la sesion
    saveSession(googleUser);

    // redirijo a la tienda, los registros siempre son clientes
    go('../../store/home/home.html');
  } catch (error) {
    console.error('Error processing Google registration:', error);
    alert('Error al registrarse con Google. Intentá de nuevo.');
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
        alert('Error al registrarse con Google');
      });
    }
  }
}

// cargo google sign-in cuando el script este listo
window.addEventListener('load', () => {
  // primero verifico si hay callback de google
  handleGoogleRedirect();
  
  const checkGoogleLoaded = setInterval(() => {
    if (window.google) {
      clearInterval(checkGoogleLoaded);
      initializeGoogleSignIn();
    }
  }, 100);
  
  setTimeout(() => clearInterval(checkGoogleLoaded), 5000);
});

// manejo el click en el boton de google
const googleBtn = document.getElementById('googleRegisterBtn');
googleBtn?.addEventListener('click', () => {
  if (!window.google) {
    alert('Google Sign-In no está disponible. Por favor, recargá la página.');
    return;
  }
  
  try {
    // creo la url de autenticacion de google manualmente
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${GOOGLE_CLIENT_ID}&` +
      `redirect_uri=${encodeURIComponent(window.location.origin + '/src/pages/auth/register/register.html')}&` +
      `response_type=token&` +
      `scope=openid%20email%20profile&` +
      `state=register`;
    
    // redirijo a google sin popup porque es mas confiable
    window.location.href = authUrl;
  } catch (e) {
    console.error('Error al iniciar Google Sign-In:', e);
  }
});

function getUsersList(): Array<{email: string, password: string}> {
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
function saveUserToList(email: string, password: string): void {
  const users = getUsersList();
  const exists = users.some((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!exists) {
    users.push({ email, password });
    localStorage.setItem(FS_USERS, JSON.stringify(users));
  }
}

const form = document.getElementById('registerForm') as HTMLFormElement | null;
form?.addEventListener('submit', (e) => {
  e.preventDefault();
  const nameEl = document.getElementById('name') as HTMLInputElement | null;
  const emailEl = document.getElementById('email') as HTMLInputElement | null;
  const passwordEl = document.getElementById('password') as HTMLInputElement | null;
  if (!nameEl || !emailEl || !passwordEl) return;
  const name = nameEl.value.trim();
  const email = emailEl.value.trim();
  const password = passwordEl.value;
  const roleEl = document.getElementById('role') as HTMLSelectElement | null;
  const role = roleEl?.value || 'cliente';
  if (!name || !email || !password) {
    alert('Completá nombre, email y contraseña');
    return;
  }
  if (password.length < 6) {
    alert('La contraseña debe tener al menos 6 caracteres');
    return;
  }
  const users = getUsersList();
  if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
    alert('Ese email ya está registrado en este sistema. Usá otro o iniciá sesión.');
    return;
  }
  // agrego usuario a la lista local
  saveUserToList(email, password);
  // guardo la sesion y redirijo
  const isAdminCreds = ADMIN_COMBOS.some((combo) =>
    combo.email.toLowerCase() === email.toLowerCase() && combo.password === password
  );
  const user = {
    id: 0,
    name,
    email,
    role: isAdminCreds ? 'admin' : (role || 'cliente'),
  } as IUser;
  saveSession(user);
  if (user.role === 'admin') {
    go('../../admin/adminHome/adminHome.html');
  } else {
    go('../../store/home/home.html');
  }
});


