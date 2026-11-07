/*! finalescerrados.com · fc-core.js · fc-assets v10.16 · bloques que antes estaban inline en theme-parcheado.xml (2026-11-07).
   Cada sentencia ejecutable va en su propio try/catch: si un bloque falla, los demás siguen corriendo (como cuando eran <script> separados). */

/* ── bloque 1/11 · antes en la línea 4900 del tema · // La posición del toast-container es fija por CSS (según altura de la barra anc ── */
//
// La posición del toast-container es fija por CSS (según altura de la barra anchor-ad
// por breakpoint: mobile 110px / tablet 100px / desktop 130px). No hace falta medir
// la barra en runtime ni observarla con MutationObserver.
// destino (opcional): URL o función. Si viene, el toast es clickeable (con flecha ›)
// y dura un poco más; sin destino se comporta igual que siempre.
try {
window.mostrarToast = function(mensaje, tipo, destino) {
  if (!tipo) tipo = 'info';
  var container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  var t = document.createElement('div');
  t.className = 'toast ' + tipo;
  t.textContent = mensaje;
  if (destino) {
    t.className += ' toast-link';
    t.setAttribute('role', 'link');
    t.tabIndex = 0;
    var ir = document.createElement('span');
    ir.className = 'toast-ir';
    ir.setAttribute('aria-hidden', 'true');
    ir.textContent = '\u203a';
    t.appendChild(ir);
    var abrir = function() {
      if (typeof destino === 'function') { destino(); quitar(); }
      else window.location.href = destino;
    };
    t.addEventListener('click', abrir);
    t.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); abrir(); }
    });
  }
  container.appendChild(t);
  requestAnimationFrame(function() {
    requestAnimationFrame(function() { t.classList.add('show'); });
  });
  var quitar = function() {
    t.classList.remove('show');
    setTimeout(function() {
      if (t.parentNode) t.parentNode.removeChild(t);
    }, 350);
  };
  setTimeout(quitar, destino ? 8000 : 5000);
};
} catch (e) { console.error('[fc-core.js bloque 1]', e); }
//

/* ── bloque 2/11 · antes en la línea 4953 del tema · let customshare_url = ''; ── */
//
let customshare_url = '';
let customshare_title = '';

function customshare_toggle(button) {
  const popup = document.getElementById('customshare-popup');
  if (popup.style.display === 'block') {
    popup.style.display = 'none';
    return;
  }
  // Modal centrado fijo (sin cálculos de posición)
  popup.style.display = 'block';
  popup.style.position = 'fixed';
  popup.style.top = '50%';
  popup.style.left = '50%';
  popup.style.transform = 'translate(-50%, -50%)';
  popup.style.zIndex = '99999';
  popup.style.maxWidth = '90vw';
  popup.style.width = 'auto';
  popup.style.boxShadow = '0 8px 30px rgba(0,0,0,0.3)';
  popup.style.borderRadius = '8px';
  popup.style.background = '#fff';
  popup.style.padding = '8px';
  
  customshare_url = encodeURIComponent(button.getAttribute('data-url'));
  customshare_title = encodeURIComponent(button.getAttribute('data-title'));
}

function customshare_share(event, network) {
  event.preventDefault();
  let shareUrl = '';
  if (network === 'facebook') {
    shareUrl = 'https://www.facebook.com/sharer/sharer.php?u=' + customshare_url;
  } else if (network === 'twitter') {
    shareUrl = 'https://twitter.com/intent/tweet?url=' + customshare_url + '&text=' + customshare_title;
  } else if (network === 'linkedin') {
    shareUrl = 'https://www.linkedin.com/sharing/share-offsite/?url=' + customshare_url;
  } else if (network === 'whatsapp') {
    shareUrl = 'https://api.whatsapp.com/send?text=' + customshare_title + '%20' + customshare_url;
  } else if (network === 'telegram') {
    shareUrl = 'https://t.me/share/url?url=' + customshare_url + '&text=' + customshare_title;
  } else if (network === 'email') {
    shareUrl = 'mailto:?subject=' + customshare_title + '&body=' + customshare_title + '%0A' + customshare_url;
  } else if (network === 'messenger') {
    shareUrl = 'fb-messenger://share/?link=' + customshare_url;
  }
  window.open(shareUrl, '_blank', 'width=600,height=500');
}

function customshare_copy(event) {
  event.preventDefault();
  navigator.clipboard.writeText(decodeURIComponent(customshare_url)).then(function () {
    mostrarToast('Enlace copiado al portapapeles', 'success');
  });
}

// Cerrar popup al hacer clic fuera
try {
document.addEventListener('click', function(event) {
  const popup = document.getElementById('customshare-popup');
  if (!popup) return;
  if (popup.style.display !== 'block') return;
  if (popup.contains(event.target)) return;
  const buttons = document.querySelectorAll('.customshare-btn, .customshare-concurso-btn');
  for (let btn of buttons) {
    if (btn.contains(event.target)) return;
  }
  popup.style.display = 'none';
}, true);
} catch (e) { console.error('[fc-core.js bloque 2]', e); }
//

/* ── bloque 3/11 · antes en la línea 5037 del tema · document.addEventListener('DOMContentLoaded', function() { ── */
  try {
document.addEventListener('DOMContentLoaded', function() {
    let ipzScriptLoaded = false;
    let loadingIpzScript = false;

    const ipzButtons = document.querySelectorAll('.ipz-button');

    ipzButtons.forEach(button => {
      button.addEventListener('click', function(event) {
        event.preventDefault(); // Previene la acción por defecto del enlace/botón

        const clickedButton = this;

        if (!ipzScriptLoaded && !loadingIpzScript) {
          loadingIpzScript = true;
          const script = document.createElement('script');
          script.src = 'https://assets.ipzmarketing.com/assets/signup_form/v1.js';
          script.id = 'ipz-marketing-global-script';
          script.defer = true;
          script.async = true;
          document.body.appendChild(script);

          script.onload = () => {
            ipzScriptLoaded = true;
            loadingIpzScript = false;
            // Después de cargar el script, abrimos la URL del formulario.
            // Si el script de IPZ Marketing tiene un comportamiento de popup por sí mismo
            // y no queremos este window.open, esta parte debería ser más sofisticada.
            // Pero para garantizar que el formulario se abra y la optimización funcione,
            // esta es la forma más directa.
            const dataHost = clickedButton.getAttribute('data-host');
            const dataProtocol = clickedButton.getAttribute('data-protocol');
            const dataToken = clickedButton.getAttribute('data-token');
            const formUrl = `${dataProtocol}://${dataHost}/f/${dataToken}`;
            window.open(formUrl, clickedButton.getAttribute('target') || '_self');
          };

          script.onerror = () => {
            loadingIpzScript = false;
            // Fallback si el script falla al cargar: también abrir en nueva ventana
            const dataHost = clickedButton.getAttribute('data-host');
            const dataProtocol = clickedButton.getAttribute('data-protocol');
            const dataToken = clickedButton.getAttribute('data-token');
            const formUrl = `${dataProtocol}://${dataHost}/f/${dataToken}`;
            window.open(formUrl, clickedButton.getAttribute('target') || '_self');
          };

        } else {
            // Si el script ya está cargado (o se está cargando), abre directamente la ventana.
            // Esto asegura que el botón siempre funcione, incluso si no logramos el popup.
            const dataHost = clickedButton.getAttribute('data-host');
            const dataProtocol = clickedButton.getAttribute('data-protocol');
            const dataToken = clickedButton.getAttribute('data-token');
            const formUrl = `${dataProtocol}://${dataHost}/f/${dataToken}`;
            window.open(formUrl, clickedButton.getAttribute('target') || '_self');
        }
      });
    });
  });
} catch (e) { console.error('[fc-core.js bloque 3]', e); }

