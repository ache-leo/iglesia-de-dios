/* =========================================
   SISTEMA DE AUTENTICACIÓN Y AUTORIZACIÓN
   ========================================= */

const ROLES = {
  admin:       { label: 'Admin',         prioridad: 100 },
  presidente:  { label: 'Presidente',    prioridad: 80 },
  secretario:  { label: 'Secretario/a',  prioridad: 60 },
  tesorero:    { label: 'Tesorero',      prioridad: 50 },
  vocal:       { label: 'Vocal',         prioridad: 40 },
};

function getRolLabel(rol) {
  return ROLES[rol] ? ROLES[rol].label : rol;
}

function getIglesiasPermitidas(usuario) {
  if (!usuario) return [];
  if (usuario.rol === 'admin' || usuario.rol === 'presidente' || usuario.rol === 'secretario' || usuario.rol === 'vocal') {
    return Object.keys(IGLESIAS); // todas
  }
  if (usuario.rol === 'tesorero') {
    if (usuario.iglesia) return [usuario.iglesia];
    return Object.keys(IGLESIAS);
  }
  return [];
}

function puedeAccederFinanzas(usuario, iglesia) {
  if (!usuario) return false;
  if (usuario.rol === 'admin' || usuario.rol === 'presidente') return true;
  if (usuario.rol === 'tesorero') {
    if (!iglesia) return true; // si no se filtra, ve toda su data
    return usuario.iglesia === iglesia || !usuario.iglesia;
  }
  return false;
}

function puedeEditarFinanzas(usuario) {
  if (!usuario) return false;
  return usuario.rol === 'admin' || (usuario.rol === 'tesorero');
}

function puedeGestionarMiembros(usuario) {
  if (!usuario) return false;
  return usuario.rol === 'admin' || usuario.rol === 'presidente' || usuario.rol === 'secretario';
}

function puedeGestionarUsuarios(usuario) {
  if (!usuario) return false;
  return usuario.rol === 'admin';
}

function puedeVerPanel(usuario) {
  if (!usuario) return false;
  return true;
}

/* =========================================
   GESTIÓN DE SESIÓN
   ========================================= */

const SESSION_KEY = 'iglesiaDeDios_sesion';

let usuarioActual = null;

function cargarSesion() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (raw) usuarioActual = JSON.parse(raw);
  } catch (e) { usuarioActual = null; }
  return usuarioActual;
}

function guardarSesion(usuario) {
  usuarioActual = usuario;
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(usuario));
  } catch (e) {}
}

function cerrarSesion() {
  usuarioActual = null;
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch (e) {}
  actualizarNavAuth();
  mostrarToast('Sesión cerrada.', 'info');

  const loginModal = document.getElementById('loginModal');
  if (loginModal) loginModal.classList.remove('open');

  const dashSection = document.getElementById('section-dashboard');
  if (dashSection) dashSection.remove();

  const mainContent = document.getElementById('mainContent');
  if (mainContent && !mainContent.querySelector('.section.active')) {
    showSection('inicio');
  }
}

function haySesion() {
  return usuarioActual !== null;
}

/* =========================================
   USUARIOS DEL SISTEMA
   ========================================= */

let usuariosRegistrados = [];

async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function cargarUsuarios() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USERS);
    if (raw) {
      usuariosRegistrados = JSON.parse(raw);
      if (usuariosRegistrados.length > 0) {
        if (usuariosRegistrados[0].password && usuariosRegistrados[0].password.length < 40) {
          for (const u of usuariosRegistrados) {
            u.password = await hashPassword(u.password);
          }
          guardarUsuarios();
        }
        return;
      }
    }
  } catch (e) {}
  await seedDefaultUsers();
}

async function seedDefaultUsers() {
  const defaults = [
    { id: 1, username: 'admin',       password: 'admin123',       nombre: 'Administrador',  rol: 'admin',       iglesia: '' },
    { id: 2, username: 'presidente',  password: 'pres123',        nombre: 'Presidente',     rol: 'presidente',  iglesia: '' },
    { id: 3, username: 'secretario',  password: 'sec123',         nombre: 'Secretaría',     rol: 'secretario',  iglesia: '' },
    { id: 4, username: 'tcentral',    password: 'tcentral123',    nombre: 'Tesorero Central',   rol: 'tesorero', iglesia: 'central' },
    { id: 5, username: 'tsayago',     password: 'tsayago123',     nombre: 'Tesorero Sayago',    rol: 'tesorero', iglesia: 'sayago' },
    { id: 6, username: 'ttacuarembo', password: 'ttacuarembo123', nombre: 'Tesorero Tacuarembó', rol: 'tesorero', iglesia: 'tacuarembo' },
    { id: 7, username: 'vocal',       password: 'vocal123',       nombre: 'Vocal',          rol: 'vocal',       iglesia: '' },
  ];
  for (const u of defaults) {
    u.password = await hashPassword(u.password);
  }
  usuariosRegistrados = defaults;
  guardarUsuarios();
}

function guardarUsuarios() {
  try {
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(usuariosRegistrados));
  } catch (e) {}
}

async function autenticar(username, password) {
  const hashedInput = await hashPassword(password);
  const user = usuariosRegistrados.find(u => u.username === username && u.password === hashedInput);
  if (!user) return null;
  const sesion = {
    id: user.id,
    username: user.username,
    nombre: user.nombre,
    rol: user.rol,
    rolLabel: getRolLabel(user.rol),
    iglesia: user.iglesia || '',
    iglesiaLabel: user.iglesia ? IGLESIAS[user.iglesia] : 'Todas'
  };
  guardarSesion(sesion);
  return sesion;
}

function actualizarNavAuth() {
  const container = document.getElementById('authBadge');
  if (!container) return;
  if (usuarioActual) {
    container.innerHTML = `
      <div class="user-badge">
        <span>${escapeHtml(usuarioActual.nombre)}</span>
        <span class="role-tag">${escapeHtml(usuarioActual.rolLabel)}${usuarioActual.iglesia ? ' · ' + escapeHtml(usuarioActual.iglesiaLabel) : ''}</span>
        <button class="logout-btn" onclick="cerrarSesion(); showSection('inicio');" title="Cerrar sesión">✕</button>
      </div>
    `;
  } else {
    container.innerHTML = `<button class="btn btn-outline btn-sm" onclick="openLoginModal()">Iniciar sesión</button>`;
  }
}

async function loginHandler(username, password) {
  const user = await autenticar(username, password);
  if (!user) return null;
  actualizarNavAuth();
  return user;
}
