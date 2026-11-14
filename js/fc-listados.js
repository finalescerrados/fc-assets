/*! finalescerrados.com · fc-listados.js · fc-assets v10.18 · JS de los listados (antes inline en ConcursosPost.py). El tema lo carga en /p/concursos-literarios-*.
   Cada sentencia ejecutable va en su propio try/catch: si un bloque falla, los demás siguen corriendo. */

/* Se saltea si la página no tiene panel de filtros (índices como "por país") o si este JS ya corrió:
   listados generados antes de v10.18 lo traen inline o con su propio <script src>. */
var __fcListadosSkip = !document.getElementById('fc-filtros-wrap') || (typeof window.fcApply === 'function' && !window.fcApply.__fcStub);

/* ── bloque 1/4 · ocultar/mostrar detalles (fxHide) ── */
/* Ícono del botón: ojo tachado = ocultar, ojo = volver a mostrar. Las páginas generadas
   antes de v10.23 traen la X (fa-circle-xmark), que se sigue rotando como siempre. */
function fcIconoOcultar(el, oculto) {
  var i = el.querySelector('i');
  if (!i) return;
  if (i.classList.contains('fa-eye-slash') || i.classList.contains('fa-eye')) {
    i.classList.toggle('fa-eye-slash', !oculto);
    i.classList.toggle('fa-eye', oculto);
    el.title = oculto ? 'Volver a mostrar este concurso' : 'Ocultar este concurso';
    el.setAttribute('aria-label', el.title);
    el.setAttribute('aria-pressed', oculto ? 'true' : 'false');
  } else {
    el.title = oculto ? 'Mostrar detalles' : 'Ocultar detalles';
    i.style.transform = oculto ? 'rotate(45deg)' : 'rotate(0deg)';
  }
}
function fxHide(el) {
  var id = el.getAttribute('data-id');
  var cont = document.getElementById(id);
  if (!cont) return;

  var details = cont.querySelector('.details');
  if (!details) return;

  var title = document.getElementById('bases_' + id);

  var key = 'hide_details_' + id;
  var hidden = localStorage.getItem(key) === '1';

  if (hidden) {
    // Mostrar detalles
    details.style.display = '';
    localStorage.setItem(key, '0');
    fcIconoOcultar(el, false);
    if (title) title.style.textDecoration = '';
    mostrarToast('Detalles visibles','info');
  } else {
    // Ocultar detalles
    details.style.display = 'none';
    localStorage.setItem(key, '1');
    fcIconoOcultar(el, true);
    if (title) title.style.textDecoration = 'line-through';
    mostrarToast('Detalles ocultos','info');
  }
}

// Restaurar al cargar
if (!__fcListadosSkip) try {
document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('button.btn-toggle').forEach(function(el) {
    var id = el.getAttribute('data-id');
    var cont = document.getElementById(id);
    if (!cont) return;

    var details = cont.querySelector('.details');
    if (!details) return;

    var title = document.getElementById('bases_' + id);

    if (localStorage.getItem('hide_details_' + id) === '1') {
      details.style.display = 'none';
      fcIconoOcultar(el, true);
      if (title) title.style.textDecoration = 'line-through';
    } else {
      fcIconoOcultar(el, false);
    }
  });
});
} catch (e) { console.error('[fc-listados.js bloque 1]', e); }

/* ── bloque 2/4 · favoritos / ya participé (fxFav) ── */
function fxFav(el) {
  var id = el.getAttribute('data-id');
  var icon = el.querySelector('i');
  var key = 'fav_' + id;

  var estado = parseInt(localStorage.getItem(key) || '0', 10);
  if (estado === 2 && !fcConfirmarQuitarRes(id)) return;   // tiene resultado anotado: pedir confirmación
  if (estado === 2) fcLimpiarRes(id);
  var antes = estado;
  estado = (estado + 1) % 3;

  localStorage.setItem(key, estado);
  if (typeof fcMeGusta === 'function') fcMeGusta(id, antes, estado, el);   // contador de "me gusta" (tema)
  
    // guardar fecha de cierre si existe
    var recuadro = document.getElementById(id);
    if (recuadro) {
      var fechaEl = recuadro.querySelector('.link-agendar');
      if (fechaEl && fechaEl.dataset.fecha) {
        var f = fechaEl.dataset.fecha.split('/');
        if (f.length === 3) {
          var fechaISO = f[2] + '-' + f[1] + '-' + f[0];
          localStorage.setItem('fav_fecha_' + id, fechaISO);
        }
      }
    }
  
  aplicarEstado(icon, estado);

  if (estado === 0) mostrarToast('Concurso desmarcado','warning');
  if (estado === 1) mostrarToast('Concurso guardado en favoritos, presione nuevamente si ya participó','success','/p/mis-concursos-favoritos.html#lista-favoritos');
  if (estado === 2) mostrarToast('Concurso guardado en "ya participé", presione nuevamente para desmarcar','success','/p/mis-concursos-favoritos.html#lista-participados');

  idle(actualizarCookie, 500);
}

// Resultado anotado en "ya participé" (claves fcres_/fcfallo_/fctxt_, ver Mis favoritos)
// Respaldo en la cookie respaldoRes ("id:r:AAAAMMDD,..."), por si el navegador vació localStorage
function fcResCookie(id) {
  var row = document.cookie.split('; ').find(function (r) { return r.indexOf('respaldoRes=') === 0; });
  var out = null;
  if (row) row.slice('respaldoRes='.length).split(',').forEach(function (x) {
    var p = x.split(':');
    if (p[0] === String(id)) out = { r: p[1] || '', l: p[2] || '' };
  });
  return out;
}
function fcTieneRes(id) {
  try { if (localStorage.getItem('fcres_' + id) || localStorage.getItem('fcfallo_' + id) || localStorage.getItem('fctxt_' + id)) return true; } catch (e) {}
  var c = fcResCookie(id);
  return !!(c ? (c.r || c.l) : false);
}
function fcResNombre(id) {
  var r = null; try { r = localStorage.getItem('fcres_' + id); } catch (e) {}
  if (!r) { var c = fcResCookie(id); if (c) r = c.r; }
  return { g: 'Ganador', f: 'Finalista', m: 'Mención', s: 'Sin premio' }[r] || '';
}
// true si se puede sacar el concurso de "ya participé" (no tiene nada anotado o el usuario lo confirma)
function fcConfirmarQuitarRes(id) {
  if (!fcTieneRes(id)) return true;
  var n = fcResNombre(id);
  return window.confirm('Este concurso tiene tu resultado anotado' + (n ? ' (' + n + ')' : '') + '. ¿Quitarlo de "ya participé"? Se borran el resultado, el texto y la fecha de fallo.');
}
// Borra el resultado de un concurso (localStorage y cookie de respaldo respaldoRes)
function fcLimpiarRes(id) {
  try { ['fcres_', 'fcfallo_', 'fctxt_'].forEach(function (p) { localStorage.removeItem(p + id); }); } catch (e) {}
  var row = document.cookie.split('; ').find(function (r) { return r.indexOf('respaldoRes=') === 0; });
  if (!row) return;
  var v = row.slice('respaldoRes='.length).split(',').filter(function (x) { return x && x.split(':')[0] !== String(id); }).join(',');
  document.cookie = 'respaldoRes=' + v + '; path=/; max-age=31536000; SameSite=Lax' + (location.protocol === 'https:' ? '; Secure' : '');
}

function aplicarEstado(icon, estado) {
  icon.className = '';
  if (estado === 0) icon.className = 'fa-brands fa-gratipay';
  if (estado === 1) icon.className = 'fa-brands fa-gratipay fav-guardado';
  if (estado === 2) icon.className = 'fa-solid fa-circle-check fav-participado';
}