/* ── bloque 4/11 · antes en la línea 5255 del tema · (function () { ── */
//
try {
(function () {
  // ===========================================================
  // FC MONETIZACION v2: popups (cafe / Antemeridiano) con dos perfiles segun
  // el visitante tenga o no bloqueador de anuncios, memoria de aportes y
  // medicion de eventos via Zaraz.
  //
  // Eventos (zaraz.track, propiedades planas; todos llevan pagina_tipo, perfil y bloqueador):
  //   popup_mostrado   {tipo, disparo, aparicion, segundos_sesion, n_sesion, contexto, variante}
  //   popup_pospuesto  {tipo, motivo}
  //   popup_cerrado    {tipo}
  //   cta_clic         {cta, ubicacion}
  //   aporte_confirmado{origen_cta, origen_ubicacion, origen_pagina_tipo, horas_desde_clic}
  // ===========================================================

  var DIA = 24 * 60 * 60 * 1000;

  // ---------- Perfiles ----------
  // relajado: visitante con anuncios (ya paga con anuncios, viñetas y Offerwall).
  // agresivo: visitante con bloqueador (no genera ingresos de AdSense).
  // umbral = segundos VISIBLES acumulados en la sesion.
  // exitDesde = segundos desde los que la salida del cursor puede disparar el popup
  //             (null = no adelanta nada: exige el mismo umbral que el temporizador).
  // separacion = segundos minimos entre un popup y el siguiente de la misma sesion.
  var PERFILES = {
    relajado: {
      umbral: { cafe: 180, antemeridiano: 300 },
      exitDesde: null,
      maxPorSesion: 1,
      separacion: 0,
      factorCooldown: 1
    },
    agresivo: {
      umbral: { cafe: 60, antemeridiano: 120 },
      exitDesde: 30,
      maxPorSesion: 2,
      separacion: 120,
      factorCooldown: 0.5
    }
  };

  var COOLDOWN_BASE = { cafe: 1 * DIA, antemeridiano: 7 * DIA };
  var COOLDOWN_MAX  = { cafe: 30 * DIA, antemeridiano: 60 * DIA };
  var COOLDOWN_DISMISS = 7 * DIA;
  var DIAS_REINICIO = 60 * DIA;
  var SILENCIO_CAFE_APORTANTE = 120 * DIA; // quien paso por la pagina de gracias no ve el popup de cafe en este lapso
  var GRACIAS_PATH = '/p/gracias-por-tu-aporte.html';

  var MIN_EN_PAGINA_MS = 5000;     // nunca antes de 5 s de haber cargado la pagina
  var TRAS_CAPA_MS = 15000;        // espera tras ver desaparecer una capa ajena (viñeta, Offerwall, menu, etc.)
  var REINTENTOS_MAX = 12;         // 12 x 5 s y desiste en esta pagina (sin gastar cooldown)
  var REINTENTO_MS = 5000;
  var DETECCION_BLOQUEADOR_MS = 20000; // si el script de AdSense fue inyectado y no cargo en 20 s, se asume bloqueador
  var AREA_CAPA = 0.2;             // una capa fija que cubra >=20% de la pantalla cuenta como "otro elemento en pantalla"

  // Capas de Google que NO deben pisarse. Verificar en DevTools cuando aparezca cada una.
  var SELECTORES_OVERLAY_GOOGLE = [
    '.fc-ab-root',                        // Funding Choices: recuperacion de bloqueo
    '.fc-consent-root',                   // Funding Choices: consentimiento
    '.fc-dialog-container',
    '.fc-dialog-overlay',
    '.fc-monetization-dialog-container'   // Offerwall (a confirmar)
  ];

  var T0 = Date.now();
  var tiempo = 0; // segundos visibles acumulados en la sesion

  // ---------- Storage seguro ----------
  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, String(v)); } catch (e) {} }
  function ssGet(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }
  function ssSet(k, v) { try { sessionStorage.setItem(k, String(v)); } catch (e) {} }

  // ---------- Tipo de pagina ----------
  function tipoPagina() {
    var p = location.pathname;
    if (p === '/' || p === '') return 'home';
    if (/^\/\d{4}\/\d{2}\/.+\.html$/.test(p)) return 'post';
    if (p.indexOf('/p/cl-') === 0) return 'cl';
    if (p.indexOf('/p/concursos') === 0) return 'concursos';
    if (p.indexOf('/p/') === 0) return 'pagina';
    return 'otro';
  }

  // ---------- Deteccion de bloqueador ----------
  // true = bloqueador, false = anuncios cargan, null = sin datos todavia (se trata como relajado).
  // Señales: (0) aviso rojo del anchor mostrado (window.fcAdblock) => bloqueador;
  //          (1) adsbygoogle.loaded === true => no hay bloqueo;
  //          (2) el <script> de AdSense existe en el DOM y 20 s despues no cargo => bloqueo de red;
  //          (3) un elemento "señuelo" quedo oculto por filtros cosmeticos => bloqueo.
  // Se guarda por sesion (sessionStorage) para no repetir la deteccion en cada pagina.
  var bait = null;
  function crearBait() {
    try {
      bait = document.createElement('div');
      bait.className = 'adsbox ad-banner textads banner-ads pub_300x250';
      bait.style.cssText = 'position:absolute;left:-9999px;top:-9999px;width:10px;height:10px;';
      bait.innerHTML = '&nbsp;';
      (document.body || document.documentElement).appendChild(bait);
    } catch (e) { bait = null; }
  }
  var estadoBloq = (function () { var v = ssGet('fc_bloq'); return v === '1' ? true : (v === '0' ? false : null); })();
  function bloqueador() {
    if (window.FC && window.FC.sinAds) return false; // aportó un café: no se le cargan anuncios a propósito
    // El aviso rojo del anchor (window.fcAdblock) tiene prioridad: quien lo ve recibe el perfil agresivo.
    if (window.fcAdblock === true && estadoBloq !== true) { estadoBloq = true; ssSet('fc_bloq', '1'); }
    if (estadoBloq !== null) return estadoBloq;
    var ag = window.adsbygoogle;
    var res = null;
    if (ag && ag.loaded === true) {
      res = false;
    } else {
      if (bait && Date.now() - T0 > 1500) {
        var cs = null;
        try { cs = window.getComputedStyle(bait); } catch (e) {}
        if (bait.offsetHeight === 0 || (cs && (cs.display === 'none' || cs.visibility === 'hidden'))) res = true;
      }
      if (res === null && Date.now() - T0 >= DETECCION_BLOQUEADOR_MS &&
          document.querySelector('script[src*="adsbygoogle.js"]')) res = true;
    }
    if (res !== null) { estadoBloq = res; ssSet('fc_bloq', res ? '1' : '0'); }
    return res;
  }
  function perfilActual() { return bloqueador() === true ? PERFILES.agresivo : PERFILES.relajado; }
  function nombrePerfil() { return bloqueador() === true ? 'agresivo' : 'relajado'; }
  function etiquetaBloq() { var b = bloqueador(); return b === true ? 'si' : (b === false ? 'no' : 'desconocido'); }

  // ---------- Medicion (Zaraz) ----------
  var cola = [];
  var intentosZaraz = 0;
  function vaciarCola() {
    if (typeof zaraz !== 'undefined' && zaraz && typeof zaraz.track === 'function') {
      while (cola.length) {
        var ev = cola.shift();
        try { zaraz.track(ev[0], ev[1]); } catch (e) {}
      }
      return;
    }
    if (cola.length && intentosZaraz++ < 40) setTimeout(vaciarCola, 1500);
  }
  function fcTrack(nombre, props) {
    props = props || {};
    if (!props.pagina_tipo) props.pagina_tipo = tipoPagina();
    props.perfil = nombrePerfil();
    props.bloqueador = etiquetaBloq();
    cola.push([nombre, props]);
    vaciarCola();
  }
  window.fcTrack = fcTrack;

  function ubicacionDe(a) {
    if (a.closest('.fc-popup-overlay')) return 'popup';
    if (a.closest('.recuadrocafe')) return 'recuadro';
    if (a.closest('.fav-aviso')) return 'favoritos_participe';
    if (a.closest('.ab3')) return 'widget_libro';
    if (a.closest('.libros-lista')) return 'lista_libros';
    if (a.closest('header, nav, #menu-primary')) return 'menu';
    return 'otro';
  }
  document.addEventListener('click', function (e) {
    var t = e.target;
    var a = (t && t.closest) ? t.closest('a.cafe, a.antemeridiano_venta') : null;
    if (!a) return;
    var cta = a.classList.contains('cafe') ? 'cafe' : 'libro';
    var ubic = ubicacionDe(a);
    lsSet('fc_last_cta', JSON.stringify({ cta: cta, ubicacion: ubic, pagina_tipo: tipoPagina(), ts: Date.now() }));
    fcTrack('cta_clic', { cta: cta, ubicacion: ubic });
  }, true);

  // ---------- Contexto del popup ----------
  // El contexto depende solo de la pagina donde esta el visitante cuando se dispara el popup:
  //   concursos  -> guia de concursos: listados, fichas, favoritos y publicar un concurso
  //   escritores -> apps para escritores
  //   lectura    -> cualquier post (tambien los de la etiqueta "Concursos literarios": es un lector del blog)
  //   general    -> home y demas paginas (incluidas las de etiquetas)
  var APPS_ESCRITORES = ['/p/editor-de-texto-online.html', '/p/corrector-ortografico.html',
    '/p/contador-de-palabras-y-caracteres-online.html', '/p/constructor-de-tramas.html',
    '/p/generador-de-personajes.html', '/p/verificador-de-originalidad-de-titulos.html'];
  function esPaginaConcursos() {
    var tp = tipoPagina();
    var p = location.pathname;
    return tp === 'cl' || tp === 'concursos' || p.indexOf('/p/mis-concursos') === 0 || p.indexOf('/p/publicar-un-conc') === 0;
  }
  function esPaginaApp() { return APPS_ESCRITORES.indexOf(location.pathname) !== -1; }
  var ctxCache = null;
  function contextoPopup() {
    if (ctxCache) return ctxCache;
    if (esPaginaConcursos()) ctxCache = 'concursos';
    else if (esPaginaApp()) ctxCache = 'escritores';
    else ctxCache = tipoPagina() === 'post' ? 'lectura' : 'general';
    return ctxCache;
  }

  // ---------- Movil: deslizar la hoja hacia abajo para cerrar ----------
  // Solo con pantalla <=600 px (en tablet/escritorio el popup es un cuadro centrado y esto no corre).
  (function () {
    var mq = window.matchMedia ? window.matchMedia('(max-width: 600px)') : null;
    var UMBRAL = 90; // px arrastrados para cerrar
    var card = null, y0 = 0, dy = 0, arrastrando = false;
    document.addEventListener('touchstart', function (e) {
      if (!mq || !mq.matches || e.touches.length !== 1) return;
      var c = e.target && e.target.closest ? e.target.closest('.fc-popup-overlay.is-visible .fc-popup-card') : null;
      if (!c || c.scrollTop > 0) return;
      card = c; y0 = e.touches[0].clientY; dy = 0; arrastrando = false;
    }, { passive: true });
    document.addEventListener('touchmove', function (e) {
      if (!card) return;
      dy = e.touches[0].clientY - y0;
      if (!arrastrando) {
        if (dy < 8) { if (dy < -8) card = null; return; } // hacia arriba: scroll normal
        arrastrando = true;
        card.style.transition = 'none';
      }
      if (e.cancelable) e.preventDefault();
      card.style.transform = 'translateY(' + Math.max(0, dy) + 'px)';
    }, { passive: false });
    function soltar() {
      if (!card) return;
      var c = card; card = null;
      if (!arrastrando) return;
      arrastrando = false;
      c.style.transition = 'transform .2s ease-out';
      if (dy > UMBRAL) {
        c.style.transform = 'translateY(110%)';
        var t = popupAbiertoTipo();
        setTimeout(function () {
          if (t) window.cerrarPopup(t);
          c.style.transition = ''; c.style.transform = '';
        }, 200);
      } else {
        c.style.transform = '';
        setTimeout(function () { c.style.transition = ''; }, 200);
      }
    }
    document.addEventListener('touchend', soltar);
    document.addEventListener('touchcancel', soltar);
  })();

  // Deja una sola variante de texto: elige al azar entre las del contexto
  // (data-var) y carga la tapa recien al mostrar.
  function prepararPopup(overlay) {
    if (!overlay || overlay.getAttribute('data-listo')) return;
    var ctx = contextoPopup();
    var vs = overlay.querySelectorAll('.fc-pop-v');
    var del = [];
    for (var i = 0; i < vs.length; i++) if (vs[i].getAttribute('data-ctx') === ctx) del.push(vs[i]);
    if (!del.length) {
      ctx = 'general';
      for (var k = 0; k < vs.length; k++) if (vs[k].getAttribute('data-ctx') === ctx) del.push(vs[k]);
    }
    var elegida = del.length ? del[Math.floor(Math.random() * del.length)] : null;
    if (elegida) overlay.setAttribute('data-var', elegida.getAttribute('data-var') || '1');
    for (var j = 0; j < vs.length; j++) {
      if (vs[j] !== elegida && vs[j].parentNode) vs[j].parentNode.removeChild(vs[j]);
    }
    var img = overlay.querySelector('img[data-src]');
    if (img) { img.src = img.getAttribute('data-src'); img.removeAttribute('data-src'); }
    overlay.setAttribute('data-listo', '1');
  }

  function popupAbiertoTipo() {
    var o = document.querySelector('.fc-popup-overlay.is-visible');
    if (!o) return null;
    return o.id === 'cafepopup-overlay' ? 'cafe' : (o.id === 'antemeridianopopup-overlay' ? 'antemeridiano' : null);
  }
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape' && e.key !== 'Esc') return;
    var t = popupAbiertoTipo();
    if (t) window.cerrarPopup(t);
  });
  document.addEventListener('click', function (e) {
    var o = e.target;
    if (!o || !o.classList || !o.classList.contains('fc-popup-overlay') || !o.classList.contains('is-visible')) return;
    var t = popupAbiertoTipo();
    if (t) window.cerrarPopup(t);
  });

  // ---------- Overlays del popup ----------
  function getOverlay(tipo) {
    if (tipo === 'antemeridiano') return document.getElementById('antemeridianopopup-overlay');
    if (tipo === 'cafe') return document.getElementById('cafepopup-overlay');
    return null;
  }

  window.cerrarPopup = function (tipo) {
    var overlay = getOverlay(tipo);
    if (!overlay) return;
    overlay.classList.remove('is-visible');
    lsSet('fc_popup_dismissed_' + tipo, Date.now());
    fcTrack('popup_cerrado', { tipo: tipo });
  };

  window.interesPopup = function (tipo) {
    var keyCount = 'fc_popup_count_' + tipo;
    var count = parseInt(lsGet(keyCount) || '0', 10);
    if (count > 0) lsSet(keyCount, count - 1);
    var overlay = getOverlay(tipo);
    if (overlay) overlay.classList.remove('is-visible');
    try { localStorage.removeItem('fc_popup_dismissed_' + tipo); } catch (e) {}
  };

  // ---------- Aportes: la pagina de gracias es la unica senal ----------
  var esGracias = location.pathname === GRACIAS_PATH;
  if (esGracias) {
    var ahoraG = Date.now();
    var previo = parseInt(lsGet('fc_aporte_ts') || '0', 10);
    lsSet('fc_aporte_ts', ahoraG);
    if (!previo || ahoraG - previo > 10 * 60 * 1000) { // evita contar recargas
      var origen = {};
      try { origen = JSON.parse(lsGet('fc_last_cta') || '{}') || {}; } catch (e) { origen = {}; }
      fcTrack('aporte_confirmado', {
        origen_cta: origen.cta || 'desconocido',
        origen_ubicacion: origen.ubicacion || 'desconocido',
        origen_pagina_tipo: origen.pagina_tipo || 'desconocido',
        horas_desde_clic: origen.ts ? Math.round((ahoraG - origen.ts) / 36e5) : -1
      });
    }
    return; // ni popups ni timers en la pagina de gracias
  }

  function aportoReciente(ahora) {
    var t = parseInt(lsGet('fc_aporte_ts') || '0', 10);
    return !!t && (ahora - t) < SILENCIO_CAFE_APORTANTE;
  }

  // ---------- Elegibilidad (cooldowns por tipo) ----------
  function getCount(tipo) { return parseInt(lsGet('fc_popup_count_' + tipo) || '0', 10); }
  var KEY_LAST = { cafe: 'fc_popup_last_cafe', antemeridiano: 'fc_popup_last_antemeridiano' };

  function getCooldown(tipo, ahora) {
    var count = getCount(tipo);
    var last = lsGet(KEY_LAST[tipo]);
    if (last && (ahora - parseInt(last, 10) > DIAS_REINICIO)) {
      count = 0;
      lsSet('fc_popup_count_' + tipo, 0);
    }
    var base = Math.min(COOLDOWN_BASE[tipo] * Math.pow(2, count), COOLDOWN_MAX[tipo]);
    return base * perfilActual().factorCooldown;
  }

  function elegible(tipo, ahora) {
    if (tipo === 'cafe' && aportoReciente(ahora)) return false;
    var last = lsGet(KEY_LAST[tipo]);
    if (last && (ahora - parseInt(last, 10) < getCooldown(tipo, ahora))) return false;
    var desc = lsGet('fc_popup_dismissed_' + tipo);
    if (desc && (ahora - parseInt(desc, 10) < COOLDOWN_DISMISS)) return false;
    return true;
  }

  // ---------- "Hay algo mas en pantalla" ----------
  function esVisible(el) {
    if (!el) return false;
    try {
      var cs = window.getComputedStyle(el);
      if (cs && (cs.display === 'none' || cs.visibility === 'hidden')) return false;
    } catch (e) {}
    var r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  }

  function hayOverlayGoogle() {
    if (location.hash.indexOf('google_vignette') !== -1) return true; // viñeta de AdSense abierta
    for (var i = 0; i < SELECTORES_OVERLAY_GOOGLE.length; i++) {
      var nodos = document.querySelectorAll(SELECTORES_OVERLAY_GOOGLE[i]);
      for (var j = 0; j < nodos.length; j++) {
        if (esVisible(nodos[j])) return true;
      }
    }
    return false;
  }

  function hayPopupAbierto() {
    return !!document.querySelector('.fc-popup-overlay.is-visible');
  }

  // Deteccion generica, sin depender de nombres de clase: mira que hay realmente en
  // el centro y en la franja superior e inferior de la pantalla, y busca ancestros con
  // position:fixed que cubran una parte grande del viewport (menu movil, buscador, avisos
  // de OneSignal, consentimiento, etc.). Los popups propios se ignoran.
  function hayCapaSuperpuesta() {
    if (!document.elementsFromPoint) return false;
    var w = window.innerWidth || 0, h = window.innerHeight || 0;
    if (!w || !h) return false;
    var area = w * h;
    var puntos = [[w / 2, h / 2], [w / 2, h * 0.15], [w / 2, h * 0.85]];
    for (var p = 0; p < puntos.length; p++) {
      var els = document.elementsFromPoint(puntos[p][0], puntos[p][1]) || [];
      for (var i = 0; i < els.length; i++) {
        for (var n = els[i]; n && n !== document.body && n !== document.documentElement; n = n.parentElement) {
          if (n.id === 'anchor-ad-container') break; // barra fija de anuncio (o aviso rojo): no es una capa que tape la lectura
          if (n.classList && n.classList.contains('fc-popup-overlay')) break;
          var cs;
          try { cs = window.getComputedStyle(n); } catch (e) { continue; }
          if (!cs || cs.position !== 'fixed' || cs.display === 'none' || cs.visibility === 'hidden') continue;
          var r = n.getBoundingClientRect();
          if (r.width * r.height >= AREA_CAPA * area) return true;
        }
      }
    }
    return false;
  }

  var ultimaCapaTs = 0;
  function motivoBloqueo() {
    if (document.visibilityState !== 'visible') return 'pestana_oculta';
    if (hayPopupAbierto()) return 'popup_abierto';
    var motivo = null;
    if (hayOverlayGoogle()) motivo = 'overlay_google';
    else if (hayCapaSuperpuesta()) motivo = 'capa_superpuesta';
    if (motivo) { ultimaCapaTs = Date.now(); return motivo; }
    if (ultimaCapaTs && Date.now() - ultimaCapaTs < TRAS_CAPA_MS) return 'tras_capa';
    return null;
  }

  // ---------- Estado de sesion ----------
  function nSesion() { return parseInt(ssGet('fc_popup_n') || '0', 10); }

  // ---------- Mostrar ----------
  // Devuelve true solo si quedo realmente visible; recien ahi se gasta el cooldown.
  function mostrarPopup(tipo, disparo) {
    var overlay = getOverlay(tipo);
    if (!overlay) return false;
    prepararPopup(overlay);
    overlay.classList.add('is-visible');
    if (!(overlay.offsetWidth > 0 || overlay.offsetHeight > 0)) {
      overlay.classList.remove('is-visible');
      return false;
    }
    var count = getCount(tipo);
    var n = nSesion() + 1;
    lsSet('fc_popup_count_' + tipo, count + 1);
    lsSet(KEY_LAST[tipo], Date.now());
    lsSet('fc_popup_turn', tipo === 'antemeridiano' ? 'cafe' : 'antemeridiano');
    ssSet('fc_popup_n', n);
    ssSet('fc_popup_t', tiempo);
    ssSet('fc_popup_tipo_prev', tipo);
    fcTrack('popup_mostrado', { tipo: tipo, disparo: disparo, aparicion: count + 1, segundos_sesion: tiempo, n_sesion: n, contexto: contextoPopup(), variante: overlay.getAttribute('data-var') || '1' });
    var card = overlay.querySelector('.fc-popup-card');
    if (card) { try { card.focus({ preventScroll: true }); } catch (e) {} }
    return true;
  }
  // Para pruebas desde la consola: mostrarPopup('cafe') / mostrarPopup('antemeridiano')
  window.mostrarPopup = function (tipo) { return mostrarPopup(tipo || 'cafe', 'manual'); };

  // ---------- Que popup toca y desde cuando ----------
  var cacheTipo = { n: -1, tipo: null };
  function tipoSiguiente(ahora) {
    var n = nSesion();
    if (cacheTipo.n === n && cacheTipo.tipo !== undefined && cacheTipo.ts && ahora - cacheTipo.ts < 30000) return cacheTipo.tipo;
    var tipo = null;
    if (n === 0) {
      var turno = lsGet('fc_popup_turn') === 'antemeridiano' ? 'antemeridiano' : 'cafe';
      var otro = turno === 'cafe' ? 'antemeridiano' : 'cafe';
      // Si al que le toca esta en cooldown/descartado/aporto, se usa el otro en vez de no mostrar nada.
      tipo = elegible(turno, ahora) ? turno : (elegible(otro, ahora) ? otro : null);
    } else {
      var prev = ssGet('fc_popup_tipo_prev');
      var sig = prev === 'cafe' ? 'antemeridiano' : 'cafe';
      tipo = elegible(sig, ahora) ? sig : null;
    }
    cacheTipo = { n: n, tipo: tipo, ts: ahora };
    return tipo;
  }

  // Segundos de sesion minimos para mostrar `tipo`. exit=true usa el umbral de salida de cursor del perfil.
  function minimoSegundos(tipo, perfil, exit) {
    var base = (exit && perfil.exitDesde !== null) ? perfil.exitDesde : perfil.umbral[tipo];
    var n = nSesion();
    if (n > 0) base = Math.max(base, parseInt(ssGet('fc_popup_t') || '0', 10) + perfil.separacion);
    return base;
  }

  // ---------- Puerta unica (temporizador y salida de cursor pasan por aca) ----------
  var intentando = false;
  var desistido = false; // se agotaron los reintentos en esta pagina: el temporizador no insiste, la salida de cursor si puede reintentar
  function intentarMostrar(tipo, disparo, intento) {
    if (intento === undefined) {
      if (intentando) return;
      intentando = true;
      intento = 0;
    }
    var perfil = perfilActual();
    // Reconfirma con el perfil vigente (puede haber cambiado a "agresivo" mientras esperaba)
    if (nSesion() >= perfil.maxPorSesion || !elegible(tipo, Date.now())) { intentando = false; return; }

    var enPagina = Date.now() - T0;
    if (enPagina < MIN_EN_PAGINA_MS) {
      setTimeout(function () { intentarMostrar(tipo, disparo, intento); }, MIN_EN_PAGINA_MS - enPagina);
      return;
    }

    var motivo = motivoBloqueo();
    if (motivo === null) {
      if (mostrarPopup(tipo, disparo)) { intentando = false; return; }
      motivo = 'sin_visibilidad';
    }
    if (intento >= REINTENTOS_MAX) {
      intentando = false;
      desistido = true;
      fcTrack('popup_pospuesto', { tipo: tipo, motivo: motivo });
      return;
    }
    // Con la pestaña oculta no se gastan reintentos: espera a que vuelva a estar visible
    var siguiente = (motivo === 'pestana_oculta') ? intento : intento + 1;
    setTimeout(function () { intentarMostrar(tipo, disparo, siguiente); }, REINTENTO_MS);
  }

  function evaluar(disparo) {
    if (intentando) return;
    if (disparo === 'exit_intent') desistido = false; else if (desistido) return;
    var perfil = perfilActual();
    if (nSesion() >= perfil.maxPorSesion) return;
    var ahora = Date.now();
    var tipo = tipoSiguiente(ahora);
    if (!tipo) return;
    if (tiempo >= minimoSegundos(tipo, perfil, disparo === 'exit_intent')) intentarMostrar(tipo, disparo);
  }

  // ---------- Arranque ----------
  crearBait();
  tiempo = parseInt(ssGet('fc_time_spent') || '0', 10);

  setInterval(function () {
    if (document.visibilityState !== 'visible') return; // solo cuenta con la pestaña visible
    tiempo++;
    ssSet('fc_time_spent', tiempo);
    if (estadoBloq !== true) bloqueador();
    evaluar('timer');
  }, 1000);

  // Salida de cursor: pasa por la misma puerta que el temporizador (mismas capas, mismo
  // minimo de tiempo del perfil). Ventana de gracia para no confundir con prompts nativos.
  var EXIT_INTENT_GRACE_MS = 4000;
  var EXIT_INTENT_DEBOUNCE = 200;
  if (window.matchMedia && window.matchMedia('(pointer: fine)').matches) {
    document.addEventListener('mouseout', function (e) {
      if (e.clientY > 0 || e.relatedTarget !== null) return;
      if (Date.now() - T0 < EXIT_INTENT_GRACE_MS) return;
      setTimeout(function () { evaluar('exit_intent'); }, EXIT_INTENT_DEBOUNCE);
    });
  }
})();
} catch (e) { console.error('[fc-core.js bloque 4]', e); }
//

