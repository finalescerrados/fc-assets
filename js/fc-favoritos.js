/*! finalescerrados.com · fc-favoritos.js · fc-assets v10.18 · JS de la página Mis concursos favoritos (antes inline en el contenido de la página).
   Cada sentencia ejecutable va en su propio try/catch: si un bloque falla, los demás siguen corriendo. */

/* Se saltea si la página todavía trae este JS inline (versión anterior del contenido de la página). */
var __fcFavoritosSkip = Array.isArray(window.allEntries);

/* ── bloque 1/2 · estado, cookies, listado de favoritos ── */
var allEntries; if (!__fcFavoritosSkip) { allEntries = []; }
var hoy; if (!__fcFavoritosSkip) { hoy = new Date(); } if (!__fcFavoritosSkip) try {
hoy.setHours(0,0,0,0);
} catch (e) { console.error('[fc-favoritos.js bloque 1]', e); }

// --- Funciones de Estado y Cookies (cookie compacta v2; lee también el formato anterior) ---
// Cookie de respaldo compacta (v2): "2_<favs>_<participados>_<id:AAAAMMDD,...>"
// ~30 bytes por favorito (el formato JSON anterior ocupaba ~76). Sigue leyendo el formato anterior.
var FC_COOKIE_MAX; if (!__fcFavoritosSkip) { FC_COOKIE_MAX = 3900; }

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

// --- Estado vacío útil: enlaces a los listados ---
var FC_LISTADOS; if (!__fcFavoritosSkip) { FC_LISTADOS = [
  { t: 'Populares',          u: '/p/concursos-literarios-mas-populares-hoy.html',  i: 'fa-fire' },
  { t: 'Nuevos',             u: '/p/concursos-literarios-agregados-esta.html',     i: 'fa-calendar-week' },
  { t: 'Por participante',   u: '/p/concursos-literarios-por-participante.html', i: 'fa-users' },
  { t: 'Envío electrónico',  u: '/p/concursos-literarios-que-permiten-envio.html', i: 'fa-wifi' },
  { t: 'Todos los concursos', u: '/p/concursos.html',                              i: 'fa-infinity' }
]; }

function htmlVacio() {
  var links = FC_LISTADOS.map(function(l) {
    return '<a href="' + l.u + '"><i class="fa-solid ' + l.i + '" aria-hidden="true"></i> ' + l.t + '</a>';
  }).join('');
  return '<div class="fav-vacio"><p>Todavía no tenés concursos guardados. Tocá el corazón en cualquier concurso y aparecerá acá. Empezá por alguno de estos listados:</p>'
       + '<div class="fav-vacio-links">' + links + '</div></div>';
}

// --- Avisos (boletín / café): frecuencia limitada y respetando a quien ya aportó ---
var FC_AVISO_COOLDOWN; if (!__fcFavoritosSkip) { FC_AVISO_COOLDOWN = 30 * 86400000; }
function fcLs(k) { try { return localStorage.getItem(k); } catch(e) { return null; } }
function fcLsSet(k, v) { try { localStorage.setItem(k, String(v)); } catch(e) {} }
function fcPuede(key) { var t = parseInt(fcLs(key) || '0', 10); return !t || (Date.now() - t) > FC_AVISO_COOLDOWN; }
function fcAporto() { var t = parseInt(fcLs('fc_aporte_ts') || '0', 10); return !!t && (Date.now() - t) < 120 * 86400000; }
function fcHayBoletin() { return !!document.querySelector('.ipz-button'); }
function fcMedir(n, p) { if (typeof fcTrack === 'function') { try { fcTrack(n, p || {}); } catch(e) {} } }

// El boletín se abre con el mismo botón del sitio (.ipz-button): se le reenvía el clic
function avisoBoletin(ev, origen) {
  ev.preventDefault();
  var b = document.querySelector('.ipz-button');
  if (b) b.click();
  fcMedir('fav_boletin_click', { origen: origen });
  return false;
}
function cerrarBoletin() {
  fcLsSet('fc_fav_boletin_ts', Date.now());
  var c = document.getElementById('fav-boletin'); if (c) c.hidden = true;
}

function mostrarAvisoParticipe(prevId) {
  var lista = document.getElementById('lista-favoritos');
  if (!lista || document.querySelector('.fav-aviso-part') || !fcPuede('fc_fav_aviso_ts')) return;
  var partes = [];
  if (fcHayBoletin()) partes.push('Para no perderte el próximo concurso, <a href="#" class="fav-ipz" onclick="return avisoBoletin(event, \'participe\')">recibí el boletín</a>.');
  if (!fcAporto()) partes.push('Si la guía te sirve, podés <a class="cafe" href="https://www.finalescerrados.com/p/redirigiendo-cafe.html">invitarme un café</a>.');
  if (!partes.length) return;
  var aviso = document.createElement('div');
  aviso.className = 'fav-aviso fav-aviso-part';
  aviso.setAttribute('role', 'status');
  aviso.innerHTML = '<button type="button" class="fav-aviso-x" aria-label="Cerrar" onclick="this.parentNode.remove()">&times;</button>'
                  + '<strong>¡Mucha suerte con el envío!</strong> ' + partes.join(' ');
  var ancla = prevId ? lista.querySelector('.icon-fav[data-id="' + prevId + '"]') : null;
  var fila = ancla ? ancla.closest('.fav-linea') : null;
  if (fila) fila.after(aviso); else lista.insertBefore(aviso, lista.firstChild);
  fcLsSet('fc_fav_aviso_ts', Date.now());
  var tarjeta = document.getElementById('fav-boletin'); if (tarjeta) tarjeta.hidden = true;
  fcMedir('fav_aviso_visto', {});
}

// --- Anuncio entre "favoritos" y "ya participé": solo si hay contenido propio del usuario ---
function montarAnuncio(total) {
  var cont = document.getElementById('fav-ad');
  if (!cont || total < 1 || cont.dataset.on) return;
  cont.dataset.on = '1';
  cont.hidden = false;
  var ins = document.createElement('ins');
  ins.className = 'adsbygoogle';
  ins.style.cssText = 'display:block;text-align:center;';
  ins.setAttribute('data-ad-layout', 'in-article');
  ins.setAttribute('data-ad-format', 'fluid');
  ins.setAttribute('data-ad-client', 'ca-pub-7776262814765753');
  ins.setAttribute('data-ad-slot', '8986089529');
  cont.appendChild(ins);
  var go = function() {
    if (window.FC && typeof window.FC.pushAd === 'function') window.FC.pushAd(ins);
    else { try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch(e) {} }
  };
  if (window.FC && typeof window.FC.scheduleAfterAds === 'function') window.FC.scheduleAfterAds(go, 3000);
  else setTimeout(go, 2500);
}

function actualizarTarjetaBoletin(total) {
  var c = document.getElementById('fav-boletin');
  if (!c) return;
  var mostrar = total >= 2 && fcHayBoletin() && fcPuede('fc_fav_boletin_ts') && !document.querySelector('.fav-aviso-part');
  c.hidden = !mostrar;
}

function getEstado(id) {
  var key = 'fav_' + id;
  var estado = parseInt(localStorage.getItem(key) || '0', 10);
  if(estado === 0) {
    var respaldo = leerRespaldoCookie();
    if(respaldo) {
      if(respaldo.favs && respaldo.favs[id]) estado = 1;
      if(respaldo.participados && respaldo.participados[id]) estado = 2;
      if(estado !== 0) localStorage.setItem(key, estado);
    }
  }
  return estado;
}