// Cookie de respaldo compacta (v2): "2_<favs>_<participados>_<id:AAAAMMDD,...>"
// ~30 bytes por favorito (el formato JSON anterior ocupaba ~76). Sigue leyendo el formato anterior.
var FC_COOKIE_MAX; if (!__fcListadosSkip) { FC_COOKIE_MAX = 3900; }

// Función para leer cookie de respaldo
function leerRespaldoCookie() {
  var row = document.cookie.split('; ').find(function(r) { return r.indexOf('respaldoFavs=') === 0; });
  if (!row) return null;
  var raw = row.slice('respaldoFavs='.length);
  try {
    if (raw.charAt(0) === '2' && raw.charAt(1) === '_') {
      var p = raw.split('_'), out = { favs:{}, participados:{}, fechas:{} };
      (p[1] || '').split('.').forEach(function(id) { if (id) out.favs[id] = true; });
      (p[2] || '').split('.').forEach(function(id) { if (id) out.participados[id] = true; });
      (p[3] || '').split(',').forEach(function(kv) {
        var i = kv.indexOf(':');
        if (i > 0) {
          var d = kv.slice(i + 1);
          out.fechas[kv.slice(0, i)] = /^[0-9]{8}$/.test(d) ? d.slice(0,4) + '-' + d.slice(4,6) + '-' + d.slice(6) : d;
        }
      });
      return out;
    }
    return JSON.parse(decodeURIComponent(raw)); // formato anterior
  } catch(e) { return null; }
}

// Función para sincronizar cookie con localStorage
function actualizarCookie() {
  var favs = [], parts = [], fechas = [], conFecha = [];
  try {
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i);
      if (k.indexOf('fav_fecha_') === 0) {
        conFecha.push(k.slice(10));
      } else if (k.indexOf('fav_') === 0) {
        var e = parseInt(localStorage.getItem(k), 10), id = k.slice(4);
        if (e === 1) favs.push(id); else if (e === 2) parts.push(id);
      }
    }
    // Solo van a la cookie las fechas de concursos guardados; las de los desmarcados se borran
    // (si no, la cookie las vuelve a crear en cada carga y ocupan el lugar de las fechas reales)
    conFecha.forEach(function(id) {
      if (favs.indexOf(id) !== -1 || parts.indexOf(id) !== -1)
        fechas.push(id + ':' + String(localStorage.getItem('fav_fecha_' + id)).replace(/-/g, ''));
      else localStorage.removeItem('fav_fecha_' + id);
    });
  } catch(e) { return; }
  var base = '2_' + favs.join('.') + '_' + parts.join('.') + '_';
  if (base.length > FC_COOKIE_MAX) return; // no pisar la cookie con algo truncado
  // Las fechas se agregan mientras entren: primero las vigentes, más próximas primero
  var t = new Date(), pad = function(n) { return String(n).padStart(2, '0'); };
  var hoy = '' + t.getFullYear() + pad(t.getMonth() + 1) + pad(t.getDate());
  var fe = function(x) { return x.split(':')[1]; };
  fechas.sort(function(a, b) { return fe(a) < fe(b) ? -1 : (fe(a) > fe(b) ? 1 : 0); });
  var vivas = fechas.filter(function(x) { return fe(x) >= hoy; });
  var vencidas = fechas.filter(function(x) { return fe(x) < hoy; });
  var v = base, usados = 0;
  vivas.concat(vencidas).some(function(x) {
    var add = (usados ? ',' : '') + x;
    if ((v + add).length > FC_COOKIE_MAX) return true;
    v += add; usados++; return false;
  });
  document.cookie = 'respaldoFavs=' + v + '; path=/; max-age=31536000; SameSite=Lax'
    + (location.protocol === 'https:' ? '; Secure' : '');
}

// Restauración al cargar la página
if (!__fcListadosSkip) try {
document.addEventListener('DOMContentLoaded', function() {
  var respaldo = leerRespaldoCookie();

  if (respaldo) {
    // Restaurar favoritos
    for (var id in respaldo.favs) {
      var key = 'fav_' + id;
      if (!localStorage.getItem(key)) localStorage.setItem(key, 1);
    }
    // Restaurar participados
    for (var id in respaldo.participados) {
      var key = 'fav_' + id;
      if (!localStorage.getItem(key)) localStorage.setItem(key, 2);
    }
  }
  
    // 🔵 Restaurar fechas si existen en cookie
    if (respaldo && respaldo.fechas) {
      for (var id in respaldo.fechas) {
        var k = 'fav_fecha_' + id;
        var est = parseInt(localStorage.getItem('fav_' + id) || '0', 10);
        if ((est === 1 || est === 2) && !localStorage.getItem(k)) {   // no revivir fechas de desmarcados
          localStorage.setItem(k, respaldo.fechas[id]);
        }
      }
    }

  // Aplicar estado a todos los íconos existentes
  document.querySelectorAll('button.btn-fav').forEach(function(el) {
    var id = el.getAttribute('data-id');
    var estado = parseInt(localStorage.getItem('fav_' + id) || '0', 10);
    aplicarEstado(el.querySelector('i'), estado);
  });
});
} catch (e) { console.error('[fc-listados.js bloque 2]', e); }

