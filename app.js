// App Credencial (PWA) + Backend Apps Script (JSONP para evitar CORS)

const STATE_KEY = 'cred:user';

const $ = (s) => document.querySelector(s);
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

// === Config editable ===
const CONFIG = {
  institucion: 'IES N°6 - Perico (Oficial)',
  subtitulo: 'Credencial Digital',
  // Reemplazá por TU URL /exec del deployment de Apps Script
  padronUrl: 'https://script.google.com/macros/s/AKfycbxr63lha4Vjbm3FgQuJumodUSU3uOwqQX3yuqJZIoMd70rG1_Jdw8maexBIDyKlqOW4/exec'
};

instName.textContent = CONFIG.institucion;
instSub.textContent = CONFIG.subtitulo;

/* =======================
   JSONP helper (sin CORS)
======================= */
function jsonp(url, { timeoutMs = 12000 } = {}) {
  return new Promise((resolve, reject) => {
    const cb = 'cb_' + Math.random().toString(36).slice(2);
    const s = document.createElement('script');

    let done = false;
    const cleanup = () => {
      if (done) return;
      done = true;
      delete window[cb];
      if (s && s.parentNode) s.parentNode.removeChild(s);
    };

    window[cb] = (data) => { cleanup(); resolve(data); };

    const sep = url.includes('?') ? '&' : '?';
    // cache-buster + callback
    s.src = `${url}${sep}callback=${cb}&t=${Date.now()}`;
    s.async = true;
    // ayuda en algunos navegadores cuando redirige a Drive (PDF)
    s.referrerPolicy = 'no-referrer';

    s.onerror = () => { cleanup(); reject(new Error('JSONP error')); };

    // Timeout defensivo para Edge
    const to = setTimeout(() => {
      if (!done) { cleanup(); reject(new Error('JSONP timeout')); }
    }, timeoutMs);

    // por si el callback llega después del timeout, cancelamos el timeout con éxito
    const _origCb = window[cb];
    window[cb] = (data) => { clearTimeout(to); _origCb(data); };

    document.body.appendChild(s);
  });
}


/* =======================
   API (Apps Script)
======================= */
function apiLookup(legajo, dni) {
  const url = `${CONFIG.padronUrl}?fn=lookup&legajo=${encodeURIComponent(legajo)}&dni=${encodeURIComponent(dni)}`;
  return jsonp(url);
}

function apiRegister(data) {
  const q = new URLSearchParams({ fn:'register', ...data }).toString();
  const url = `${CONFIG.padronUrl}?${q}`;
  return jsonp(url);
}

function apiCert(tipo, legajo, dni) {
  const url = `${CONFIG.padronUrl}?fn=cert&tipo=${encodeURIComponent(tipo)}&legajo=${encodeURIComponent(legajo)}&dni=${encodeURIComponent(dni)}`;

  // Intento 1: abrir nueva pestaña (en respuesta a click)
  const win = window.open(url, '_blank', 'noopener,noreferrer');

  // Edge a veces bloquea. Si falló, hacemos fallback con <a> + click programático
  if (!win || win.closed || typeof win.closed === 'undefined') {
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    // Edge suele permitir el click programático si se origina tras el gesto de usuario
    document.body.appendChild(a);
    a.click();
    a.remove();

    // Último recurso: misma pestaña (solo si *realmente* todo lo demás fue bloqueado)
    // setTimeout(() => { location.href = url; }, 300);
  }
}


/* =======================
   Estado local
======================= */
function saveState(user) { localStorage.setItem(STATE_KEY, JSON.stringify(user)); }
function getState() { try { return JSON.parse(localStorage.getItem(STATE_KEY) || 'null'); } catch { return null; } }
function clearState() { localStorage.removeItem(STATE_KEY); }

/* =======================
   UI
======================= */
function showCredential(user) {
  authSection.classList.add('hidden');
  credSection.classList.remove('hidden');

  cNombre.textContent = user.nombre;
  cApellido.textContent = user.apellido;
  cDni.textContent = user.dni;
  cLegajo.textContent = user.legajo;
  cCarrera.textContent = user.carrera || '—';
  cAnio.textContent = user.anio || '—';

  avatarText.textContent = (user.nombre?.[0] || '?').toUpperCase();

  cEstado.textContent = user.estado || '—';
  cEstado.classList.remove('ok', 'no');
  if (user.estado === 'ACTIVO') cEstado.classList.add('ok');
  else if (['INACTIVO','PENDIENTE'].includes(user.estado)) cEstado.classList.add('no');
}

function showAuth() {
  credSection.classList.add('hidden');
  authSection.classList.remove('hidden');
  if (form) form.reset(); // deja el formulario limpio
}

/* =======================
   Logout profundo (para cambiar de alumno)
======================= */
async function deepLogout() {
  try {
    // 1) Estado local
    localStorage.removeItem(STATE_KEY);
    sessionStorage.clear();

    // 2) Cache Storage (PWA)
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map(k => caches.delete(k)));
    }

    // 3) Service Worker (opcional)
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map(r => r.unregister()));
    }
  } catch (e) {
    console.warn('deepLogout warn:', e);
  } finally {
    // 4) Recargar en limpio (cache-buster)
    location.replace(location.pathname + '?t=' + Date.now());
  }
}

/* =======================
   Eventos
======================= */
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  msg.textContent = 'Consultando...';

  const data = Object.fromEntries(new FormData(form).entries());
  const legajo  = (data.legajo  || '').trim();
  const dni     = (data.dni     || '').trim();
  const nombre  = (data.nombre  || '').trim();
  const apellido= (data.apellido|| '').trim();

  if (!legajo || !dni || !nombre || !apellido) {
    msg.textContent = 'Completá todos los campos.';
    return;
  }

  let resp = await apiLookup(legajo, dni);
  if (!resp.ok) resp = await apiRegister({ legajo, dni, nombre, apellido });

  if (!resp.ok) {
    msg.textContent = resp.error || 'Error consultando la API';
    return;
  }

  const rec = resp.data || {};
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

logoutBtn.addEventListener('click', async () => {
  showAuth();
  await deepLogout(); // garantiza cambio de alumno sin borrar caché manual
});

downloadBtn.addEventListener('click', () => { window.print(); });

btnIns?.addEventListener('click', () => {
  const user = getState(); if (!user) return;
  apiCert('inscripcion', user.legajo, user.dni);
});

btnReg?.addEventListener('click', () => {
  const user = getState(); if (!user) return;
  if (user.estado !== 'ACTIVO') { alert('Para este certificado tu estado debe ser ACTIVO.'); return; }
  apiCert('regular', user.legajo, user.dni);
});

/* =======================
   Session restore
======================= */
const stored = getState();
if (stored) showCredential(stored);
