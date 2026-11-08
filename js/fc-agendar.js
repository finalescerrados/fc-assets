/*! finalescerrados.com · fc-agendar.js · fc-assets v10.18 · botón Agendar (Google, Outlook, .ics) de fichas y listados. Antes inline en ConcursosPost.py y fx.py.
   Cada sentencia ejecutable va en su propio try/catch: si un bloque falla, los demás siguen corriendo. */

/* ── bloque 1/1 · addToCalendarUniversal y menú ── */
function addToCalendarUniversal(link, ev) {
    if (ev) { ev.preventDefault(); ev.stopPropagation(); }
    var f = (link.dataset.fecha || '').split('/'); // dd/mm/yyyy
    if (f.length !== 3) return;
    var d = new Date(Date.UTC(+f[2], +f[1] - 1, +f[0]));
    if (isNaN(d) || d.getUTCDate() !== +f[0]) return; // rechaza fechas inexistentes (31/02)
    var anchor = (ev && ev.currentTarget && ev.currentTarget !== link) ? ev.currentTarget : link;
    var app = null;
    try { app = localStorage.getItem('fc_agendar_app'); } catch (e) {}
    if (app && fcAgApps()[app]) { fcAgEjecutar(app, link); fcAgToast(app, link, anchor); }
    else fcAgMenu(link, anchor);
}

function fcAgNombreCorto(app) {
    return { google: 'Google Calendar', apple: 'Apple Calendar', outlook: 'Outlook.com', o365: 'Outlook', ics: '.ics' }[app] || app;
}

function fcAgApps() {
    return {
        google: 'Google Calendar',
        apple: 'Apple Calendar (iPhone, Mac)',
        outlook: 'Outlook.com',
        o365: 'Outlook (trabajo / Microsoft 365)',
        ics: 'Descargar archivo .ics'
    };
}

function fcAgDatos(link) {
    var f = link.dataset.fecha.split('/');
    var d = new Date(Date.UTC(+f[2], +f[1] - 1, +f[0]));
    var next = new Date(d.getTime() + 86400000);   // fin exclusivo en eventos de dia completo
    var pad = function (n) { return String(n).padStart(2, '0'); };
    var nombre = link.dataset.nombre || 'Concurso literario';
    var url = link.dataset.url || location.href;
    return {
        d: d, next: next, pad: pad, nombre: nombre, url: url,
        ymd: function (x) { return x.getUTCFullYear() + pad(x.getUTCMonth() + 1) + pad(x.getUTCDate()); },
        iso: function (x) { return x.getUTCFullYear() + '-' + pad(x.getUTCMonth() + 1) + '-' + pad(x.getUTCDate()); },
        detalle: 'Cierra el ' + pad(+f[0]) + '/' + pad(+f[1]) + '/' + f[2] + '. Bases, premio y requisitos: ' + url
    };
}

