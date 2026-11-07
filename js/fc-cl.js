/*! finalescerrados.com · fc-cl.js · fc-assets v10.16 · bloques que antes estaban inline en theme-parcheado.xml (2026-11-07).
   Cada sentencia ejecutable va en su propio try/catch: si un bloque falla, los demás siguen corriendo (como cuando eran <script> separados). */

/* ── bloque 1/3 · antes en la línea 6548 del tema · // ====== PÁGINAS RELACIONADAS (p/cl-) ====== ── */
//
// ====== PÁGINAS RELACIONADAS (p/cl-) ======
try {
(function() {
  'use strict';
  var url = window.location.href;
  if (url.indexOf('/p/cl-') === -1) return;

  var pais = '';
  var genero = '';

  var rows = document.querySelectorAll('.recuadro-concurso table tr');
  rows.forEach(function(tr) {
    var tds = tr.querySelectorAll('td');
    if (tds.length < 2) return;
    var icon = tds[0].querySelector('i');
    if (!icon) return;
    var cls = icon.className;
    var val = tds[1].textContent.trim().toLowerCase();
    if (cls.indexOf('fa-map-marker') !== -1) pais = val.split(/[,(]/)[0].trim();
    if (cls.indexOf('fa-tags') !== -1) genero = val.split(/[,(]/)[0].trim();
  });

  if (!pais && !genero) return;

  var blogUrl = 'https://www.finalescerrados.com';
  var currentUrl = url.split('?')[0].replace(/\/$/, '');
  var iconos = ['fa-trophy','fa-award','fa-medal','fa-star','fa-crown','fa-feather-alt','fa-pen-nib','fa-scroll'];

  function renderizar(items) {
    if (items.length === 0) return;

    var section = document.createElement('div');
    section.className = 'related-posts';
    var heading = document.createElement('h3');
    heading.className = 'related-posts-title';
    heading.textContent = 'Concursos relacionados';
    section.appendChild(heading);

    var grid = document.createElement('div');
    grid.className = 'related-posts-container';

    items.forEach(function(item) {
      var card = document.createElement('a');
      card.href = item.url;
      card.className = 'related-post-card related-post-card--noimg';

      var content = document.createElement('div');
      content.className = 'related-post-content';

      var iconEl = document.createElement('span');
      iconEl.className = 'related-post-icon';
      var icono = iconos[Math.floor(Math.random() * iconos.length)];
      iconEl.innerHTML = '<i class="fas ' + icono + '"></i>';
      content.appendChild(iconEl);

      var title = document.createElement('h4');
      title.className = 'related-post-title';
      title.textContent = item.title;
      content.appendChild(title);

      card.appendChild(content);
      grid.appendChild(card);
    });

    section.appendChild(grid);

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
        var share = document.querySelector('.post-share');
        if (share && share.parentNode) {
            share.parentNode.insertBefore(adBeforeRelated, share.nextSibling);
            window.FC.pushAd(adBeforeRelated.querySelector('ins.adsbygoogle'));
            share.parentNode.insertBefore(section, adBeforeRelated.nextSibling);
        } else {
            var container = document.querySelector('.entry-container');
            if (container) {
                container.appendChild(adBeforeRelated);
                window.FC.pushAd(adBeforeRelated.querySelector('ins.adsbygoogle'));
                container.appendChild(section);
            }
        }
    });
  }

  var cbName = '_prel_cb_' + Date.now();
  var feedSrc = blogUrl + '/feeds/pages/summary?alt=json-in-script&max-results=50&q=' + encodeURIComponent(pais || genero) + '&callback=' + cbName;

  window[cbName] = function() {
    var json = arguments[0];
    delete window[cbName];
    var s = document.getElementById(cbName);
    if (s) s.parentNode.removeChild(s);
    if (!json || !json.feed || !json.feed.entry) return;

    var scored = [];
    json.feed.entry.forEach(function(entry) {
      var entryUrl = '';
      for (var i = 0; i < entry.link.length; i++) {
        if (entry.link[i].rel === 'alternate') { entryUrl = entry.link[i].href; break; }
      }
      if (!entryUrl) return;
      if (entryUrl.indexOf('/p/cl-') === -1) return;
      if (entryUrl.split('?')[0].replace(/\/$/, '') === currentUrl) return;

      var score = 0;
      var txt = entry.title.$t.toLowerCase();
      if (pais   && txt.indexOf(pais)   !== -1) score += 2;
      if (genero && txt.indexOf(genero) !== -1) score += 2;
      if (score === 0) score = 1;

      scored.push({ title: entry.title.$t, url: entryUrl, score: score });
    });

    scored.sort(function(a, b) { return b.score - a.score; });
    renderizar(scored.slice(0, 3));
  };

  var sc = document.createElement('script');
  sc.id = cbName;
  sc.fetchPriority = 'low'; // contenido debajo del fold, no crítico para el primer render
  sc.src = feedSrc;
  sc.async = true;
  sc.onerror = function() { delete window[cbName]; };
  idle(function () { document.body.appendChild(sc); });
})();
} catch (e) { console.error('[fc-cl.js bloque 1]', e); }
//