/* ── bloque 5/11 · antes en la línea 5814 del tema · // TOAST RECORDATORIO DE CONCURSOS POR VENCER ── */
//
// TOAST RECORDATORIO DE CONCURSOS POR VENCER
try {
window.addEventListener('load', function() {
    idle(function() {
        if (sessionStorage.getItem('toastMostrado')) return;

        var hoy = new Date();
        hoy.setHours(0,0,0,0);
        var manana = new Date(hoy);
        manana.setDate(hoy.getDate() + 1);
        var domingo = new Date();
        domingo.setDate(hoy.getDate() + (7 - hoy.getDay()));
        domingo.setHours(23,59,59,999);

        var countHoy = 0;
        var countSemana = 0;
        var falloHoy = 0;      // "ya particip\u00e9" sin resultado anotado (esperando) con fallo hoy
        var falloSemana = 0;   // ... o en lo que queda de la semana

        for(var i=0; i < localStorage.length; i++){
            var k = localStorage.key(i);
            if(k.indexOf('fav_') === 0 && k.indexOf('fav_fecha_') !== 0){
                var id = k.replace('fav_','');
                var estado = parseInt(localStorage.getItem(k), 10);

                if(estado === 1){
                    var fechaISO = localStorage.getItem('fav_fecha_' + id);
                    if(fechaISO){
                        var p = fechaISO.split('-');
                        var f = new Date(p[0], p[1]-1, p[2]);
                        if(f >= hoy && f < manana){
                            countHoy++;
                        } else if(f >= manana && f <= domingo){
                            countSemana++;
                        }
                    }
                } else if(estado === 2 && !localStorage.getItem('fcres_' + id)){
                    var falloISO = localStorage.getItem('fcfallo_' + id);
                    if(falloISO && /^\d{4}-\d{2}-\d{2}$/.test(falloISO)){
                        var q = falloISO.split('-');
                        var ff = new Date(q[0], q[1]-1, q[2]);
                        if(ff >= hoy && ff < manana){
                            falloHoy++;
                        } else if(ff >= manana && ff <= domingo){
                            falloSemana++;
                        }
                    }
                }
            }
        }

        if(typeof mostrarToast === 'function'){
            var irFavs = '/p/mis-concursos-favoritos.html#lista-favoritos';
            var irPart = '/p/mis-concursos-favoritos.html#lista-participados';
            if(countHoy > 0){
                var msgHoy = '⚠️ ' + (countHoy > 1
                    ? countHoy + ' concursos favoritos vencen HOY'
                    : '1 concurso favorito vence HOY');
                mostrarToast(msgHoy, 'warning', irFavs);
            }
            if(countSemana > 0){
                var msgSemana = countSemana + ' concurso' + (countSemana > 1 ? 's' : '') + ' favorito' + (countSemana > 1 ? 's' : '') + ' vence' + (countSemana > 1 ? 'n' : '') + ' esta semana';
                mostrarToast(msgSemana, 'warning', irFavs);
            }
            if(falloHoy > 0){
                mostrarToast('\ud83c\udfc6 ' + (falloHoy > 1
                    ? 'Hoy se conoce el fallo de ' + falloHoy + ' concursos en los que participaste'
                    : 'Hoy se conoce el fallo de un concurso en el que participaste'), 'info', irPart);
            }
            if(falloSemana > 0){
                mostrarToast(falloSemana > 1
                    ? 'Esta semana se conoce el fallo de ' + falloSemana + ' concursos en los que participaste'
                    : 'Esta semana se conoce el fallo de un concurso en el que participaste', 'info', irPart);
            }
            if(countHoy > 0 || countSemana > 0 || falloHoy > 0 || falloSemana > 0){
                sessionStorage.setItem('toastMostrado', 'true');
            }
        }
    });
});
} catch (e) { console.error('[fc-core.js bloque 5]', e); }
// === Badge "Mis favoritos" en menú y widget ===
function actualizarFavBadge() {
  var hoy = new Date(); hoy.setHours(0,0,0,0);
  var limite = new Date(hoy); limite.setDate(limite.getDate() + 7);
  var total = 0, porVencer = 0;
  for (var i = 0; i < localStorage.length; i++) {
    var k = localStorage.key(i);
    if (k.indexOf('fav_') === 0 && k.indexOf('fav_fecha_') !== 0) {
      if (parseInt(localStorage.getItem(k), 10) === 1) {
        total++;
        var fechaISO = localStorage.getItem('fav_fecha_' + k.replace('fav_', ''));
        if (fechaISO) {
          var p = fechaISO.split('-');
          var f = new Date(p[0], p[1]-1, p[2]);
          if (f >= hoy && f <= limite) porVencer++;
        }
      }
    }
  }
  var texto = porVencer > 0 ? '⚠ ' + porVencer + '/' + total + ' por vencer' : (total > 0 ? String(total) : '0');
  ['fav-badge-menu', 'fav-badge-widget', 'fav-badge-home'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) {
      el.textContent = texto;
      el.className = porVencer > 0 ? 'fav-badge fav-badge--warn' : 'fav-badge fav-badge--normal';
    }
  });
}
try {
idle(actualizarFavBadge);
} catch (e) { console.error('[fc-core.js bloque 5]', e); }
//

