/*! finalescerrados.com · fc-concursos.js · fc-assets v10.18 · sincronización de favoritos (Firebase) y relacionados de los listados.
   Cada sentencia ejecutable va en su propio try/catch: si un bloque falla, los demás siguen corriendo. */

/* ── bloque 1/2 · sincronización de favoritos con Firebase (fcSync) ── */
//
try {
(function () {
  // Clave web pública del proyecto. No es secreta: la seguridad la dan las reglas de la base.
  var API_KEY = 'AIzaSyAzDKNtgwqW53u5LuHT2HqC0k-oaFcipWs';
  // Firebase → Authentication → Método de acceso → Google → "ID de cliente web"
  var CLIENT_ID = '275610793018-h04l5h4fr8fvljd4fd3g0scmlk668076.apps.googleusercontent.com';
  var DB = 'https://finalescerrados-b075c-default-rtdb.firebaseio.com';
  var PAGINA = 'https://www.finalescerrados.com/p/mis-concursos-favoritos.html';
  var K_AUTH = 'fc_sync_auth', K_COD = 'fc_sync_codigo', K_SNAP = 'fc_sync_snap', K_PEND = 'fc_sync_pend';
  var ID_OK = /^[0-9]{6,25}$/;
  var ALFABETO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';   // sin 0/O ni 1/I para que no se confundan
  var COD_OK = /^[A-HJ-NP-Z2-9]{16}$/;
  var ultimaSync = 0, enCurso = false, gisPromesa = null, gisIniciado = false;

  function ls(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function lsDel(k) { try { localStorage.removeItem(k); } catch (e) {} }
  function jget(k) { try { return JSON.parse(ls(k) || 'null'); } catch (e) { return null; } }
  function toast(m, t) { if (typeof window.mostrarToast === 'function') window.mostrarToast(m, t || 'success'); }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return '&#' + c.charCodeAt(0) + ';'; }); }
  function auth() { return jget(K_AUTH); }
  function codigo() { var c = ls(K_COD); return (c && COD_OK.test(c)) ? c : null; }
  function vinculado() { return !!(auth() || codigo()); }

  // ---------- OneSignal: avisos de favoritos que cierran pronto ----------
  // external_id = 'fc_' + 32 hex de SHA-256('g:'+uid | 'k:'+código); el código nunca viaja a OneSignal.
  // Mismo cálculo que idExterno() en ConcursosNotificarFavoritos.py. Si OneSignal (Zaraz) todavía no
  // cargó, el pedido queda en la cola OneSignalDeferred y corre cuando llegue el SDK.
  var K_OS = 'fc_os_ext', K_OS_OFF = 'fc_os_off';
  var avisoPend = false;   // tocó "Avisarme" sin estar sincronizado: falta elegir Google o código
  async function idExterno() {
    var a = auth(), c = codigo(), base = a ? 'g:' + a.uid : (c ? 'k:' + c : null);
    if (!base || !window.crypto || !crypto.subtle) return null;
    var h = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(base));
    return 'fc_' + Array.from(new Uint8Array(h)).map(function (b) { return ('0' + b.toString(16)).slice(-2); }).join('').slice(0, 32);
  }
  function osCola(fn) {
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(function (OneSignal) { try { return fn(OneSignal); } catch (e) {} });
  }
  async function osVincular() {
    try {
      if (ls(K_OS_OFF) === '1') return;   // pidió "Dejar de avisarme"
      var ext = await idExterno(); if (!ext) return;
      try { if (sessionStorage.getItem(K_OS) === ext) return; } catch (e) {}   // una vez por sesión
      osCola(function (OneSignal) {
        return OneSignal.login(ext).then(function () {
          try { sessionStorage.setItem(K_OS, ext); } catch (e) {}
        });
      });
    } catch (e) {}
  }
  function osDesvincular() {
    try { sessionStorage.removeItem(K_OS); } catch (e) {}
    osCola(function (OneSignal) { return OneSignal.logout(); });
  }

  // ---------- Recuadro "Avisarme antes del cierre" (página de favoritos) ----------
  function hayFavoritos() {
    var o = leerLocal();
    return Object.keys(o).some(function (id) { return o[id].charAt(0) === '1'; });
  }
  function esIOSsinApp() {
    var ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    var app = navigator.standalone === true || (window.matchMedia && matchMedia('(display-mode: standalone)').matches);
    return ios && !app;
  }
  function estadoAvisos() {
    if (esIOSsinApp()) return 'ios';
    if (!('Notification' in window) || !('serviceWorker' in navigator)) return 'nosoporta';
    if (Notification.permission === 'denied') return 'bloqueado';
    if (vinculado() && Notification.permission === 'granted' && ls(K_OS_OFF) !== '1') return 'activo';
    return 'inactivo';
  }
  function htmlAvisos() {
    if (!hayFavoritos()) return '';
    var est = estadoAvisos();
    if (est === 'activo') {
      return '<p class="fc-av-linea"><i class="fa-solid fa-bell fc-av-ok"></i> <strong>Avisos activados</strong>'
        + ' <span class="fc-av-sub">\u00b7 una semana antes y en los \u00faltimos d\u00edas de cada favorito</span>'
        + ' <a href="#" class="fc-av-mini" data-fcs="noavisar">Dejar de avisarme</a></p>';
    }
    if (est === 'bloqueado') {
      return '<p class="fc-av-linea fc-av-sub"><i class="fa-solid fa-triangle-exclamation fc-av-warn"></i> '
        + 'Bloqueaste las notificaciones de este sitio. Habilitalas desde el candado de la barra de direcciones y volv\u00e9 a esta p\u00e1gina.</p>';
    }
    if (est === 'ios') {
      return '<p class="fc-av-linea fc-av-sub"><i class="fa-solid fa-mobile-screen"></i> '
        + 'En iPhone y iPad todav\u00eda no podemos avisarte. Sincroniz\u00e1 tu lista y activ\u00e1 los avisos desde la compu o un Android.</p>';
    }
    if (est === 'nosoporta') return '';
    if (avisoPend && !vinculado()) {
      return '<div class="fc-av-cta"><i class="fa-solid fa-bell fc-av-ico"></i><div>'
        + '<p class="fc-av-tit"><strong>\u00daltimo paso: eleg\u00ed c\u00f3mo guardar tu lista</strong></p>'
        + '<p class="fc-av-sub">Para avisarte necesitamos tu lista de favoritos en la nube. Es la misma sincronizaci\u00f3n que te deja verla en tus otros dispositivos.</p>'
        + '<div id="fc-sync-google" class="fc-sync-google"></div>'
        + '<div class="fc-sync-acciones">'
        + '<button type="button" class="btn-borrar btn-gris" data-fcs="avisocod"><i class="fa-solid fa-lock"></i> Seguir sin cuenta, con un c\u00f3digo</button>'
        + '<a href="#" class="fc-av-mini" data-fcs="avisocancel">Cancelar</a>'
        + '</div></div></div>';
    }
    return '<div class="fc-av-cta"><i class="fa-solid fa-bell fc-av-ico"></i><div>'
      + '<p class="fc-av-tit"><strong>Que no se te pase ning\u00fan cierre</strong></p>'
      + '<p class="fc-av-sub">Te avisamos una semana antes y en los \u00faltimos d\u00edas de cada favorito.'
      + (vinculado() ? '' : ' Para eso tu lista se sincroniza: con tu cuenta de Google o con un c\u00f3digo, sin cuenta.') + '</p>'
      + '<button type="button" class="btn-borrar btn-verde" data-fcs="avisar"><i class="fa-solid fa-bell"></i> Avisarme antes del cierre</button>'
      + '</div></div>';
  }
  // El permiso se pide dentro del clic (si no, el navegador bloquea el cartel). Con el SDK ya cargado lo
  // pide OneSignal; si Zaraz todavía no lo cargó, lo pide el navegador y OneSignal suscribe al llegar.
  async function activarAvisos() {
    var permiso;
    try {
      if (window.OneSignal && OneSignal.Notifications && OneSignal.Notifications.requestPermission) {
        await OneSignal.Notifications.requestPermission();
        permiso = Notification.permission;
      } else {
        permiso = await Notification.requestPermission();
      }
    } catch (e) { permiso = Notification.permission; }
    if (permiso !== 'granted') { pintar(); return; }
    lsDel(K_OS_OFF);
    try { sessionStorage.removeItem(K_OS); } catch (e) {}
    osCola(function (OneSignal) {
      var ps = OneSignal.User && OneSignal.User.PushSubscription;
      if (ps && ps.optedIn === false) return ps.optIn();
    });
    if (!vinculado()) { avisoPend = true; pintar(); return; }   // sin lista en la nube no hay a quién avisar: que elija Google o código
    osVincular();
    toast('Listo: te vamos a avisar antes de que cierren tus favoritos');
    pintar();
  }
  function desactivarAvisos() {
    lsSet(K_OS_OFF, '1');
    osDesvincular();
    toast('Listo: no te vamos a avisar de tus favoritos');
    pintar();
  }
  function formatear(c) { return c.replace(/(.{4})(?=.)/g, '$1-'); }
  function enlaceCodigo(c) { return PAGINA + '#fcsync=' + c; }

  function nuevoCodigo() {
    var b = new Uint8Array(16), s = '';
    crypto.getRandomValues(b);
    for (var i = 0; i < 16; i++) s += ALFABETO[b[i] % 32];
    return s;
  }
  // Acepta el código con o sin guiones, o el enlace completo
  function normalizarCodigo(txt) {
    txt = String(txt || '');
    var m = txt.match(/fcsync=([A-Za-z0-9-]+)/);
    if (m) txt = m[1];
    var c = txt.toUpperCase().replace(/[^A-Z0-9]/g, '');
    return COD_OK.test(c) ? c : null;
  }

  // ---------- Estado local ----------
  // { id: "estado|fecha" }, solo estados 1 (favorito) y 2 (ya participé).
  // En "ya participé" se suma el resultado si hay alguno: "2|fecha|r|fallo|texto" (texto con encodeURIComponent).
  // Claves del resultado: fcres_<id> (g/f/m/s), fcfallo_<id> (AAAA-MM-DD), fctxt_<id> (título del texto).
  var RES_OK = /^[gfms]$/, FALLO_OK = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/;
  function sufijoRes(r, l, x) {
    r = RES_OK.test(r || '') ? r : ''; l = FALLO_OK.test(l || '') ? l : ''; x = String(x || '').slice(0, 120);
    return (r || l || x) ? '|' + r + '|' + l + '|' + encodeURIComponent(x) : '';
  }
  function leerLocal() {
    var o = {};
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k.indexOf('fav_') !== 0 || k.indexOf('fav_fecha_') === 0) continue;
        var id = k.slice(4), e = parseInt(localStorage.getItem(k), 10);
        if (!ID_OK.test(id) || (e !== 1 && e !== 2)) continue;
        o[id] = e + '|' + (localStorage.getItem('fav_fecha_' + id) || '')
          + (e === 2 ? sufijoRes(localStorage.getItem('fcres_' + id), localStorage.getItem('fcfallo_' + id), localStorage.getItem('fctxt_' + id)) : '');
      }
    } catch (err) {}
    return o;
  }
  function escribirRes(id, x) {   // aplica en este dispositivo el resultado que llegó de la nube
    var r = RES_OK.test(x.r || '') ? x.r : '', l = FALLO_OK.test(x.l || '') ? x.l : '', t = String(x.x || '').slice(0, 120);
    if (r) lsSet('fcres_' + id, r); else lsDel('fcres_' + id);
    if (l) lsSet('fcfallo_' + id, l); else lsDel('fcfallo_' + id);
    if (t) lsSet('fctxt_' + id, t); else lsDel('fctxt_' + id);
  }

  // Diferencias contra la última foto sincronizada. Así no hace falta tocar los scripts que
  // escriben fav_* (tema, listados de ConcursosPost.py, página de favoritos).
  function cambiosLocales() {
    var cur = leerLocal(), snap = jget(K_SNAP) || {}, pend = jget(K_PEND) || {};
    var ahora = Date.now(), out = {}, n = 0;
    function marca(id, val) { return (pend[id] && pend[id].v === val) ? pend[id].t : ahora; }
    Object.keys(cur).forEach(function (id) {
      if (cur[id] === snap[id]) return;
      var p = cur[id].split('|');
      out[id] = { e: +p[0], t: marca(id, cur[id]) };
      if (p[1]) out[id].f = p[1];
      if (p[2]) out[id].r = p[2];
      if (p[3]) out[id].l = p[3];
      if (p[4]) { try { out[id].x = decodeURIComponent(p[4]); } catch (e) {} }
      n++;
    });
    Object.keys(snap).forEach(function (id) {
      if (id in cur) return;
      out[id] = { e: 0, t: marca(id, '') };
      n++;
    });
    return { cur: cur, out: out, n: n };
  }

  // ---------- Destino en la base ----------
  async function token() {
    var a = auth(); if (!a) return null;
    if (a.it && a.exp > Date.now() + 60000) return a.it;
    var r = await fetch('https://securetoken.googleapis.com/v1/token?key=' + API_KEY, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'grant_type=refresh_token&refresh_token=' + encodeURIComponent(a.rt)
    });
    if (!r.ok) { if (r.status === 400) desvincular(true); return null; }
    var j = await r.json();
    a.it = j.id_token; a.rt = j.refresh_token; a.exp = Date.now() + (+j.expires_in || 3600) * 1000;
    lsSet(K_AUTH, JSON.stringify(a));
    return a.it;
  }
  async function destino() {
    var a = auth();
    if (a) { var tk = await token(); return tk ? DB + '/favs/' + a.uid + '.json?auth=' + encodeURIComponent(tk) : null; }
    var c = codigo();
    return c ? DB + '/favk/' + c + '.json' : null;
  }
  function destinoInmediato() {   // para pagehide: sin pedidos previos
    var a = auth();
    if (a) return (a.it && a.exp > Date.now() + 5000) ? DB + '/favs/' + a.uid + '.json?auth=' + encodeURIComponent(a.it) : null;
    var c = codigo();
    return c ? DB + '/favk/' + c + '.json' : null;
  }

  // ---------- Sincronización ----------
  async function sincronizar(manual) {
    if (!vinculado() || enCurso) return;
    enCurso = true; ultimaSync = Date.now();
    var fallo = function () { if (manual) toast('No se pudo sincronizar. Probá más tarde.', 'warning'); };
    try {
      var url = await destino(); if (!url) { fallo(); return; }
      var c = cambiosLocales();
      var r = await fetch(url, { priority: 'low' });
      if (!r.ok) { fallo(); return; }
      var remoto = (await r.json()) || {};
      var snap = {}, aplicados = 0;
      Object.keys(c.cur).forEach(function (id) { snap[id] = c.cur[id]; });

      Object.keys(remoto).forEach(function (id) {
        var x = remoto[id] || {};
        if (!ID_OK.test(id)) return;
        if (c.out[id]) {   // conflicto: gana el cambio más reciente
          if ((+x.t || 0) > c.out[id].t) { delete c.out[id]; c.n--; } else return;
        }
        var actual = c.cur[id] ? c.cur[id].split('|') : ['0', ''];
        var eLoc = +actual[0], fLoc = actual[1];
        var eRem = (x.e === 1 || x.e === 2) ? x.e : 0;
        var resLoc = c.cur[id] ? c.cur[id].split('|').slice(2).join('|') : '';
        var resRem = eRem === 2 ? sufijoRes(x.r, x.l, x.x).slice(1) : '';
        if (eLoc !== eRem) {
          if (eRem) {
            lsSet('fav_' + id, String(eRem));
            if (x.f) lsSet('fav_fecha_' + id, x.f);
            if (eRem === 2) escribirRes(id, x);
            snap[id] = eRem + '|' + (x.f || fLoc || '') + (resRem ? '|' + resRem : '');
          } else {
            lsDel('fav_' + id); lsDel('fav_fecha_' + id);
            escribirRes(id, {});
            delete snap[id];
          }
          aplicados++;
        } else if (eRem === 2 && resRem !== resLoc) {
          escribirRes(id, x);
          if (x.f && !fLoc) lsSet('fav_fecha_' + id, x.f);
          snap[id] = eRem + '|' + (x.f || fLoc || '') + (resRem ? '|' + resRem : '');
          aplicados++;
        } else if (eRem && x.f && !fLoc) {
          lsSet('fav_fecha_' + id, x.f);
          snap[id] = eRem + '|' + x.f + (resLoc ? '|' + resLoc : '');
        }
      });

      if (c.n > 0) {
        var w = await fetch(url, { method: 'PATCH', body: JSON.stringify(c.out), priority: 'low' });
        if (!w.ok) { fallo(); return; }
      }
      lsSet(K_SNAP, JSON.stringify(snap));
      lsDel(K_PEND);

      if (aplicados > 0) {
        if (typeof window.actualizarCookie === 'function') { try { window.actualizarCookie(); } catch (e) {} }
        if (typeof window.actualizarCookieRes === 'function') { try { window.actualizarCookieRes(); } catch (e) {} }
        if (document.getElementById('lista-favoritos')) {
          toast('Se trajeron ' + aplicados + ' cambio(s) de tus otros dispositivos');
          setTimeout(function () { location.reload(); }, 900);
          return;
        }
      }
      if (manual) toast('Todo sincronizado');
    } catch (err) {
      fallo();
    } finally {
      enCurso = false;
      pintar();
    }
  }

  // Al salir de la página: sube lo pendiente sin esperar respuesta y guarda la hora real del cambio
  function empujarAlSalir() {
    if (!vinculado()) return;
    var c = cambiosLocales(); if (!c.n) return;
    var pend = {};
    Object.keys(c.out).forEach(function (id) { pend[id] = { v: c.cur[id] || '', t: c.out[id].t }; });
    lsSet(K_PEND, JSON.stringify(pend));
    var url = destinoInmediato(); if (!url) return;
    try { fetch(url, { method: 'PATCH', body: JSON.stringify(c.out), keepalive: true }); } catch (e) {}
  }

  // Al vincular (Google o código): se suma todo lo local a lo que ya haya guardado
  function empezarDeCero() { lsDel(K_SNAP); lsDel(K_PEND); }

  function desvincular(silencioso) {
    lsDel(K_AUTH); lsDel(K_COD); lsDel(K_SNAP); lsDel(K_PEND);
    osDesvincular();
    if (!silencioso) toast('Este dispositivo dejó de sincronizar. Tus concursos siguen guardados acá.');
    pintar();
  }

  // Supresión: borra la lista guardada en la base y desvincula este dispositivo (los datos locales quedan)
  async function borrarNube() {
    if (!window.confirm('¿Borrar tu lista sincronizada de la nube? En este dispositivo tus concursos siguen guardados.')) return;
    try {
      var url = await destino();
      if (!url) throw new Error('sin destino');
      var r = await fetch(url, { method: 'DELETE' });
      if (!r.ok) throw new Error('borrado');
      desvincular(true);
      toast('Listo: borramos tu lista de la nube. Tus concursos siguen en este dispositivo.');
    } catch (e) {
      toast('No se pudo borrar. Probá de nuevo o escribinos.', 'warning');
    }
  }

  // ---------- Google ----------
  function cargarGIS() {
    if (window.google && google.accounts && google.accounts.id) return Promise.resolve();
    if (gisPromesa) return gisPromesa;
    gisPromesa = new Promise(function (ok, mal) {
      var s = document.createElement('script');
      s.src = 'https://accounts.google.com/gsi/client';
      s.async = true; s.onload = ok; s.onerror = function () { gisPromesa = null; mal(); };
      document.head.appendChild(s);
    });
    return gisPromesa;
  }
  function montarBotonGoogle() {
    var el = document.getElementById('fc-sync-google'); if (!el) return;
    cargarGIS().then(function () {
      if (!gisIniciado) {
        google.accounts.id.initialize({ client_id: CLIENT_ID, callback: alVolverDeGoogle });
        gisIniciado = true;
      }
      google.accounts.id.renderButton(el, { theme: 'outline', size: 'large', shape: 'pill', text: 'continue_with', locale: 'es' });
    }).catch(function () { el.textContent = 'No se pudo cargar el botón de Google.'; });
  }
  async function alVolverDeGoogle(resp) {
    try {
      var r = await fetch('https://identitytoolkit.googleapis.com/v1/accounts:signInWithIdp?key=' + API_KEY, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postBody: 'id_token=' + encodeURIComponent(resp.credential) + '&providerId=google.com',
          requestUri: location.origin, returnSecureToken: true
        })
      });
      var j = await r.json();
      if (!r.ok || !j.idToken) throw new Error('login');
      lsSet(K_AUTH, JSON.stringify({
        uid: j.localId, email: j.email || '', it: j.idToken, rt: j.refreshToken,
        exp: Date.now() + (+j.expiresIn || 3600) * 1000
      }));
      lsDel(K_COD);
      empezarDeCero();
      toast(avisoPend ? 'Listo: sincronizado con tu cuenta de Google. Te vamos a avisar antes de que cierren tus favoritos'
        : 'Listo: este dispositivo quedó sincronizado con tu cuenta de Google');
      avisoPend = false;
      try { sessionStorage.removeItem(K_OS); } catch (e) {}
      osVincular();
      pintar();
      await sincronizar();
    } catch (e) {
      toast('No se pudo entrar con Google. Probá de nuevo en un rato.', 'warning');
    }
  }

  // ---------- Código ----------
  function vincularCodigo(c, creado) {
    lsDel(K_AUTH);
    lsSet(K_COD, c);
    empezarDeCero();
    toast(creado === 'aviso' ? 'Listo: tu lista quedó sincronizada con un código. Te vamos a avisar antes de que cierren tus favoritos'
      : (creado ? 'Código creado: usalo en tus otros dispositivos' : 'Listo: este dispositivo quedó vinculado'));
    try { sessionStorage.removeItem(K_OS); } catch (e) {}
    osVincular();
    pintar();
    sincronizar();
  }
  function copiar(txt, msg) {
    var hecho = function () { toast(msg); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(txt).then(hecho, function () { window.prompt('Copiá esto:', txt); });
    } else { window.prompt('Copiá esto:', txt); }
  }

  // ---------- Recuadro de la página de favoritos: <div id="fc-sync-box"></div> ----------
  function pintar() {
    var box = document.getElementById('fc-sync-box'); if (!box) return;
    var a = auth(), c = codigo(), av = htmlAvisos(), sync;
    if (a) {
      sync =
        '<p class="fc-sync-linea"><i class="fa-solid fa-circle-check"></i> Sincronizado' + (a.email ? ' con <strong>' + esc(a.email) + '</strong>' : '') + ' en todos tus dispositivos</p>' +
        '<p class="fc-sync-nota"><a href="#" data-fcs="salir">Cerrar sesi\u00f3n</a> \u00b7 <a href="#" data-fcs="borrar">Borrar mi lista de la nube</a></p>';
    } else if (c) {
      sync =
        '<p class="fc-sync-linea"><i class="fa-solid fa-lock"></i> Sincronizado con el c\u00f3digo <strong class="fc-sync-cod">' + formatear(c) + '</strong>' +
        ' \u00b7 <a href="#" data-fcs="enlace">Copiar enlace</a></p>' +
        '<p class="fc-sync-nota">Usalo en tus otros dispositivos. No lo compartas. \u00b7 <a href="#" data-fcs="salir">Desvincular</a> \u00b7 <a href="#" data-fcs="borrar">Borrar mi lista de la nube</a></p>';
    } else {
      sync =
        '<p class="fc-sync-linea"><i class="fa-solid fa-right-left"></i> <strong>' + (av ? '\u00bfUs\u00e1s otro dispositivo?' : 'Sincroniz\u00e1 tus concursos en todos tus dispositivos') + '</strong></p>' +
        '<div id="fc-sync-google" class="fc-sync-google"></div>' +
        '<details class="fc-sync-sincuenta"><summary>Usar un c\u00f3digo en vez de una cuenta</summary>' +
        '<div class="fc-sync-acciones"><button type="button" class="btn-borrar btn-verde" data-fcs="crear"><i class="fa-solid fa-lock"></i> Crear c\u00f3digo</button></div>' +
        '<form class="fc-sync-form" novalidate>' +
        '<input type="text" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="C\u00f3digo o enlace" aria-label="C\u00f3digo de sincronizaci\u00f3n">' +
        '<button type="submit" class="btn-borrar btn-gris">Ya tengo un c\u00f3digo</button>' +
        '</form></details>';
    }
    var paso2 = avisoPend && !a && !c && av.indexOf('fc-sync-google') !== -1;
    box.innerHTML = (av ? '<div class="fc-avisos">' + av + '</div>' : '')
      + (paso2 ? '' : '<div class="fc-sync-parte' + (av ? ' fc-sync-sep' : '') + '">' + sync + '</div>');
    if (!a && !c) montarBotonGoogle();
  }

  document.addEventListener('click', function (ev) {
    var b = ev.target.closest && ev.target.closest('#fc-sync-box [data-fcs]');
    if (!b) return;
    var acc = b.getAttribute('data-fcs');
    if (b.tagName === 'A') ev.preventDefault();
    if (acc === 'borrar') { borrarNube(); return; }
    if (acc === 'avisar') { activarAvisos(); return; }
    if (acc === 'noavisar') { desactivarAvisos(); return; }
    if (acc === 'avisocod') { avisoPend = false; vincularCodigo(nuevoCodigo(), 'aviso'); return; }
    if (acc === 'avisocancel') { avisoPend = false; pintar(); return; }
    if (acc === 'ahora') sincronizar(true);
    else if (acc === 'salir') desvincular();
    else if (acc === 'crear') vincularCodigo(nuevoCodigo(), true);
    else if (acc === 'enlace' && codigo()) copiar(enlaceCodigo(codigo()), 'Enlace copiado. Abrilo en tu otro dispositivo.');
  });

  document.addEventListener('submit', function (ev) {
    var f = ev.target;
    if (!f.classList || !f.classList.contains('fc-sync-form')) return;
    ev.preventDefault();
    var input = f.querySelector('input');
    // Códigos viejos de exportación (FCFAVS:...): se importan una vez con la función de la página
    var viejo = document.getElementById('campoCodigoFavs');
    if (/^\s*FCFAVS:/.test(input.value) && viejo && typeof window.importarCodigoFavs === 'function') {
      viejo.value = input.value.trim();
      window.importarCodigoFavs();
      return;
    }
    var c = normalizarCodigo(input.value);
    if (!c) { toast('Ese código no es válido. Revisalo.', 'warning'); input.focus(); return; }
    vincularCodigo(c, false);
  });

  function init() {
    var m = (location.hash || '').match(/fcsync=([A-Za-z0-9-]+)/);
    if (m) {
      try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {}
      var c = normalizarCodigo(m[1]);
      if (auth()) toast('Este dispositivo ya sincroniza con Google; no hace falta el código.', 'warning');
      else if (c && c !== codigo()) { vincularCodigo(c, false); return; }
    }
    pintar();
    if (vinculado()) { sincronizar(); osVincular(); }
  }

  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') empujarAlSalir();
    else if (vinculado() && Date.now() - ultimaSync > 60000) sincronizar();
  });
  window.addEventListener('pagehide', empujarAlSalir);

  window.addEventListener('load', function () {
    if (typeof idle === 'function') idle(init, 3000); else setTimeout(init, 500);
  });

  window.fcSync = { sincronizar: function () { return sincronizar(true); }, desvincular: desvincular };
})();
} catch (e) { console.error('[fc-concursos.js bloque 1]', e); }
//

