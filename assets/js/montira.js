/* =====================================================================
   Rare Earth Projects · montira.js  (Montira page only, load after
   project.js)
   1. The Palmeraie field: one palm mark for each of the 229 date palms
      (count read from RE_PROJECTS montira.date_palms), planted in
      quincunx rows like an oasis grove; reveals row by row.
   2. Render-with-photo fallback captions: <img data-fb="…" data-fb-cap=
      "…"> inside a <figure> with [data-cap]. While the 3D render is
      missing, the photo fallback shows with its own caption, so a
      photograph is never labelled as a render (and vice versa).
   ===================================================================== */
(function () {
  'use strict';
  var RE = window.RE; if (!RE || !RE.current) return;
  var D = document, $$ = RE.$$, p = RE.current;

  /* ---------- 1. palm field ---------- */
  var PALM = '<symbol id="mt-palm" viewBox="-12 -16 24 31"><g fill="none" stroke="currentColor" stroke-width="1.15" stroke-linecap="round">' +
    '<path d="M0 14.5C.7 9 .5 3.5 0-1.5"/>' +
    '<path d="M0-1.5C-3.5-5.5-7.5-5-11-.5"/><path d="M0-1.5C3.5-5.5 7.5-5 11-.5"/>' +
    '<path d="M0-1.5C-2.5-7.5-6.5-9.5-10.5-8.5"/><path d="M0-1.5C2.5-7.5 6.5-9.5 10.5-8.5"/>' +
    '<path d="M0-1.5C-.8-7.5-2-11.5-4.5-14.5"/><path d="M0-1.5C.8-7.5 2-11.5 4.5-14.5"/>' +
    '</g><circle cx="0" cy="0" r="1.1" fill="currentColor"/></symbol>';

  // landscape grove on wide screens, a taller grove on phones so each palm stays legible
  var narrow = window.matchMedia('(max-width:767px)');
  function plant(svg) {
    var total = +(p.date_palms || svg.getAttribute('data-palms')) || 0;
    if (!total) { svg.remove(); return; }
    var m = narrow.matches, Wd = m ? 400 : 1000, Hd = m ? 540 : 300;
    var rows = m ? 18 : 10, cols = Math.ceil(total / rows), s = 7;
    var base = m ? 17 : 20, grow = m ? 9 : 12;
    var rnd = function () { return (s = (s * 9301 + 49297) % 233280) / 233280; };
    var stepX = Wd / (cols + .5), stepY = (Hd - base - grow - 2) / (rows - 1);
    var out = [], n = 0;
    for (var r = 0; r < rows && n < total; r++) {
      var depth = r / (rows - 1);                     // 0 = back row, 1 = front row
      var size = base + depth * grow;                  // nearer palms read larger
      var h = size * 31 / 24, foot = 2 + r * stepY + base + grow;
      for (var c = 0; c < cols && n < total; c++) {
        var x = (c + (r % 2 ? .75 : .25)) * stepX + (rnd() - .5) * stepX * .28;
        var y = foot - h + (rnd() - .5) * 5;
        var k = rnd(), cls = k < .1 ? ' class="t"' : (k < .2 ? ' class="o"' : '');
        out.push('<use href="#mt-palm"' + cls + ' x="' + (x - size / 2).toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + size.toFixed(1) + '" height="' + h.toFixed(1) + '" style="--d:' + Math.round(r * (m ? 50 : 90) + c * (m ? 22 : 14)) + 'ms"/>');
        n++;
      }
    }
    svg.setAttribute('viewBox', '0 0 ' + Wd + ' ' + Hd);
    svg.innerHTML = '<defs>' + PALM + '</defs><title>' + total + ' date palms</title>' + out.join('');
  }
  var fields = $$('svg[data-palms]');
  fields.forEach(plant);
  var replant = function () { fields.forEach(function (f) { if (f.isConnected) plant(f); }); };
  if (narrow.addEventListener) narrow.addEventListener('change', replant); else if (narrow.addListener) narrow.addListener(replant);

  /* ---------- 2. render / photo fallback captions ---------- */
  $$('img[data-fb-cap]').forEach(function (img) {
    var fig = img.closest('figure'), cap = fig && fig.querySelector('[data-cap]');
    if (!cap) return;
    var renderCap = cap.textContent, photoCap = img.getAttribute('data-fb-cap');
    var sync = function () {
      var isRender = /\/renders\//.test(img.currentSrc || img.src);
      cap.textContent = isRender ? renderCap : photoCap;
      if (!isRender) img.alt = photoCap;
    };
    img.addEventListener('load', sync);
    img.addEventListener('error', function () { setTimeout(sync, 0); });
    if (img.complete) sync();
  });
})();

/* 360° drone view: swap the poster for the Google Maps photo sphere only when asked (privacy + speed). */
(function () {
  var fig = document.querySelector('.pano[data-pano]'); if (!fig) return;
  var go = fig.querySelector('.pano-go');
  go && go.addEventListener('click', function () {
    var wrap = document.createElement('div'); wrap.className = 'pano-frame';
    var f = document.createElement('iframe');
    f.src = fig.getAttribute('data-pano'); f.title = '360 degree drone view of Montira (Google Maps)';
    f.setAttribute('allowfullscreen', ''); f.setAttribute('loading', 'eager'); f.setAttribute('referrerpolicy', 'no-referrer-when-downgrade');
    wrap.appendChild(f);
    fig.classList.add('is-live');
    var poster = fig.querySelector('.pano-poster'); poster && poster.remove(); go.remove();
    fig.insertBefore(wrap, fig.firstChild);
    f.focus();
  });
})();