/* ── bloque 6/11 · antes en la línea 5927 del tema · // ====== FUNCIONES PARA PÁGINA INDIVIDUAL DE CONCURSOS ====== ── */
//
// ====== FUNCIONES PARA PÁGINA INDIVIDUAL DE CONCURSOS ======

// Función para obtener el page-id desde la URL actual
function obtenerPageIdActual() {
  var el = document.querySelector('.entry-content > div[id]');
  return el ? el.id : null;
}

// Función para obtener el ID de la página actual mediante API
function obtenerIdDesdeFeed(callback) {
  var url = window.location.pathname;
  
  // Extraer el path de la página
  var script = document.createElement('script');
  script.src = '/feeds/pages/summary?alt=json-in-script&callback=procesarFeedPaginas';
  
  window.procesarFeedPaginas = function(json) {
    if (json && json.feed && json.feed.entry) {
      var currentUrl = window.location.href;
      
      for (var i = 0; i < json.feed.entry.length; i++) {
        var entry = json.feed.entry[i];
        var entryLink = null;
        for (var j = 0; j < entry.link.length; j++) {
          if (entry.link[j].rel === 'alternate') {
            entryLink = entry.link[j].href;
            break;
          }
        }
        
        if (entryLink && currentUrl.includes(entryLink.split('.com')[1])) {
          var id = entry.id.$t.split('.page-')[1] || entry.id.$t.split('.post-')[1];
          callback(id);
          return;
        }
      }
    }
    callback(null);
  };
  
  document.body.appendChild(script);
}

