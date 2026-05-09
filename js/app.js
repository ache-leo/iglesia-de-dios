const SECTION_MAP = {
  quienes:      'sections/quienes.html',
  organizacion: 'sections/organizacion.html',
  iglesias:     'sections/iglesias.html',
  noticias:     'sections/noticias.html',
  contacto:     'sections/contacto.html',
  corporativo:  'sections/corporativo/dashboard.html',
  dashboard:    'sections/corporativo/dashboard.html',
};

let seccionActual = 'inicio';

function loadSection(id) {
  if (id === 'corporativo' && haySesion()) id = 'dashboard';
  if ((id === 'corporativo' || id === 'dashboard') && !haySesion()) { openLoginModal(); return; }

  const path = SECTION_MAP[id];
  if (!path) return;

  const existing = document.getElementById('section-' + id);
  if (existing) {
    activarSeccion(id, existing);
    if (id === 'dashboard') setTimeout(() => refrescarPaneCorporativo(), 50);
    return;
  }

  mostrarLoader(true);
  const main = document.getElementById('mainContent');
  const div = document.createElement('div');
  div.id = 'section-' + id;
  div.className = 'section';

  const embeddedHtml = typeof EMBEDDED_SECTIONS !== 'undefined' && EMBEDDED_SECTIONS[id];
  if (embeddedHtml) {
    div.innerHTML = embeddedHtml;
    main.appendChild(div);
    activarSeccion(id, div);
    if (id === 'dashboard' && haySesion()) setTimeout(() => showPane('resumen'), 50);
    mostrarLoader(false);
    return;
  }

  fetch(path)
    .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.text(); })
    .then(html => {
      div.innerHTML = html;
      main.appendChild(div);
      activarSeccion(id, div);
      if (id === 'dashboard' && haySesion()) setTimeout(() => showPane('resumen'), 50);
      mostrarLoader(false);
    })
    .catch(err => {
      div.innerHTML = `<div class="container content-section" style="padding-top:120px;"><div class="msg-error"><strong>Error de carga</strong><br>${err.message}<br><br>No se pudo cargar la secci\u00f3n. Revisa la conexi\u00f3n o el archivo <code>sections-embed.js</code>.</div></div>`;
      main.appendChild(div);
      activarSeccion(id, div);
      mostrarLoader(false);
    });
}

function showSection(id) {
  if (id === 'login') { openLoginModal(); return; }

  if (id === 'corporativo' && haySesion()) id = 'dashboard';
  if (id === 'corporativo' && !haySesion()) { openLoginModal(); return; }

  const existing = document.getElementById('section-' + id);
  if (existing) {
    activarSeccion(id, existing);
    if (id === 'dashboard') refrescarPaneCorporativo();
    return;
  }
  loadSection(id);
}

function activarSeccion(id, el) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  el.classList.add('active');
  seccionActual = id;
  actualizarNavActivo(id);
  document.getElementById('navTabs')?.classList.remove('open');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function actualizarNavActivo(id) {
  document.querySelectorAll('.nav-tabs button').forEach(b => {
    b.classList.toggle('active', b.dataset.target === id);
  });
  const btn = document.querySelector('.nav-tabs button[data-target="corporativo"]');
  if (btn) btn.classList.toggle('active', ['corporativo','dashboard','resumen','contabilidad','miembros','gestion','carnets','usuarios'].includes(id));
}

function toggleNav() {
  document.getElementById('navTabs')?.classList.toggle('open');
}

/* ===== LOADER ===== */
function mostrarLoader(show) {
  const el = document.getElementById('pageLoader');
  if (!el) return;
  el.classList.toggle('visible', show);
}

/* ===== LOGIN MODAL ===== */
function openLoginModal() {
  document.getElementById('loginUser').value = '';
  document.getElementById('loginPass').value = '';
  document.getElementById('loginError').textContent = '';
  document.getElementById('loginModal').classList.add('open');
  setTimeout(() => document.getElementById('loginUser')?.focus(), 100);
}

function closeLoginModal() {
  document.getElementById('loginModal').classList.remove('open');
}

function initLoginForm() {
  const form = document.getElementById('loginForm');
  if (!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('loginUser').value.trim();
    const password = document.getElementById('loginPass').value.trim();
    const errEl = document.getElementById('loginError');
    if (!username || !password) { errEl.textContent = 'Ingresa usuario y contrase\u00f1a.'; mostrarToast('Completa todos los campos.', 'error'); return; }
    const user = await loginHandler(username, password);
    if (!user) { errEl.textContent = 'Usuario o contrase\u00f1a incorrectos.'; mostrarToast('Credenciales inv\u00e1lidas.', 'error'); return; }
    errEl.textContent = '';
    closeLoginModal();
    mostrarToast('Bienvenido, ' + user.nombre, 'success');
    if (document.getElementById('section-dashboard')) {
      showSection('dashboard');
    } else {
      loadSection('dashboard');
    }
  });
}

