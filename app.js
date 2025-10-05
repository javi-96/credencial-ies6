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
const btnIns = document.getElementById('btnInscripcion');
const btnReg = document.getElementById('btnRegular');

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
  padronUrl: 'https://script.google.com/macros/s/AKfycbxiyr6_gL-GQbJFUgRKSdqT2BDPh3RUX0kXfWdzrQ9v8VdROMG1zWCI-GqGm8sxbcNj/exec' // <-- URL de tu Web App de Apps Script
};

instName.textContent = CONFIG.institucion;
instSub.textContent = CONFIG.subtitulo;

async function loadPadron() {
  async function apiLookup(legajo, dni) {
  const url = `${CONFIG.padronUrl}?fn=lookup&legajo=${encodeURIComponent(legajo)}&dni=${encodeURIComponent(dni)}`;
  const r = await fetch(url, { cache:'no-store' });
  return r.json();
}

async function apiRegister(data) {
  const r = await fetch(CONFIG.padronUrl, {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ fn:'register', ...data })
  });
  return r.json();
}

async function apiCert(tipo, legajo, dni) {
  // Abre en nueva pestaña (el script devuelve link al PDF)
  const url = `${CONFIG.padronUrl}?fn=cert&tipo=${tipo}&legajo=${encodeURIComponent(legajo)}&dni=${encodeURIComponent(dni)}`;
  window.open(url, '_blank');
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
  msg.textContent = 'Consultando...';

  const data = Object.fromEntries(new FormData(form).entries());
  const legajo = data.legajo.trim();
  const dni = data.dni.trim();
  const nombre = data.nombre.trim();
  const apellido = data.apellido.trim();

  // 1) Intentar encontrar en padrón (lookup)
  let resp = await apiLookup(legajo, dni);

  if (!resp.ok) {
    // 2) Si no está, registrar solicitud
    resp = await apiRegister({ legajo, dni, nombre, apellido });
  }

  if (!resp.ok) {
    msg.textContent = resp.error || 'Error';
    return;
  }

  const rec = resp.data;
  const user = {
    legajo, dni,
    nombre: rec.nombre || nombre,
    apellido: rec.apellido || apellido,
    carrera: rec.carrera || '',
    anio: rec.anio || '',
    estado: rec.estado || 'PENDIENTE'
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

btnIns.addEventListener('click', () => {
  const user = getState();
  if (!user) return;
  apiCert('inscripcion', user.legajo, user.dni);
});

btnReg.addEventListener('click', () => {
  const user = getState();
  if (!user) return;
  if (user.estado !== 'ACTIVO') {
    alert('Para este certificado tu estado debe ser ACTIVO.');
    return;
  }
  apiCert('regular', user.legajo, user.dni);
});

// Session restore
const stored = getState();
if (stored) { showCredential(stored); }