// Funciones de estado (idénticas a las de favoritos; cookie compacta v2, lee también el formato anterior)
// Cookie de respaldo compacta (v2): "2_<favs>_<participados>_<id:AAAAMMDD,...>"
// ~30 bytes por favorito (el formato JSON anterior ocupaba ~76). Sigue leyendo el formato anterior.
var FC_COOKIE_MAX = 3900;

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
  var favs = [], parts = [], fechas = [];
  try {
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i);
      if (k.indexOf('fav_fecha_') === 0) {
        fechas.push(k.slice(10) + ':' + String(localStorage.getItem(k)).replace(/-/g, ''));
      } else if (k.indexOf('fav_') === 0) {
        var e = parseInt(localStorage.getItem(k), 10), id = k.slice(4);
        if (e === 1) favs.push(id); else if (e === 2) parts.push(id);
      }
    }
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

function getEstado(id) {
  var key = 'fav_' + id;
  var raw = localStorage.getItem(key);
  var estado = raw !== null ? parseInt(raw, 10) : 0;
  if (raw === null) {
    var respaldo = leerRespaldoCookie();
    if(respaldo) {
      if(respaldo.favs && respaldo.favs[id]) estado = 1;
      if(respaldo.participados && respaldo.participados[id]) estado = 2;
      if(estado !== 0) localStorage.setItem(key, estado);
    }
  }
  return estado;
}