/* ===== PANEL CORPORATIVO ===== */
function initCorporativoPane(pane) {
  if (pane === 'resumen') renderResumen();
  else if (pane === 'contabilidad') renderContabilidad();
  else if (pane === 'miembros') renderMiembros();
  else if (pane === 'gestion') renderGestion();
  else if (pane === 'carnets') { renderCarnetSelect(); renderCarnet(); }
  else if (pane === 'usuarios') renderUsuarios();
}

function showPane(name) {
  const adminMain = document.querySelector('.admin-main');
  if (!adminMain) return;

  const paneEl = document.getElementById('pane-' + name);
  if (paneEl) {
    document.querySelectorAll('.admin-pane').forEach(p => p.classList.remove('active'));
    paneEl.classList.add('active');
    document.querySelectorAll('.admin-side button').forEach(b => {
      b.classList.toggle('active', b.dataset.pane === name);
    });
    initCorporativoPane(name);
    return;
  }

  const embeddedHtml = typeof EMBEDDED_PANELS !== 'undefined' && EMBEDDED_PANELS[name];
  if (!embeddedHtml) {
    mostrarToast('Panel no disponible.', 'error');
    return;
  }

  const div = document.createElement('div');
  div.id = 'pane-' + name;
  div.className = 'admin-pane active';
  div.innerHTML = embeddedHtml;
  adminMain.appendChild(div);

  document.querySelectorAll('.admin-pane').forEach(p => {
    if (p.id !== 'pane-' + name) p.classList.remove('active');
  });
  document.querySelectorAll('.admin-side button').forEach(b => {
    b.classList.toggle('active', b.dataset.pane === name);
  });
  initCorporativoPane(name);
}

function refrescarPaneCorporativo() {
  renderDashboard();
  if (document.getElementById('pane-resumen')) renderResumen();
  if (document.getElementById('pane-contabilidad')) renderContabilidad();
  if (document.getElementById('pane-miembros')) renderMiembros();
  if (document.getElementById('pane-gestion')) renderGestion();
  if (document.getElementById('pane-carnets')) { renderCarnetSelect(); renderCarnet(); }
  if (document.getElementById('pane-usuarios')) renderUsuarios();
}

function refrescarPaneActual() {
  const activePane = document.querySelector('.admin-pane.active');
  if (!activePane) return;
  const name = activePane.id.replace('pane-', '');
  initCorporativoPane(name);
}

function renderDashboard() {
  const user = usuarioActual;
  if (!user) return;
  for (const [id, el] of [['dashNombre','textContent'],['dashRol','textContent'],['dashIglesia','textContent']]) {
    const e = document.getElementById(id);
    if (e) e.textContent = { dashNombre: user.nombre, dashRol: user.rolLabel, dashIglesia: user.iglesia ? IGLESIAS[user.iglesia] : 'Todas las iglesias' }[id];
  }
  document.querySelectorAll('.admin-side button[data-pane]').forEach(btn => {
    const p = btn.dataset.pane;
    if (p === 'contabilidad' && !puedeAccederFinanzas(user)) btn.style.display = 'none';
    else if (p === 'gestion' && !puedeGestionarMiembros(user)) btn.style.display = 'none';
    else if (p === 'usuarios' && !puedeGestionarUsuarios(user)) btn.style.display = 'none';
    else btn.style.display = 'flex';
  });
}

/* ===== FORMATO ===== */
function fmt$(n) { return '$ ' + (n || 0).toLocaleString('es-UY', { minimumFractionDigits: 0, maximumFractionDigits: 0 }); }
function fmtDate(s) { if (!s) return '—'; try { return new Date(s + 'T00:00:00').toLocaleDateString('es-UY', { day: '2-digit', month: 'short', year: 'numeric' }); } catch(e) { return s; } }
function fmtDateShort(s) { if (!s) return '—'; try { return new Date(s + 'T00:00:00').toLocaleDateString('es-UY', { day: '2-digit', month: '2-digit', year: 'numeric' }); } catch(e) { return s; } }
function escapeHtml(s) { return String(s || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[c])); }

function mostrarToast(msg, tipo) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.className = 'toast';
  if (tipo) el.classList.add('toast-' + tipo);
  el.classList.add('show');
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(() => el.classList.remove('show'), 2400);
}

/* ===== CONFIRMACIÓN PERSONALIZADA ===== */
let _confirmCallback = null;
function confirmar(msg, cb, titulo) {
  document.getElementById('confirmMessage').textContent = msg;
  document.getElementById('confirmTitle').textContent = titulo || 'Confirmar';
  const btn = document.getElementById('confirmBtn');
  _confirmCallback = cb;
  btn.onclick = function() { closeConfirmModal(); if (_confirmCallback) _confirmCallback(); };
  document.getElementById('confirmModal').classList.add('open');
}
function closeConfirmModal() { document.getElementById('confirmModal').classList.remove('open'); _confirmCallback = null; }