/* ── bloque 2/3 · antes en la línea 7137 del tema · (function() { ── */
//
try {
(function() {

  if (window.location.pathname.indexOf('/p/cl-') === -1) return;

  var enlaces = [
    { texto: 'Todos los concursos', url: '/p/concursos.html', icono: 'fa-infinity' },
    { texto: 'Populares', url: '/p/concursos-literarios-mas-populares-hoy.html', icono: 'fa-fire' },
    { texto: 'Nuevos', url: '/p/concursos-literarios-agregados-esta.html', icono: 'fa-calendar-week' },
    { texto: 'Calendario', url: '/p/concursos-literarios-calendario.html', icono: 'fa-calendar-alt' },
    { texto: 'Abiertos a todos', url: '/p/concursos-literarios-abiertos-todos.html', icono: 'fa-users' },
    { texto: 'Envío electrónico', url: '/p/concursos-literarios-que-permiten-envio.html', icono: 'fa-wifi' }
  ];

  function posicionarPopover(popover, ancla) {
    var rect = ancla.getBoundingClientRect();
    var top = rect.bottom + window.scrollY + 8;
    var left = rect.left + window.scrollX;

    // evitar que se salga por la derecha en mobile
    var maxLeft = window.scrollX + document.documentElement.clientWidth - popover.offsetWidth - 12;
    if (left > maxLeft) left = Math.max(window.scrollX + 12, maxLeft);

    popover.style.top = top + 'px';
    popover.style.left = left + 'px';
  }

  function mostrarPopover(ancla) {
    if (document.getElementById('fc-concurso-cerrado-popover')) return;

    var popover = document.createElement('div');
    popover.id = 'fc-concurso-cerrado-popover';
    popover.className = 'fc-popover-card';
    popover.setAttribute('role', 'dialog');
    popover.setAttribute('aria-label', 'Convocatoria cerrada');

    var closeBtn = document.createElement('button');
    closeBtn.className = 'fc-popover-close';
    closeBtn.innerHTML = '&times;';
    closeBtn.setAttribute('aria-label', 'Cerrar');
    closeBtn.onclick = cerrarPopover;
    popover.appendChild(closeBtn);

    var titulo = document.createElement('h3');
    titulo.className = 'fc-popover-title';
    titulo.textContent = '⏰ Convocatoria cerrada';
    popover.appendChild(titulo);

    var mensaje = document.createElement('p');
    mensaje.className = 'fc-popover-text';
    mensaje.textContent = 'Este concurso ya no acepta trabajos. Mirá otras convocatorias abiertas:';
    popover.appendChild(mensaje);

    var lista = document.createElement('ul');
    lista.className = 'fc-popover-links';
    enlaces.forEach(function(item) {
      var li = document.createElement('li');
      var a = document.createElement('a');
      a.href = item.url;
      a.innerHTML = '<i class="fas ' + item.icono + '"></i> ' + item.texto;
      li.appendChild(a);
      lista.appendChild(li);
    });
    popover.appendChild(lista);

    document.body.appendChild(popover);
    posicionarPopover(popover, ancla);

    // listeners de cierre
	document.addEventListener('click', clickAfuera, true);
    document.addEventListener('keydown', escKey);
    window.addEventListener('resize', onReposicionarThrottled);
    window.addEventListener('scroll', onReposicionarThrottled, { passive: true });

    var reposicionarTicking = false;
    function onReposicionar() { posicionarPopover(popover, ancla); }
    function onReposicionarThrottled() {
      if (reposicionarTicking) return;
      reposicionarTicking = true;
      requestAnimationFrame(function() {
        onReposicionar();
        reposicionarTicking = false;
      });
    }
    popover._onReposicionar = onReposicionarThrottled;
  }

  function clickAfuera(e) {
    var popover = document.getElementById('fc-concurso-cerrado-popover');
    if (!popover) return;
    if (!popover.contains(e.target) && e.target.id !== 'fav-badge-widget' && !e.target.closest('#fav-badge-widget')) {
      cerrarPopover();
    }
  }

  function escKey(e) {
    if (e.key === 'Escape') cerrarPopover();
  }

  function cerrarPopover() {
    var popover = document.getElementById('fc-concurso-cerrado-popover');
    if (!popover) return;
    document.removeEventListener('click', clickAfuera, true);
    document.removeEventListener('keydown', escKey);
    window.removeEventListener('resize', popover._onReposicionar);
    window.removeEventListener('scroll', popover._onReposicionar);
    popover.remove();
  }

  function initBadge(link) {
    var fechaStr = link.getAttribute('data-fecha');
    if (!fechaStr) return;
    if (link.getAttribute('data-badge') === 'ok') return;

    var partes = fechaStr.split('/');
    if (partes.length !== 3) return;

    var dia = parseInt(partes[0], 10);
    var mes = parseInt(partes[1], 10) - 1;
    var anio = parseInt(partes[2], 10);

    var fechaCierre = new Date(anio, mes, dia, 23, 59, 59);
    var hoy = new Date();

    var td = link.parentNode.nextElementSibling;
    if (!td) return;

    var badge = document.createElement('span');
    badge.id = 'fav-badge-widget';
    badge.className = 'fav-badge';

    var dotBase = 'display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:6px;';

    if (hoy > fechaCierre) {
      badge.className += ' fav-badge--warn';
      badge.style.cssText = 'display:inline-block;font-size:11px;font-weight:600;padding:1px 7px;border-radius:99px;margin-left:10px;vertical-align:middle;background:#c0392b;border:1px solid #e74c3c;color:#fff;cursor:pointer;';
      badge.innerHTML = "<span style='" + dotBase + "background:#b45f06;'></span>Cerrado";
      badge.setAttribute('tabindex', '0');
      badge.setAttribute('aria-label', 'Convocatoria cerrada, ver alternativas');

      td.appendChild(badge);
      link.setAttribute('data-badge', 'ok');

      badge.addEventListener('click', function(e) {
        e.stopPropagation();
        mostrarPopover(badge);
      });
      badge.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          mostrarPopover(badge);
        }
      });

      // Auto-mostrar una sola vez, con delay corto, sin bloquear lectura
      setTimeout(function() { mostrarPopover(badge); }, 4000);

    } else {
      badge.className += ' fav-badge--ok';
      badge.style.cssText = 'display:inline-block;font-size:11px;font-weight:600;padding:1px 7px;border-radius:99px;margin-left:10px;vertical-align:middle;background:#e6f4ea;color:#1e7e34;';
      badge.innerHTML = "<span style='" + dotBase + "background:#1e7e34;'></span>Activo";
      td.appendChild(badge);
      link.setAttribute('data-badge', 'ok');
    }
  }

  var observer = new MutationObserver(function() {
      var link = document.querySelector('.link-agendar');
      if (link && !link.hasAttribute('data-badge')) {
          idle(function() { initBadge(link); });
          observer.disconnect();
      }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  // chequeo inicial por si ya está en el DOM al cargar el script
  var linkInicial = document.querySelector('.link-agendar');
  if (linkInicial) {
      idle(function() { initBadge(linkInicial); });
  }

})();
} catch (e) { console.error('[fc-cl.js bloque 2]', e); }
//