// Función para extraer la fecha del HTML de la página
function extraerFechaDeHTML() {
  // Buscar en el recuadro de concurso el atributo data-fecha
  var linkAgendar = document.querySelector('.link-agendar');
  if (linkAgendar && linkAgendar.dataset.fecha) {
    var fechaDDMMYYYY = linkAgendar.dataset.fecha; // formato dd/mm/yyyy
    var partes = fechaDDMMYYYY.split('/');
    if (partes.length === 3) {
      // Convertir a formato ISO: yyyy-mm-dd
      return partes[2] + '-' + partes[1] + '-' + partes[0];
    }
  }
  
  // Fallback: buscar en el meta datetime
  var timeElement = document.querySelector('time[datetime]');
  if (timeElement) {
    return timeElement.getAttribute('datetime');
  }
  
  return null;
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

// ====== Contador de "me gusta" de cada concurso (Firebase: likes/<BloggerID>) ======
// Me gusta = estar en favoritos o en "ya participé". Solo lo mueven los clics del usuario (nunca la
// sincronización ni la restauración desde cookies): 0 -> 1/2 suma uno, 1/2 -> 0 resta uno, 1 <-> 2 no cambia.
// El total que se muestra en listados lo imprime el pipeline (ConcursosVistas -> ConcursosPost);
// en la ficha se lee en vivo con un GET chico cuando la página ya está ociosa.
var FC_MG_DB = 'https://finalescerrados-b075c-default-rtdb.firebaseio.com/likes/';
try {
window.fcMgTotal = window.fcMgTotal || {};
} catch (e) { console.error('[fc-core.js bloque 6]', e); }
function fcMgTexto(n) { return n < 1000 ? String(n) : String(Math.round(n / 100) / 10).replace('.', ',') + ' k'; }
function fcMgTitulo(n) { return n === 1 ? '1 lector lo guardó' : n + ' lectores lo guardaron'; }
// Pinta (o quita) el globito con el total dentro de un botón de favorito de los listados
function fcMgPintar(el, n) {
  if (!el) return;
  var b = el.querySelector('.fc-mg');
  if (n > 0) {
    if (!b) { b = document.createElement('span'); b.className = 'fc-mg'; b.setAttribute('aria-hidden', 'true'); el.appendChild(b); }
    b.textContent = fcMgTexto(n);
    b.title = fcMgTitulo(n);
  } else if (b) { b.parentNode.removeChild(b); }
  el.setAttribute('data-mg', String(n > 0 ? n : 0));
}
// Registra el cambio de estado de un concurso; devuelve +1, -1 o 0. `el`: botón del listado (opcional)
function fcMeGusta(id, antes, despues, el) {
  var d = ((parseInt(despues, 10) || 0) > 0 ? 1 : 0) - ((parseInt(antes, 10) || 0) > 0 ? 1 : 0);
  if (!d || !/^[0-9]{6,25}$/.test(String(id))) return 0;
  try {
    fetch(FC_MG_DB + id + '.json', { method: 'PUT', keepalive: true, body: JSON.stringify({ '.sv': { increment: d } }) })
      .catch(function () {});
  } catch (e) {}
  if (el) fcMgPintar(el, Math.max(0, (parseInt(el.getAttribute('data-mg') || '0', 10) || 0) + d));
  if (Object.prototype.hasOwnProperty.call(window.fcMgTotal, id)) window.fcMgTotal[id] = Math.max(0, window.fcMgTotal[id] + d);
  return d;
}
// Lee el total de un concurso (ficha) y llama a cb cuando llega
function fcMgCargar(id, cb) {
  if (!/^[0-9]{6,25}$/.test(String(id)) || typeof fetch !== 'function') return;
  fetch(FC_MG_DB + id + '.json', { priority: 'low' })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (n) { window.fcMgTotal[id] = (typeof n === 'number' && n > 0) ? n : 0; if (cb) cb(); })
    .catch(function () {});
}

// Toggle favorito en página individual
function toggleFavIndividual(pageId) {
  var antes = getEstado(pageId);
  if (getEstado(pageId) === 2) {   // pasar de "ya participé" a favorito: proteger el resultado anotado
    if (!fcConfirmarQuitarRes(pageId)) return;
    fcLimpiarRes(pageId);
  }
  var estado = getEstado(pageId) === 1 ? 0 : 1;
  
  if(typeof mostrarToast === 'function') {
    mostrarToast(estado === 1 ? 'Guardado en favoritos' : 'Eliminado de favoritos','success',
      estado === 1 ? '/p/mis-concursos-favoritos.html#lista-favoritos' : null);
  }

  localStorage.setItem('fav_' + pageId, estado);
  fcMeGusta(pageId, antes, estado);
  
  // Guardar fecha si estamos marcando como favorito
  if (estado === 1) {
    var fechaISO = extraerFechaDeHTML();
    if (fechaISO) {
      localStorage.setItem('fav_fecha_' + pageId, fechaISO);
    }
  }
  
  renderizarIconosIndividuales(pageId);
  idle(actualizarCookie, 500);
}

// Toggle participado en página individual
function togglePartIndividual(pageId) {
  var antes = getEstado(pageId);
  if (getEstado(pageId) === 2) {
    if (!fcConfirmarQuitarRes(pageId)) return;
    fcLimpiarRes(pageId);
  }
  var estado = getEstado(pageId) === 2 ? 0 : 2;

  if(typeof mostrarToast === 'function') {
    mostrarToast(estado === 2 ? 'Guardado en "ya participé"' : 'Desmarcado','success',
      estado === 2 ? '/p/mis-concursos-favoritos.html#lista-participados' : null);
  }

  localStorage.setItem('fav_' + pageId, estado);
  fcMeGusta(pageId, antes, estado);
  
  // Guardar fecha si estamos marcando como participado
  if (estado === 2) {
    var fechaISO = extraerFechaDeHTML();
    if (fechaISO) {
      localStorage.setItem('fav_fecha_' + pageId, fechaISO);
    }
  }
  
  renderizarIconosIndividuales(pageId);
  idle(actualizarCookie, 500);
}

// Renderizar iconos en la página individual
function renderizarIconosIndividuales(pageId) {
  var container = document.getElementById('acciones-concurso-individual');
  if (!container || !pageId) return;
  
  var estado = getEstado(pageId);
  
  var favActive = estado === 1 ? 'active' : '';
  var partActive = estado === 2 ? 'active' : '';
  
  var labelFav = estado === 1 ? '<span class="label-estado">En favoritos</span>' : '';
  var resNombre = estado === 2 ? fcResNombre(pageId) : '';
  var labelPart = estado === 2 ? '<span class="label-estado">Ya participé' + (resNombre ? ' · ' + resNombre : '')
    + ' <a class="label-estado-res" href="/p/mis-concursos-favoritos.html">' + (resNombre ? 'Editar resultado' : 'Anotar resultado') + '</a></span>' : '';
  
  var titleFav = estado === 1 ? 'Quitar de favoritos' : 'Agregar a favoritos';
  var titlePart = estado === 2 ? 'Desmarcar participación' : 'Marcar como que ya has participado';
  var mg = window.fcMgTotal[pageId] || 0;
  var mgBadge = mg > 0 ? '<span class="fc-mg" title="' + fcMgTitulo(mg) + '">' + fcMgTexto(mg) + '</span>' : '';
  
  fcPsSync(pageId, estado, mg);
  container.innerHTML = '<span class="icon-circle-individual icon-share-ind" onclick="customshare_toggle(this)" data-url="' + window.location.href + '" data-title="' + document.title.replace(/"/g, "&quot;") + '" title="Compartir"><i class="fa-solid fa-share-nodes"></i></span>' + '<span class="icon-circle-individual icon-fav-ind ' + favActive + '" onclick="toggleFavIndividual(\'' + pageId + '\')" title="' + titleFav + (mg > 0 ? ' · ' + fcMgTitulo(mg) : '') + '"><i class="fa-solid fa-heart"></i>' + mgBadge + '</span>' + labelFav + '<span class="icon-circle-individual icon-part-ind ' + partActive + '" onclick="togglePartIndividual(\'' + pageId + '\')" title="' + titlePart + '"><i class="fa-solid fa-check"></i></span>' + labelPart;
}

// Botones Favorito / Ya participé de la barra Compartir (abajo): reflejan el mismo estado que los de arriba
function fcPsSync(pageId, estado, mg) {
  var f = document.querySelector('.post-share .fc-ps-fav');
  var p = document.querySelector('.post-share .fc-ps-part');
  if (!f || !p) return;
  var tf = (estado === 1 ? 'Quitar de favoritos' : 'Agregar a favoritos') + (mg > 0 ? ' · ' + fcMgTitulo(mg) : '');
  var tp = estado === 2 ? 'Desmarcar participación' : 'Marcar como que ya participaste';
  f.setAttribute('data-id', pageId); p.setAttribute('data-id', pageId);
  f.setAttribute('aria-pressed', estado === 1 ? 'true' : 'false');
  p.setAttribute('aria-pressed', estado === 2 ? 'true' : 'false');
  f.title = tf; f.setAttribute('aria-label', tf);
  p.title = tp; p.setAttribute('aria-label', tp);
  fcMgPintar(f, mg);
}
function fcPsClick(btn, tipo) {
  var id = btn.getAttribute('data-id');
  if (!id) return;   // todavía no se resolvió el ID del concurso
  if (tipo === 'fav') toggleFavIndividual(id); else togglePartIndividual(id);
}

// Inicializar iconos en página individual
function inicializarIconosConcurso() {
  // Solo ejecutar si estamos en una página de concurso (verificar que existe el div)
  if (!document.getElementById('acciones-concurso-individual')) return;
  
  var pageId = obtenerPageIdActual();
  
  var conMeGusta = function(id) {
    renderizarIconosIndividuales(id);
    fcMgCargar(id, function() { renderizarIconosIndividuales(id); });
  };
  if (pageId) {
    conMeGusta(pageId);
  } else {
    // Si no pudimos obtener el ID de la URL, buscarlo vía API
    obtenerIdDesdeFeed(function(id) {
      if (id) {
        conMeGusta(id);
      }
    });
  }
}

// Ejecutar al cargar la página
// Ejecutar al cargar la página
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() {
    idle(inicializarIconosConcurso);
  });
} else {
  idle(inicializarIconosConcurso);
}
//

