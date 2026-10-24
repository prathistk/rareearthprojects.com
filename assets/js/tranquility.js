/* =====================================================================
   Rare Earth Projects · tranquility.js  (Tranquility page only)
   Load with defer AFTER project.js and project-ill.js.
   Styles: assets/css/tranquility.css

   1. Layout and Gallery appear only once their renders exist.
      <body class="tq-noplan tq-nogal"> keeps both sections collapsed in
      place (and their sub-nav links hidden) so the page never shows
      placeholder content. Probes the plan sheet named in projects-data.js and
      the gallery files listed in projects-data.js; a class is removed
      as soon as a file actually loads. Collapsing in place (height 0,
      not display:none) keeps project.js's scroll-spy positions right.
   2. Location map: places the Tranquility pin and the other Rare Earth
      communities from projects-data.js map_xy (460 x 563.96 viewBox →
      the 1000 x 1226 base map), skipping any outside the crop.
   3. "Load interactive map" (Google Maps embed on request only) and the
      directions link, both from projects-data.js.
   ===================================================================== */
(function () {
  'use strict';
  var RE = window.RE; if (!RE || !RE.current || RE.current.slug !== 'tranquility') return;
  var D = document, W = window, B = D.body, p = RE.current, $ = RE.$, $$ = RE.$$, esc = RE.esc;

  /* ---------- 1. sections that wait for their renders ---------- */
  function probe(list, cb) {
    var i = 0;
    (function next() {
      if (i >= list.length) { cb(null); return; }
      var src = list[i++], im = new Image();
      im.onload = function () { if (im.naturalWidth > 0) cb(src); else next(); };
      im.onerror = next;
      im.src = src;
    })();
  }
  function reveal(cls, id) {
    if (!B.classList.contains(cls)) return;
    B.classList.remove(cls);
    W.dispatchEvent(new Event('resize'));   // lets the sub-nav re-measure its links
    if (location.hash === '#' + id) {
      var t = D.getElementById(id);
      if (t) setTimeout(function () { t.scrollIntoView({ behavior: 'auto' }); }, 60);
    }
  }
  var sh0 = p.plan && p.plan.sheets && p.plan.sheets[0];
  probe(sh0 ? [sh0.sm, sh0.src].filter(Boolean).map(RE.asset) : [], function (found) {
    if (found) reveal('tq-noplan', 'layout');
  });
  var gal = ((p.images && p.images.gallery) || []).filter(function (g) { return g && (g.sm || g.src); });
  var galDone = false;
  gal.forEach(function (g) {
    probe([g.sm, g.src].filter(Boolean).map(RE.asset), function (found) {
      if (found && !galDone) { galDone = true; reveal('tq-nogal', 'gallery'); }
    });
  });

  /* ---------- 2. location map pins ---------- */
  var K = 1000 / 460, CROP = { x0: 0, y0: 560, x1: 850, y1: 1226 };
  var map = $('.tq-map-pins');
  if (map) {
    var xy = p.map_xy;
    var pin = $('[data-tq-pin]', map);
    if (pin && xy) pin.setAttribute('transform', 'translate(' + (xy.x * K).toFixed(1) + ' ' + (xy.y * K).toFixed(1) + ')');
    var host = $('[data-tq-others]', map);
    if (host) {
      host.innerHTML = (RE.projects || []).filter(function (o) { return o !== p && o.map_xy; }).map(function (o) {
        var x = o.map_xy.x * K, y = o.map_xy.y * K;
        if (x < CROP.x0 + 10 || x > CROP.x1 - 10 || y < CROP.y0 + 10 || y > CROP.y1 - 10) return '';
        // label side as on the landing map, flipped if it would run off the crop
        var left = (o.map_xy.lx != null && o.map_xy.lx < o.map_xy.x) || x > CROP.x1 - 120;
        if (left && x < CROP.x0 + 120) left = false;
        return '<a href="' + RE.href(o.url) + '" aria-label="' + esc(o.name + ', ' + o.locality_line) + '">' +
          '<g transform="translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ')"><circle class="hit" r="22"/><circle class="dot" r="6"/>' +
          '<text x="' + (left ? -14 : 14) + '" y="6"' + (left ? ' text-anchor="end"' : '') + '>' + esc(o.name) + '</text></g></a>';
      }).join('');
    }
  }

  /* ---------- 3. directions + interactive map ---------- */
  var dir = $('[data-tq-directions]');
  if (dir && RE.mapsLink) dir.href = RE.mapsLink(p);
  var ml = $('[data-tq-map-load]');
  if (ml) ml.addEventListener('click', function () {
    var box = $('.tq-loc .locm-embed'); if (!box) return;
    box.hidden = false;
    box.innerHTML = '<iframe title="Map of ' + esc(p.name) + '" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="https://www.google.com/maps?q=' + encodeURIComponent(p.maps_query || p.address) + '&amp;output=embed"></iframe>';
    ml.remove();
  });
})();
