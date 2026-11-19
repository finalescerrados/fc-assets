/*! finalescerrados.com · fc-concursos.js · fc-assets v10.34 · sincronización de favoritos (Firebase) y relacionados de los listados.
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
  var K_PREFC = 'fc_os_prefc';   // copia local de la etiqueta pref_concursos ('1' / '0'; sin valor = no la tiene)
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
      osCola(function (OneSignal) { return osLogin(OneSignal, ext); });
    } catch (e) {}
  }
  // Login en OneSignal conservando las preferencias del navegador. Si el external_id ya existía (otro dispositivo,
  // o volvió a vincular), OneSignal pasa la suscripción a ese usuario y descarta las etiquetas del usuario anónimo
  // (probado: el anónimo tenía pref_concursos y pref_blog en 1 y después del login quedaron {}). Por eso se leen
  // antes y se le suman al usuario las pref_* que no tenga; las que ya tiene en el servidor no se tocan.
  // Una sola vez por página y external_id: todos los que llaman comparten la misma promesa.
  var loginEnCurso = null, loginExt = null;
  function osLogin(OneSignal, ext) {
    if (loginEnCurso && loginExt === ext) return loginEnCurso;
    loginExt = ext;
    var previo = {};
    try { if (!(OneSignal.User && OneSignal.User.externalId)) previo = OneSignal.User.getTags() || {}; } catch (e) {}   // solo del anónimo
    loginEnCurso = OneSignal.login(ext).then(function () {
      try { sessionStorage.setItem(K_OS, ext); } catch (e) {}
      return new Promise(function (ok) { setTimeout(ok, 1500); });   // el SDK trae del servidor las etiquetas del usuario
    }).then(function () {
      var ahora = {}, faltan = {}, n = 0;
      try { ahora = OneSignal.User.getTags() || {}; } catch (e) {}
      Object.keys(previo).forEach(function (k) {
        if (/^pref_/.test(k) && ahora[k] == null) { faltan[k] = String(previo[k]); n++; }
      });
      if (n && OneSignal.User && OneSignal.User.addTags) { try { OneSignal.User.addTags(faltan); } catch (e) {} }
      var t = {}, k;
      for (k in faltan) t[k] = faltan[k];
      for (k in ahora) t[k] = ahora[k];
      guardarPrefc(t);
      return t;
    });
    loginEnCurso.catch(function () { loginEnCurso = null; });
    return loginEnCurso;
  }
  // Guarda pref_concursos en localStorage para que el recuadro sepa si los avisos de concursos están activos.
  function guardarPrefc(t) {
    var antes = ls(K_PREFC), v = String(t.pref_concursos == null ? '' : t.pref_concursos);
    if (v === '1' || v === '0') lsSet(K_PREFC, v); else lsDel(K_PREFC);
    if (ls(K_PREFC) !== antes) pintar();
  }
  // Igual que osVincular, pero siempre (sin el "una vez por sesión") y sumando etiquetas al usuario identificado.
  // Primero login y después tags: si el usuario ya existía en OneSignal, lo anónimo no se le pasa.
  async function osVincularCon(tags) {
    try {
      var ext = await idExterno(); if (!ext) return;
      osCola(function (OneSignal) {
        return osLogin(OneSignal, ext).then(function () {   // lo elegido ahora pisa lo conservado
          if (tags && tags.pref_concursos != null) lsSet(K_PREFC, String(tags.pref_concursos));
          if (tags && OneSignal.User && OneSignal.User.addTags) return OneSignal.User.addTags(tags);
        });
      });
    } catch (e) {}
  }
  // logout() deja la suscripción del navegador en un usuario anónimo nuevo, sin etiquetas: sin las pref_* deja de
  // estar en los segmentos de los masivos (concursos, blog). Se leen antes y se le ponen al anónimo.
  function osDesvincular() {
    loginEnCurso = null; loginExt = null;
    try { sessionStorage.removeItem(K_OS); } catch (e) {}
    osCola(function (OneSignal) {
      var t = {}, pref = {}, n = 0;
      try { t = (OneSignal.User && OneSignal.User.getTags && OneSignal.User.getTags()) || {}; } catch (e) {}
      Object.keys(t).forEach(function (k) {
        if (/^pref_/.test(k) && t[k] !== '' && t[k] != null) { pref[k] = String(t[k]); n++; }
      });
      return OneSignal.logout().then(function () {
        if (!n || !OneSignal.User || !OneSignal.User.addTags) return;
        return new Promise(function (ok) { setTimeout(ok, 1000); }).then(function () { return OneSignal.User.addTags(pref); });
      });
    });
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
    if (vinculado() && Notification.permission === 'granted' && ls(K_OS_OFF) !== '1') return ls(K_PREFC) === '0' ? 'sinconcursos' : 'activo';
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
    if (est === 'sinconcursos') {
      return '<div class="fc-av-cta"><i class="fa-solid fa-bell fc-av-ico"></i><div>'
        + '<p class="fc-av-tit"><strong>Tus avisos est\u00e1n activados solo para el blog</strong></p>'
        + '<p class="fc-av-sub">Activ\u00e1 tambi\u00e9n los de concursos y te avisamos una semana antes y en los \u00faltimos d\u00edas de cada favorito.</p>'
        + '<button type="button" class="btn-borrar btn-verde" data-fcs="concursos"><i class="fa-solid fa-bell"></i> Avisarme de concursos</button>'
        + '</div></div>';
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
  async function pedirPermiso() {   // llamar dentro de un clic
    var permiso;
    try {
      if (window.OneSignal && OneSignal.Notifications && OneSignal.Notifications.requestPermission) {
        await OneSignal.Notifications.requestPermission();
        permiso = Notification.permission;
      } else {
        permiso = await Notification.requestPermission();
      }
    } catch (e) { permiso = Notification.permission; }
    if (permiso !== 'granted') return permiso;
    lsDel(K_OS_OFF);
    try { sessionStorage.removeItem(K_OS); } catch (e) {}
    osCola(function (OneSignal) {
      var ps = OneSignal.User && OneSignal.User.PushSubscription;
      if (ps && ps.optedIn === false) return ps.optIn();
    });
    return permiso;
  }
  async function activarAvisos() {
    if (await pedirPermiso() !== 'granted') { pintar(); return; }
    if (!vinculado()) { avisoPend = true; pintar(); return; }   // sin lista en la nube no hay a quién avisar: que elija Google o código
    osVincularCon({ pref_concursos: '1' });
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
      // Lo subido al salir (pend) todavía no está en la foto: si difiere de lo actual, es un cambio
      if (cur[id] === snap[id] && !(pend[id] && pend[id].v !== cur[id])) return;
      var p = cur[id].split('|');
      out[id] = { e: +p[0], t: marca(id, cur[id]) };
      if (p[1]) out[id].f = p[1];
      if (p[2]) out[id].r = p[2];
      if (p[3]) out[id].l = p[3];
      if (p[4]) { try { out[id].x = decodeURIComponent(p[4]); } catch (e) {} }
      n++;
    });
    // Bajas: lo que estaba en la foto o en lo pendiente y ya no está acá
    Object.keys(snap).concat(Object.keys(pend)).forEach(function (id) {
      if ((id in cur) || (id in out)) return;
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
    lsDel(K_AUTH); lsDel(K_COD); lsDel(K_SNAP); lsDel(K_PEND); lsDel(K_PREFC);
    try { sessionStorage.removeItem('fc_inv_ses'); } catch (e) {}   // si vuelve a guardar algo, se le ofrece de nuevo
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
  function iniciarGIS() {
    return cargarGIS().then(function () {
      if (!gisIniciado) {
        google.accounts.id.initialize({
          client_id: CLIENT_ID, callback: alVolverDeGoogle,
          auto_select: false, cancel_on_tap_outside: true, itp_support: true, use_fedcm_for_prompt: true
        });
        gisIniciado = true;
      }
    });
  }
  function montarBotonGoogle(el) {
    el = el || document.getElementById('fc-sync-google'); if (!el) return;
    // El iframe de Google es claro: con el sitio en oscuro (color-scheme: dark) el navegador le pinta un fondo
    // opaco y queda un rectángulo blanco detrás del botón. Con el mismo esquema que el iframe, el fondo es transparente.
    el.style.colorScheme = 'light';
    iniciarGIS().then(function () {
      google.accounts.id.renderButton(el, { theme: 'outline', size: 'large', shape: 'pill', text: 'continue_with', locale: 'es' });
    }).catch(function () { el.textContent = 'No se pudo cargar el botón de Google.'; });
  }
  // One Tap de Google en la página de favoritos: una vez por sesión, solo si hay algo que guardar
  var K_ONETAP = 'fc_onetap_ses', K_INV = 'fc_inv_ses';
  function sesion(k) { try { return sessionStorage.getItem(k) === '1'; } catch (e) { return true; } }
  function marcarSesion(k) { try { sessionStorage.setItem(k, '1'); } catch (e) {} }
  function oneTap() {
    if (vinculado() || sesion(K_ONETAP) || !hayFavoritos() || document.getElementById('fc-inv')) return;
    marcarSesion(K_ONETAP);
    iniciarGIS().then(function () { google.accounts.id.prompt(); }).catch(function () {});
  }
  function avisarVinculado(pidioAvisos) {
    if (pidioAvisos) { osVincularCon({ pref_concursos: '1' }); cerrarInvitacion(); }   // venía de "Avisarme antes del cierre"
    else if (puedePedirAvisos()) mostrarPreferencias('pedir');
    else { cerrarInvitacion(); if (avisosConcedidos()) revisarPrefs(); }
    try { window.dispatchEvent(new CustomEvent('fc-sync-vinculado')); } catch (e) {}
  }
  function avisosConcedidos() {
    return !esIOSsinApp() && ('Notification' in window) && Notification.permission === 'granted' && ls(K_OS_OFF) !== '1';
  }
  // Ya tenía las notificaciones activadas: si no tiene las de concursos (p. ej. eligió solo Blog en el cartel de
  // OneSignal), se le ofrece sumarlas sin volver a pedir el permiso.
  async function revisarPrefs() {
    try {
      var ext = await idExterno(); if (!ext) return;
      osCola(function (OneSignal) {
        return osLogin(OneSignal, ext).then(function (t) {
          var pc = t.pref_concursos == null ? '' : String(t.pref_concursos);
          if (pc === '0') mostrarPreferencias('guardar', t.pref_blog);   // eligió explícitamente sin concursos
          else if (pc !== '1') {   // sin etiqueta (suscriptor viejo): ya aceptó avisos y concursos es obligatorio al sincronizar
            lsSet(K_PREFC, '1');
            if (OneSignal.User && OneSignal.User.addTags) OneSignal.User.addTags({ pref_concursos: '1' });
          }
        });
      });
    } catch (e) {}
  }
  // Solo si el navegador todavía no respondió el permiso (ni lo aceptó ni lo bloqueó)
  function puedePedirAvisos() {
    return !esIOSsinApp() && ('Notification' in window) && ('serviceWorker' in navigator) && Notification.permission === 'default';
  }

  // ---------- Invitación al guardar algo sin estar sincronizado (una vez por sesión) ----------
  var ICO_NUBE = '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17.5 19H7a5 5 0 1 1 1.1-9.9A6 6 0 0 1 19.5 11a4 4 0 0 1-2 8z"/><path d="M12 16v-5M9.5 13.5 12 11l2.5 2.5"/></svg>';
  var ICO_CAMPANA = '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg>';
  var CSS_INV = '#fc-inv{position:fixed;left:50%;bottom:16px;transform:translate(-50%,24px);opacity:0;transition:opacity .25s,transform .25s;z-index:99990;width:calc(100% - 24px);max-width:400px;box-sizing:border-box;background:#fff;color:#1a1a1a;border-radius:16px;box-shadow:0 10px 36px rgba(0,0,0,.28);padding:16px 16px 12px;font-family:inherit;line-height:1.45}'
    + '#fc-inv.fc-inv-ver{opacity:1;transform:translate(-50%,0)}'
    + '#fc-inv .fc-inv-cab{display:flex;gap:12px;align-items:flex-start;padding-right:22px}'
    + '#fc-inv .fc-inv-ico{color:#CD2122;flex-shrink:0;margin-top:2px}'
    + '#fc-inv strong{display:block;font-size:16px;margin-bottom:2px}'
    + '#fc-inv p{margin:0;font-size:14px;color:#4a4a4a}'
    + '#fc-inv .fc-inv-g{min-height:44px;margin:12px 0 6px;display:flex;justify-content:center}'
    + '#fc-inv .fc-inv-pie{display:flex;justify-content:space-between;align-items:center;font-size:13px}'
    + '#fc-inv .fc-inv-pie a,#fc-inv .fc-inv-pie button{color:#5f5f5f;background:none;border:0;padding:6px 0;font:inherit;cursor:pointer;text-decoration:underline}'
    + '#fc-inv .fc-inv-ops{display:flex;flex-direction:column;gap:8px;margin:12px 0}'
    + '#fc-inv .fc-inv-op{display:flex;gap:10px;align-items:flex-start;font-size:14px;line-height:1.4;cursor:pointer}'
    + '#fc-inv .fc-inv-fijo{cursor:default}'
    + '#fc-inv .fc-inv-op input{width:18px;height:18px;margin:1px 0 0;flex-shrink:0;accent-color:#CD2122}'
    + '#fc-inv .fc-inv-btn{display:block;width:100%;min-height:44px;border:0;border-radius:22px;background:#CD2122;color:#fff;font:inherit;font-size:15px;font-weight:700;cursor:pointer}'
    + '#fc-inv .fc-inv-pie-der{justify-content:flex-end}'
    + '#fc-inv .fc-inv-x{position:absolute;top:8px;right:8px;width:32px;height:32px;border:0;background:none;color:#5f5f5f;font-size:22px;line-height:1;cursor:pointer;border-radius:50%}'
    + 'body.dark-mode #fc-inv{background:#1f1f1f;color:#f1f1f1;box-shadow:0 10px 36px rgba(0,0,0,.6)}'
    + 'body.dark-mode #fc-inv p{color:#c8c8c8}'
    + 'body.dark-mode #fc-inv .fc-inv-pie a,body.dark-mode #fc-inv .fc-inv-pie button,body.dark-mode #fc-inv .fc-inv-x{color:#b0b0b0}'
    + '@media (prefers-reduced-motion:reduce){#fc-inv{transition:none}}';
  function cerrarInvitacion() {
    var c = document.getElementById('fc-inv'); if (!c) return;
    c.classList.remove('fc-inv-ver');
    var t = document.getElementById('toast-container'); if (t) t.style.bottom = '';
    setTimeout(function () { if (c.parentNode) c.parentNode.removeChild(c); }, 300);
  }
  function tarjeta(html) {   // crea (o reutiliza) la tarjeta flotante y le pone el contenido
    if (!document.getElementById('fc-inv-css')) {
      var st = document.createElement('style'); st.id = 'fc-inv-css'; st.textContent = CSS_INV; document.head.appendChild(st);
    }
    var c = document.getElementById('fc-inv'), nueva = !c;
    if (nueva) {
      c = document.createElement('div');
      c.id = 'fc-inv'; c.setAttribute('role', 'dialog'); c.setAttribute('aria-labelledby', 'fc-inv-tit');
      c.addEventListener('click', function (ev) {
        var b = ev.target.closest && ev.target.closest('[data-inv]'); if (!b) return;
        var acc = b.getAttribute('data-inv');
        if (acc === 'cerrar') cerrarInvitacion();
        else if (acc === 'avisos') activarDesdeTarjeta();
        else if (acc === 'guardar') guardarDesdeTarjeta();
      });
      document.body.appendChild(c);
    }
    c.innerHTML = html;
    requestAnimationFrame(function () {
      c.classList.add('fc-inv-ver');
      var t = document.getElementById('toast-container'); if (t) t.style.bottom = (c.offsetHeight + 28) + 'px';
    });
    return c;
  }
  // modo 'pedir': todav\u00eda no respondi\u00f3 el permiso; 'guardar': ya lo concedi\u00f3, solo se eligen las etiquetas
  function mostrarPreferencias(modo, blogActual) {
    var guardar = modo === 'guardar', blogOn = String(blogActual) !== '0';
    var chk = function (tag, txt, sub, fijo) {   // fijo: marcado y sin poder desmarcar (es el motivo de sincronizar)
      var on = fijo || tag !== 'pref_blog' || blogOn;
      return '<label class="fc-inv-op' + (fijo ? ' fc-inv-fijo' : '') + '"><input type="checkbox" data-tag="' + tag + '"' + (on ? ' checked' : '') + (fijo ? ' disabled' : '') + '> <span><b>' + txt + '</b> ' + sub + '</span></label>';
    };
    tarjeta('<button type="button" class="fc-inv-x" data-inv="cerrar" aria-label="Cerrar">\u00d7</button>'
      + '<div class="fc-inv-cab"><span class="fc-inv-ico">' + ICO_CAMPANA + '</span><div>'
      + '<strong id="fc-inv-tit">\u00a1Listo, tus concursos est\u00e1n en la nube!</strong>'
      + '<p>' + (guardar ? 'Ya ten\u00e9s los avisos activados. \u00bfQu\u00e9 quer\u00e9s recibir?' : '\u00bfQu\u00e9 quer\u00e9s que te avisemos?') + '</p></div></div>'
      + '<div class="fc-inv-ops">'
      + chk('pref_concursos', 'Concursos:', 'tus favoritos antes del cierre y los resultados de donde participaste', true)
      + chk('pref_blog', 'Blog:', 'art\u00edculos nuevos')
      + '</div>'
      + '<button type="button" class="fc-inv-btn" data-inv="' + (guardar ? 'guardar' : 'avisos') + '">' + (guardar ? 'Guardar' : 'Activar avisos') + '</button>'
      + '<div class="fc-inv-pie fc-inv-pie-der"><button type="button" data-inv="cerrar">Ahora no</button></div>');
  }
  function tagsDeTarjeta(c) {
    var tags = {};
    [].forEach.call(c.querySelectorAll('input[data-tag]'), function (i) { tags[i.getAttribute('data-tag')] = i.checked ? '1' : '0'; });
    tags.pref_concursos = '1';   // siempre: es lo que se activa al sincronizar
    return tags;
  }
  function avisoListo(tags) {
    toast('Listo: te vamos a avisar antes de que cierren tus favoritos' + (tags.pref_blog === '1' ? ' y cuando haya art\u00edculos nuevos' : ''));
  }
  function guardarDesdeTarjeta() {
    var c = document.getElementById('fc-inv'); if (!c) return;
    var tags = tagsDeTarjeta(c);
    cerrarInvitacion();
    osVincularCon(tags);
    avisoListo(tags);
    pintar();
  }
  async function activarDesdeTarjeta() {
    var c = document.getElementById('fc-inv'); if (!c) return;
    var tags = tagsDeTarjeta(c);
    var permiso = await pedirPermiso();
    cerrarInvitacion();
    if (permiso !== 'granted') {
      if (permiso === 'denied') toast('El navegador bloque\u00f3 los avisos. Pod\u00e9s habilitarlos desde el candado de la barra de direcciones.', 'warning');
      pintar(); return;
    }
    osVincularCon(tags);
    avisoListo(tags);
    pintar();
  }
  function invitar(estadoNuevo) {
    if (vinculado() || sesion(K_INV) || document.getElementById('fc-inv')) return;
    if (document.documentElement.classList.contains('fc-mazo')) return;   // Flechazo tiene su propia invitación al final
    marcarSesion(K_INV);
    var part = +estadoNuevo === 2;
    tarjeta('<button type="button" class="fc-inv-x" data-inv="cerrar" aria-label="Cerrar">\u00d7</button>'
      + '<div class="fc-inv-cab"><span class="fc-inv-ico">' + ICO_NUBE + '</span><div>'
      + '<strong id="fc-inv-tit">' + (part ? 'No pierdas tu historial de participaciones' : 'Guard\u00e1 tus concursos en la nube') + '</strong>'
      + '<p>Por ahora ' + (part ? 'est\u00e1' : 'est\u00e1n') + ' solo en este navegador: si lo borr\u00e1s o cambi\u00e1s de celu, se pierde' + (part ? '' : 'n') + '. Con Google ' + (part ? 'lo' : 'los') + ' ten\u00e9s en todos tus dispositivos.</p>'
      + '</div></div>'
      + '<div class="fc-inv-g" id="fc-inv-g"></div>'
      + '<div class="fc-inv-pie"><a href="/p/mis-concursos-favoritos.html#fc-sync-box">Prefiero un c\u00f3digo, sin cuenta</a>'
      + '<button type="button" data-inv="cerrar">Ahora no</button></div>');
    montarBotonGoogle(document.getElementById('fc-inv-g'));
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
      var pidio = avisoPend;
      toast(pidio ? 'Listo: sincronizado con tu cuenta de Google. Te vamos a avisar antes de que cierren tus favoritos'
        : 'Listo: este dispositivo quedó sincronizado con tu cuenta de Google');
      avisoPend = false;
      try { sessionStorage.removeItem(K_OS); } catch (e) {}
      osVincular();
      pintar();
      avisarVinculado(pidio);
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
    avisarVinculado(creado === 'aviso');
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
        '<p class="fc-sync-linea"><i class="fa-solid fa-right-left"></i> <strong>Guard\u00e1 tus concursos en la nube</strong></p>' +
        '<p class="fc-av-sub">Hoy est\u00e1n solo en este navegador. Con Google los ves en el celu y en la compu, y no se pierden.</p>' +
        '<div id="fc-sync-google" class="fc-sync-google"></div>' +
        '<details class="fc-sync-sincuenta"><summary>\u00bfPrefer\u00eds no usar Google? Us\u00e1 un c\u00f3digo</summary>' +
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
    if (acc === 'concursos') { osVincularCon({ pref_concursos: '1' }); lsSet(K_PREFC, '1'); toast('Listo: te vamos a avisar antes de que cierren tus favoritos'); pintar(); return; }
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
    else if (document.getElementById('lista-favoritos')) oneTap();
  }

  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') empujarAlSalir();
    else if (vinculado() && Date.now() - ultimaSync > 60000) sincronizar();
  });
  window.addEventListener('pagehide', empujarAlSalir);

  window.addEventListener('load', function () {
    if (typeof idle === 'function') idle(init, 3000); else setTimeout(init, 500);
  });

  window.fcSync = {
    sincronizar: function () { return sincronizar(true); }, desvincular: desvincular,
    vinculado: vinculado, invitar: invitar, botonGoogle: montarBotonGoogle
  };
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