/* ── bloque 3/4 · panel de filtros: estado, facetas, URL ── */
if (!__fcListadosSkip) try {
(function() {

/* ─── ESTADO ─── */
var FC_KEY = 'fc_filtros2:' + window.location.pathname;
/* v10.23: los filtros se guardan en sessionStorage (solo mientras dura la visita); se borra lo que quedó en localStorage */
try { localStorage.removeItem('fc_filtros:' + window.location.pathname); localStorage.removeItem(FC_KEY); } catch(e) {}
/* Orden con el que arranca la página: Populares trae data-defecto="popular"; el resto, por fecha de cierre */
var FC_ORDEN_DEF = (function() { var s = document.getElementById('fc-orden'); return (s && s.getAttribute('data-defecto')) || 'cierre'; })();
var FC_ORDENES = ['cierre', 'popular', 'nuevos', 'premio'];

var fcState = {
  generos:      new Set(),
  premios:      new Set(),
  paises:       new Set(),
  edades:       new Set(),
  residencias:  new Set(),
  envios:       new Set(),
  dateFrom:     '',
  dateTo:       '',
  soloAbiertos: false,
  miPais:       false,
  texto:        '',
  orden:        FC_ORDEN_DEF
};
var fcPanelOpen  = false;
var fcGroupsOpen = { fecha: false, genero: false, premio: false, pais: false, participacion: false, envio: false };
var fcData = [];
var fcListaParent = null;   // contenedor original de las tarjetas (con las cabeceras de mes)
var fcPalabras = [];        // búsqueda por texto ya normalizada
var fcMiPais = '';   // país del visitante, en el mismo formato que los chips de residencia

/* Código ISO (Cloudflare) -> nombre como figura en las bases */
var FC_ISO = {
  AR: 'Argentina', BO: 'Bolivia', CL: 'Chile', CO: 'Colombia', CR: 'Costa Rica', CU: 'Cuba',
  DO: 'República Dominicana', EC: 'Ecuador', SV: 'El Salvador', GQ: 'Guinea Ecuatorial',
  GT: 'Guatemala', HN: 'Honduras', MX: 'México', NI: 'Nicaragua', PA: 'Panamá', PY: 'Paraguay',
  PE: 'Perú', PR: 'Puerto Rico', ES: 'España', UY: 'Uruguay', VE: 'Venezuela',
  US: 'Estados Unidos', CA: 'Canadá', BR: 'Brasil', PT: 'Portugal', AD: 'Andorra',
  FR: 'Francia', IT: 'Italia', DE: 'Alemania', GB: 'Reino Unido', CH: 'Suiza', BE: 'Bélgica'
};

/* Grupos de chips: clave del estado, campo del concurso, contenedor, parámetro del hash */
var FC_GRUPOS = [
  { key: 'generos',     campo: 'generos',     el: 'fc-chips-genero',     badge: 'fc-badge-genero',  h: 'g'  },
  { key: 'paises',      campo: 'pais',        el: 'fc-chips-pais',       badge: 'fc-badge-pais',    h: 'p'  },
  { key: 'edades',      campo: 'edades',      el: 'fc-chips-edad',       badge: null,               h: 'e'  },
  { key: 'residencias', campo: 'residencias', el: 'fc-chips-residencia', badge: null,               h: 'r'  },
  { key: 'premios',     campo: 'premios',     el: 'fc-chips-premio',     badge: 'fc-badge-premio',  h: 'pr' },
  { key: 'envios',      campo: 'envio',       el: 'fc-chips-envio',      badge: 'fc-badge-envio',   h: 'env' }
];
var FC_ENVIO_LABEL = { electronico: 'Electrónico', postal: 'Postal' };
var FC_EDAD_ORDEN  = ['Mujeres', 'Niños y adolescentes', 'Jóvenes (hasta 35)', 'Adultos', 'Mayores de 50', 'Estudiantes', 'Docentes'];

/* ─── TOGGLE PANEL / GRUPO ─── */
window.fcTogglePanel = function() {
  fcPanelOpen = !fcPanelOpen;
  document.getElementById('fc-filtros-wrap').classList.toggle('open', fcPanelOpen);
};
window.fcToggleGroup = function(g) {
  fcGroupsOpen[g] = !fcGroupsOpen[g];
  var body = document.getElementById('fc-gbody-' + g);
  body.closest('.fc-group').classList.toggle('open', fcGroupsOpen[g]);
};

/* ─── NORMALIZACIÓN ─── */
var FC_MINUSC = { de: 1, del: 1, la: 1, las: 1, los: 1, el: 1, y: 1, e: 1 };
function fcTitleCase(s) {
  return s.trim().toLowerCase().split(' ').map(function(w, i) {
    if (!w) return w;
    if (i > 0 && FC_MINUSC[w]) return w;
    return w.charAt(0).toUpperCase() + w.slice(1);
  }).join(' ');
}
/* Minúsculas sin tildes (los diacríticos se arman sin escribirlos en el código) */
var FC_DIAC = new RegExp('[' + String.fromCharCode(768) + '-' + String.fromCharCode(879) + ']', 'g');
function fcNorm(s) { return String(s || '').toLowerCase().normalize('NFD').replace(FC_DIAC, ''); }

function fcAdd(arr, v) { if (v && arr.indexOf(v) === -1) arr.push(v); }
function fcEsc(s) {
  return String(s).replace(/[&<>"]/g, function(ch) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch];
  });
}

/* País: alias de subdivisiones y "desconocido" fuera de los chips */
var FC_PAIS_ALIAS = { 'ciudad de méxico': 'México', 'cdmx': 'México', 'país desconocido': '', 'pais desconocido': '', 'desconocido': '' };
function fcPais(s) {
  var k = (s || '').trim().toLowerCase();
  if (k in FC_PAIS_ALIAS) return FC_PAIS_ALIAS[k];
  return fcTitleCase(s || '');
}

/* Premio: nombre de la página-listado (data-fc-cat) -> rótulo corto */
var FC_PREMIO_CORTO = {
  'con Compensación Económica':           'Dinero',
  'que Ofrecen Publicación':              'Publicación',
  'con Difusión en Prensa':               'Difusión en prensa',
  'que Otorgan Beca o Residencia':        'Beca, residencia o formación',
  'que Otorgan Subsidios para Proyectos': 'Subsidio para proyectos',
  'que Premian con Tecnología':           'Tecnología',
  'con Premios Canjeables':               'Bonos y vales',
  'que Premian con Libros':               'Libros',
  'para Viajar o Participar en Eventos':  'Viajes y eventos',
  'que Premian con Arte':                 'Obra de arte',
  'que Otorgan Trofeo, Medalla o Placa':  'Trofeo, medalla o placa',
  'que Otorgan Diploma':                  'Diploma',
  'que Premian con Bebida o Alimento':    'Bebida o alimento',
  'que Premian con Plantas y Flores':     'Plantas y flores'
};
function fcPremioCorto(n) {
  if (FC_PREMIO_CORTO[n]) return FC_PREMIO_CORTO[n];
  var s = n.replace(/^(con|para|que [^ ]+( con)?) /, '');
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

/* Participación: cada categoría marcada por fxMarcarCategoriasPara va a
   "Dirigidos a" (edad o perfil) o a "Residencia o nacionalidad". */
function fcRango(lab) {
  var s = lab.toLowerCase(), m;
  if ((m = s.match(/^mayores(?: de)? ([0-9]+)$/))) return [+m[1], 120];
  if ((m = s.match(/^menores(?: de)? ([0-9]+)$/))) return [0, +m[1] - 1];
  if ((m = s.match(/^(?:entre|de) ([0-9]+) (?:y|a) ([0-9]+)$/))) return [+m[1], +m[2]];
  var fijos = { 'mayores de edad': [18, 120], 'adultos': [18, 120], 'adultos mayores': [60, 120], 'niños': [0, 12], 'jóvenes': [12, 35] };
  return fijos[s] || null;
}
function fcClasificarPara(lab) {
  var s = lab.toLowerCase();
  if (s === 'alumnos')  return { tipo: 'edad', val: 'Estudiantes' };
  if (s === 'docentes') return { tipo: 'edad', val: 'Docentes' };
  if (s === 'mujeres')  return { tipo: 'edad', val: 'Mujeres' };
  var r = fcRango(lab);
  if (!r) return { tipo: 'res', val: fcPais(lab) };
  if (r[0] >= 50)  return { tipo: 'edad', val: 'Mayores de 50' };
  if (r[1] >= 100) return { tipo: 'edad', val: 'Adultos' };
  if (r[1] <= 20)  return { tipo: 'edad', val: 'Niños y adolescentes' };
  if (r[1] <= 40)  return { tipo: 'edad', val: 'Jóvenes (hasta 35)' };
  return { tipo: 'edad', val: 'Adultos' };
}

/* ─── MONTO DEL PREMIO EN EUROS (solo para ordenar; cotizaciones aproximadas) ─── */
var FC_EUR = { EUR: 1, USD: 0.9, GBP: 1.15, CHF: 1.05, ARS: 0.0008, MXN: 0.05, COP: 0.00022, CLP: 0.00095,
               UYU: 0.022, PEN: 0.24, GTQ: 0.115, DOP: 0.015, BOB: 0.13, CUP: 0.003 };
var FC_PESO_PAIS = { 'Argentina': 'ARS', 'México': 'MXN', 'Colombia': 'COP', 'Chile': 'CLP', 'Uruguay': 'UYU',
                     'Cuba': 'CUP', 'República Dominicana': 'DOP' };
var FC_MONEDA_RE = new RegExp('(?<![a-z])(' + String.fromCharCode(8364) + '|£|us[$]|u[$]s|[$]|eur(?:os?)?|usd|d[oó]lar(?:es)?|ars|pesos?|mxn|cop|clp|soles|pen|uyu|gbp|libras?|chf|quetzal(?:es)?|gtq|bob)(?![a-z])', 'g');
var FC_NUM_RE = /([0-9]{1,3}(?:[., ][0-9]{3})+|[0-9]+)(?:,([0-9]{1,2}))?(?![0-9])/g;
function fcMonedaDe(tok) {
  if (tok === String.fromCharCode(8364) || tok.indexOf('eur') === 0) return 'EUR';
  if (tok === '£' || tok === 'gbp' || tok.indexOf('libra') === 0) return 'GBP';
  if (tok === 'us$' || tok === 'u$s' || tok === 'usd' || tok.charAt(0) === 'd') return 'USD';
  if (tok === 'soles' || tok === 'pen') return 'PEN';
  if (tok.indexOf('quetzal') === 0 || tok === 'gtq') return 'GTQ';
  if (tok === '$' || tok.indexOf('peso') === 0) return '';   // depende del país
  return tok.toUpperCase();
}
function fcMontoEur(details, pais) {
  if (!details) return 0;
  var txtPremio = details.querySelector('.fc-det-premio .fc-det-txt');
  var seg = (txtPremio ? txtPremio.textContent : (details.textContent.split('|')[2] || '')).toLowerCase();
  var toks = [], m;
  FC_MONEDA_RE.lastIndex = 0;
  while ((m = FC_MONEDA_RE.exec(seg))) toks.push({ s: m.index, e: m.index + m[0].length, cod: fcMonedaDe(m[1]) });
  if (!toks.length) return 0;
  var explicita = toks.filter(function(t) { return t.cod; })[0];
  var cod = explicita ? explicita.cod : (FC_PESO_PAIS[pais] || (seg.indexOf('$') !== -1 ? 'USD' : ''));
  if (!FC_EUR[cod]) return 0;
  var max = 0;
  FC_NUM_RE.lastIndex = 0;
  while ((m = FC_NUM_RE.exec(seg))) {
    var ini = m.index, fin = ini + m[0].length;
    var resto = seg.slice(fin, fin + 12);
    var mult = /^ ?mil(?![a-z])/.test(resto) ? 1000 : (/^ ?mill[oó]n/.test(resto) ? 1000000 : 1);
    // solo números pegados a una moneda (evita años, puestos, cantidad de ejemplares…)
    var cerca = toks.some(function(t) { return (t.e <= ini && ini - t.e <= 3) || (t.s >= fin && t.s - fin <= 14); });
    if (!cerca) continue;
    var n = parseFloat(m[1].replace(/[., ]/g, '') + (m[2] ? '.' + m[2] : '')) * mult;
    if (n * FC_EUR[cod] > max) max = n * FC_EUR[cod];
  }
  return max;
}

/* ─── EXTRAER DATOS DEL DOM (una sola vez) ─── */
function fcExtract() {
  var out = [];
  document.querySelectorAll('.recuadro[id]').forEach(function(card) {
    var agendar = card.querySelector('.link-agendar');
    if (!agendar) return;
    var p = (agendar.getAttribute('data-fecha') || '').split('/');
    var c = {
      card: card,
      idx: out.length,
      pop: parseInt(card.getAttribute('data-pop'), 10) || Infinity,
      agregado: card.getAttribute('data-agregado') || '',
      nuevo: !!card.querySelector('.novedad-icon'),
      // el texto recortado de las tarjetas (premio, género, entidad, "Abierto a") se busca completo, desde su title
      texto: fcNorm(card.textContent + ' ' + Array.prototype.map.call(
        card.querySelectorAll('.fc-det-txt[title], .fc-para-txt[title]'), function(e) { return e.title; }).join(' ')),
      isoDate: p.length === 3 ? p[2] + '-' + p[1] + '-' + p[0] : '',
      pais: fcPais(agendar.getAttribute('data-pais') || ''),
      generos: [], generoTodos: false, premios: [], abierto: false,
      envio: '', edades: [], residencias: []
    };
    var details = card.querySelector('.details');
    if (details) {
      details.querySelectorAll('a[style*="background-color"]').forEach(function(a) {
        var bg  = (a.getAttribute('style') || '').toLowerCase();
        var txt = a.textContent.trim();
        if (!txt) return;
        var cat = a.getAttribute('data-fc-cat');
        if (bg.indexOf('#1e7e34') !== -1) {
          // "Todos" (cualquier género) aparece al filtrar por cualquier género
          if (cat === '*' || (!cat && txt.toLowerCase() === 'todos')) c.generoTodos = true;
          else fcAdd(c.generos, cat || fcTitleCase(txt));
        } else if (bg.indexOf('#7a5fa1') !== -1) {
          fcAdd(c.premios, cat ? fcPremioCorto(cat) : fcTitleCase(txt));
        } else if (bg.indexOf('#00695c') !== -1 && txt.toLowerCase() === 'todos') {
          c.abierto = true;
        }
      });
      details.querySelectorAll('.fc-para-tag').forEach(function(tag) {
        var lab = (tag.getAttribute('data-categoria') || '').trim();
        if (!lab) return;
        var k = fcClasificarPara(lab);
        fcAdd(k.tipo === 'edad' ? c.edades : c.residencias, k.val);
      });
    }
    var ic = card.querySelector('table td:first-child a i');
    if (ic) {
      if (ic.classList.contains('fa-wifi'))     c.envio = 'electronico';
      if (ic.classList.contains('fa-envelope')) c.envio = 'postal';
    }
    c.premioEur = fcMontoEur(details, c.pais);
    out.push(c);
  });
  return out;
}

function fcValores(c, campo) {
  var v = c[campo];
  return Array.isArray(v) ? v : (v ? [v] : []);
}

/* ─── ¿UN CONCURSO PASA LOS FILTROS? ───
   'excluir' salta un grupo: sirve para calcular cuántos resultados daría
   cada opción de ese grupo con el resto de los filtros aplicados (facetado). */
function fcPasa(c, excluir) {
  if (fcPalabras.length && !fcPalabras.every(function(w) { return c.texto.indexOf(w) !== -1; })) return false;
  if (excluir !== 'fecha') {
    if (fcState.dateFrom && c.isoDate && c.isoDate < fcState.dateFrom) return false;
    if (fcState.dateTo   && c.isoDate && c.isoDate > fcState.dateTo)   return false;
  }
  if (excluir !== 'abiertos' && fcState.soloAbiertos && !c.abierto) return false;
  if (excluir !== 'mipais' && fcState.miPais && fcMiPais && !fcParaMiPais(c)) return false;
  for (var i = 0; i < FC_GRUPOS.length; i++) {
    var g = FC_GRUPOS[i], sel = fcState[g.key];
    if (g.key === excluir || !sel.size) continue;
    if (g.key === 'generos' && c.generoTodos) continue;
    if (!fcValores(c, g.campo).some(function(v) { return sel.has(v); })) return false;
  }
  return true;
}

function fcConteo(g) {
  var cnt = {};
  fcData.forEach(function(c) {
    if (!fcPasa(c, g.key)) return;
    var vals = fcValores(c, g.campo);
    if (g.key === 'generos' && c.generoTodos) vals = vals.concat(g.orden.filter(function(v) { return vals.indexOf(v) === -1; }));
    vals.forEach(function(v) { cnt[v] = (cnt[v] || 0) + 1; });
  });
  return cnt;
}

/* Orden fijo de cada grupo (por cantidad total, desempate alfabético) para que los chips no salten */
function fcCalcularOrden() {
  FC_GRUPOS.forEach(function(g) {
    var tot = {};
    fcData.forEach(function(c) { fcValores(c, g.campo).forEach(function(v) { tot[v] = (tot[v] || 0) + 1; }); });
    var vals = Object.keys(tot);
    if (g.key === 'edades') {
      vals.sort(function(a, b) { return FC_EDAD_ORDEN.indexOf(a) - FC_EDAD_ORDEN.indexOf(b); });
    } else if (g.key === 'envios') {
      vals = ['electronico', 'postal'].filter(function(v) { return tot[v]; });
    } else {
      vals.sort(function(a, b) { return (tot[b] - tot[a]) || a.localeCompare(b, 'es'); });
    }
    g.orden = vals;
  });
}

/* ─── ORDEN ───
   "Por fecha de cierre" es el orden original, con las cabeceras de mes.
   Los otros mueven las tarjetas a un contenedor propio (las cabeceras y el
   índice de meses se ocultan solos porque sus secciones quedan vacías) y
   dejan una marca en el lugar original para poder volver. Los anuncios del
   tema se redistribuyen con el evento fc:filtrado, que sigue el orden del DOM. */
function fcOrdenar() {
  var cont = document.getElementById('fc-ordenados');
  if (fcState.orden === 'cierre') {
    if (!cont) return;
    fcData.forEach(function(c) { c.marca.parentNode.insertBefore(c.card, c.marca.nextSibling); });
    cont.parentNode.removeChild(cont);
    return;
  }
  if (!cont) {
    fcData.forEach(function(c) {
      if (!c.marca) { c.marca = document.createComment('fc'); c.card.parentNode.insertBefore(c.marca, c.card); }
    });
    cont = document.createElement('div');
    cont.id = 'fc-ordenados';
    // Debajo de la primera cabecera (que conserva el anuncio y el separador)
    var raiz = fcListaParent.querySelector('.fc-mes') || document.getElementById('mes-0');
    while (raiz && raiz.parentNode !== fcListaParent) raiz = raiz.parentNode;
    fcListaParent.insertBefore(cont, raiz ? raiz.nextSibling : fcData[0].marca);
  }
  var cmp = fcState.orden === 'nuevos'
    // por fecha de agregado (data-agregado, AAAA-MM-DD); las páginas viejas, por el ícono de nuevo
    ? function(a, b) { return (a.agregado === b.agregado ? 0 : (a.agregado < b.agregado ? 1 : -1)) || (b.nuevo - a.nuevo) || (a.idx - b.idx); }
    : fcState.orden === 'popular'
    ? function(a, b) { return (a.pop === b.pop ? 0 : (a.pop < b.pop ? -1 : 1)) || (a.idx - b.idx); }
    : function(a, b) { return (b.premioEur - a.premioEur) || (a.idx - b.idx); };
  fcData.slice().sort(cmp).forEach(function(c) { cont.appendChild(c.card); });
}

/* ─── BARRA FIJA EN CELULAR ─── */
function fcSticky() {
  var bar = document.getElementById('fc-sticky');
  var wrap = document.getElementById('fc-filtros-wrap');
  if (!bar || !wrap || !('IntersectionObserver' in window)) return;
  var fin = document.getElementById('reglas');
  var arriba = false, alFinal = false;
  var upd = function() {
    var on = arriba && !alFinal;
    bar.classList.toggle('visible', on);
    bar.setAttribute('aria-hidden', on ? 'false' : 'true');
  };
  new IntersectionObserver(function(es) {
    arriba = !es[0].isIntersecting && es[0].boundingClientRect.top < 0; upd();
  }).observe(wrap);
  if (fin) new IntersectionObserver(function(es) {
    alFinal = es[0].isIntersecting || es[0].boundingClientRect.top < 0; upd();
  }).observe(fin);
  document.getElementById('fc-sticky-btn').onclick = function() {
    if (!fcPanelOpen) fcTogglePanel();
    wrap.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
}

/* ─── CEDER EL HILO (INP) ───
   Los clics del panel primero muestran el cambio (chip marcado, píldora quitada) y
   recién en la tarea siguiente filtran: el navegador pinta la respuesta al toque sin
   esperar a que se recalcule todo el listado. */
function fcCeder() {
  if (window.scheduler && typeof scheduler.yield === 'function') return scheduler.yield();
  return new Promise(function(r) { setTimeout(r, 0); });
}
function fcLuego(fn) {
  fcCeder().then(function() {
    try { fn(); } catch (err) { console.error('[fc-listados]', err); }
  });
}

/* ─── RENDER DE CHIPS ─── */
function fcChip(label, n, on, onclick) {
  var btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'fc-chip' + (on ? ' active' : '');
  btn.setAttribute('aria-pressed', on ? 'true' : 'false');
  btn.innerHTML = '<i class="fa-solid fa-check fc-chip-check"></i>' + fcEsc(label) +
                  (n !== null ? ' <span class="fc-chip-n">' + n + '</span>' : '');
  btn.onclick = function(e) {
    e.stopPropagation();
    var activo = btn.classList.toggle('active');
    btn.setAttribute('aria-pressed', activo ? 'true' : 'false');
    fcLuego(onclick);
  };
  return btn;
}

function fcRenderGrupo(g) {
  var wrap = document.getElementById(g.el);
  if (!wrap) return;
  var cnt = fcConteo(g), sel = fcState[g.key];
  var vals = g.orden.concat(Array.from(sel).filter(function(v) { return g.orden.indexOf(v) === -1; }));
  // País del visitante primero (y destacado) si hay concursos de ese país
  var mio = (g.key === 'paises' && fcMiPais && (cnt[fcMiPais] || sel.has(fcMiPais))) ? fcMiPais : '';
  if (mio) vals = [mio].concat(vals.filter(function(v) { return v !== mio; }));
  wrap.innerHTML = '';
  vals.forEach(function(v) {
    var n = cnt[v] || 0, on = sel.has(v);
    if (!n && !on) return;   // opciones que darían 0 resultados no se ofrecen
    var chip = fcChip(g.key === 'envios' ? FC_ENVIO_LABEL[v] : v, n, on, function() {
      if (sel.has(v)) sel.delete(v); else sel.add(v);
      fcApply();
    });
    if (v === mio) {
      chip.classList.add('fc-chip-mio');
      chip.insertAdjacentHTML('afterbegin', '<i class="fa-solid fa-location-dot" aria-hidden="true"></i>');
      chip.title = 'Tu país';
    }
    wrap.appendChild(chip);
  });
  var sub = document.getElementById(g.el.replace('fc-chips-', 'fc-sub-'));
  if (sub) sub.style.display = wrap.children.length ? '' : 'none';
}

function fcParaMiPais(c) {
  return c.abierto || c.residencias.indexOf(fcMiPais) !== -1;
}
function fcRenderAbiertos() {
  var wrap = document.getElementById('fc-chips-participacion');
  if (!wrap) return;
  wrap.innerHTML = '';
  // "Abiertos a todos o a <país del visitante>": incluye los que piden residir en su país
  if (fcMiPais) {
    // solo si hay concursos que piden residir en el país del visitante (si no, es igual a "Abiertos a todos")
    var propios = fcData.filter(function(c) { return c.residencias.indexOf(fcMiPais) !== -1 && fcPasa(c, 'mipais'); }).length;
    var m = fcData.filter(function(c) { return fcParaMiPais(c) && fcPasa(c, 'mipais'); }).length;
    if (propios || fcState.miPais) {
      wrap.appendChild(fcChip('Abiertos a todos o a ' + fcMiPais, m, fcState.miPais, function() {
        fcState.miPais = !fcState.miPais;
        fcApply();
      }));
    }
  }
  var n = fcData.filter(function(c) { return c.abierto && fcPasa(c, 'abiertos'); }).length;
  if (!n && !fcState.soloAbiertos) return;
  wrap.appendChild(fcChip('Abiertos a todos', n, fcState.soloAbiertos, function() {
    fcState.soloAbiertos = !fcState.soloAbiertos;
    fcApply();
  }));
}

/* País del visitante: window.FC_COUNTRY si el Worker lo inyecta; si no, /cdn-cgi/trace
   de Cloudflare (mismo origen, sin costo), cacheado en la sesión. */
function fcDetectarPais() {
  var usar = function(code) {
    var nombre = FC_ISO[(code || '').toUpperCase()] || '';
    if (nombre === fcMiPais) return;
    fcMiPais = nombre;
    fcApply();
  };
  var code = window.FC_COUNTRY || '';
  if (!code) { try { code = sessionStorage.getItem('fc_pais') || ''; } catch(e) {} }
  if (code) { usar(code); return; }
  if (!window.fetch) return;
  fetch('/cdn-cgi/trace', { credentials: 'omit' })
    .then(function(r) { return r.ok ? r.text() : ''; })
    .then(function(t) {
      var m = t.match(/^loc=([A-Z]{2})$/m);
      if (!m) return;
      try { sessionStorage.setItem('fc_pais', m[1]); } catch(e) {}
      usar(m[1]);
    })
    .catch(function() {});
}

/* ─── FECHAS RÁPIDAS ─── */
function fcFmt(d) {
  var pad = function(n) { return String(n).padStart(2, '0'); };
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
}
function fcQuicks() {
  var t = new Date(), y = t.getFullYear(), m = t.getMonth(), d = t.getDate();
  return [
    { label: 'Próximos 7 días',  from: fcFmt(t), to: fcFmt(new Date(y, m, d + 7)) },
    { label: 'Próximos 15 días', from: fcFmt(t), to: fcFmt(new Date(y, m, d + 15)) },
    { label: 'Este mes',         from: fcFmt(t), to: fcFmt(new Date(y, m + 1, 0)) },
    { label: 'Próx. 3 meses',    from: fcFmt(t), to: fcFmt(new Date(y, m + 3, 0)) },
    { label: 'Año siguiente',    from: fcFmt(new Date(y + 1, 0, 1)), to: fcFmt(new Date(y + 1, 11, 31)) }
  ];
}
function fcQuickActivo() {
  return fcQuicks().filter(function(q) { return q.from === fcState.dateFrom && q.to === fcState.dateTo; })[0] || null;
}
function fcSetFechas(from, to) {
  fcState.dateFrom = from; fcState.dateTo = to;
  document.getElementById('fc-date-from').value = from;
  document.getElementById('fc-date-to').value   = to;
}
function fcRenderQuick() {
  var wrap = document.getElementById('fc-quick-dates');
  if (!wrap) return;
  wrap.innerHTML = '';
  var act = fcQuickActivo();
  fcQuicks().forEach(function(q) {
    var on = !!act && act.label === q.label;
    wrap.appendChild(fcChip(q.label, null, on, function() {
      if (on) fcSetFechas('', ''); else fcSetFechas(q.from, q.to);
      fcApply();
    }));
  });
}
function fcFechaTexto() {
  var q = fcQuickActivo();
  if (q) return q.label;
  var f = function(iso) { var p = iso.split('-'); return p[2] + '/' + p[1]; };
  if (fcState.dateFrom && fcState.dateTo) return 'Cierre del ' + f(fcState.dateFrom) + ' al ' + f(fcState.dateTo);
  if (fcState.dateFrom) return 'Cierre desde el ' + f(fcState.dateFrom);
  return 'Cierre hasta el ' + f(fcState.dateTo);
}

/* ─── FILTROS ACTIVOS (píldoras con ×) ─── */
function fcActivos() {
  var lista = [];
  if (fcState.dateFrom || fcState.dateTo) lista.push({ label: fcFechaTexto(), quitar: function() { fcSetFechas('', ''); } });
  if (fcState.texto) lista.push({ label: '"' + fcState.texto + '"', quitar: function() {
    fcState.texto = ''; document.getElementById('fc-texto').value = '';
  } });
  if (fcState.miPais && fcMiPais) lista.push({ label: 'Abiertos a todos o a ' + fcMiPais, quitar: function() { fcState.miPais = false; } });
  if (fcState.soloAbiertos) lista.push({ label: 'Abiertos a todos', quitar: function() { fcState.soloAbiertos = false; } });
  FC_GRUPOS.forEach(function(g) {
    fcState[g.key].forEach(function(v) {
      lista.push({ label: g.key === 'envios' ? 'Envío ' + FC_ENVIO_LABEL[v].toLowerCase() : v,
                   quitar: function() { fcState[g.key].delete(v); } });
    });
  });
  return lista;
}
function fcRenderActivos(lista) {
  var wrap = document.getElementById('fc-activos');
  if (!wrap) return;
  wrap.innerHTML = '';
  lista.forEach(function(it) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'fc-pill';
    b.setAttribute('aria-label', 'Quitar filtro: ' + it.label);
    b.innerHTML = fcEsc(it.label) + ' <i class="fa-solid fa-xmark" aria-hidden="true"></i>';
    b.onclick = function(e) { e.stopPropagation(); b.style.visibility = 'hidden'; fcLuego(function() { it.quitar(); fcApply(); }); };
    wrap.appendChild(b);
  });
}

/* ─── ESTADO EN LA URL (#filtros?...) y en localStorage ─── */
function fcSerializar() {
  var qs = new URLSearchParams();
  FC_GRUPOS.forEach(function(g) { if (fcState[g.key].size) qs.set(g.h, Array.from(fcState[g.key]).join('|')); });
  if (fcState.soloAbiertos) qs.set('a', '1');
  if (fcState.miPais) qs.set('mp', '1');
  if (fcState.texto) qs.set('t', fcState.texto);
  if (fcState.orden !== FC_ORDEN_DEF) qs.set('o', fcState.orden);
  if (fcState.dateFrom) qs.set('df', fcState.dateFrom);
  if (fcState.dateTo)   qs.set('dt', fcState.dateTo);
  return qs.toString();
}
function fcCargar(qs) {
  FC_GRUPOS.forEach(function(g) {
    var v = qs.get(g.h);
    if (v) v.split('|').forEach(function(x) { if (x) fcState[g.key].add(x); });
  });
  fcState.soloAbiertos = qs.get('a') === '1';
  fcState.miPais = qs.get('mp') === '1';
  fcState.texto = qs.get('t') || '';
  document.getElementById('fc-texto').value = fcState.texto;
  fcState.orden = FC_ORDENES.indexOf(qs.get('o')) !== -1 ? qs.get('o') : FC_ORDEN_DEF;
  document.getElementById('fc-orden').value = fcState.orden;
  fcSetFechas(qs.get('df') || '', qs.get('dt') || '');
}
function fcHashActual() {
  return window.location.hash.indexOf('#filtros?') === 0 ? window.location.hash.slice(9) : null;
}
function fcGuardar(qs) {
  try { if (qs) sessionStorage.setItem(FC_KEY, qs); else sessionStorage.removeItem(FC_KEY); } catch(e) {}
  try {
    var base = window.location.pathname + window.location.search;
    if (qs) history.replaceState(history.state, '', base + '#filtros?' + qs);
    else if (fcHashActual() !== null) history.replaceState(history.state, '', base);
  } catch(e) {}
  // Los listados partidos en dos páginas llevan los filtros al pasar de una a otra
  document.querySelectorAll('a.fc-pager').forEach(function(a) {
    a.href = a.getAttribute('data-base') + (qs ? '#filtros?' + qs : '');
  });
}
function fcMarcarPaginador() {
  document.querySelectorAll('.post a[href*="/p/concursos"]').forEach(function(a) {
    if (!/^(siguiente|anterior)$/i.test(a.textContent.trim())) return;
    if (a.closest('#fc-filtros-wrap, #fc-empty-state')) return;
    a.classList.add('fc-pager');
    a.setAttribute('data-base', a.href.split('#')[0]);
  });
}

/* ─── APLICAR FILTROS ─── */
window.fcApply = function() {
  fcState.dateFrom = document.getElementById('fc-date-from').value || '';
  fcState.dateTo   = document.getElementById('fc-date-to').value   || '';
  fcPalabras = fcNorm(fcState.texto).split(' ').filter(function(w) { return w; });

  var total = fcData.length, visible = 0;
  fcData.forEach(function(c) {
    var show = fcPasa(c, null);
    c.card.classList.toggle('fc-hidden', !show);
    if (show) visible++;
  });

  FC_GRUPOS.forEach(fcRenderGrupo);
  fcRenderAbiertos();
  fcRenderQuick();

  // Lo que no hace falta para el primer pintado se difiere al próximo frame (INP)
  requestAnimationFrame(function() {

  // ── Limpiar espacios: ocultar/mostrar <br> y cabeceras de mes ──
  if (!fcListaParent) return;

  var parent   = fcListaParent;
  var children = Array.prototype.slice.call(parent.childNodes);

  function esCabeceraMes(node) {
    return node.nodeType === 1 && node.querySelector &&
      ((node.classList && node.classList.contains('fc-mes')) || !!node.querySelector('h2[id^="mes-"]'));
  }

  var secciones = [];
  var secActual = null;
  children.forEach(function(node) {
    if (esCabeceraMes(node)) {
      secActual = { header: node, nodes: [] };
      secciones.push(secActual);
    } else if (secActual) {
      secActual.nodes.push(node);
    }
  });

  // La primera cabecera de mes también lleva el anuncio previo al listado y el
  // separador: nunca se oculta entera. Si su mes queda vacío (por filtros) o el
  // orden no es por cierre, solo se oculta su título; y si su título no se ve,
  // el separador del primer mes visible sobra (ya está el de la primera).
  var porCierre = fcState.orden === 'cierre';
  var tituloPrimeraOculto = false, separadorQuitado = false;
  secciones.forEach(function(sec, iSec) {
    var recuadros = sec.nodes.filter(function(n) {
      return n.nodeType === 1 && n.classList && n.classList.contains('recuadro');
    });
    var recuadrosVisibles = recuadros.filter(function(n) {
      return !n.classList.contains('fc-hidden');
    });
    var tieneVisible  = recuadrosVisibles.length > 0;
    var ultimoVisible = tieneVisible ? recuadrosVisibles[recuadrosVisibles.length - 1] : null;

    var titulo = sec.header.querySelector('h2.fc-mes-tit') || sec.header.querySelector('h2:not([id])');
    var separador = sec.header.querySelector('hr.divider');
    if (iSec === 0) {
      sec.header.style.display = '';
      tituloPrimeraOculto = !(tieneVisible && porCierre);
      if (titulo) titulo.style.display = tituloPrimeraOculto ? 'none' : '';
    } else {
      sec.header.style.display = tieneVisible ? '' : 'none';
      if (separador) {
        var quitar = tituloPrimeraOculto && tieneVisible && !separadorQuitado;
        separador.style.display = quitar ? 'none' : '';
        if (quitar) separadorQuitado = true;
      }
    }

    sec.nodes.forEach(function(node) {
      if (node.nodeType !== 1 || node.nodeName !== 'BR') return;
      var prev = node.previousElementSibling;
      if (!prev || !prev.classList || !prev.classList.contains('recuadro')) {
        node.style.display = tieneVisible ? '' : 'none';
        return;
      }
      var prevVisible = !prev.classList.contains('fc-hidden');
      node.style.display = (prevVisible && prev !== ultimoVisible) ? '' : 'none';
    });
  });

  // botón para bajar a los resultados (con el panel abierto quedan lejos)
  var verRes = document.getElementById('fc-ver-res');
  if (verRes) {
    verRes.hidden = visible === 0;
    var verTxt = document.getElementById('fc-ver-res-txt');
    if (verTxt) verTxt.textContent = visible === 1 ? 'Ver el concurso' : 'Ver ' + visible + ' concursos';
  }

  // conteo resultado
  var countEl = document.getElementById('fc-result-count');
  if (countEl) {
    countEl.innerHTML = visible === total
      ? '<strong>' + total + '</strong> concursos en esta página'
      : 'Mostrando <strong>' + visible + '</strong> de ' + total + ' concursos';
  }

  // empty state (con enlace a la otra página del listado, si la hay)
  var empty = document.getElementById('fc-empty-state');
  if (empty) empty.style.display = (visible === 0) ? '' : 'none';
  var otra = document.getElementById('fc-empty-otra');
  var pager = document.querySelector('a.fc-pager');
  if (otra) {
    otra.innerHTML = pager
      ? 'Este listado sigue en otra página: <a href="' + fcEsc(pager.href) + '">probá los mismos filtros ahí</a>.'
      : '';
  }

  // badges
  FC_GRUPOS.forEach(function(g) { if (g.badge) fcUpdateBadge(g.badge, fcState[g.key].size); });
  fcUpdateBadge('fc-badge-participacion', (fcState.soloAbiertos ? 1 : 0) + (fcState.miPais ? 1 : 0) + fcState.edades.size + fcState.residencias.size);
  fcUpdateBadge('fc-badge-fecha', (fcState.dateFrom || fcState.dateTo) ? 1 : 0);

  // filtros activos: resumen en la barra + píldoras quitables
  var activos = fcActivos();
  var summary = document.getElementById('fc-bar-summary');
  if (summary) {
    summary.textContent = activos.length
      ? '\u2014 ' + visible + ' resultado' + (visible === 1 ? '' : 's')
      : '';
  }
  fcRenderActivos(activos);
  var sticky = document.getElementById('fc-sticky-info');
  if (sticky) {
    sticky.textContent = activos.length
      ? visible + ' de ' + total + ' concursos · ' + activos.length + (activos.length === 1 ? ' filtro' : ' filtros')
      : total + ' concursos';
  }
  document.getElementById('fc-filtros-wrap').classList.toggle('has-filters', activos.length > 0);

  fcGuardar(fcSerializar());

  // ── Índice de meses: ocultar/mostrar cada enlace ──
  document.querySelectorAll('a[href^="#mes-"]').forEach(function(link) {
    var mesId = link.getAttribute('href').replace('#', '');
    var ancla = document.getElementById(mesId);
    if (!ancla) return;

    var nodoRaiz = ancla;
    while (nodoRaiz.parentNode && nodoRaiz.parentNode !== fcListaParent) {
      nodoRaiz = nodoRaiz.parentNode;
    }

    var hayVisible = false;
    var sibling = nodoRaiz.nextElementSibling;
    while (sibling) {
      if (esCabeceraMes(sibling)) break;
      if (sibling.classList && sibling.classList.contains('recuadro') && !sibling.classList.contains('fc-hidden')) {
        hayVisible = true;
        break;
      }
      sibling = sibling.nextElementSibling;
    }

    link.style.display = hayVisible ? '' : 'none';

    var next = link.nextSibling;
    while (next && next.nodeType === 3 && next.textContent.trim() === '') {
      next = next.nextSibling;
    }
    if (next && next.nodeName === 'BR') {
      next.style.display = hayVisible ? '' : 'none';
    }
  });

  // Redistribuir anuncios entre recuadros visibles
  document.dispatchEvent(new CustomEvent('fc:filtrado'));

  }); // fin requestAnimationFrame
};

function fcUpdateBadge(id, count) {
  var el = document.getElementById(id);
  if (!el) return;
  el.textContent = count;
  el.classList.toggle('visible', count > 0);
}

/* ─── LIMPIAR TODO ─── */
window.fcClearAll = function(e) {
  if (e) e.stopPropagation();
  FC_GRUPOS.forEach(function(g) { fcState[g.key].clear(); });
  fcState.soloAbiertos = false;
  fcState.miPais = false;
  fcState.texto = '';
  document.getElementById('fc-texto').value = '';
  fcSetFechas('', '');
  fcLuego(fcApply);
};

/* ─── IR A LOS RESULTADOS ───
   Baja al primer concurso visible (en el orden actual) y cierra el panel.
   Con teclado, además lleva el foco al título de ese concurso. */
function fcIrAResultados(conTeclado) {
  var cont = document.getElementById('fc-ordenados');
  var primera = (cont || fcListaParent || document).querySelector('.recuadro[id]:not(.fc-hidden)');
  if (!primera) return;
  if (fcPanelOpen) fcTogglePanel();
  requestAnimationFrame(function() {
    primera.scrollIntoView({ behavior: 'smooth', block: 'start' });
    var tit = conTeclado && primera.querySelector('a[id^="bases_"]');
    if (tit) { try { tit.focus({ preventScroll: true }); } catch (e) {} }
  });
}

/* ─── INIT ─── */
function fcInit() {
  fcData = fcExtract();
  fcListaParent = fcData.length ? fcData[0].card.parentNode : null;
  fcCalcularOrden();
  fcMarcarPaginador();

  // "Más populares" solo si las tarjetas traen su puesto (los archivados y las páginas viejas no)
  var selOrden = document.getElementById('fc-orden');
  var hayPop = fcData.some(function(c) { return c.pop !== Infinity; });
  if (!hayPop) {
    var optPop = selOrden && selOrden.querySelector('option[value="popular"]');
    if (optPop) optPop.parentNode.removeChild(optPop);
    FC_ORDENES = FC_ORDENES.filter(function(o) { return o !== 'popular'; });
    if (FC_ORDEN_DEF === 'popular') FC_ORDEN_DEF = 'cierre';
    if (fcState.orden === 'popular') fcState.orden = 'cierre';
  }
  if (selOrden) selOrden.value = fcState.orden;
  var verRes = document.getElementById('fc-ver-res');
  if (verRes) verRes.addEventListener('click', function(e) { e.stopPropagation(); fcIrAResultados(e.detail === 0); });

  // Búsqueda por texto (con una pequeña espera entre teclas) y orden
  var inTexto = document.getElementById('fc-texto'), tTexto = null;
  inTexto.addEventListener('input', function() {
    clearTimeout(tTexto);
    tTexto = setTimeout(function() { fcState.texto = inTexto.value.trim(); fcApply(); }, 200);
  });
  document.getElementById('fc-orden').addEventListener('change', function() {
    var orden = this.value;
    fcLuego(function() {
      fcState.orden = orden;
      fcOrdenar();
      fcApply();
    });
  });

  // Restaurar: primero el enlace (#filtros?...), si no, lo guardado en este listado
  var qs = fcHashActual();
  if (qs === null) { try { qs = sessionStorage.getItem(FC_KEY); } catch(e) { qs = null; } }
  if (qs) {
    fcCargar(new URLSearchParams(qs));
    if (fcActivos().length) {
      fcPanelOpen = true;
      document.getElementById('fc-filtros-wrap').classList.add('open');
    }
  }
  if (qs || fcState.orden !== 'cierre') fcOrdenar();
  fcApply();
  fcDetectarPais();
  fcSticky();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', fcInit);
} else {
  fcInit();
}

})();
} catch (e) { console.error('[fc-listados.js bloque 3]', e); }

/* ── bloque 4/4 · accesibilidad del panel y de los favoritos ── */
/* Accesibilidad del panel de filtros y de los botones de favorito */
if (!__fcListadosSkip) try {
(function () {
  'use strict';

  function onKey(el, fn) {
    el.addEventListener('keydown', function (e) {
      if (e.target !== el) return;
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fn(); }
    });
  }

  function enhance() {
    var wrap = document.getElementById('fc-filtros-wrap');
    if (!wrap || wrap.dataset.a11y) return;
    wrap.dataset.a11y = '1';

    // Barra principal: el rol va en la etiqueta (el botón "Limpiar" ya es un <button>, no se anida)
    var label = document.getElementById('fc-bar-label');
    if (label) {
      label.setAttribute('role', 'button');
      label.setAttribute('tabindex', '0');
      label.setAttribute('aria-controls', 'fc-panel');
      onKey(label, function () { label.click(); });
      var syncBar = function () { label.setAttribute('aria-expanded', wrap.classList.contains('open') ? 'true' : 'false'); };
      syncBar();
      new MutationObserver(syncBar).observe(wrap, { attributes: true, attributeFilter: ['class'] });
    }

    // Grupos plegables
    wrap.querySelectorAll('.fc-group').forEach(function (g) {
      var h = g.querySelector('.fc-group-header'), b = g.querySelector('.fc-group-body');
      if (!h || !b) return;
      h.setAttribute('role', 'button');
      h.setAttribute('tabindex', '0');
      h.setAttribute('aria-controls', b.id);
      onKey(h, function () { h.click(); });
      var sync = function () { h.setAttribute('aria-expanded', g.classList.contains('open') ? 'true' : 'false'); };
      sync();
      new MutationObserver(sync).observe(g, { attributes: true, attributeFilter: ['class'] });
    });

    // Etiquetas de los campos de fecha
    [['fc-date-from', 'Fecha de cierre desde'], ['fc-date-to', 'Fecha de cierre hasta']].forEach(function (p) {
      var i = document.getElementById(p[0]);
      if (i) {
        i.setAttribute('aria-label', p[1]);
        var l = i.parentNode && i.parentNode.querySelector('label');
        if (l) l.setAttribute('for', p[0]);
      }
    });

    // Chips: aria-pressed inicial (los que crea fcChip ya lo traen)
    var syncChips = function () {
      wrap.querySelectorAll('.fc-chip').forEach(function (c) {
        var on = c.classList.contains('active') ? 'true' : 'false';
        if (c.getAttribute('aria-pressed') !== on) c.setAttribute('aria-pressed', on);
        if (!c.hasAttribute('type')) c.setAttribute('type', 'button');
      });
    };
    syncChips();
    // (sin MutationObserver: fcChip ya crea cada chip con aria-pressed y lo actualiza al tocarlo)

    // Resultado del filtrado anunciado a lectores de pantalla
    var sum = document.getElementById('fc-bar-summary');
    if (sum) { sum.setAttribute('role', 'status'); sum.setAttribute('aria-live', 'polite'); }
  }

  // Botones de favorito: nombre accesible según el estado (0 sin marcar, 1 favorito, 2 ya participé)
  var ETQ = ['Guardar en favoritos', 'Marcado como favorito. Pulsar para marcar como ya participé', 'Marcado como ya participé. Pulsar para desmarcar'];
  function favLabels(soloEste) {
    (soloEste ? [soloEste] : document.querySelectorAll('button.btn-fav')).forEach(function (b) {
      var e = 0;
      try { e = parseInt(localStorage.getItem('fav_' + b.getAttribute('data-id')) || '0', 10) || 0; } catch (x) {}
      var res = (e === 2 && typeof fcResNombre === 'function') ? fcResNombre(b.getAttribute('data-id')) : '';
      var etq = res ? 'Ya participé · ' + res + '. Pulsar para desmarcar' : (ETQ[e] || ETQ[0]);
      b.setAttribute('aria-label', etq);
      if (!b.hasAttribute('data-titulo')) b.setAttribute('data-titulo', b.getAttribute('title') || '');
      b.setAttribute('title', res ? 'Ya participé · ' + res : b.getAttribute('data-titulo'));
    });
  }
  document.addEventListener('click', function (e) {
    var btn = e.target.closest ? e.target.closest('button.btn-fav') : null;
    if (btn) setTimeout(function () { favLabels(btn); }, 0);
  });

  function boot() { enhance(); favLabels(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
} catch (e) { console.error('[fc-listados.js bloque 4]', e); }

/* ── clics que llegaron antes de que cargara este archivo (los guarda el stub inline del tema) ── */
if (window.fcFlushQ) { try { window.fcFlushQ(); } catch (e) { console.error(e); } }