// --- Resultados de "ya particip\u00e9": resultado, texto enviado y fecha de fallo ---
// Claves propias (no empiezan con fav_ para no confundirse con los estados):
//   fcres_<id>   g = ganador, f = finalista, m = menci\u00f3n, s = sin premio (sin clave = esperando)
//   fcfallo_<id> AAAA-MM-DD     fctxt_<id> t\u00edtulo del texto enviado
// Respaldo en la cookie respaldoRes ("id:r:AAAAMMDD,..."); el t\u00edtulo no entra en la cookie.
var FC_RES; if (!__fcFavoritosSkip) { FC_RES = { g: 'Ganador', f: 'Finalista', m: 'Menci\u00f3n', s: 'Sin premio' }; }
var fcResAbiertos; if (!__fcFavoritosSkip) { fcResAbiertos = {}; }

function fcEsc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return '&#' + c.charCodeAt(0) + ';'; }); }

function leerRespaldoRes() {
  var row = document.cookie.split('; ').find(function (r) { return r.indexOf('respaldoRes=') === 0; });
  var out = {};
  if (!row) return out;
  row.slice('respaldoRes='.length).split(',').forEach(function (x) {
    var p = x.split(':');
    if (p.length >= 2 && /^[0-9]{6,25}$/.test(p[0])) out[p[0]] = { r: p[1] || '', l: p[2] || '' };
  });
  return out;
}

function actualizarCookieRes() {
  var items = [];
  try {
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i);
      if (k.indexOf('fcres_') === 0 || k.indexOf('fcfallo_') === 0) {
        var id = k.slice(k.indexOf('_') + 1);
        if (items.indexOf(id) === -1) items.push(id);
      }
    }
  } catch (e) { return; }
  var v = '';
  items.forEach(function (id) {
    var r = fcLs('fcres_' + id) || '', l = (fcLs('fcfallo_' + id) || '').replace(/-/g, '');
    if (!r && !l) return;
    var add = (v ? ',' : '') + id + ':' + r + ':' + l;
    if ((v + add).length <= FC_COOKIE_MAX) v += add;
  });
  document.cookie = 'respaldoRes=' + v + '; path=/; max-age=31536000; SameSite=Lax'
    + (location.protocol === 'https:' ? '; Secure' : '');
}

function getRes(id) {
  var r = fcLs('fcres_' + id), l = fcLs('fcfallo_' + id);
  if (r === null && l === null) {
    var c = leerRespaldoRes()[id];
    if (c) {
      if (c.r && FC_RES[c.r]) { fcLsSet('fcres_' + id, c.r); r = c.r; }
      if (/^[0-9]{8}$/.test(c.l)) { l = c.l.slice(0, 4) + '-' + c.l.slice(4, 6) + '-' + c.l.slice(6); fcLsSet('fcfallo_' + id, l); }
    }
  }
  return { r: (r && FC_RES[r]) ? r : '', l: l || '', x: fcLs('fctxt_' + id) || '' };
}

function fcResBorrar(id) {
  try { localStorage.removeItem('fcres_' + id); localStorage.removeItem('fcfallo_' + id); localStorage.removeItem('fctxt_' + id); } catch (e) {}
}

// --- Descargar la lista en PDF (con enlaces a cada concurso) ---
// jsPDF se carga reci\u00e9n al tocar el bot\u00f3n, as\u00ed no pesa en la p\u00e1gina.
var FC_JSPDF; if (!__fcFavoritosSkip) { FC_JSPDF = 'https://cdn.jsdelivr.net/npm/jspdf@2.5.2/dist/jspdf.umd.min.js'; }
function fcCargarJsPDF() {
  if (window.jspdf && window.jspdf.jsPDF) return Promise.resolve(window.jspdf.jsPDF);
  return new Promise(function (ok, mal) {
    var s = document.createElement('script');
    s.src = FC_JSPDF; s.async = true;
    s.onload = function () { (window.jspdf && window.jspdf.jsPDF) ? ok(window.jspdf.jsPDF) : mal(new Error('jsPDF')); };
    s.onerror = mal;
    document.head.appendChild(s);
  });
}
// Las fuentes est\u00e1ndar del PDF solo tienen los caracteres de Windows-1252: el resto se reemplaza
function fcPdfTxt(s) {
  var t = document.createElement('textarea'); t.innerHTML = String(s == null ? '' : s); s = t.value;
  var extra = '\u20ac\u201a\u0192\u201e\u2026\u2020\u2021\u02c6\u2030\u0160\u2039\u0152\u017d\u2018\u2019\u201c\u201d\u2022\u2013\u2014\u02dc\u2122\u0161\u203a\u0153\u017e\u0178';
  return s.replace(/[\u2010\u2011\u2012\u2212]/g, '-').replace(/[\u00a0\u2007\u202f]/g, ' ')
    .replace(/[\s\S]/g, function (c) { var n = c.charCodeAt(0); return (n < 256 || extra.indexOf(c) !== -1) ? c : ''; })
    .replace(/\s+/g, ' ').trim();
}
function fcPdfFecha(iso) { var p = String(iso || '').split('-'); return p.length === 3 ? p[2] + '/' + p[1] + '/' + p[0] : ''; }

function fcDescargarPDF(btn) {
  var items = [];
  allEntries.forEach(function (en) {
    var id = en.id.$t.split('.page-')[1] || en.id.$t.split('.post-')[1];
    var e = getEstado(id);
    if (e !== 1 && e !== 2) return;
    var link = (en.link.find(function (l) { return l.rel === 'alternate'; }) || {}).href || '';
    var f = localStorage.getItem('fav_fecha_' + id) || '';
    var d = f ? new Date(f + 'T00:00:00') : null;
    items.push({ e: e, nombre: fcPdfTxt(fcNombreCorto(en.title.$t)), link: link, iso: f, d: d, res: e === 2 ? getRes(id) : null });
  });
  if (!items.length) { if (typeof mostrarToast === 'function') mostrarToast('No hay concursos guardados para descargar', 'warning'); return; }
  var txt0 = btn ? btn.innerHTML : '';
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-file-pdf"></i> Armando el PDF\u2026'; }
  var fin = function () { if (btn) { btn.disabled = false; btn.innerHTML = txt0; } };
  fcCargarJsPDF().then(function (jsPDF) {
    return Promise.resolve().then(function () { return fcArmarPDF(jsPDF, items); })
      .catch(function (err) { console.error(err); if (typeof mostrarToast === 'function') mostrarToast('No se pudo armar el PDF', 'warning'); })
      .then(fin);
  }, function () { fin(); if (typeof mostrarToast === 'function') mostrarToast('No se pudo cargar el generador de PDF. Prob\u00e1 de nuevo', 'warning'); });
}

