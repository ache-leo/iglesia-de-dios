const STORAGE_KEY_MEMBROS = 'iglesiaDeDios_miembros_v2';
const STORAGE_KEY_MOVS = 'iglesiaDeDios_movimientos_v2';
const STORAGE_KEY_USERS = 'iglesiaDeDios_usuarios_v2';

const IGLESIAS = {
  central: 'Central',
  sayago: 'Sayago',
  tacuarembo: 'Tacuarembó'
};

let state = {
  miembros: [],
  movimientos: [],
  contFiltro: 'todas'
};

function loadState() {
  try {
    const rawM = localStorage.getItem(STORAGE_KEY_MEMBROS);
    const rawMov = localStorage.getItem(STORAGE_KEY_MOVS);
    if (rawM) state.miembros = JSON.parse(rawM) || [];
    if (rawMov) state.movimientos = JSON.parse(rawMov) || [];
  } catch (e) { console.error(e); }

  if (state.miembros.length === 0 && state.movimientos.length === 0) {
    seedDemoData();
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY_MEMBROS, JSON.stringify(state.miembros));
    localStorage.setItem(STORAGE_KEY_MOVS, JSON.stringify(state.movimientos));
  } catch (e) {}
}

function seedDemoData() {
  const today = new Date();
  const ym = (m) => {
    const d = new Date(today.getFullYear(), today.getMonth() - m, 15);
    return d.toISOString().slice(0,10);
  };

  state.miembros = [
    { id: 1, nombre: 'Juan Pérez', doc: '1.234.567-8', iglesia: 'central', rol: 'Pastor', estado: 'activo', ingreso: '2015-03-12', tel: '+598 99 111 111', email: 'juan.perez@email.com' },
    { id: 2, nombre: 'María Rodríguez', doc: '2.345.678-9', iglesia: 'central', rol: 'Diácono', estado: 'activo', ingreso: '2017-06-03', tel: '+598 99 222 222', email: 'maria@email.com' },
    { id: 3, nombre: 'Carlos Silva', doc: '3.456.789-0', iglesia: 'sayago', rol: 'Pastor', estado: 'activo', ingreso: '2014-09-21', tel: '+598 99 333 333', email: 'carlos@email.com' },
    { id: 4, nombre: 'Ana López', doc: '4.567.890-1', iglesia: 'sayago', rol: 'Maestro/a', estado: 'activo', ingreso: '2019-01-15', tel: '+598 99 444 444', email: 'ana@email.com' },
    { id: 5, nombre: 'Roberto Méndez', doc: '5.678.901-2', iglesia: 'tacuarembo', rol: 'Pastor', estado: 'activo', ingreso: '2016-04-08', tel: '+598 99 555 555', email: 'roberto@email.com' },
    { id: 6, nombre: 'Laura Castro', doc: '6.789.012-3', iglesia: 'tacuarembo', rol: 'Líder de jóvenes', estado: 'activo', ingreso: '2020-07-22', tel: '+598 99 666 666', email: 'laura@email.com' },
    { id: 7, nombre: 'Pedro Acosta', doc: '7.890.123-4', iglesia: 'central', rol: 'Miembro', estado: 'activo', ingreso: '2021-02-10', tel: '+598 99 777 777', email: 'pedro@email.com' },
    { id: 8, nombre: 'Sofía Ramírez', doc: '8.901.234-5', iglesia: 'sayago', rol: 'Miembro', estado: 'inactivo', ingreso: '2018-11-05', tel: '+598 99 888 888', email: 'sofia@email.com' },
    { id: 9, nombre: 'Daniel Fernández', doc: '9.012.345-6', iglesia: 'central', rol: 'Diácono', estado: 'activo', ingreso: '2016-08-14', tel: '+598 99 999 999', email: 'daniel@email.com' },
    { id: 10, nombre: 'Elena Martínez', doc: '0.123.456-7', iglesia: 'tacuarembo', rol: 'Miembro', estado: 'activo', ingreso: '2022-03-01', tel: '+598 99 000 000', email: 'elena@email.com' },
    { id: 11, nombre: 'Gabriel Álvez', doc: '1.111.111-1', iglesia: 'sayago', rol: 'Miembro', estado: 'inactivo', ingreso: '2020-10-20', tel: '', email: '' },
    { id: 12, nombre: 'Lucía Pereira', doc: '2.222.222-2', iglesia: 'central', rol: 'Líder de jóvenes', estado: 'activo', ingreso: '2019-05-30', tel: '+598 98 777 666', email: 'lucia@email.com' }
  ];

  state.movimientos = [
    { id: 1, fecha: ym(0), iglesia: 'central', concepto: 'Diezmos y ofrendas dominicales', tipo: 'ingreso', monto: 18500 },
    { id: 2, fecha: ym(0), iglesia: 'central', concepto: 'UTE - electricidad', tipo: 'egreso', monto: 3200 },
    { id: 3, fecha: ym(0), iglesia: 'sayago', concepto: 'Diezmos dominicales', tipo: 'ingreso', monto: 12300 },
    { id: 4, fecha: ym(0), iglesia: 'sayago', concepto: 'Materiales escuela dominical', tipo: 'egreso', monto: 1800 },
    { id: 5, fecha: ym(0), iglesia: 'tacuarembo', concepto: 'Ofrendas mensuales', tipo: 'ingreso', monto: 9800 },
    { id: 6, fecha: ym(1), iglesia: 'central', concepto: 'Diezmos y ofrendas dominicales', tipo: 'ingreso', monto: 17200 },
    { id: 7, fecha: ym(1), iglesia: 'sayago', concepto: 'Alquiler salón', tipo: 'egreso', monto: 6500 },
    { id: 8, fecha: ym(1), iglesia: 'tacuarembo', concepto: 'OSE - agua', tipo: 'egreso', monto: 980 },
    { id: 9, fecha: ym(2), iglesia: 'central', concepto: 'Donación especial', tipo: 'ingreso', monto: 5000 },
    { id: 10, fecha: ym(2), iglesia: 'sayago', concepto: 'Diezmos dominicales', tipo: 'ingreso', monto: 11400 },
    { id: 11, fecha: ym(0), iglesia: 'tacuarembo', concepto: 'Antel - teléfono', tipo: 'egreso', monto: 1200 },
    { id: 12, fecha: ym(1), iglesia: 'central', concepto: 'Limpieza y mantenimiento', tipo: 'egreso', monto: 2500 },
    { id: 13, fecha: ym(2), iglesia: 'tacuarembo', concepto: 'Diezmos y ofrendas', tipo: 'ingreso', monto: 8700 },
    { id: 14, fecha: ym(1), iglesia: 'sayago', concepto: 'Donación para campaña', tipo: 'ingreso', monto: 3200 },
    { id: 15, fecha: ym(0), iglesia: 'central', concepto: 'Refrigerios escuela dominical', tipo: 'egreso', monto: 1100 },
    { id: 16, fecha: ym(3), iglesia: 'central', concepto: 'Diezmos mensuales', tipo: 'ingreso', monto: 16000 },
    { id: 17, fecha: ym(3), iglesia: 'sayago', concepto: 'Ofrendas especiales', tipo: 'ingreso', monto: 8500 },
    { id: 18, fecha: ym(3), iglesia: 'tacuarembo', concepto: 'Gas oil viaje pastoral', tipo: 'egreso', monto: 2400 }
  ];
  saveState();
}