function fcAgEjecutar(app, link) {
    var x = fcAgDatos(link);
    if (app === 'google') {
        window.open('https://calendar.google.com/calendar/render?action=TEMPLATE'
            + '&text=' + encodeURIComponent(x.nombre)
            + '&dates=' + x.ymd(x.d) + '/' + x.ymd(x.next)
            + '&details=' + encodeURIComponent(x.detalle), '_blank', 'noopener');
        return;
    }
    if (app === 'outlook' || app === 'o365') {
        var base = app === 'outlook' ? 'https://outlook.live.com' : 'https://outlook.office.com';
        window.open(base + '/calendar/0/deeplink/compose?path=%2Fcalendar%2Faction%2Fcompose&rru=addevent&allday=true'
            + '&subject=' + encodeURIComponent(x.nombre)
            + '&startdt=' + x.iso(x.d) + '&enddt=' + x.iso(x.next)
            + '&body=' + encodeURIComponent(x.detalle), '_blank', 'noopener');
        return;
    }
    // apple / ics: archivo .ics con avisos 7 dias y 1 dia antes
    var esc = function (t) { return String(t).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n'); };
    var fold = function (line) {                    // RFC 5545: max. 75 octetos por linea
        var enc = new TextEncoder(), out = [], cur = '', len = 0;
        for (var ch of line) {
            var b = enc.encode(ch).length;
            if (len + b > (out.length ? 74 : 75)) { out.push(cur); cur = ch; len = b; } else { cur += ch; len += b; }
        }
        out.push(cur);
        return out.join('\r\n ');
    };
    var slug = String(x.nombre).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
        .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'concurso';
    var now = new Date();
    var stamp = x.ymd(now) + 'T' + x.pad(now.getUTCHours()) + x.pad(now.getUTCMinutes()) + x.pad(now.getUTCSeconds()) + 'Z';
    var lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Finales Cerrados//Concursos//ES', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
        'BEGIN:VEVENT',
        'UID:' + slug + '-' + x.ymd(x.d) + '@finalescerrados.com',
        'DTSTAMP:' + stamp,
        'DTSTART;VALUE=DATE:' + x.ymd(x.d),
        'DTEND;VALUE=DATE:' + x.ymd(x.next),
        'SUMMARY:' + esc(x.nombre),
        'DESCRIPTION:' + esc(x.detalle),
        'URL:' + x.url,
        'TRANSP:TRANSPARENT'];
    [[7, 'Faltan 7 d\u00edas'], [1, 'Falta 1 d\u00eda']].forEach(function (a) {
        lines.push('BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:' + esc(a[1] + ': ' + x.nombre + '. Revis\u00e1 las bases.'),
            'TRIGGER:-P' + a[0] + 'D', 'END:VALARM');
    });
    lines.push('END:VEVENT', 'END:VCALENDAR');
    var blob = new Blob([lines.map(fold).join('\r\n') + '\r\n'], { type: 'text/calendar;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'cierre-' + slug + '.ics';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
}

function fcAgEstilos() {
    if (document.getElementById('fc-ag-css')) return;
    var st = document.createElement('style');
    st.id = 'fc-ag-css';
    st.textContent =
        '.fc-ag-menu{position:absolute;z-index:99999;background:#fff;border:1px solid #ddd;border-radius:12px;box-shadow:0 8px 28px rgba(0,0,0,.2);padding:6px;width:270px;max-width:calc(100vw - 16px);font-size:15px;line-height:1.3;text-align:left}'
        + '.fc-ag-menu .fc-ag-t{font-weight:700;padding:8px 10px 6px;color:#333}'
        + 'body .fc-ag-menu button.fc-ag-op{display:block!important;width:100%!important;text-align:left!important;background:none!important;border:0!important;padding:10px!important;margin:0!important;border-radius:8px!important;cursor:pointer;font:inherit!important;color:#222!important;text-transform:none!important;box-shadow:none!important}'
        + 'body .fc-ag-menu button.fc-ag-op:hover,body .fc-ag-menu button.fc-ag-op:focus{background:#eef3f7!important;outline:none}'
        + '.fc-ag-menu label{display:flex;gap:8px;align-items:center;padding:8px 10px 6px;font-size:13px;color:#555;border-top:1px solid #eee;margin-top:4px;cursor:pointer}'
        + '.fc-ag-toast{position:fixed;left:50%;bottom:20px;transform:translateX(-50%);background:#333;color:#fff;padding:10px 14px;border-radius:10px;z-index:99999;font-size:14px;display:flex;gap:12px;align-items:center;box-shadow:0 6px 20px rgba(0,0,0,.25);max-width:calc(100vw - 24px)}'
        + 'body .fc-ag-toast button{background:none!important;border:1px solid #999!important;color:#fff!important;border-radius:6px!important;padding:3px 10px!important;cursor:pointer;font:inherit!important}'
        + 'body.dark-mode .fc-ag-menu{background:#1f1f1f!important;border-color:#3a3a3a!important}'
        + 'body.dark-mode .fc-ag-menu .fc-ag-t,body.dark-mode .fc-ag-menu button.fc-ag-op{color:#e0e0e0!important}'
        + 'body.dark-mode .fc-ag-menu button.fc-ag-op:hover,body.dark-mode .fc-ag-menu button.fc-ag-op:focus{background:#2c3a46!important}'
        + 'body.dark-mode .fc-ag-menu label{color:#bbb!important;border-color:#333!important}'
        + '@media (max-width:600px){.fc-ag-menu{position:fixed!important;left:8px!important;right:8px!important;bottom:8px!important;top:auto!important;width:auto!important;max-width:none!important}}';
    document.head.appendChild(st);
}

function fcAgCerrar() {
    var m = document.getElementById('fc-ag-menu');
    if (m) m.remove();
    document.removeEventListener('click', fcAgFuera, true);
    document.removeEventListener('keydown', fcAgTecla, true);
}
function fcAgFuera(e) { var m = document.getElementById('fc-ag-menu'); if (m && !m.contains(e.target)) fcAgCerrar(); }
function fcAgTecla(e) { if (e.key === 'Escape') fcAgCerrar(); }

function fcAgMenu(link, anchor) {
    fcAgEstilos();
    fcAgCerrar();
    var apps = fcAgApps();
    var m = document.createElement('div');
    m.id = 'fc-ag-menu';
    m.className = 'fc-ag-menu';
    m.setAttribute('role', 'menu');
    var t = document.createElement('div');
    t.className = 'fc-ag-t';
    t.textContent = 'Agendar el cierre en\u2026';
    m.appendChild(t);
    var lbl = document.createElement('label');
    var chk = document.createElement('input');
    chk.type = 'checkbox';
    chk.checked = true;
    lbl.appendChild(chk);
    lbl.appendChild(document.createTextNode('Recordar mi elecci\u00f3n'));
    Object.keys(apps).forEach(function (k) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'fc-ag-op';
        b.setAttribute('role', 'menuitem');
        b.textContent = apps[k];
        b.addEventListener('click', function (e) {
            e.stopPropagation();
            if (chk.checked) { try { localStorage.setItem('fc_agendar_app', k); } catch (er) {} }
            fcAgCerrar();
            fcAgEjecutar(k, link);
        });
        m.appendChild(b);
    });
    m.appendChild(lbl);
    document.body.appendChild(m);
    var r = anchor.getBoundingClientRect();
    var left = Math.min(window.scrollX + r.left, window.scrollX + document.documentElement.clientWidth - m.offsetWidth - 8);
    m.style.left = Math.max(window.scrollX + 8, left) + 'px';
    m.style.top = (window.scrollY + r.bottom + 6) + 'px';
    var primero = m.querySelector('button.fc-ag-op');
    if (primero) primero.focus({ preventScroll: true });
    setTimeout(function () {
        document.addEventListener('click', fcAgFuera, true);
        document.addEventListener('keydown', fcAgTecla, true);
    }, 0);
}

function fcAgToast(app, link, anchor) {
    fcAgEstilos();
    var viejo = document.getElementById('fc-ag-toast');
    if (viejo) viejo.remove();
    var t = document.createElement('div');
    t.id = 'fc-ag-toast';
    t.className = 'fc-ag-toast';
    t.setAttribute('role', 'status');
    var s = document.createElement('span');
    s.textContent = app === 'ics' ? 'Archivo .ics descargado' : 'Agendando en ' + fcAgNombreCorto(app);
    var b = document.createElement('button');
    b.type = 'button';
    b.textContent = 'Cambiar';
    b.addEventListener('click', function (e) {
        e.stopPropagation();
        try { localStorage.removeItem('fc_agendar_app'); } catch (er) {}
        t.remove();
        fcAgMenu(link, anchor);
    });
    t.appendChild(s);
    t.appendChild(b);
    document.body.appendChild(t);
    setTimeout(function () { if (t.parentNode) t.remove(); }, 6000);
}

/* ── clics que llegaron antes de que cargara este archivo (los guarda el stub inline del tema) ── */
if (window.fcFlushQ) { try { window.fcFlushQ(); } catch (e) { console.error(e); } }