// Im\u00e1genes del encabezado: el logo sale del SVG del encabezado del sitio (mismo origen, no hace falta
// descargar nada) y el coraz\u00f3n y el check se dibujan; todo se pasa a PNG con un canvas.
var FC_PDF_FONDO; if (!__fcFavoritosSkip) { FC_PDF_FONDO = '#141414'; }
function fcPdfCanvas(w, h, dibujar) {
  var c = document.createElement('canvas'); c.width = w; c.height = h;
  dibujar(c.getContext('2d'));
  return c.toDataURL('image/png');
}
function fcPdfIcono(tipo, fondo, tinta) {
  return fcPdfCanvas(160, 160, function (x) {
    x.fillStyle = fondo; x.beginPath(); x.arc(80, 80, 80, 0, Math.PI * 2); x.fill();
    x.fillStyle = tinta; x.strokeStyle = tinta;
    if (tipo === 'fav') {
      x.beginPath(); x.moveTo(80, 122);
      x.bezierCurveTo(28, 88, 30, 44, 57, 42); x.bezierCurveTo(69, 41, 77, 49, 80, 57);
      x.bezierCurveTo(83, 49, 91, 41, 103, 42); x.bezierCurveTo(130, 44, 132, 88, 80, 122);
      x.fill();
    } else {
      x.lineWidth = 17; x.lineCap = 'round'; x.lineJoin = 'round';
      x.beginPath(); x.moveTo(47, 83); x.lineTo(70, 106); x.lineTo(115, 57); x.stroke();
    }
  });
}
function fcPdfLogo(blanco) {
  return new Promise(function (ok) {
    var svg = document.querySelector('#Header1 svg');
    if (!svg) return ok(null);
    var s = svg.cloneNode(true), vb = (s.getAttribute('viewBox') || '0 0 572 70').split(/\s+/);
    var ps = s.querySelectorAll('path');
    ps.forEach(function (p, i) { p.setAttribute('fill', i === 0 ? (blanco ? '#ffffff' : '#141414') : (blanco ? FC_PDF_FONDO : '#ffffff')); });
    s.setAttribute('width', vb[2]); s.setAttribute('height', vb[3]);
    var img = new Image();
    img.onload = function () {
      try { ok({ url: fcPdfCanvas(vb[2] * 4, vb[3] * 4, function (x) { x.drawImage(img, 0, 0, vb[2] * 4, vb[3] * 4); }), r: vb[3] / vb[2] }); }
      catch (e) { ok(null); }
    };
    img.onerror = function () { ok(null); };
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(new XMLSerializer().serializeToString(s));
  });
}

function fcArmarPDF(jsPDF, items) {
  return fcPdfLogo(true).then(function (logo) {
  var doc = new jsPDF({ unit: 'mm', format: 'a4' });
  var W = 210, H = 297, M = 16, X2 = M + 30, ANCHO = W - X2 - M, y;
  var AZUL = [64, 106, 140], GRIS = [110, 110, 110], ROJO = [214, 40, 40], NEGRO = [30, 30, 30], VERDE = [30, 126, 52];
  var PAG = 'https://www.finalescerrados.com/p/mis-concursos-favoritos.html';
  var hoyD = new Date(); hoyD.setHours(0, 0, 0, 0);
  var ico = { fav: fcPdfIcono('fav', '#d62828', '#ffffff'), part: fcPdfIcono('part', '#1e7e34', '#ffffff'),
              favS: fcPdfIcono('fav', '#ffebeb', '#d62828'), partS: fcPdfIcono('part', '#e6f4ea', '#1e7e34') };
  var color = function (c) { doc.setTextColor(c[0], c[1], c[2]); };
  var nFav = items.filter(function (i) { return i.e === 1; }).length, nPart = items.length - nFav;
  var logoEn = function (x, yy, ancho) {
    if (logo) doc.addImage(logo.url, 'PNG', x, yy, ancho, ancho * logo.r);
    else { doc.setFont('helvetica', 'bold'); doc.setFontSize(ancho / 3.2); doc.setTextColor(255, 255, 255); doc.text('FINALES CERRADOS', x, yy + ancho * 0.1); }
  };
  // Banda superior de la primera p\u00e1gina
  doc.setFillColor(20, 20, 20); doc.rect(0, 0, W, 36, 'F');
  doc.setFillColor(ROJO[0], ROJO[1], ROJO[2]); doc.rect(0, 36, W, 1.3, 'F');
  logoEn(M, 10.5, 82);
  doc.link(M, 10, 82, 10, { url: 'https://www.finalescerrados.com/' });
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(185, 185, 185);
  doc.text('Concursos literarios en espa\u00f1ol', M, 28);
  var cx = W - M - 44;
  doc.addImage(ico.fav, 'PNG', cx, 8.5, 8, 8); doc.addImage(ico.part, 'PNG', cx, 20, 8, 8);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(11.5); doc.setTextColor(255, 255, 255);
  doc.text(nFav + (nFav === 1 ? ' favorito' : ' favoritos'), cx + 11, 14.1);
  doc.text(nPart + ' ya particip\u00e9', cx + 11, 25.6);
  y = 51;
  doc.setFont('helvetica', 'bold'); doc.setFontSize(20); color(NEGRO);
  doc.text('Mis concursos literarios', M, y); y += 7;
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5); color(GRIS);
  var gen = 'Lista generada el ' + fcPdfFecha(hoyD.getFullYear() + '-' + String(hoyD.getMonth() + 1).padStart(2, '0') + '-' + String(hoyD.getDate()).padStart(2, '0')) + ' en ';
  doc.text(gen, M, y); color(AZUL);
  doc.textWithLink('finalescerrados.com', M + doc.getTextWidth(gen), y, { url: PAG });
  color(GRIS); doc.text('. Toc\u00e1 el nombre de un concurso para abrir sus bases.', M + doc.getTextWidth(gen + 'finalescerrados.com'), y);
  y += 11;
  var espacio = function (h) {
    if (y + h <= H - 18) return;
    doc.addPage();
    doc.setFillColor(20, 20, 20); doc.rect(0, 0, W, 13, 'F');
    doc.setFillColor(ROJO[0], ROJO[1], ROJO[2]); doc.rect(0, 13, W, 0.8, 'F');
    logoEn(M, 4.2, 38);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(185, 185, 185);
    doc.text('Mis concursos literarios', W - M, 8.3, { align: 'right' });
    y = 25;
  };
  var pastilla = function (txt, x, yy, fondo, tinta) {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5);
    var w = doc.getTextWidth(txt) + 4;
    doc.setFillColor(fondo[0], fondo[1], fondo[2]); doc.roundedRect(x, yy - 3.1, w, 4.3, 2.1, 2.1, 'F');
    doc.setTextColor(tinta[0], tinta[1], tinta[2]); doc.text(txt, x + 2, yy);
    return w;
  };
  var RES_COL = { g: [196, 138, 0], f: [46, 139, 87], m: [64, 106, 140], s: [140, 140, 140] };

  function seccion(titulo, icono, lista) {
    if (!lista.length) return;
    espacio(18);
    doc.addImage(icono, 'PNG', M, y - 5.2, 7, 7);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(13.5); color(NEGRO);
    doc.text(titulo + ' (' + lista.length + ')', M + 9.5, y); y += 3;
    doc.setDrawColor(225, 225, 225); doc.setLineWidth(0.3); doc.line(M, y, W - M, y); y += 6.5;
    lista.forEach(function (it, idx) {
      doc.setFont('helvetica', 'bold'); doc.setFontSize(10.5);
      var lineas = doc.splitTextToSize(it.nombre, ANCHO).slice(0, 3);
      var r = it.res || {}, det = [];
      if (it.e === 2) {
        if (r.x) det.push('Texto: ' + fcPdfTxt(r.x));
        if (r.l) det.push('Fallo: ' + fcPdfFecha(r.l));
      }
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
      var detL = det.length ? doc.splitTextToSize(det.join('  \u2022  '), ANCHO - (it.e === 2 ? 26 : 0)) : [];
      var alto = lineas.length * 5 + (it.e === 2 ? Math.max(1, detL.length) * 4.4 : 0) + 4;
      espacio(alto);
      var dias = it.d ? Math.round((it.d - hoyD) / 86400000) : null;
      var pronto = it.e === 1 && dias !== null && dias >= 0 && dias <= 7, cerrado = dias !== null && dias < 0;
      doc.setFont('helvetica', 'bold'); doc.setFontSize(10); color(pronto ? ROJO : (it.e === 1 && cerrado ? GRIS : NEGRO));
      doc.text(it.iso ? fcPdfFecha(it.iso) : 'Sin fecha', M, y);
      if (it.e === 1 && dias !== null) {
        var nota = cerrado ? 'Cerrado' : dias === 0 ? 'Cierra hoy' : dias === 1 ? 'Cierra ma\u00f1ana' : dias <= 7 ? 'En ' + dias + ' d\u00edas' : '';
        if (nota) pastilla(nota, M, y + 4.6, pronto ? [255, 235, 235] : [238, 238, 238], pronto ? ROJO : GRIS);
      }
      doc.setFont('helvetica', 'bold'); doc.setFontSize(10.5); color(it.e === 1 && cerrado ? GRIS : AZUL);
      lineas.forEach(function (l, i) {
        if (it.link) doc.textWithLink(l, X2, y + i * 5, { url: it.link }); else doc.text(l, X2, y + i * 5);
      });
      var yy = y + lineas.length * 5;
      if (it.e === 2) {
        var col = RES_COL[r.r] || [120, 125, 135];
        var w = pastilla(r.r ? FC_RES[r.r] : 'Esperando', X2, yy - 0.3, col, [255, 255, 255]);
        doc.setFont('helvetica', 'normal'); doc.setFontSize(9); color(GRIS);
        detL.forEach(function (l, i) { doc.text(l, X2 + w + 3, yy - 0.3 + i * 4.4); });
        yy += Math.max(1, detL.length) * 4.4;
      }
      y = Math.max(yy - 2.5, y + (it.e === 1 && dias !== null && (cerrado || dias <= 7) ? 5.5 : 0)) + 1.8;
      if (idx < lista.length - 1) { doc.setDrawColor(238, 238, 238); doc.line(X2, y, W - M, y); }
      y += 6;
    });
    y += 5;
  }
  var porFecha = function (a, b) {
    var va = a.d && a.d >= hoyD, vb = b.d && b.d >= hoyD;
    if (va !== vb) return va ? -1 : 1;              // vigentes primero
    if (!a.d || !b.d) return a.d ? -1 : (b.d ? 1 : 0);
    return va ? a.d - b.d : b.d - a.d;              // vigentes: lo m\u00e1s pr\u00f3ximo primero; cerrados: lo m\u00e1s reciente
  };
  seccion('Favoritos', ico.favS, items.filter(function (i) { return i.e === 1; }).sort(porFecha));
  seccion('Ya particip\u00e9', ico.partS, items.filter(function (i) { return i.e === 2; }).sort(porFecha));

  var n = doc.getNumberOfPages();
  for (var p = 1; p <= n; p++) {
    doc.setPage(p); doc.setDrawColor(230, 230, 230); doc.line(M, H - 14, W - M, H - 14);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); color(GRIS);
    doc.textWithLink('finalescerrados.com \u00b7 concursos literarios en espa\u00f1ol', M, H - 9, { url: 'https://www.finalescerrados.com/' });
    doc.text('P\u00e1gina ' + p + ' de ' + n, W - M, H - 9, { align: 'right' });
  }
  var f = new Date();
  doc.save('mis-concursos-finalescerrados-' + f.getFullYear() + '-' + String(f.getMonth() + 1).padStart(2, '0') + '-' + String(f.getDate()).padStart(2, '0') + '.pdf');
  });
}

