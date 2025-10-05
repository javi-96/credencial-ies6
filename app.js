// App simple de credencial (PWA) sin backend
// - Registro con legajo, dni, nombre, apellido
// - Lookup local de carrera/año desde assets/students.json
// - Estado Activo/Inactivo provisto en el padrón local (editable)
// - Persistencia local con localStorage
// - Exportación a PDF (usando print to PDF)

const STATE_KEY = 'cred:user';

const $ = (s)=>document.querySelector(s);
const authSection = $('#authSection');
const credSection = $('#credSection');
const form = $('#registerForm');
const msg = $('#authMsg');
const logoutBtn = $('#logoutBtn');
const downloadBtn = $('#downloadBtn');

const cNombre = $('#cNombre');
const cApellido = $('#cApellido');
const cDni = $('#cDni');
const cLegajo = $('#cLegajo');
const cCarrera = $('#cCarrera');
const cAnio = $('#cAnio');
const cEstado = $('#cEstado');
const avatarText = $('#avatarText');
const instName = $('#instName');
const instSub = $('#instSub');

// Configuración editable por institución
const CONFIG = {
  institucion: 'IES N°6 - Perico (Oficial)',
  subtitulo: 'Credencial Digital',
  padronUrl: 'assets/students.json' // Cambiar a un endpoint cuando haya backend
};

instName.textContent = CONFIG.institucion;
instSub.textContent = CONFIG.subtitulo;

async function loadPadron() {
  try {
    const res = await fetch(CONFIG.padronUrl, { cache: 'no-store' });
    if (!res.ok) throw new Error('No se pudo cargar el padrón');
    return await res.json();
  } catch (e) {
    console.error(e);
    msg.textContent = 'Error cargando padrón local. Contactá a Secretaría.';
    return [];
  }
}

function saveState(user) {
  localStorage.setItem(STATE_KEY, JSON.stringify(user));
}
function getState() {
  const raw = localStorage.getItem(STATE_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}
function clearState() { localStorage.removeItem(STATE_KEY); }

function showCredential(user) {
  authSection.classList.add('hidden');
  credSection.classList.remove('hidden');

  cNombre.textContent = user.nombre;
  cApellido.textContent = user.apellido;
  cDni.textContent = user.dni;
  cLegajo.textContent = user.legajo;
  cCarrera.textContent = user.carrera ?? '—';
  cAnio.textContent = user.anio ?? '—';

  avatarText.textContent = (user.nombre?.[0] || '?').toUpperCase();

  cEstado.textContent = user.estado ?? '—';
  cEstado.classList.remove('ok', 'no');
  if (user.estado === 'ACTIVO') cEstado.classList.add('ok');
  else if (user.estado === 'INACTIVO') cEstado.classList.add('no');
}

function showAuth() {
  credSection.classList.add('hidden');
  authSection.classList.remove('hidden');
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  msg.textContent = 'Buscando en padrón...';
  const data = Object.fromEntries(new FormData(form).entries());
  const legajo = (data.legajo || '').trim();
  const dni = (data.dni || '').trim();
  const nombre = (data.nombre || '').trim();
  const apellido = (data.apellido || '').trim();

  if (!legajo || !dni || !nombre || !apellido) {
    msg.textContent = 'Completá todos los campos.';
    return;
  }
  const padron = await loadPadron();
  const match = padron.find(s =>
    (s.legajo + '').toLowerCase() === legajo.toLowerCase() &&
    (s.dni + '') === dni
  );

  if (!match) {
    msg.textContent = 'No se encontró tu registro en el padrón. Verificá legajo/DNI en Secretaría.';
    return;
  }

  // Validación opcional: nombre/apellido deben coincidir (puede permitir variaciones)
  const okName = (match.nombre || '').trim().toLowerCase() === nombre.toLowerCase()
              && (match.apellido || '').trim().toLowerCase() === apellido.toLowerCase();
  if (!okName) {
    msg.textContent = 'El nombre/apellido no coincide con el padrón. Revisá los datos o consultá en Secretaría.';
    return;
  }

  const user = {
    legajo, dni, nombre, apellido,
    carrera: match.carrera, anio: match.anio,
    estado: match.estado || 'INACTIVO'
  };
  saveState(user);
  msg.textContent = '';
  showCredential(user);
});

logoutBtn.addEventListener('click', () => {
  clearState();
  showAuth();
});

downloadBtn.addEventListener('click', () => {
  // Usamos print-to-PDF nativo del navegador para generar un PDF simple de la tarjeta
  window.print();
});

// Session restore
const stored = getState();
if (stored) { showCredential(stored); }

