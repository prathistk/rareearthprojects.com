/* =====================================================================
   Rare Earth Projects · home.js  (landing page only)
   Load with defer AFTER projects-data.js, site.js and enquiry.js.
   - Hero pins, portfolio rows and "Where We Build" pins are generated
     from projects-data.js (the static HTML is the no-JS fallback).
   - Portfolio hover peek (desktop) and the manifesto word reveal.
   Header, footer, preloader, reveals, featured band, enquiry dialog
   and the #viewing composer are handled by the shared scripts.
   ===================================================================== */
(function () {
  'use strict';
  var RE = window.RE; if (!RE) return;
  var D = document, W = window, $ = RE.$, $$ = RE.$$, esc = RE.esc;
  var PROJ = (RE.projects || []).slice();
  var pad = function (n) { return (n < 10 ? '0' : '') + n; };
  var statusOf = function (p) { return p.flagship ? 'Flagship' : (p.stage && p.stage.label) || ''; };

  /* ---------------- hero: communities on the contour field (site.js) ---------------- */
  RE.fillPins($('#heroPins'), 'hero');

  /* ---------------- portfolio rows ---------------- */
  var rows = $('#rows');
  if (rows && PROJ.length) {
    rows.innerHTML = PROJ.map(function (p, i) {
      return '<a class="row rv" href="' + RE.href(p.url) + '" data-slug="' + esc(p.slug) + '">' +
        '<span class="n">' + pad(i + 1) + '</span><span class="nm">' + esc(p.name) + '</span>' +
        '<span class="lc">' + esc(p.locality.label) + '</span><span class="tp">' + esc(p.type.label) + '</span>' +
        '<span class="st">' + esc(statusOf(p)) + '</span></a>';
    }).join('');
    RE.ready(function () { RE.observeReveals(rows); });
  }

  /* ---------------- "Where We Build" pins ---------------- */
  var pins = $('#mapPins');
  if (pins && PROJ.length) {
    var live = 0;
    pins.innerHTML = PROJ.filter(function (p) { return p.map_xy; }).map(function (p) {
      var m = p.map_xy, pulse = '';
      if (p.footer_group === 'Now selling') {
        pulse = RE.reduce
          ? '<circle r="12" fill="#caa773" opacity=".15"/>'
          : '<circle r="16" fill="#caa773" opacity=".15"><animate attributeName="r" values="8;20;8" dur="3s" begin="' + (live++) + 's" repeatCount="indefinite"/></circle>';
      }
      return '<a href="' + RE.href(p.url) + '" aria-label="' + esc(p.name + ', ' + p.locality_line) + '">' +
        '<g transform="translate(' + m.x + ' ' + m.y + ')"><circle class="hit" r="16"/>' + pulse + '<circle r="4.5" fill="#caa773"/></g>' +
        '<text x="' + m.lx + '" y="' + m.ly + '"' + (m.lx < m.x ? ' text-anchor="end"' : '') + '>' + esc(p.name) + '</text></a>';
    }).join('');
  }

  /* ---------------- hover peek (desktop, fine pointer) ---------------- */
  var peek = $('#peek');
  if (peek && rows && RE.finePointer) {
    var px = 0, py = 0, tx = 0, ty = 0, on = false, running = false;
    var loop = function () {
      px += (tx - px) * .12; py += (ty - py) * .12;
      peek.style.left = px + 'px'; peek.style.top = py + 'px';
      if (on || Math.abs(tx - px) > .5 || Math.abs(ty - py) > .5) W.requestAnimationFrame(loop);
      else running = false;
    };
    var kick = function () { if (!running) { running = true; W.requestAnimationFrame(loop); } };
    W.addEventListener('mousemove', function (e) { tx = e.clientX + 230; ty = e.clientY; if (on) kick(); }, { passive: true });
    rows.addEventListener('mouseover', function (e) {
      var r = e.target.closest && e.target.closest('.row');
      if (!r || r.contains(e.relatedTarget)) return;
      var p = RE.project(r.getAttribute('data-slug')); if (!p) return;
      if (!on && !running) { px = tx; py = ty; }
      peek.innerHTML = RE.artHTML(p, { alt: '' });
      on = true; peek.classList.add('on'); kick();
    });
    rows.addEventListener('mouseout', function (e) {
      var r = e.target.closest && e.target.closest('.row');
      if (!r || r.contains(e.relatedTarget)) return;
      on = false; peek.classList.remove('on');
    });
    // warm the peek images so the first hover is instant
    RE.ready(function () { PROJ.forEach(function (p) { if (p.art && p.art.photo) { var i = new Image(); i.src = RE.asset(p.art.photo); } }); });
  }

  /* ---------------- manifesto word reveal ---------------- */
  var man = $('#manifesto');
  if (man) {
    man.innerHTML = man.innerHTML.replace(/(<em>.*?<\/em>)|([^\s<]+)/g, function (m) { return '<span class="w">' + m + '</span>'; });
    var words = $$('.w', man);
    var paint = function () {
      var mr = man.getBoundingClientRect(), vh = W.innerHeight;
      var k = Math.min(1, Math.max(0, (vh * .85 - mr.top) / (mr.height + vh * .35)));
      var n = RE.reduce ? words.length : Math.round(k * words.length);
      words.forEach(function (w, i) { w.classList.toggle('on', i < n); });
    };
    D.addEventListener('re:scroll', paint);
    W.addEventListener('resize', paint);
    paint();
  }
})();