function setRes(el) {
  var id = el.dataset.id, r = el.dataset.r;
  try { if (r) localStorage.setItem('fcres_' + id, r); else localStorage.removeItem('fcres_' + id); } catch (e) {}
  if (typeof mostrarToast === 'function') {
    var msg = { g: '\u00a1Felicitaciones! Marcado como ganador', f: '\u00a1Bien ah\u00ed! Marcado como finalista', m: 'Marcado como menci\u00f3n', s: 'Marcado como sin premio. El pr\u00f3ximo ser\u00e1' }[r] || 'Vuelve a "esperando resultado"';
    mostrarToast(msg, 'success');
  }
  actualizarCookieRes();
  renderLists();
  var n = document.querySelector('.fav-res-op[data-id="' + id + '"][data-r="' + r + '"]');
  if (n && esTeclado(el)) n.focus();
}

function setResDato(el) {
  var id = el.dataset.id, campo = el.dataset.campo, v = (el.value || '').trim();
  var k = (campo === 'x' ? 'fctxt_' : 'fcfallo_') + id;
  if (campo === 'x') v = v.slice(0, 120);
  if (campo === 'l' && !/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(v)) v = '';
  try { if (v) localStorage.setItem(k, v); else localStorage.removeItem(k); } catch (e) {}
  actualizarCookieRes();
  fcResAbiertos[id] = true;
  renderLists();
}

function fcResToggle(det) { fcResAbiertos[det.dataset.id] = det.open; }

// T\u00edtulo de la ficha sin premio ni fecha: "Nombre \u00b7 Premio \u00b7 Cierra dd/mm/aaaa" -> "Nombre".
// Se cortan los dos \u00faltimos tramos (as\u00ed un "\u00b7" dentro del nombre no lo rompe); si el t\u00edtulo no tiene ese formato, queda igual.
function fcNombreCorto(t) {
  var p = String(t || '').split(/\s+\u00b7\s+/);
  if (p.length >= 3) return p.slice(0, -2).join(' \u00b7 ');
  if (p.length === 2 && /cierra|\d{1,2}\/\d{1,2}\/\d{2,4}/i.test(p[1])) return p[0];
  return p.join(' \u00b7 ');
}