/* ===== RESUMEN ===== */
function renderResumen() {
  const user = usuarioActual;
  const iglesiaFiltro = (user?.rol === 'tesorero' && user?.iglesia) ? user.iglesia : null;

  const miembrosFiltrados = iglesiaFiltro ? state.miembros.filter(m => m.iglesia === iglesiaFiltro) : state.miembros;
  const movsFiltrados = iglesiaFiltro ? state.movimientos.filter(m => m.iglesia === iglesiaFiltro) : state.movimientos;

  const total = miembrosFiltrados.length;
  const activos = miembrosFiltrados.filter(m => m.estado === 'activo').length;
  const ingresos = movsFiltrados.filter(m => m.tipo === 'ingreso').reduce((s,m) => s + m.monto, 0);
  const egresos = movsFiltrados.filter(m => m.tipo === 'egreso').reduce((s,m) => s + m.monto, 0);
  const saldo = ingresos - egresos;
  const ahora = new Date();
  const mesActual = movsFiltrados.filter(m => { const d = new Date(m.fecha + 'T00:00:00'); return d.getMonth() === ahora.getMonth() && d.getFullYear() === ahora.getFullYear(); }).length;

  const ids = { 'stat-total': total, 'stat-activos': activos, 'stat-saldo': fmt$(saldo), 'stat-movs': mesActual };
  for (const [id, val] of Object.entries(ids)) { const e = document.getElementById(id); if (e) e.textContent = val; }

  const tbody = document.querySelector('#resumen-iglesias tbody');
  if (!tbody) return;
  tbody.innerHTML = '';
  const iglesiasAMostrar = iglesiaFiltro ? [iglesiaFiltro] : Object.keys(IGLESIAS);
  iglesiasAMostrar.forEach(key => {
    const ing = state.movimientos.filter(m => m.iglesia === key && m.tipo === 'ingreso').reduce((s,m) => s + m.monto, 0);
    const egr = state.movimientos.filter(m => m.iglesia === key && m.tipo === 'egreso').reduce((s,m) => s + m.monto, 0);
    const miem = state.miembros.filter(m => m.iglesia === key).length;
    tbody.innerHTML += `<tr><td><span class="badge b-${key}">${IGLESIAS[key]}</span></td><td class="amount income">${fmt$(ing)}</td><td class="amount expense">${fmt$(egr)}</td><td class="amount" style="color:var(--navy-deep);">${fmt$(ing - egr)}</td><td>${miem}</td></tr>`;
  });
}

/* ===== CONTABILIDAD ===== */
document.addEventListener('click', (e) => {
  if (e.target.matches('.chip[data-iglesia]')) {
    document.querySelectorAll('.chip[data-iglesia]').forEach(c => c.classList.remove('active'));
    e.target.classList.add('active');
    state.contFiltro = e.target.dataset.iglesia;
    renderContabilidad();
  }
});