/* ── bloque 3/3 · antes en la línea 7600 del tema · (function() { ── */
//
try {
(function() {
  // Solo en páginas /p/cl-
  if (window.location.pathname.indexOf('/p/cl-') === -1) return;

  function insertarAnuncio() {
    var content = document.querySelector('.entry-content');
    if (!content) return;

    // Intentar localizar el recuadro de concurso
    // Si hay RESULTADO, el anuncio va después del resultado (no entre el recuadro y el resultado)
    var recuadro = content.querySelector('div.resultado-concurso') || content.querySelector('div.recuadro-concurso');
    if (recuadro) {
      // Si existe, lo usamos como referencia
      insertarDespuesDe(recuadro);
      return;
    }

    // Fallback: buscar la tabla y luego BASES (comportamiento anterior)
    var tabla = content.querySelector('table');
    if (!tabla) return;

    // Contar palabras fuera de la tabla (mismo criterio)
    var textoTotal = content.textContent.trim();
    var textoTabla = tabla.textContent.trim();
    var textoPost = textoTotal.replace(textoTabla, '').trim();
    var palabras = textoPost.split(/\s+/).filter(Boolean).length;
    if (palabras < 150) return;

    // Buscar encabezado BASES
    var basesH2 = null;
    var headings = content.querySelectorAll('h2, h3, h4, h5, h6');
    for (var i = 0; i < headings.length; i++) {
      if (headings[i].textContent.trim().toUpperCase() === 'BASES') {
        basesH2 = headings[i];
        break;
      }
    }

    var referencia = basesH2 || tabla;
    insertarDespuesDe(referencia);
  }

  function insertarDespuesDe(referencia) {
    if (!referencia) return;

    var adWrapper = document.createElement('div');
    adWrapper.style.cssText = 'margin: 20px 0; text-align: center; overflow: hidden;';
    adWrapper.classList.add('ad-reservado');
    adWrapper.innerHTML = '<ins class="adsbygoogle"'
      + ' style="display:block; text-align:center;"'
      + ' data-ad-layout="in-article"'
      + ' data-ad-format="fluid"'
      + ' data-ad-client="ca-pub-7776262814765753"'
      + ' data-ad-slot="3366988807"></ins>';

    // Insertar después de la referencia
    referencia.parentNode.insertBefore(adWrapper, referencia.nextSibling);

    // Delegar la carga al IntersectionObserver
    if (window.adObserver) {
      var nuevaIns = adWrapper.querySelector('ins.adsbygoogle');
      if (nuevaIns) window.adObserver.observe(nuevaIns);
    } else {
      window.FC.pushAd(adWrapper.querySelector('ins.adsbygoogle'));
    }
  }

  var DELAY = 500;

  if (document.readyState === 'complete') {
    setTimeout(insertarAnuncio, DELAY);
  } else {
    window.addEventListener('load', function() {
      setTimeout(insertarAnuncio, DELAY);
    });
  }
})();
} catch (e) { console.error('[fc-cl.js bloque 3]', e); }
//