function fcNormTitulo(t) {
  return String(t || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
}

// HTML del bloque de resultado de un concurso en "ya particip\u00e9"
function fcResHTML(id, res, otrosConMismoTexto) {
  var ops = [['', 'Esperando']].concat(Object.keys(FC_RES).map(function (k) { return [k, FC_RES[k]]; }));
  var chips = ops.map(function (o) {
    var on = res.r === o[0];
    return '<button type="button" class="fav-res-op fav-res-' + (o[0] || 'e') + (on ? ' active' : '') + '" data-id="' + id
      + '" data-r="' + o[0] + '" aria-pressed="' + on + '" onclick="setRes(this)">' + o[1] + '</button>';
  }).join('');
  var info = [];
  if (res.x) info.push('<span class="fav-res-txt">Texto: ' + fcEsc(res.x) + '</span>');
  if (res.l) {
    var p = res.l.split('-'), f = new Date(+p[0], +p[1] - 1, +p[2]); f.setHours(0, 0, 0, 0);
    var dias = Math.round((f - hoy) / 86400000), cuando = p[2] + '/' + p[1] + '/' + p[0];
    if (!res.r && dias > 0) info.push('<span class="fav-res-fallo' + (dias <= 7 ? ' pronto' : '') + '">Fallo: ' + cuando + ' (en ' + dias + (dias === 1 ? ' d\u00eda' : ' d\u00edas') + ')</span>');
    else if (!res.r && dias === 0) info.push('<span class="fav-res-fallo pronto">El fallo es hoy</span>');
    else if (!res.r) info.push('<span class="fav-res-fallo pronto">El fallo era el ' + cuando + ': \u00bfya sali\u00f3 el resultado?</span>');
    else info.push('<span class="fav-res-fallo">Fallo: ' + cuando + '</span>');
  }
  if (otrosConMismoTexto.length) {
    info.push('<span class="fav-res-dup">Este texto tambi\u00e9n est\u00e1 esperando resultado en: ' + otrosConMismoTexto.map(fcEsc).join(', ')
      + '. Revis\u00e1 si alguno pide exclusividad.</span>');
  }
  var abierto = fcResAbiertos[id] ? ' open' : '';
  return '<div class="fav-res">'
    + '<div class="fav-res-ops" role="group" aria-label="Resultado">' + chips + '</div>'
    + (info.length ? '<div class="fav-res-info">' + info.join('') + '</div>' : '')
    + '<details class="fav-res-det" data-id="' + id + '" ontoggle="fcResToggle(this)"' + abierto + '><summary>'
    + (res.x || res.l ? 'Editar texto y fecha de fallo' : 'Anotar con qu\u00e9 texto participaste y cu\u00e1ndo sale el fallo') + '</summary>'
    + '<label>T\u00edtulo del texto <input type="text" maxlength="120" data-id="' + id + '" data-campo="x" value="' + fcEsc(res.x) + '" onchange="setResDato(this)"></label>'
    + '<label>Fecha de fallo <input type="date" data-id="' + id + '" data-campo="l" value="' + fcEsc(res.l) + '" onchange="setResDato(this)"></label>'
    + '</details></div>';
}

// Resultado anotado en "ya particip\u00e9" (claves fcres_/fcfallo_/fctxt_, ver Mis favoritos)
// Respaldo en la cookie respaldoRes ("id:r:AAAAMMDD,..."), por si el navegador vaci\u00f3 localStorage
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
  return { g: 'Ganador', f: 'Finalista', m: 'Menci\u00f3n', s: 'Sin premio' }[r] || '';
}
// true si se puede sacar el concurso de "ya particip\u00e9" (no tiene nada anotado o el usuario lo confirma)
function fcConfirmarQuitarRes(id) {
  if (!fcTieneRes(id)) return true;
  var n = fcResNombre(id);
  return window.confirm('Este concurso tiene tu resultado anotado' + (n ? ' (' + n + ')' : '') + '. \u00bfQuitarlo de "ya particip\u00e9"? Se borran el resultado, el texto y la fecha de fallo.');
}
// Borra el resultado de un concurso (localStorage y cookie de respaldo respaldoRes)
function fcLimpiarRes(id) {
  try { ['fcres_', 'fcfallo_', 'fctxt_'].forEach(function (p) { localStorage.removeItem(p + id); }); } catch (e) {}
  var row = document.cookie.split('; ').find(function (r) { return r.indexOf('respaldoRes=') === 0; });
  if (!row) return;
  var v = row.slice('respaldoRes='.length).split(',').filter(function (x) { return x && x.split(':')[0] !== String(id); }).join(',');
  document.cookie = 'respaldoRes=' + v + '; path=/; max-age=31536000; SameSite=Lax' + (location.protocol === 'https:' ? '; Secure' : '');
}

// --- Toasts recuperados ---
function esTeclado(el) {
  try { return el.matches(':focus-visible'); } catch(e) { return false; }
}

function reenfocar(sel, id) {
  var n = document.querySelector(sel + '[data-id="' + id + '"]');
  if (n) n.focus();
}

function toggleFav(el) {
  var id = el.dataset.id;
  var antes = getEstado(id);
  if (getEstado(id) === 2) {   // de "ya particip\u00e9" a favorito: proteger el resultado anotado
    if (!fcConfirmarQuitarRes(id)) return;
    fcResBorrar(id); actualizarCookieRes();
  }
  var estado = getEstado(id) === 1 ? 0 : 1;
  var teclado = esTeclado(el); // solo quien navega con teclado necesita que el foco lo siga

  if(typeof mostrarToast === 'function') 
    mostrarToast(estado === 1 ? 'Guardado en favoritos' : 'Eliminado de favoritos','success');

  localStorage.setItem('fav_' + id, estado);
  if (typeof fcMeGusta === 'function') fcMeGusta(id, antes, estado);   // contador de "me gusta" (tema)
  actualizarCookie();
  renderLists();
  if (teclado) reenfocar('.icon-fav', id);
}

function togglePart(el) {
  var id = el.dataset.id;
  var antes = getEstado(id);
  if (getEstado(id) === 2) {
    if (!fcConfirmarQuitarRes(id)) return;
    fcResBorrar(id); actualizarCookieRes();
  }
  var estado = getEstado(id) === 2 ? 0 : 2;
  var teclado = esTeclado(el);
  var fila = el.closest('.fav-linea');
  var previa = fila && fila.previousElementSibling ? fila.previousElementSibling.querySelector('[data-id]') : null;
  var prevId = previa ? previa.dataset.id : null;
  var veniaDeFavoritos = !!(fila && fila.parentNode && fila.parentNode.id === 'lista-favoritos');

  if(typeof mostrarToast === 'function') 
    mostrarToast(estado === 2 ? 'Guardado en "ya participé"' : 'Desmarcado','success');

  localStorage.setItem('fav_' + id, estado);
  if (typeof fcMeGusta === 'function') fcMeGusta(id, antes, estado);   // contador de "me gusta" (tema)
  actualizarCookie();
  renderLists();
  if (estado === 2 && veniaDeFavoritos) mostrarAvisoParticipe(prevId);
  if (teclado) reenfocar('.icon-part', id);
}

function identificarFavoritos() {
    var ids = [];
    for(var i=0; i<localStorage.length; i++){
        var k = localStorage.key(i);
        if(k.startsWith('fav_') && !k.startsWith('fav_fecha_')){
             var id = k.replace('fav_', '');
             var est = parseInt(localStorage.getItem(k), 10);
             if(est === 1 || est === 2) ids.push(id);
        }
    }
    if(ids.length === 0) { renderLists(); return; }
    ids.forEach(id => {
        var script = document.createElement('script');
        script.src = '/feeds/pages/summary/' + id + '?alt=json-in-script&callback=procesarEntradaUnica';
        document.body.appendChild(script);
    });
}

var _renderT; if (!__fcFavoritosSkip) { _renderT = null; }
function programarRender() {
    if (_renderT) return;
    _renderT = setTimeout(function() { _renderT = null; renderLists(); }, 50);
}

function procesarEntradaUnica(json) {
    if(json && json.entry) {
        if(!allEntries.some(e => e.id.$t === json.entry.id.$t)) allEntries.push(json.entry);
        programarRender();
    }
}