/* ── bloque 7/11 · antes en la línea 6284 del tema · // ====== RELATED POSTS ====== ── */
//
// ====== RELATED POSTS ======
try {
(function() {
  'use strict';
  var postContent = document.querySelector('.entry-content, .post-body, .post, .entry-container');
  if (!postContent) return;
  var tagElements = document.querySelectorAll('a[rel="tag"]');
  if (tagElements.length === 0) return;
  var currentTags = [];
  tagElements.forEach(function(tag) {
    currentTags.push(tag.textContent.trim());
  });
  var currentTitle = document.querySelector('.post h1, .entry-title, h1, .post-title');
  var currentTitleText = currentTitle ? currentTitle.textContent.trim() : '';
  var currentURL = window.location.href;
  var script = document.createElement('script');
  script.fetchPriority = 'low'; // contenido debajo del fold, no crítico para el primer render
  script.src = '/feeds/posts/summary?alt=json-in-script&max-results=50&callback=procesarPostsRelacionados';
  window.procesarPostsRelacionados = function(json) {
    if (!json.feed || !json.feed.entry) return;
    var relatedPosts = [];
    json.feed.entry.forEach(function(entry) {
      if (entry.title.$t === currentTitleText) return;
      var entryURL = '';
      if (entry.link) {
        for (var i = 0; i < entry.link.length; i++) {
          if (entry.link[i].rel === 'alternate') {
            entryURL = entry.link[i].href;
            break;
          }
        }
      }
      if (entryURL === currentURL || entryURL.split('?')[0] === currentURL.split('?')[0]) return;
      var coincidencias = 0;
      if (entry.category) {
        entry.category.forEach(function(cat) {
          if (currentTags.indexOf(cat.term) !== -1) {
            coincidencias++;
          }
        });
      }
      if (coincidencias > 0) {
        var postImage = '';
        if (entry.media$thumbnail) {
          postImage = entry.media$thumbnail.url.replace(/\/s72-c/, '/s400-c');
        }
        relatedPosts.push({
          title: entry.title.$t,
          link: entryURL,
          image: postImage,
          matches: coincidencias
        });
      }
    });
    relatedPosts.sort(function(a, b) {
      return b.matches - a.matches;
    });
    relatedPosts = relatedPosts.slice(0, 3);
    if (relatedPosts.length === 0) return;
    var relatedSection = document.createElement('div');
    relatedSection.className = 'related-posts';
    var title = document.createElement('h3');
    title.className = 'related-posts-title';
    title.textContent = 'Artículos Relacionados';
    relatedSection.appendChild(title);
    var container = document.createElement('div');
    container.className = 'related-posts-container';
    relatedPosts.forEach(function(post) {
      var card = document.createElement('a');
      card.href = post.link;
      card.className = 'related-post-card';
      card.target = '_self';
      var imageDiv = document.createElement('div');
      imageDiv.className = 'related-post-image';
      if (post.image) {
        var img = document.createElement('img');
        img.src = post.image;
        img.alt = post.title;
        imageDiv.appendChild(img);
      } else {
        imageDiv.style.background = '#f0f0f0';
      }
      var contentDiv = document.createElement('div');
      contentDiv.className = 'related-post-content';
      var postTitle = document.createElement('h4');
      postTitle.className = 'related-post-title';
      postTitle.textContent = post.title;
      contentDiv.appendChild(postTitle);
      card.appendChild(imageDiv);
      card.appendChild(contentDiv);
      container.appendChild(card);
    });
    relatedSection.appendChild(container);
    // Ad antes de relacionados
    var adBeforeRelated = document.createElement('div');
    adBeforeRelated.style.cssText = 'margin: 20px 0; text-align: center; overflow: hidden;';
    adBeforeRelated.classList.add('ad-reservado');
    adBeforeRelated.innerHTML = '<ins class="adsbygoogle"'
      + ' style="display:block; text-align:center;"'
      + ' data-ad-layout="in-article"'
      + ' data-ad-format="fluid"'
      + ' data-ad-client="ca-pub-7776262814765753"'
      + ' data-ad-slot="8986089529"></ins>';
    idle(function() {
        postContent.appendChild(adBeforeRelated);
        window.FC.pushAd(adBeforeRelated.querySelector('ins.adsbygoogle'));
        postContent.appendChild(relatedSection);
    });
    window.procesarPostsRelacionados = null;
  };
  idle(function () { document.body.appendChild(script); });
})();
} catch (e) { console.error('[fc-core.js bloque 7]', e); }
//

/* ── bloque 8/11 · antes en la línea 6741 del tema · // ====== Schema markup para SEO con dateModified real ====== ── */
//
// ====== Schema markup para SEO con dateModified real ======
try {
(function() {
  'use strict';

  // --- Leer fechas inyectadas por la plantilla (páginas estáticas) ANTES de eliminarlas ---
  var metaDateModified  = document.querySelector('meta[itemprop="dateModified"]');
  var metaDatePublished = document.querySelector('meta[itemprop="datePublished"]');
  var bloggerDateModified  = metaDateModified  ? metaDateModified.getAttribute('content')  : '';
  var bloggerDatePublished = metaDatePublished ? metaDatePublished.getAttribute('content') : '';
  window.fcOriginalDates = { datePublished: bloggerDatePublished, dateModified: bloggerDateModified };
  if (metaDateModified)  metaDateModified.parentNode.removeChild(metaDateModified);
  if (metaDatePublished) metaDatePublished.parentNode.removeChild(metaDatePublished);

  // --- Limpiar microdata nativa de Blogger (evita schema duplicado) ---
  var postDiv = document.querySelector('div[itemscope][itemtype*="BlogPosting"]');
  if (postDiv) {
    postDiv.removeAttribute('itemscope');
    postDiv.removeAttribute('itemtype');
    postDiv.querySelectorAll('[itemprop]').forEach(function(el) {
      el.removeAttribute('itemprop');
    });
  }

  // --- Detectar tipo de página ---
  var path = window.location.pathname;
  var isHome   = path === '/' || path === '';
  var isSearch = /^\/(search|label)\//.test(path);
  var isPage   = path.indexOf('/p/') !== -1;
  var isPost   = !isHome && !isSearch && !isPage;
  if (isHome || isSearch) return;

  // --- Datos base disponibles en el DOM ---
  var pageTitle = document.querySelector('title');
  if (!pageTitle) return;
  var titleText = pageTitle.textContent.split(' | ')[0].trim();

  var urlMeta = document.querySelector('meta[property="og:url"]');
  var canonicalUrl = urlMeta ? urlMeta.getAttribute('content') : window.location.href;

  var authorEl = document.querySelector('a[title="El autor"]');
  var authorName = authorEl ? authorEl.textContent.trim() : 'Javier E.G. Andújar';
  var authorUrl = authorEl ? authorEl.getAttribute('href') : 'https://www.finalescerrados.com/p/el-autor.html';

  var metaImage = document.querySelector('meta[property="og:image"]');
  var imageUrl = metaImage ? metaImage.getAttribute('content') : '';

  var descMeta = document.querySelector('meta[name="description"]') ||
                 document.querySelector('meta[property="og:description"]');
  var description = descMeta ? descMeta.getAttribute('content') : '';

  // Fecha de publicación desde el abbr del DOM (posts)
  var isoDatePublished = '';
  var abbr = document.querySelector('abbr.published[title]');
  if (abbr) isoDatePublished = abbr.getAttribute('title');

  // Para páginas estáticas, usar la fecha de publicación de la plantilla
  if (isPage && bloggerDatePublished) isoDatePublished = bloggerDatePublished;

  // --- Función que construye e inyecta el schema ---
  function injectSchema(dateModified) {
    var schema = {
      '@context': 'https://schema.org',
      '@type': isPage ? 'WebPage' : 'BlogPosting',
      'headline': titleText,
      'url': canonicalUrl,
      'author': {
        '@type': 'Person',
        'name': authorName,
        'url': authorUrl
      },
      'publisher': {
        '@type': 'Organization',
        'name': 'Finales Cerrados',
        'url': 'https://www.finalescerrados.com/'
      }
    };
    if (description)      schema.description   = description;
    if (imageUrl)         schema.image         = imageUrl;
    if (isoDatePublished) schema.datePublished  = isoDatePublished;
    if (dateModified)     schema.dateModified   = dateModified;
    var s = document.createElement('script');
    s.type = 'application/ld+json';
    s.textContent = JSON.stringify(schema);
    document.head.appendChild(s);
  }

  // --- Breadcrumb Schema ---
  (function() {
    var breadcrumbs = [
      { '@type': 'ListItem', 'position': 1,
        'name': 'Inicio', 'item': 'https://www.finalescerrados.com/' }
    ];
    var labelLinks = document.querySelectorAll('.meta1 a[rel="tag"]');
    if (labelLinks.length > 0) {
      breadcrumbs.push({
        '@type': 'ListItem', 'position': 2,
        'name': labelLinks[0].textContent.trim(),
        'item': labelLinks[0].href.split('?')[0]
      });
      breadcrumbs.push({
        '@type': 'ListItem', 'position': 3,
        'name': titleText,
        'item': canonicalUrl
      });
    } else {
      breadcrumbs.push({
        '@type': 'ListItem', 'position': 2,
        'name': titleText,
        'item': canonicalUrl
      });
    }
    var bcSchema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      'itemListElement': breadcrumbs
    };
    var s = document.createElement('script');
    s.type = 'application/ld+json';
    s.textContent = JSON.stringify(bcSchema);
    document.head.appendChild(s);
  })();

  // --- Para páginas estáticas: usar directamente las fechas de la plantilla ---
  if (isPage) {
    injectSchema(bloggerDateModified);
    return;
  }

  // --- Para posts: obtener dateModified real desde el feed de Blogger ---
  var blogUrl = 'https://www.finalescerrados.com';
  var encodedUrl = encodeURIComponent(canonicalUrl);

  function tryFeed(feedType, onResult) {
    var callbackName = '_bloggerDateCb_' + Math.floor(Math.random() * 1e9);
    var feedUrl = blogUrl + '/feeds/' + feedType + '/default?alt=json' +
              '&max-results=1' +
              '&q=' + encodedUrl +
              '&fields=entry(updated,published,link)' +
              '&callback=' + callbackName;

    window[callbackName] = function(data) {
      var dateModified = '';
      try {
        var entries = data && data.feed && data.feed.entry;
        if (entries && entries.length > 0) {
          var entry = entries[0];
          var links = entry.link || [];
          var matchesUrl = links.some(function(link) {
            return link.rel === 'alternate' && link.href === canonicalUrl;
          });
          if (matchesUrl) {
            dateModified = entry.updated.$t || '';
          }
        }
      } catch(e) {}
      onResult(dateModified);
      delete window[callbackName];
      var s = document.getElementById(callbackName);
      if (s) s.parentNode.removeChild(s);
    };

    var script = document.createElement('script');
    script.id = callbackName;
    script.src = feedUrl;
    script.async = true;
    script.onerror = function() {
      onResult('');
      delete window[callbackName];
    };
    document.body.appendChild(script);
  }

  tryFeed('posts', function(dateModified) {
    injectSchema(dateModified);
  });

})();
} catch (e) { console.error('[fc-core.js bloque 8]', e); }
//