function renderContabilidad() {
  const user = usuarioActual;
  let movs = state.movimientos.slice();
  if (user && user.rol === 'tesorero' && user.iglesia) movs = movs.filter(m => m.iglesia === user.iglesia);
  else if (state.contFiltro !== 'todas') movs = movs.filter(m => m.iglesia === state.contFiltro);

  const q = (document.getElementById('contSearch')?.value || '').toLowerCase();
  if (q) movs = movs.filter(m => m.concepto.toLowerCase().includes(q));

  movs.sort((a,b) => b.fecha.localeCompare(a.fecha));

  const ing = movs.filter(m => m.tipo === 'ingreso').reduce((s,m) => s + m.monto, 0);
  const egr = movs.filter(m => m.tipo === 'egreso').reduce((s,m) => s + m.monto, 0);

  const eIng = document.getElementById('cont-ing'); if (eIng) eIng.textContent = fmt$(ing);
  const eEgr = document.getElementById('cont-egr'); if (eEgr) eEgr.textContent = fmt$(egr);
  const eSal = document.getElementById('cont-sal');
  if (eSal) { eSal.textContent = fmt$(ing - egr); eSal.style.color = (ing - egr) >= 0 ? '#2c7a3e' : '#a8302d'; }

  const tbody = document.querySelector('#cont-table tbody');
  if (!tbody) return;
  const countEl = document.getElementById('cont-count');
  tbody.innerHTML = '';
  if (!movs.length) { tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:32px;color:var(--muted);">Sin movimientos para mostrar.</td></tr>'; if (countEl) countEl.textContent = '0 registros'; return; }

  if (countEl) countEl.textContent = movs.length + ' registro' + (movs.length !== 1 ? 's' : '');

  movs.forEach(m => {
    tbody.innerHTML += `<tr>
      <td>${fmtDateShort(m.fecha)}</td>
      <td><span class="badge b-${m.iglesia}">${IGLESIAS[m.iglesia]}</span></td>
      <td>${escapeHtml(m.concepto)}</td>
      <td>${m.tipo === 'ingreso' ? 'Ingreso' : 'Egreso'}</td>
      <td class="amount ${m.tipo === 'ingreso' ? 'income' : 'expense'}" style="text-align:right;">${m.tipo === 'ingreso' ? '+' : '−'} ${fmt$(m.monto)}</td>
      <td style="text-align:right;">${puedeEditarFinanzas(user) ? `<button class="btn btn-ghost btn-sm" onclick="editMov(${m.id})" title="Editar">✎</button> <button class="btn btn-ghost btn-sm" onclick="deleteMov(${m.id})" title="Eliminar">×</button>` : ''}</td>
    </tr>`;
  });

  const btnNuevo = document.querySelector('.btn-gold[onclick*="openMovModal"]');
  if (btnNuevo) btnNuevo.style.display = puedeEditarFinanzas(user) ? '' : 'none';

  const csvBtn = document.querySelector('#exportContCSV');
  if (csvBtn) csvBtn.style.display = movs.length ? '' : 'none';

  if (user && user.rol === 'tesorero' && user.iglesia) {
    document.querySelectorAll('.chip[data-iglesia]').forEach(c => { c.style.display = c.dataset.iglesia === user.iglesia || c.dataset.iglesia === 'todas' ? '' : 'none'; });
  } else {
    document.querySelectorAll('.chip[data-iglesia]').forEach(c => c.style.display = '');
  }
}

function exportarCSVContabilidad() {
  const user = usuarioActual;
  let movs = state.movimientos.slice();
  if (user && user.rol === 'tesorero' && user.iglesia) movs = movs.filter(m => m.iglesia === user.iglesia);
  else if (state.contFiltro !== 'todas') movs = movs.filter(m => m.iglesia === state.contFiltro);
  const q = (document.getElementById('contSearch')?.value || '').toLowerCase();
  if (q) movs = movs.filter(m => m.concepto.toLowerCase().includes(q));
  movs.sort((a,b) => b.fecha.localeCompare(a.fecha));

  const headers = ['Fecha','Iglesia','Concepto','Tipo','Monto'];
  const rows = movs.map(m => [m.fecha, IGLESIAS[m.iglesia], m.concepto, m.tipo === 'ingreso' ? 'Ingreso' : 'Egreso', String(m.monto)]);
  const csv = [headers, ...rows].map(r => r.map(c => '"' + String(c).replace(/"/g, '""') + '"').join(',')).join('\n');
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'contabilidad_iglesia_de_dios.csv'; a.click();
  URL.revokeObjectURL(a.href);
  mostrarToast('Contabilidad exportada.', 'success');
}

/* ===== MOVIMIENTOS CRUD ===== */
function openMovModal(id) {
  document.getElementById('movModalTitle').textContent = id ? 'Editar movimiento contable' : 'Nuevo movimiento contable';
  document.getElementById('movId').value = id || '';
  document.getElementById('movFecha').value = new Date().toISOString().slice(0,10);
  document.getElementById('movConcepto').value = '';
  document.getElementById('movTipo').value = 'ingreso';
  document.getElementById('movMonto').value = '';
  if (usuarioActual && usuarioActual.rol === 'tesorero' && usuarioActual.iglesia) {
    document.getElementById('movIglesia').value = usuarioActual.iglesia;
    document.getElementById('movIglesia').disabled = true;
  } else {
    document.getElementById('movIglesia').value = 'central';
    document.getElementById('movIglesia').disabled = false;
  }
  if (id) {
    const m = state.movimientos.find(x => x.id === id);
    if (m) {
      document.getElementById('movFecha').value = m.fecha;
      document.getElementById('movConcepto').value = m.concepto;
      document.getElementById('movTipo').value = m.tipo;
      document.getElementById('movMonto').value = m.monto;
      document.getElementById('movIglesia').value = m.iglesia;
      if (usuarioActual?.rol === 'tesorero' && usuarioActual?.iglesia) document.getElementById('movIglesia').disabled = true;
      else document.getElementById('movIglesia').disabled = false;
    }
  }
  document.getElementById('movModal').classList.add('open');
}
function closeMovModal() { document.getElementById('movModal').classList.remove('open'); }

function editMov(id) { openMovModal(id); }

function saveMov() {
  const id = document.getElementById('movId').value;
  const fecha = document.getElementById('movFecha').value;
  const concepto = document.getElementById('movConcepto').value.trim();
  const monto = parseFloat(document.getElementById('movMonto').value);
  if (!fecha || !concepto || !monto || monto <= 0) { mostrarToast('Completa todos los campos correctamente.', 'error'); return; }
  const data = { id: id ? parseInt(id) : Date.now(), fecha, concepto, iglesia: document.getElementById('movIglesia').value, tipo: document.getElementById('movTipo').value, monto };
  if (id) {
    const i = state.movimientos.findIndex(m => m.id === parseInt(id));
    if (i >= 0) state.movimientos[i] = data;
    mostrarToast('Movimiento actualizado.', 'success');
  } else {
    state.movimientos.push(data);
    mostrarToast('Movimiento registrado.', 'success');
  }
  saveState();
  closeMovModal();
  refrescarPaneCorporativo();
}

function deleteMov(id) {
  confirmar('¿Eliminar este movimiento contable?', () => {
    state.movimientos = state.movimientos.filter(m => m.id !== id);
    saveState();
    refrescarPaneCorporativo();
    mostrarToast('Movimiento eliminado.', 'error');
  });
}

/* ===== MIEMBROS ===== */
function renderMiembros() {
  const user = usuarioActual;
  const iglesiaFiltro = (user?.rol === 'tesorero' && user?.iglesia) ? user.iglesia : null;
  const q = (document.getElementById('memSearch')?.value || '').toLowerCase();
  const filtSelect = document.getElementById('memFilter');
  let filt = filtSelect?.value || 'todas';
  const tbody = document.querySelector('#mem-table tbody');
  if (!tbody) return;

  if (iglesiaFiltro) {
    filt = iglesiaFiltro;
    if (filtSelect) { filtSelect.value = iglesiaFiltro; filtSelect.disabled = true; }
  } else {
    if (filtSelect) filtSelect.disabled = false;
  }

  let lista = state.miembros.slice();
  if (filt !== 'todas') lista = lista.filter(m => m.iglesia === filt);
  if (q) lista = lista.filter(m => m.nombre.toLowerCase().includes(q) || (m.doc || '').toLowerCase().includes(q));
  lista.sort((a,b) => a.nombre.localeCompare(b.nombre));
  const countEl = document.getElementById('mem-count');
  tbody.innerHTML = '';
  if (!lista.length) { tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:32px;color:var(--muted);">Sin miembros para mostrar.</td></tr>'; if (countEl) countEl.textContent = '0 miembros'; return; }
  if (countEl) countEl.textContent = lista.length + ' miembro' + (lista.length !== 1 ? 's' : '');
  lista.forEach((m, i) => {
    tbody.innerHTML += `<tr>
      <td style="color:var(--muted);font-variant-numeric:tabular-nums;">${String(i+1).padStart(3,'0')}</td>
      <td><strong style="color:var(--navy-deep);">${escapeHtml(m.nombre)}</strong></td>
      <td>${escapeHtml(m.doc || '—')}</td>
      <td><span class="badge b-${m.iglesia}">${IGLESIAS[m.iglesia]}</span></td>
      <td>${escapeHtml(m.rol)}</td>
      <td><span class="badge b-${m.estado === 'activo' ? 'active' : 'inactive'}">${m.estado === 'activo' ? 'Activo' : 'Inactivo'}</span></td>
      <td>${fmtDateShort(m.ingreso)}</td>
    </tr>`;
  });
}

function exportarCSV() {
  const user = usuarioActual;
  const iglesiaFiltro = (user?.rol === 'tesorero' && user?.iglesia) ? user.iglesia : null;
  const headers = ['Nombre','Documento','Iglesia','Rol','Estado','Ingreso','Telefono','Email'];
  const miembros = iglesiaFiltro ? state.miembros.filter(m => m.iglesia === iglesiaFiltro) : state.miembros;
  const rows = miembros.map(m => [m.nombre, m.doc||'', IGLESIAS[m.iglesia], m.rol, m.estado, m.ingreso||'', m.tel||'', m.email||'']);
  const csv = [headers, ...rows].map(r => r.map(c => '"' + String(c).replace(/"/g, '""') + '"').join(',')).join('\n');
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'miembros_iglesia_de_dios.csv'; a.click();
  URL.revokeObjectURL(a.href);
  mostrarToast('Padrón exportado.', 'success');
}

/* ===== GESTIÓN MIEMBROS ===== */
function renderGestion() {
  const tbody = document.querySelector('#gest-table tbody');
  if (!tbody) return;

  if (!puedeGestionarMiembros(usuarioActual)) {
    const btnNuevo = document.querySelector('.btn-gold[onclick*="openMemberModal"]');
    if (btnNuevo) btnNuevo.style.display = 'none';
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:32px;color:var(--muted);">No tienes permisos para gestionar miembros.</td></tr>';
    return;
  }
  const btnNuevo = document.querySelector('.btn-gold[onclick*="openMemberModal"]');
  if (btnNuevo) btnNuevo.style.display = '';

  const q = (document.getElementById('gestSearch')?.value || '').toLowerCase();
  let lista = state.miembros.slice();
  if (q) lista = lista.filter(m => m.nombre.toLowerCase().includes(q) || (m.doc || '').toLowerCase().includes(q));
  lista.sort((a,b) => a.nombre.localeCompare(b.nombre));
  const countEl = document.getElementById('gest-count');
  tbody.innerHTML = '';
  if (!lista.length) { tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:32px;color:var(--muted);">Sin miembros.</td></tr>'; if (countEl) countEl.textContent = '0 miembros'; return; }
  if (countEl) countEl.textContent = lista.length + ' miembro' + (lista.length !== 1 ? 's' : '');
  lista.forEach(m => {
    tbody.innerHTML += `<tr>
      <td><strong style="color:var(--navy-deep);">${escapeHtml(m.nombre)}</strong><div style="font-size:0.78rem;color:var(--muted);margin-top:2px;">${escapeHtml(m.rol)}</div></td>
      <td>${escapeHtml(m.doc || '—')}</td>
      <td><span class="badge b-${m.iglesia}">${IGLESIAS[m.iglesia]}</span></td>
      <td><span class="badge b-${m.estado === 'activo' ? 'active' : 'inactive'}">${m.estado === 'activo' ? 'Activo' : 'Inactivo'}</span></td>
      <td style="text-align:right;">
        <button class="btn btn-outline btn-sm" onclick="editMember(${m.id})">Editar</button>
        <button class="btn btn-danger btn-sm" onclick="deleteMember(${m.id})">Eliminar</button>
      </td>
    </tr>`;
  });
}

function openMemberModal() {
  document.getElementById('memberModalTitle').textContent = 'Nuevo miembro';
  document.getElementById('memId').value = '';
  document.getElementById('memNombre').value = '';
  document.getElementById('memDoc').value = '';
  document.getElementById('memIglesia').value = 'central';
  document.getElementById('memRol').value = 'Miembro';
  document.getElementById('memIngreso').value = new Date().toISOString().slice(0,10);
  document.getElementById('memEstado').value = 'activo';
  document.getElementById('memTel').value = '';
  document.getElementById('memEmail').value = '';
  document.getElementById('memberModal').classList.add('open');
}
function closeMemberModal() { document.getElementById('memberModal').classList.remove('open'); }

function editMember(id) {
  const m = state.miembros.find(x => x.id === id);
  if (!m) return;
  document.getElementById('memberModalTitle').textContent = 'Editar miembro';
  document.getElementById('memId').value = m.id;
  document.getElementById('memNombre').value = m.nombre;
  document.getElementById('memDoc').value = m.doc || '';
  document.getElementById('memIglesia').value = m.iglesia;
  document.getElementById('memRol').value = m.rol;
  document.getElementById('memIngreso').value = m.ingreso || '';
  document.getElementById('memEstado').value = m.estado;
  document.getElementById('memTel').value = m.tel || '';
  document.getElementById('memEmail').value = m.email || '';
  document.getElementById('memberModal').classList.add('open');
}

function saveMember() {
  const id = document.getElementById('memId').value;
  const nombre = document.getElementById('memNombre').value.trim();
  if (!nombre) { mostrarToast('El nombre es obligatorio.', 'error'); return; }
  const data = {
    nombre,
    doc: document.getElementById('memDoc').value.trim(),
    iglesia: document.getElementById('memIglesia').value,
    rol: document.getElementById('memRol').value,
    ingreso: document.getElementById('memIngreso').value,
    estado: document.getElementById('memEstado').value,
    tel: document.getElementById('memTel').value.trim(),
    email: document.getElementById('memEmail').value.trim()
  };
  if (id) {
    const i = state.miembros.findIndex(m => m.id === parseInt(id));
    if (i >= 0) state.miembros[i] = { ...state.miembros[i], ...data };
    mostrarToast('Miembro actualizado.', 'success');
  } else {
    data.id = Date.now();
    state.miembros.push(data);
    mostrarToast('Miembro registrado.', 'success');
  }
  saveState();
  closeMemberModal();
  refrescarPaneCorporativo();
}

function deleteMember(id) {
  const m = state.miembros.find(x => x.id === id);
  if (!m) return;
  confirmar(`¿Eliminar a "${m.nombre}" del padrón? Esta acción no se puede deshacer.`, () => {
    state.miembros = state.miembros.filter(x => x.id !== id);
    saveState();
    refrescarPaneCorporativo();
    mostrarToast('Miembro eliminado.', 'error');
  });
}

/* ===== CARNETS ===== */
function renderCarnetSelect() {
  const sel = document.getElementById('carnetSelect');
  if (!sel) return;
  const prev = sel.value;
  sel.innerHTML = '<option value="">— Seleccionar —</option>';
  state.miembros.slice().sort((a,b) => a.nombre.localeCompare(b.nombre)).forEach(m => {
    const opt = document.createElement('option');
    opt.value = m.id; opt.textContent = `${m.nombre} · ${IGLESIAS[m.iglesia]}`;
    sel.appendChild(opt);
  });
  if (prev && state.miembros.some(m => m.id == prev)) sel.value = prev;
  else if (state.miembros.length > 0) sel.value = state.miembros[0].id;
}

function renderCarnet() {
  const sel = document.getElementById('carnetSelect');
  if (!sel) return;
  const id = parseInt(sel.value);
  const m = state.miembros.find(x => x.id === id);
  for (const k of ['cName','cRole','cDoc','cCong','cIng','cVig']) { const e = document.getElementById(k); if (e) e.textContent = '—'; }
  const cId = document.getElementById('cId'); if (cId) cId.textContent = 'N° ----';
  if (!m) return;
  const eName = document.getElementById('cName'); if (eName) eName.textContent = m.nombre;
  const eRole = document.getElementById('cRole'); if (eRole) eRole.textContent = m.rol;
  const eDoc = document.getElementById('cDoc'); if (eDoc) eDoc.textContent = m.doc || '—';
  const eCong = document.getElementById('cCong'); if (eCong) eCong.textContent = IGLESIAS[m.iglesia];
  const eIng = document.getElementById('cIng'); if (eIng) eIng.textContent = m.ingreso ? fmtDateShort(m.ingreso) : '—';
  const eVig = document.getElementById('cVig');
  if (eVig) { const v = new Date(); v.setFullYear(v.getFullYear() + 2); eVig.textContent = v.toLocaleDateString('es-UY', { day: '2-digit', month: '2-digit', year: 'numeric' }); }
  if (cId) cId.textContent = 'N° ' + String(m.id).slice(-4).padStart(4,'0');
}

function descargarCarnet() {
  const sel = document.getElementById('carnetSelect');
  if (!sel || !sel.value) { mostrarToast('Selecciona un miembro primero.', 'error'); return; }
  const m = state.miembros.find(x => x.id === parseInt(sel.value));
  if (!m) { mostrarToast('Miembro no encontrado.', 'error'); return; }
  const v = new Date(); v.setFullYear(v.getFullYear() + 2);
  const vigencia = v.toLocaleDateString('es-UY', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const num = 'N° ' + String(m.id).slice(-4).padStart(4, '0');
  const ingreso = m.ingreso ? new Date(m.ingreso + 'T00:00:00').toLocaleDateString('es-UY', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';

  const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>Carnet - ${escapeHtml(m.nombre)}</title>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { display: flex; justify-content: center; align-items: center; min-height: 100vh; font-family: 'Manrope', sans-serif; background: #f0f0f0; }
.carnet {
  width: 380px; aspect-ratio: 1.586 / 1;
  background: linear-gradient(135deg, #0a1a35 0%, #142b54 50%, #1f3a6b 100%);
  border-radius: 14px; padding: 22px; position: relative; overflow: hidden;
  color: #faf4e3; box-shadow: 0 12px 32px rgba(10,26,53,0.2);
}
.carnet::before { content: ""; position: absolute; inset: 0; background: radial-gradient(circle at 80% 20%, rgba(201,161,74,0.25), transparent 40%), radial-gradient(circle at 20% 80%, rgba(20,43,84,0.4), transparent 40%); pointer-events: none; }
.ch { display: flex; align-items: center; gap: 10px; margin-bottom: 22px; position: relative; }
.cm { width: 32px; height: 32px; border-radius: 50%; background: #c9a14a; }
.ct { font-family: 'Cormorant Garamond', serif; font-size: 1.05rem; font-weight: 600; line-height: 1; color: #faf4e3; }
.ct small { display: block; font-family: 'Manrope', sans-serif; font-size: 0.6rem; font-weight: 600; letter-spacing: 0.22em; color: #e0bd6a; margin-top: 4px; }
.cb { position: relative; padding-bottom: 32px; }
.cn { font-family: 'Cormorant Garamond', serif; font-size: 1.55rem; font-weight: 600; margin-bottom: 4px; color: #fff; line-height: 1.1; }
.cr { font-size: 0.7rem; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; color: #e0bd6a; margin-bottom: 18px; }
.ci { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 18px; font-size: 0.7rem; }
.ci .lbl { font-size: 0.6rem; letter-spacing: 0.15em; text-transform: uppercase; color: rgba(224,189,106,0.85); margin-bottom: 2px; }
.ci .val { font-weight: 500; color: #fff; font-size: 0.85rem; font-family: 'Cormorant Garamond', serif; }
.cf { position: absolute; bottom: 16px; left: 22px; right: 22px; display: flex; align-items: center; justify-content: space-between; font-size: 0.6rem; letter-spacing: 0.15em; color: rgba(250,244,227,0.6); }
.cid { font-family: 'Cormorant Garamond', serif; font-size: 0.85rem; letter-spacing: 0.08em; color: #e0bd6a; }
@media print { body { background: #fff; } .carnet { box-shadow: none; border: 2px solid #ccc; } }
</style></head><body>
<div class="carnet">
  <div class="ch"><div class="cm"></div><div class="ct">Iglesia de Dios<small>Carnet de miembro</small></div></div>
  <div class="cb">
    <div class="cn">${escapeHtml(m.nombre)}</div>
    <div class="cr">${escapeHtml(m.rol)}</div>
    <div class="ci">
      <div><div class="lbl">Documento</div><div class="val">${escapeHtml(m.doc || '—')}</div></div>
      <div><div class="lbl">Congregaci\u00f3n</div><div class="val">${IGLESIAS[m.iglesia]}</div></div>
      <div><div class="lbl">Ingreso</div><div class="val">${ingreso}</div></div>
      <div><div class="lbl">Vigencia</div><div class="val">${vigencia}</div></div>
    </div>
  </div>
  <div class="cf"><span>Misi\u00f3n Evang\u00e9lica</span><span class="cid">${num}</span></div>
</div>
<script>window.onload = function () { setTimeout(function () { window.print(); }, 300); }<\/script>
</body></html>`;

  const w = window.open('', '_blank');
  w.document.write(html);
  w.document.close();
}

/* ===== USUARIOS ===== */
function renderUsuarios() {
  const tbody = document.querySelector('#usuarios-table tbody');
  if (!tbody) return;
  if (!puedeGestionarUsuarios(usuarioActual)) { tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:32px;color:var(--muted);">No tienes permiso para gestionar usuarios.</td></tr>'; return; }
  tbody.innerHTML = '';
  usuariosRegistrados.forEach(u => {
    const esAdminPrincipal = u.id === 1;
    tbody.innerHTML += `<tr>
      <td>${escapeHtml(u.nombre)}</td>
      <td>${escapeHtml(u.username)}</td>
      <td><span class="badge" style="background:rgba(20,43,84,0.08);color:var(--navy-deep);">${getRolLabel(u.rol)}</span></td>
      <td>${u.iglesia ? IGLESIAS[u.iglesia] : '—'}</td>
      <td style="text-align:right;">
        <button class="btn btn-outline btn-sm" onclick="editUser(${u.id})" ${esAdminPrincipal ? 'disabled title="No puedes editar al administrador principal"' : ''}>Editar</button>
        <button class="btn btn-danger btn-sm" onclick="deleteUser(${u.id})" ${esAdminPrincipal ? 'disabled title="No puedes eliminar al administrador principal"' : ''}>Eliminar</button>
      </td>
    </tr>`;
  });
}

function editUser(id) {
  const u = usuariosRegistrados.find(x => x.id === id);
  if (!u) return;
  document.getElementById('userModalTitle').textContent = 'Editar usuario';
  document.getElementById('userId').value = u.id;
  document.getElementById('userNombre').value = u.nombre;
  document.getElementById('userUsername').value = u.username;
  document.getElementById('userPass').value = '';
  document.getElementById('userRol').value = u.rol;
  document.getElementById('userIglesia').value = u.iglesia || '';
  document.getElementById('userModal').classList.add('open');
}

function openUserModal() {
  document.getElementById('userModalTitle').textContent = 'Nuevo usuario';
  document.getElementById('userId').value = '';
  document.getElementById('userNombre').value = '';
  document.getElementById('userUsername').value = '';
  document.getElementById('userPass').value = '';
  document.getElementById('userRol').value = 'vocal';
  document.getElementById('userIglesia').value = '';
  document.getElementById('userModal').classList.add('open');
}
function closeUserModal() { document.getElementById('userModal').classList.remove('open'); }

async function saveUser() {
  const nombre = document.getElementById('userNombre').value.trim();
  const username = document.getElementById('userUsername').value.trim();
  const password = document.getElementById('userPass').value.trim();
  if (!nombre || !username) { mostrarToast('Nombre y usuario son obligatorios.'); return; }
  const id = document.getElementById('userId').value;
  if (!id && !password) { mostrarToast('La contrase\u00f1a es obligatoria para nuevos usuarios.'); return; }
  const data = { nombre, username, rol: document.getElementById('userRol').value, iglesia: document.getElementById('userIglesia').value };
  if (password) data.password = await hashPassword(password);
  if (id) {
    const i = usuariosRegistrados.findIndex(u => u.id === parseInt(id));
    if (i >= 0) usuariosRegistrados[i] = { ...usuariosRegistrados[i], ...data };
    mostrarToast('Usuario actualizado.', 'success');
  } else {
    if (usuariosRegistrados.some(u => u.username === username)) { mostrarToast('El nombre de usuario ya existe.', 'error'); return; }
    usuariosRegistrados.push({ id: Date.now(), ...data });
    mostrarToast('Usuario creado.', 'success');
  }
  guardarUsuarios();
  closeUserModal();
  renderUsuarios();
}

function deleteUser(id) {
  if (id === 1) { mostrarToast('No puedes eliminar al administrador principal.', 'error'); return; }
  const u = usuariosRegistrados.find(x => x.id === id);
  if (!u) return;
  confirmar(`¿Eliminar al usuario "${u.nombre}"?`, () => {
    usuariosRegistrados = usuariosRegistrados.filter(x => x.id !== id);
    guardarUsuarios();
    renderUsuarios();
    mostrarToast('Usuario eliminado.', 'error');
  });
}

/* ===== INIT ===== */
document.addEventListener('DOMContentLoaded', async () => {
  cargarSesion();
  await cargarUsuarios();
  loadState();
  actualizarNavAuth();
  document.getElementById('section-inicio')?.classList.add('active');
  initLoginForm();

  document.querySelectorAll('.modal-backdrop').forEach(m => {
    m.addEventListener('click', e => { if (e.target === m) m.classList.remove('open'); });
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') document.querySelectorAll('.modal-backdrop.open').forEach(m => m.classList.remove('open'));
  });
  document.addEventListener('change', e => { if (e.target.id === 'carnetSelect') renderCarnet(); });
});