function renderLists() {
  var totalFav=0, totalHoy=0, totalSemana=0, totalPart=0;
  var favHTML = '', partHTML = '';

  allEntries.sort((a,b) => {
      var idA = a.id.$t.split('.page-')[1] || a.id.$t.split('.post-')[1];
      var idB = b.id.$t.split('.page-')[1] || b.id.$t.split('.post-')[1];
      var fA_str = localStorage.getItem('fav_fecha_'+idA);
      var fB_str = localStorage.getItem('fav_fecha_'+idB);

      function parsearISO(str) {
          if (!str) return null;
          var p = str.split('-');
          if (p.length !== 3) return null;
          var d = new Date(parseInt(p[0],10), parseInt(p[1],10)-1, parseInt(p[2],10));
          d.setHours(0,0,0,0);
          return isNaN(d.getTime()) ? null : d;
      }

      var dA = parsearISO(fA_str);
      var dB = parsearISO(fB_str);

      function getPriority(date) {
          if (!date) return 3;
          var t = date.getTime();
          var hoyT = hoy.getTime();
          if (t === hoyT) return 1;
          if (t > hoyT) return 2;
          return 4;
      }

      var prioA = getPriority(dA);
      var prioB = getPriority(dB);
      if (prioA !== prioB) return prioA - prioB;

      // Dentro del mismo grupo: más próximo primero (ascendente)
      if (dA && dB) return dA.getTime() - dB.getTime();
      if (dA) return -1;
      if (dB) return 1;
      return 0;
  });

  // Textos que esperan resultado en m\u00e1s de un concurso
  var fcPorTexto = {}, totalEsp = 0, totalG = 0, totalF = 0, totalM = 0;
  allEntries.forEach(function (en) {
      var i = en.id.$t.split('.page-')[1] || en.id.$t.split('.post-')[1];
      if (getEstado(i) !== 2) return;
      var rr = getRes(i);
      if (rr.r || !rr.x) return;
      var n = fcNormTitulo(rr.x);
      (fcPorTexto[n] = fcPorTexto[n] || []).push({ id: i, nombre: fcNombreCorto(en.title.$t) });
  });

  allEntries.forEach(entry => {
      var id = entry.id.$t.split('.page-')[1] || entry.id.$t.split('.post-')[1];
      var estado = getEstado(id);
      if(estado === 0) return;

      var fechaISO = localStorage.getItem('fav_fecha_' + id) || "";
      var d='--', m='--', y='----', claseV = '';
      
      if(fechaISO) {
          var partes = fechaISO.split('-');
          y = partes[0] || '----';
          m = (partes[1] || '--').padStart(2,'0');
          d = (partes[2] || '--').padStart(2,'0');
          var fObj = new Date(y, m-1, d); fObj.setHours(0,0,0,0);
          var diff = Math.floor((fObj - hoy)/86400000);
          
          if(fObj < hoy) {
              if (estado === 1) claseV = 'fc-vencido';   // en "ya particip\u00e9" lo vencido es lo normal
          } else if(estado === 1) { 
              if(diff === 0) { claseV = 'fc-hoy'; totalHoy++; }
              else if(diff > 0 && diff <= 7) { claseV = 'fc-semana'; totalSemana++; }
          }
      }

      var link = entry.link.find(l => l.rel === 'alternate')?.href || '#';
      var favI = `<button type="button" class="icon-circle icon-fav ${estado===1?'active':''}" data-id="${id}" onclick="toggleFav(this)" aria-pressed="${estado===1}" aria-label="${estado===1 ? 'Quitar de favoritos' : 'Agregar a favoritos'}" title="${estado===1 ? 'Quitar de favoritos' : 'Agregar a favoritos'}"><i class="fa-solid fa-heart" aria-hidden="true"></i></button>`;
	  var partI = `<button type="button" class="icon-circle icon-part ${estado===2?'active':''}" data-id="${id}" onclick="togglePart(this)" aria-pressed="${estado===2}" aria-label="${estado===2 ? 'Quitar de listos' : 'Marcar como que ya has participado'}" title="${estado===2 ? 'Quitar de listos' : 'Marcar como que ya has participado'}"><i class="fa-solid fa-check" aria-hidden="true"></i></button>`;
      
      var resHTML = '';
      if (estado === 2) {
          var res = getRes(id);
          var otros = (res.x && !res.r) ? (fcPorTexto[fcNormTitulo(res.x)] || []).filter(function (o) { return o.id !== id; }).map(function (o) { return o.nombre; }) : [];
          resHTML = fcResHTML(id, res, otros);
          if (!res.r) totalEsp++; else if (res.r === 'g') totalG++; else if (res.r === 'f') totalF++; else if (res.r === 'm') totalM++;
      }
      var itemHTML = `
      <div class="fav-linea ${claseV}${estado === 2 ? ' fav-part' : ''}">
        <div class="dayStyle">${d}/${m}<br><small>${y}</small></div>
        <div class="titulo-concurso">
          <a href="${link}" class="link-nombre">${fcNombreCorto(entry.title.$t)}</a>
          <div class="spacer"></div>
          <a href="${link}" target="_blank" class="external-link"><i class="fa-solid fa-up-right-from-square"></i></a>
        </div>
        <div class="acciones-linea">${favI}${partI}</div>
        ${resHTML}
      </div>`;

      if(estado === 1) { favHTML += itemHTML; totalFav++; }
      else { partHTML += itemHTML; totalPart++; }
  });

  document.getElementById("lista-favoritos").innerHTML = favHTML || htmlVacio();
  document.getElementById("lista-participados").innerHTML = partHTML || "<p>No has participado en concursos todavía, ¡envía ese manuscrito, no seas tímido!</p>";

  var st = '';
  if(totalFav > 0) st += `<div class="stat-badge stat-total"><i class="fa-brands fa-gratipay"></i> ${totalFav} ${totalFav === 1 ? 'guardado' : 'guardados'}</div>`;
	if(totalHoy > 0) st += `<div class="stat-badge stat-hoy"><i class="fa-solid fa-fire-flame-curved"></i> ${totalHoy} ${totalHoy === 1 ? 'vence hoy' : 'vencen hoy'}</div>`;
	if(totalSemana > 0) st += `<div class="stat-badge stat-semana"><i class="fa-solid fa-calendar-week"></i> ${totalSemana} ${totalSemana === 1 ? 'vence esta semana' : 'vencen esta semana'}</div>`;
	if(totalPart > 0) st += `<div class="stat-badge stat-part"><i class="fa-solid fa-circle-check"></i> ${totalPart} ${totalPart === 1 ? 'enviado' : 'enviados'}</div>`;
	if(totalEsp > 0) st += `<div class="stat-badge stat-esp">${totalEsp} esperando resultado</div>`;
	if(totalG > 0) st += `<div class="stat-badge stat-g"><i class="fas fa-trophy"></i> ${totalG} ${totalG === 1 ? 'ganado' : 'ganados'}</div>`;
	if(totalF > 0) st += `<div class="stat-badge stat-f"><i class="fas fa-award"></i> ${totalF} ${totalF === 1 ? 'finalista' : 'finalistas'}</div>`;
	if(totalM > 0) st += `<div class="stat-badge stat-m">${totalM} ${totalM === 1 ? 'menci\u00f3n' : 'menciones'}</div>`;
  document.getElementById("fav-stats").innerHTML = st;

  actualizarTarjetaBoletin(totalFav + totalPart);
  montarAnuncio(totalFav + totalPart);
}

function filtrarFavoritos() {
    var query = document.getElementById("buscadorFavoritos").value.toLowerCase();
    document.querySelectorAll(".fav-linea").forEach(l => {
        l.style.display = l.innerText.toLowerCase().includes(query) ? "" : "none";
    });
}

// --- Funciones de Limpieza con Mensajes de Conteo ---
function limpiarVencidos() {
    var contador = 0;
    var aEliminar = [];
    for(var i=0; i<localStorage.length; i++){
        var k = localStorage.key(i);
        if(k.startsWith('fav_fecha_')){
            var id = k.replace('fav_fecha_','');
            if(getEstado(id) === 1){
                var f = new Date(localStorage.getItem(k) + "T00:00:00");
                if(f < hoy) { aEliminar.push(k, 'fav_'+id); contador++; }
            }
        }
    }
    if (contador > 0) {
        alert("Se eliminarán " + contador + " favoritos vencidos.");
        aEliminar.forEach(key => localStorage.removeItem(key));
        actualizarCookie();
        location.reload();
    } else {
        alert("No hay favoritos vencidos para limpiar.");
    }
}