/* ── bloque 9/11 · antes en la línea 6923 del tema · // ====== TABLA DE CONTENIDOS (h2 + h3 con indentación) ====== ── */
//
// ====== TABLA DE CONTENIDOS (h2 + h3 con indentación) ======
try {
(function() {
  'use strict';
  var url = window.location.href;
  var isPost = !url.includes('/p/');
  var isConcurso = url.includes('/p/cl-');
  if (!isPost && !isConcurso) return;
  var postContent = document.querySelector('.entry-content');
  if (!postContent) return;
  var headings = Array.from(postContent.querySelectorAll('h2, h3'));
  if (headings.length > 0 && headings[0].tagName === 'H2' && headings[0].textContent.trim().toUpperCase() === 'BASES') {
    headings = headings.slice(1);
  }
  var h2Count = postContent.querySelectorAll('h2').length;
  var h3Count = postContent.querySelectorAll('h3').length;
  if (h2Count < 1 || h2Count+h3Count < 4) return;
  var firstH2 = headings.find(function(h) { return h.tagName === 'H2'; });
  if (!firstH2) return;
  var toc = document.createElement('div');
  toc.className = 'tabla-contenidos';
  var header = document.createElement('div');
  header.className = 'tabla-contenidos-header';
  var titleDiv = document.createElement('h3');
  var icon = document.createElement('span');
  icon.className = 'tabla-contenidos-icon';
  icon.textContent = '📑';
  var text = document.createElement('span');
  text.textContent = 'Contenido del artículo';
  titleDiv.appendChild(icon);
  titleDiv.appendChild(text);
  var toggle = document.createElement('span');
  toggle.className = 'tabla-contenidos-toggle';
  toggle.textContent = '▼';
  header.appendChild(titleDiv);
  header.appendChild(toggle);
  toc.appendChild(header);
  var listContainer = document.createElement('div');
  listContainer.className = 'tabla-contenidos-list';
  var list = document.createElement('ol');
  headings.forEach(function(heading, index) {
    if (!heading.id) {
      heading.id = 'toc-' + index;
    }
    var item = document.createElement('li');
    var link = document.createElement('a');
    link.href = '#' + heading.id;
    link.textContent = heading.textContent;
    link.addEventListener('click', function(e) {
      e.preventDefault();
      heading.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    if (heading.tagName === 'H3') {
      item.className = 'toc-h3';
    }
    item.appendChild(link);
    list.appendChild(item);
  });
  listContainer.appendChild(list);
  toc.appendChild(listContainer);
  header.addEventListener('click', function() {
    toc.classList.toggle('collapsed');
  });
  var insertBefore = firstH2;
  var prev = firstH2.previousElementSibling;
  if (prev && prev.tagName === 'HR') {
    insertBefore = prev;
  }
  firstH2.parentNode.insertBefore(toc, insertBefore);
})();
} catch (e) { console.error('[fc-core.js bloque 9]', e); }
//

/* ── bloque 10/11 · antes en la línea 7348 del tema · document.addEventListener('DOMContentLoaded', function() { ── */
//
try {
document.addEventListener('DOMContentLoaded', function() {
  // 1. Buscamos los scripts perezosos
  var targets = document.querySelectorAll('.fc-lazy-comments[data-src]');
  // 2. Buscamos el "techo" de los comentarios (por clase, name o ID)
  var anchor = document.querySelector('.comments') || 
               document.querySelector('[name="comments"]') || 
               document.getElementById('comments') || 
               document.getElementById('comment-holder');
  if (!targets.length || !anchor) return;
  var cargado = false;
  function loadComments() {
    if (cargado) return;
    cargado = true;
    targets.forEach(function(oldScript) {
      if (!oldScript.dataset.src) return; // Ya se ejecutó
      var s = document.createElement('script');
      s.type = 'text/javascript';
      s.src = oldScript.dataset.src;
      oldScript.parentNode.insertBefore(s, oldScript);
      oldScript.removeAttribute('data-src');
    });
  }
  // IntersectionObserver: sin lectura de geometría manual, sin forced reflow
  if ('IntersectionObserver' in window) {
    var commentsObserver = new IntersectionObserver(function(entries, observer) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          loadComments();
          observer.disconnect();
        }
      });
    }, { rootMargin: '100px 0px' });
    commentsObserver.observe(anchor);
  } else {
    // Fallback para navegadores sin soporte (poco probable en 2026)
    loadComments();
  }
});
} catch (e) { console.error('[fc-core.js bloque 10]', e); }
//

/* ── bloque 11/11 · antes en la línea 7851 del tema · // Google Preferred Sources: carga 100% bajo demanda, cero costo hasta que ── */
//
// Google Preferred Sources: carga 100% bajo demanda, cero costo hasta que
// el usuario interactúa con el ícono. Nada de script en el load de la página.
try {
(function () {
  var btns = document.querySelectorAll('#btnPreferredSource, .gps-follow-btn-post');
  if (!btns.length) return;

  var warmed = false;
  function warmConnection() {
    if (warmed) return;
    warmed = true;
    var link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = 'https://news.google.com';
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  }

  var sdkPromise = null;
  function loadSdk() {
    if (sdkPromise) return sdkPromise;
    sdkPromise = new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = 'https://news.google.com/swg/js/v1/publisher.js';
      s.setAttribute('preferred-sources-control', 'manual');
      s.async = true;
      s.onload = function () {
        (self.PREFERRED_SOURCE = self.PREFERRED_SOURCE || []).push(function (preferredSource) {
          preferredSource.init({ theme: 'light' });
          resolve(preferredSource);
        });
      };
      s.onerror = reject;
      document.head.appendChild(s);
    });
    return sdkPromise;
  }

  Array.prototype.forEach.call(btns, function (btn) {
    // Pre-conecta apenas hay indicio de intención (hover/foco/touch),
    // así el click ya encuentra la conexión abierta.
    ['pointerenter', 'focus', 'touchstart'].forEach(function (ev) {
      btn.addEventListener(ev, warmConnection, { passive: true, once: true });
    });

    btn.addEventListener('click', function (e) {
      e.preventDefault();
      loadSdk().then(function (preferredSource) {
        preferredSource.addPreferredSource();
      }).catch(function () {
        // Si Google/news.google.com no responde, caemos al deeplink normal
        window.open(btn.href, '_blank', 'noopener');
      });
    });
  });
})();
} catch (e) { console.error('[fc-core.js bloque 11]', e); }
//

/* ── clics que llegaron antes de que cargara este archivo (los guarda el stub inline del tema) ── */
(function (w) {
  var q = w.__fcQ; w.__fcQ = null;
  if (!q) return;
  q.forEach(function (c) {
    try { var fn = w[c[0]]; if (typeof fn === 'function' && !fn.__fcStub) fn.apply(c[2], c[1]); }
    catch (e) { console.error('[fc-core.js clic en cola]', e); }
  });
})(window);