/* ── bloque 2/2 · entradas del blog relacionadas en listados · solo si: location.pathname.indexOf('/p/concursos') !== -1 ── */
//
// ====== ENTRADAS DEL BLOG RELACIONADAS EN LISTADOS (p/concursos) ======
if (location.pathname.indexOf('/p/concursos') !== -1) try {
(function() {
  'use strict';
  var url = window.location.pathname;
  if (url.indexOf('/p/concursos') === -1) return;

  var blogUrl = 'https://www.finalescerrados.com';
  var cbName = '_prel_lst_' + Date.now();
  var feedSrc = blogUrl + '/feeds/posts/summary/-/Concursos%20literarios?alt=json-in-script&max-results=20&callback=' + cbName;

  function barajar(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
    }
    return arr;
  }

  function renderizar(posts) {
    if (posts.length === 0) return;

    var section = document.createElement('div');
    section.className = 'related-posts';
    var heading = document.createElement('h3');
    heading.className = 'related-posts-title';
    heading.textContent = 'Del blog';
    section.appendChild(heading);

    var grid = document.createElement('div');
    grid.className = 'related-posts-container';

    posts.forEach(function(post) {
      var card = document.createElement('a');
      card.href = post.link;
      card.className = 'related-post-card' + (post.image ? '' : ' related-post-card--noimg');
      card.target = '_self';

      if (post.image) {
        var imageDiv = document.createElement('div');
        imageDiv.className = 'related-post-image';
        var img = document.createElement('img');
        img.src = post.image;
        img.alt = post.title;
        imageDiv.appendChild(img);
        card.appendChild(imageDiv);
      }

      var contentDiv = document.createElement('div');
      contentDiv.className = 'related-post-content';

      if (!post.image) {
        var iconEl = document.createElement('span');
        iconEl.className = 'related-post-icon';
        iconEl.innerHTML = '<i class="fas fa-feather-alt"></i>';
        contentDiv.appendChild(iconEl);
      }

      var postTitle = document.createElement('h4');
      postTitle.className = 'related-post-title';
      postTitle.textContent = post.title;
      contentDiv.appendChild(postTitle);

      card.appendChild(contentDiv);
      grid.appendChild(card);
    });

    section.appendChild(grid);

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

    function registrarAdRelacionados() {
      var ins = adBeforeRelated.querySelector('ins.adsbygoogle');
      if (!ins) return;
      if (window.adObserver) {
        window.adObserver.observe(ins);
      } else {
        window.FC.pushAd(ins);
      }
    }

    idle(function() {
        var share = document.querySelector('.post-share');
        if (share && share.parentNode) {
            share.parentNode.insertBefore(adBeforeRelated, share.nextSibling);
            share.parentNode.insertBefore(section, adBeforeRelated.nextSibling);
            registrarAdRelacionados();
        } else {
            var container = document.querySelector('.entry-container');
            if (container) {
                container.appendChild(adBeforeRelated);
                container.appendChild(section);
                registrarAdRelacionados();
            }
        }
    });
  }

  window[cbName] = function(json) {
    delete window[cbName];
    var s = document.getElementById(cbName);
    if (s) s.parentNode.removeChild(s);
    if (!json || !json.feed || !json.feed.entry) return;

    var posts = [];
    json.feed.entry.forEach(function(entry) {
      var entryUrl = '';
      if (entry.link) {
        for (var i = 0; i < entry.link.length; i++) {
          if (entry.link[i].rel === 'alternate') { entryUrl = entry.link[i].href; break; }
        }
      }
      if (!entryUrl) return;
      var postImage = '';
      if (entry.media$thumbnail) {
        postImage = entry.media$thumbnail.url.replace(/\/s72-c/, '/s400-c');
      }
      posts.push({ title: entry.title.$t, link: entryUrl, image: postImage });
    });

    posts = barajar(posts).slice(0, 3);
    renderizar(posts);
  };

  var sc = document.createElement('script');
  sc.id = cbName;
  sc.fetchPriority = 'low'; // contenido debajo del fold, no crítico para el primer render
  sc.src = feedSrc;
  sc.async = true;
  sc.onerror = function() { delete window[cbName]; };
  idle(function () { document.body.appendChild(sc); });
})();
} catch (e) { console.error('[fc-concursos.js bloque 2]', e); }
//

/* ── clics que llegaron antes de que cargara este archivo (los guarda el stub inline del tema) ── */
if (window.fcFlushQ) { try { window.fcFlushQ(); } catch (e) { console.error(e); } }