function limpiarParticipados() {
    // Borra los "ya particip\u00e9" vencidos que no tienen nada que guardar: sin premio, o esperando
    // sin fecha de fallo futura. Nunca borra ganados, finalistas ni menciones (son tu historial).
    var contador = 0;
    var aEliminar = [];
    for(var i=0; i<localStorage.length; i++){
        var k = localStorage.key(i);
        if(k.startsWith('fav_fecha_')){
            var id = k.replace('fav_fecha_','');
            if(getEstado(id) === 2){
                var f = new Date(localStorage.getItem(k) + "T00:00:00");
                if(f < hoy) {
                    var res = getRes(id);
                    if (res.r === 'g' || res.r === 'f' || res.r === 'm') continue;
                    if (!res.r && res.l && new Date(res.l + "T00:00:00") >= hoy) continue;
                    aEliminar.push(id); contador++;
                }
            }
        }
    }
    if (contador > 0) {
        alert((contador === 1 ? "Se eliminar\u00e1 1 concurso vencido" : "Se eliminar\u00e1n " + contador + " concursos vencidos") + " sin premio o sin fallo pendiente. Los ganados, finalistas y menciones se conservan.");
        aEliminar.forEach(function (id) {
            localStorage.removeItem('fav_fecha_' + id); localStorage.removeItem('fav_' + id); fcResBorrar(id);
        });
        actualizarCookie();
        actualizarCookieRes();
        location.reload();
    } else {
        alert("No hay concursos vencidos para limpiar (los ganados, finalistas, menciones y los que esperan un fallo se conservan).");
    }
}

// Si el navegador vaci\u00f3 localStorage (Safari lo hace tras 7 d\u00edas sin visitas, o al borrar datos del sitio),
// se recupera lo guardado desde las cookies de respaldo antes de armar las listas.
function fcRestaurarDesdeCookies() {
  try {
    var hay = false;
    for (var i = 0; i < localStorage.length; i++) { if (localStorage.key(i).indexOf('fav_') === 0) { hay = true; break; } }
    if (hay) return;
    var c = leerRespaldoCookie();
    if (!c) return;
    Object.keys(c.favs || {}).forEach(function (id) { localStorage.setItem('fav_' + id, '1'); });
    Object.keys(c.participados || {}).forEach(function (id) { localStorage.setItem('fav_' + id, '2'); });
    Object.keys(c.fechas || {}).forEach(function (id) {
      if (localStorage.getItem('fav_' + id) && /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(c.fechas[id])) localStorage.setItem('fav_fecha_' + id, c.fechas[id]);
    });
    var r = leerRespaldoRes();
    Object.keys(r).forEach(function (id) { getRes(id); });   // getRes copia resultado y fallo de la cookie
  } catch (e) {}
}
if (!__fcFavoritosSkip) try {
fcRestaurarDesdeCookies();
} catch (e) { console.error('[fc-favoritos.js bloque 1]', e); }
if (!__fcFavoritosSkip) try {
window.addEventListener('DOMContentLoaded', identificarFavoritos);
} catch (e) { console.error('[fc-favoritos.js bloque 1]', e); }
  
function generarCodigoFavs(){

  var data = {};

  for (var i=0;i<localStorage.length;i++){
    var k = localStorage.key(i);
    if(k.startsWith("fav_")){
      data[k] = localStorage.getItem(k);
    }
  }

  if(Object.keys(data).length===0){
    if(typeof mostrarToast==="function")
      mostrarToast("Aún no tienes concursos guardados","warning");
    return;
  }

  // convertir a base64 robusto UTF8
  var json = JSON.stringify(data);
  var bytes = new TextEncoder().encode(json);
  var binary = "";
  bytes.forEach(b => binary += String.fromCharCode(b));
  var b64 = btoa(binary);

  var codigo = "FCFAVS:" + b64;

  navigator.clipboard.writeText(codigo).then(()=>{
      if(typeof mostrarToast==="function")
        mostrarToast("Código copiado. Pégalo en otro dispositivo para recuperar tus concursos","success");
  }).catch(()=>{
      if(typeof mostrarToast==="function")
        mostrarToast("No se pudo copiar automáticamente. Revisa la consola","warning");
      console.log(codigo);
  });
}
function importarCodigoFavs(){

  var campo = document.getElementById("campoCodigoFavs");
  if(!campo) return;

  var codigo = campo.value.trim();

  if(!codigo){
    if(typeof mostrarToast==="function")
      mostrarToast("Pega primero tu código","warning");
    return;
  }

  if(!codigo.startsWith("FCFAVS:")){
    if(typeof mostrarToast==="function")
      mostrarToast("El código no es válido","warning");
    return;
  }

  try{

    var b64 = codigo.replace("FCFAVS:","");

    // decode base64 robusto UTF8
    var binary = atob(b64);
    var bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
    var json = new TextDecoder().decode(bytes);

    var data = JSON.parse(json);

    var nuevos=0, mejorados=0;

    Object.keys(data).forEach(k=>{

      var incoming = data[k];
      var actual = localStorage.getItem(k);

      if(actual===null){
        localStorage.setItem(k,incoming);
        nuevos++;
        return;
      }

      // estados fav vs participado
      if(k.startsWith("fav_") && !k.startsWith("fav_fecha_")){
        var a=parseInt(actual||"0",10);
        var b=parseInt(incoming||"0",10);
        if(b>a){
          localStorage.setItem(k,incoming);
          mejorados++;
        }
      }

      // fechas
      if(k.startsWith("fav_fecha_") && !actual){
        localStorage.setItem(k,incoming);
      }

    });

    actualizarCookie();

    if(typeof mostrarToast==="function"){
      if(nuevos===0 && mejorados===0){
        mostrarToast("No había concursos nuevos en el código","warning");
      }else{
        mostrarToast("Concursos recuperados correctamente","success");
      }
    }

    setTimeout(()=>location.reload(),900);

  }catch(e){
    if(typeof mostrarToast==="function")
      mostrarToast("El código está incompleto o dañado","warning");
  }
}

/* ── bloque 2/2 · resumen y avisos ── */
if (!__fcFavoritosSkip) try {
(function() {
  'use strict';

  var hoy = new Date(); hoy.setHours(0,0,0,0);

  // ── 1. Recopilar IDs guardados ─────────────────────────────────────────────
  var savedIds = [];
  for (var i = 0; i < localStorage.length; i++) {
    var k = localStorage.key(i);
    if (k.startsWith('fav_') && !k.startsWith('fav_fecha_')) {
      var id = k.replace('fav_', '');
      var estado = parseInt(localStorage.getItem(k) || '0', 10);
      if (estado === 1 || estado === 2) savedIds.push(id);
    }
  }
  if (savedIds.length === 0) return;

  // ── 2. Helpers ─────────────────────────────────────────────────────────────
  function limpiarTexto(str) {
    if (!str) return '';
    return str.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
  }

  function tokenizar(str) {
    var stop = ['de','la','el','en','y','a','los','del','las','para','por','con','un','una','que','al','se','o','es','i','ii','iii','iv','v','vi','vii'];
    return limpiarTexto(str).split(/[\s,\/\-\(\)]+/).filter(function(w) {
      return w.length > 3 && stop.indexOf(w) === -1;
    });
  }

  function extraerTabla(html, clave) {
    var re = new RegExp('<tr[^>]*>[\\s\\S]*?' + clave + '[\\s\\S]*?<\\/td>[\\s\\S]*?<td[^>]*>([^<]{1,120})<\\/td>', 'i');
    var m = html.match(re);
    return m ? m[1].trim() : '';
  }

  // Parsear data-fecha="dd/mm/yyyy" → Date o null
  function parsearFechaDataAttr(str) {
    if (!str) return null;
    var p = str.trim().split('/');
    if (p.length !== 3) return null;
    var dd = parseInt(p[0], 10);
    var mm = parseInt(p[1], 10);
    var aaaa = parseInt(p[2], 10);
    if (isNaN(dd) || isNaN(mm) || isNaN(aaaa)) return null;
    if (mm < 1 || mm > 12 || dd < 1 || dd > 31) return null;
    var d = new Date(aaaa, mm - 1, dd);
    d.setHours(0,0,0,0);
    return isNaN(d.getTime()) ? null : d;
  }

  // ── 3. Cargar metadata de guardados vía feed ───────────────────────────────
  var cargados = [];
  var pendientes = savedIds.length;

  function procesarEntrada(entry) {
    if (!entry) { pendientes--; if (pendientes === 0) buscarCandidatos(); return; }
    var texto = (entry.content && entry.content.$t) ? entry.content.$t :
                (entry.summary && entry.summary.$t) ? entry.summary.$t : '';
    var pais    = limpiarTexto(extraerTabla(texto, 'map-marker'));
    var generos = limpiarTexto(extraerTabla(texto, 'fa-tags'));
    cargados.push({
      palabras: tokenizar(entry.title.$t + ' ' + pais + ' ' + generos),
      pais:    pais,
      generos: generos
    });
    pendientes--;
    if (pendientes === 0) buscarCandidatos();
  }

  savedIds.forEach(function(id) {
    var cb = '_rfav_' + id;
    window[cb] = function(json) {
      delete window[cb];
      procesarEntrada(json && json.entry ? json.entry : null);
    };
    var s = document.createElement('script');
    s.src = '/feeds/pages/summary/' + id + '?alt=json-in-script&callback=' + cb;
    s.onerror = function() { pendientes--; if (pendientes === 0) buscarCandidatos(); };
    document.body.appendChild(s);
  });

  // ── 4. Buscar candidatos en el feed ────────────────────────────────────────
  function buscarCandidatos() {
    if (cargados.length === 0) { ocultarLoader(); return; }

    var pool = {};
    cargados.forEach(function(e) {
      e.palabras.forEach(function(w) { pool[w] = (pool[w] || 0) + 1; });
      if (e.pais)    pool[e.pais]    = (pool[e.pais]    || 0) + 3;
      if (e.generos) pool[e.generos] = (pool[e.generos] || 0) + 3;
    });

    var señales = Object.keys(pool)
      .sort(function(a,b){ return pool[b]-pool[a]; })
      .filter(function(w){ return w.length > 3; })
      .slice(0, 2);

    if (señales.length === 0) { ocultarLoader(); return; }

    var cb = '_rbus_' + Date.now();
    window[cb] = function(json) {
      delete window[cb];
      puntuar(json, pool);
    };
    var s = document.createElement('script');
    s.src = '/feeds/pages/default?alt=json-in-script&max-results=50&q=' +
            encodeURIComponent(señales.join(' ')) + '&callback=' + cb;
    document.body.appendChild(s);
  }

  // ── 5. Puntuar y seleccionar top candidatos ────────────────────────────────
  function puntuar(json, pool) {
    if (!json || !json.feed || !json.feed.entry) { ocultarLoader(); return; }

    var candidatos = [];
    json.feed.entry.forEach(function(entry) {
      var link = '';
      for (var i = 0; i < entry.link.length; i++) {
        if (entry.link[i].rel === 'alternate') { link = entry.link[i].href; break; }
      }
      if (!link || link.indexOf('/p/cl-') === -1) return;

      var id = (entry.id.$t.split('.page-')[1] || entry.id.$t.split('.post-')[1] || '').trim();
      if (savedIds.indexOf(id) !== -1) return;

      var score = 0;
      tokenizar(entry.title.$t).forEach(function(t) { if (pool[t]) score += pool[t]; });
      if (score === 0) return;

      candidatos.push({ titulo: fcNombreCorto(entry.title.$t), link: link, score: score });
    });

    candidatos.sort(function(a,b){ return b.score - a.score; });
    // Tomar top 12 para verificar fechas; de ahí saldrán los 6 vigentes
    verificarFechas(candidatos.slice(0, 12));
  }

  // ── 6. Fetchear cada candidato y leer data-fecha del link-agendar ──────────
  function verificarFechas(candidatos) {
    if (candidatos.length === 0) { ocultarLoader(); return; }

    var vigentes = [];
    var restantes = candidatos.length;

    candidatos.forEach(function(c) {
      fetch(c.link)
        .then(function(r) { return r.text(); })
        .then(function(html) {
          // Buscar data-fecha en cualquier <a class="link-agendar">
          var re = /link-agendar[^>]*data-fecha="([^"]+)"/;
          // También capturar si data-fecha viene antes de la clase
          var re2 = /data-fecha="([^"]+)"[^>]*link-agendar/;
          var m = html.match(re) || html.match(re2);
          if (m) {
            var fecha = parsearFechaDataAttr(m[1]);
            if (fecha && fecha >= hoy) {
              c.fechaCierre = m[1]; // guardar para mostrar
              vigentes.push(c);
            }
          }
        })
        .catch(function() { /* ignorar errores de red */ })
        .finally(function() {
          restantes--;
          if (restantes === 0) renderRecomendaciones(vigentes.slice(0, 6));
        });
    });
  }

  // ── 7. Render ──────────────────────────────────────────────────────────────
  function renderRecomendaciones(items) {
    var section = document.getElementById('recomendaciones-section');
    var lista   = document.getElementById('lista-recomendaciones');
    if (!lista) return;

    if (items.length === 0) {
      lista.innerHTML = '<p style="font-size:13px;color:#aaa;">No encontramos recomendaciones vigentes en este momento.</p>';
    } else {
      var html = '';
      items.forEach(function(item) {
        var dayBlock = '';
        if (item.fechaCierre) {
          var p = item.fechaCierre.split('/');
          var dd = (p[0] || '--').padStart(2,'0');
          var mm = (p[1] || '--').padStart(2,'0');
          var aaaa = p[2] || '----';
          dayBlock = '<div class="dayStyle">' + dd + '/' + mm + '<br><small>' + aaaa + '</small></div>';
        }
        html += '<div class="fav-linea">' +
          dayBlock +
          '<div class="titulo-concurso">' +
            '<a class="link-nombre" href="' + item.link + '">' + item.titulo + '</a>' +
            '<div class="spacer"></div>' +
            '<a href="' + item.link + '" target="_blank" class="external-link"><i class="fa-solid fa-up-right-from-square"></i></a>' +
          '</div>' +
        '</div>';
      });
      lista.innerHTML = html;
      section.style.display = 'block';
    }
  }

  function ocultarLoader() {
    var lista = document.getElementById('lista-recomendaciones');
    if (lista) lista.innerHTML = '';
  }

})();
} catch (e) { console.error('[fc-favoritos.js bloque 2]', e); }

/* ── clics que llegaron antes de que cargara este archivo (los guarda el stub inline del tema) ── */
if (window.fcFlushQ) { try { window.fcFlushQ(); } catch (e) { console.error(e); } }
