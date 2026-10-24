/* =====================================================================
   Rare Earth Projects · athena.js  (Athena page only, load after
   project.js)
   1. Key plan ↔ phase cards: hovering or focusing one highlights the
      other. [data-ph-go="phase-n"] links scroll to the layout and point
      at that phase: on the rendered master plan via the phase highlight
      (4), on the fallback drawing by marking that drawing.
   1b. Layout fallback: if the master plan (assets/renders/athena-plan.svg,
      both phases joined as one layout) cannot load, the viewer is
      replaced by the same plan as a plain image ([data-ath-planfb]);
      once it loads the fallback is removed and the viewer is used.
   2. Road cross-sections (Infrastructure), drawn to a common scale from
      RE_PROJECTS athena.roads (internal widths + frontage widening).
   3. Location: site facts (village, taluk, frontage, internal roads)
      beside the schematic map, since no drive times are published.
   4. Optional phase overlay on the master plan: if the render's
      meta JSON carries
        "phases":[{"key":"phase-1","poly":[[left,top],…]},
                  {"key":"phase-2","poly":[[left,top],…]}]
      (left/top in % of the image, like the hotspots), a Both · Phase I ·
      Phase II switch appears above the sheet; choosing a phase dims the
      other and zooms to it. Without that field nothing is shown.
   ===================================================================== */
(function () {
  'use strict';
  var RE = window.RE; if (!RE || !RE.current || RE.current.slug !== 'athena') return;
  var D = document, W = window, $ = RE.$, $$ = RE.$$, esc = RE.esc, p = RE.current;
  var ROMAN = { 1: 'I', 2: 'II', 3: 'III' };

  /* ---------- 1. key plan ↔ cards, layout sheet links ---------- */
  var phSec = $('#phases');
  if (phSec) {
    var hl = function (n) {
      $$('[data-ph]', phSec).forEach(function (el) { el.classList.toggle('hl', !!n && el.getAttribute('data-ph') === n); });
    };
    ['mouseover', 'focusin'].forEach(function (ev) {
      phSec.addEventListener(ev, function (e) { var t = e.target.closest && e.target.closest('[data-ph]'); hl(t ? t.getAttribute('data-ph') : null); });
    });
    phSec.addEventListener('mouseleave', function () { hl(null); });
    phSec.addEventListener('focusout', function (e) { if (!phSec.contains(e.relatedTarget)) hl(null); });
  }

  var pvEl = $('[data-plan-viewer]'), fbEl = $('[data-ath-planfb]');
  D.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('[data-ph-go]');
    if (!a) return;
    var key = a.getAttribute('data-ph-go'), layout = D.getElementById('layout');
    if (!layout) return;
    e.preventDefault();
    var later = RE.reduce ? 0 : 750;
    layout.scrollIntoView({ behavior: RE.reduce ? 'auto' : 'smooth', block: 'start' });
    if (fbEl && fbEl.classList.contains('on')) {
      // fallback drawings: mark the phase's drawing and move focus to it
      $$('.ath-fb', fbEl).forEach(function (f) { f.classList.remove('hl'); });
      var fig = $('.ath-fb[data-ph="' + (key.match(/\d+/) || [''])[0] + '"]', fbEl);
      if (fig) {
        fig.classList.add('hl');
        setTimeout(function () { var l = $('a', fig); if (l) l.focus({ preventScroll: true }); }, later);
        setTimeout(function () { fig.classList.remove('hl'); }, 2600 + later);
      }
      return;
    }
    if (!pvEl) return;
    var v = pvEl._pv || (RE.PlanViewer && RE.PlanViewer.mount(pvEl));
    var pick = function () {
      var b = $('.ath-phsel button[data-k="' + key + '"]', pvEl);
      if (b) { b.click(); b.focus({ preventScroll: true }); }
    };
    // the viewer may still be loading its image and meta: try now and once more after the scroll
    pick(); setTimeout(pick, later + 400);
  });

  /* ---------- 1b. layout fallback: the plan as a plain image if the viewer cannot load it ---------- */
  if (fbEl) {
    var sh = (p.plan && p.plan.sheets && p.plan.sheets[0]) || null;
    var urls = sh && !sh.fallback ? [sh.sm, sh.src].filter(Boolean).map(function (u) { return RE.asset(u); }) : [];
    var useViewer = function () { fbEl.remove(); fbEl = null; if (pvEl) pvEl.hidden = false; };
    var useFallback = function () {
      fbEl.classList.add('on');
      if (pvEl) pvEl.hidden = true;
      var sub = $('#layout .sec-head .body-l');
      if (sub) sub.textContent = 'Both phases on one plan: Phase I to the north, Phase II directly south across the shared 12 m road. The plan opens full screen; zoom in to read the plots, the parks, the civic amenity sites and the shop. Rendered from the layout drawings; indicative.';
    };
    if (!urls.length) useViewer();
    else {
      // probe the render the viewer would load (sm first, then full size)
      var tryN = function (i) {
        if (i >= urls.length) { useFallback(); return; }
        var im = new Image();
        im.onload = function () { if (im.naturalWidth) useViewer(); else tryN(i + 1); };
        im.onerror = function () { tryN(i + 1); };
        im.src = urls[i];
      };
      tryN(0);
    }
  }

  /* ---------- 2. road cross-sections ---------- */
  var roadsBox = $('[data-ath-roads]');
  var R = p.roads || {};
  var widths = (R.internal_m || []).slice().sort(function (a, b) { return a - b; });
  var front = (String(R.frontage || '').match(/(\d+(?:\.\d+)?)\s*m\b[^\d]*(\d+(?:\.\d+)?)\s*m\b/) || []).slice(1).map(Number);
  var ROAD_NOTE = { 9: 'Between the plot rows', 12: 'Shared by Phase I and Phase II' };
  if (roadsBox && (widths.length || front.length === 2)) {
    var S = 10, G = 132, H = 150, M = 8, PL = 46;
    var hatch = '';
    var hatchDefs = '<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs><pattern id="rs-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 0V6" stroke="rgba(202,167,115,.32)" stroke-width="1.2"/></pattern></defs></svg>';
    var dim = function (x0, x1, y, label, cls) {
      return '<g class="g-dim"><path d="M' + x0 + ' ' + y + 'H' + x1 + 'M' + (x0 - 4) + ' ' + (y + 4) + 'l8 -8M' + (x1 - 4) + ' ' + (y + 4) + 'l8 -8"/></g>' +
        '<text class="t-dim' + (cls ? ' ' + cls : '') + '" x="' + ((x0 + x1) / 2) + '" y="' + (y - 7) + '" text-anchor="middle">' + label + '</text>';
    };
    var ext = function (x, y0) { return '<path class="g-ext" d="M' + x + ' ' + y0 + 'V' + (G - 6) + '"/>'; };
    var tree = function (x) { return '<g class="g-tree"><line x1="' + x + '" y1="' + (G - 5) + '" x2="' + x + '" y2="' + (G - 40) + '"/><circle cx="' + x + '" cy="' + (G - 53) + '" r="14"/></g>'; };
    var lamp = function (x) { return '<g class="g-lamp"><path d="M' + x + ' ' + (G - 5) + 'V' + (G - 76) + 'h15"/><circle cx="' + (x + 15) + '" cy="' + (G - 74) + '" r="2.6"/></g>'; };
    var figs = [], maxW = 0;
    widths.forEach(function (w) {
      var rw = w * S, x0 = M + PL, x1 = x0 + rw, vbw = x1 + PL + M;
      var svg = '<svg viewBox="0 0 ' + vbw + ' ' + H + '" role="img" aria-label="Cross-section of a ' + w + ' m internal road with avenue trees and a street light, plots on either side (schematic)">' + hatch +
        '<path class="g-ground" d="M0 ' + G + 'H' + vbw + '"/>' +
        '<rect class="g-plot" x="' + M + '" y="' + (G - 14) + '" width="' + PL + '" height="14"/><rect class="g-plot" x="' + x1 + '" y="' + (G - 14) + '" width="' + PL + '" height="14"/>' +
        '<text x="' + (M + PL / 2) + '" y="' + (G + 14) + '" text-anchor="middle">PLOT</text><text x="' + (x1 + PL / 2) + '" y="' + (G + 14) + '" text-anchor="middle">PLOT</text>' +
        '<rect class="g-road" x="' + x0 + '" y="' + (G - 5) + '" width="' + rw + '" height="5"/>' +
        tree(x0 + 12) + tree(x1 - 12) + lamp(x0 + 30) +
        ext(x0, 26) + ext(x1, 26) + dim(x0, x1, 30, w + ' m') + '</svg>';
      figs.push({ vbw: vbw, html: svg, b: w + ' m internal road', s: ROAD_NOTE[w] || 'Internal road' });
    });
    if (front.length === 2) {
      var now = front[0] * S, full = front[1] * S, xa = M + 22, xb = xa + full, side = (full - now) / 2, vbw2 = xb + 22 + M;
      var svg2 = '<svg viewBox="0 0 ' + vbw2 + ' ' + H + '" role="img" aria-label="Cross-section of the district road: ' + front[0] + ' m today, being widened to ' + front[1] + ' m (schematic)">' + hatch +
        '<path class="g-ground" d="M0 ' + G + 'H' + vbw2 + '"/>' +
        '<rect class="g-wid" x="' + xa + '" y="' + (G - 5) + '" width="' + side + '" height="5"/><rect class="g-wid" x="' + (xb - side) + '" y="' + (G - 5) + '" width="' + side + '" height="5"/>' +
        '<rect class="g-now" x="' + (xa + side) + '" y="' + (G - 5) + '" width="' + now + '" height="5"/>' +
        ext(xa, 26) + ext(xb, 26) + ext(xa + side, 70) + ext(xb - side, 70) +
        dim(xa, xb, 30, front[1] + ' m') + dim(xa + side, xb - side, 74, front[0] + ' m', 'sm') +
        '<text x="' + ((xa + xb) / 2) + '" y="' + (G + 14) + '" text-anchor="middle">DISTRICT ROAD</text></svg>';
      figs.push({ vbw: vbw2, html: svg2, b: 'District road frontage', s: front[0] + ' m today · being widened to ' + front[1] + ' m' });
    }
    figs.forEach(function (f) { maxW = Math.max(maxW, f.vbw); });
    roadsBox.innerHTML = hatchDefs + '<div class="ath-rs">' + figs.map(function (f) {
      return '<figure style="flex:' + f.vbw + ' 1 0;--k:' + (f.vbw / maxW * 100).toFixed(1) + '%">' + f.html + '<figcaption><b>' + esc(f.b) + '</b><span>' + esc(f.s) + '</span></figcaption></figure>';
    }).join('') + '</div>' +
      '<p class="ath-rs-note">Road widths drawn to a common scale, from the layout drawings. Avenue trees and street lights as shown on the rendered layout; plots are schematic.</p>';
  }

  var luNote = $('#infrastructure .lu-note');
  if (luNote) luNote.textContent = 'Areas from the layout drawings of both phases.';

  /* ---------- 3. location: site facts beside the map ---------- */
  var side = $('#location .locm-side');
  if (side) {
    var rows = [];
    if (p.village) rows.push(['Village', p.village]);
    if (p.locality && p.locality.label) rows.push(['Taluk', p.locality.label]);
    if (front.length === 2) rows.push(['Frontage', 'District road · ' + front[0] + ' m → ' + front[1] + ' m']);
    if (widths.length) rows.push(['Internal roads', widths.join(' m & ') + ' m']);
    if (p.completion) rows.push(['Completion', p.completion]);
    if (rows.length) {
      side.insertAdjacentHTML('afterbegin', '<ul class="specs ath-locspecs">' + rows.map(function (r) { return '<li><span>' + esc(r[0]) + '</span><b>' + esc(r[1]) + '</b></li>'; }).join('') + '</ul>');
      var addr = $('.locm-addr', side); if (addr) addr.style.marginTop = '22px';
    }
  }

  /* ---------- 3b. gallery intro follows what is shown ---------- */
  var galIntro = $('#gallery .sec-head .body-l');
  if (galIntro) {
    var withRenders = galIntro.textContent;
    var galSync = function () {
      var r = $$('#gallery .gal figure[data-kind="render"]').length;
      galIntro.textContent = r ? withRenders : 'The master plan of both phases, drawn from the approved layout drawings. Indicative.';
    };
    D.addEventListener('re:img-removed', function () { setTimeout(galSync, 0); });
    W.addEventListener('load', function () { setTimeout(galSync, 50); });
    galSync();
  }

  /* ---------- 4. optional phase overlay on the combined plan ---------- */
  if (!pvEl || !('MutationObserver' in W)) return;
  var phaseLabel = function (key) {
    var ph = (p.phases || []).filter(function (x) { return x.key === key; })[0];
    return ph ? ph.label : 'Phase ' + (ROMAN[(key.match(/\d+/) || [])[0]] || '');
  };
  function validPhases(meta) {
    var list = meta && Array.isArray(meta.phases) ? meta.phases : [];
    list = list.filter(function (x) {
      return x && /^phase-\d+$/.test(x.key || '') && Array.isArray(x.poly) && x.poly.length >= 3 && x.poly.every(function (pt) {
        return Array.isArray(pt) && isFinite(pt[0]) && isFinite(pt[1]) && pt[0] >= 0 && pt[0] <= 100 && pt[1] >= 0 && pt[1] <= 100;
      });
    });
    return list.length >= 2 ? list : null;
  }
  function bbox(poly) {
    var xs = poly.map(function (q) { return +q[0]; }), ys = poly.map(function (q) { return +q[1]; });
    var x0 = Math.min.apply(null, xs), x1 = Math.max.apply(null, xs), y0 = Math.min.apply(null, ys), y1 = Math.max.apply(null, ys);
    return { x0: x0, x1: x1, y0: y0, y1: y1, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 };
  }
  function zoomTo(v, b) {
    try {
      if (!b) { v.fit(true); return; }
      var base = v.base, bw = Math.max(1, b.x1 - b.x0) / 100 * base.w, bh = Math.max(1, b.y1 - b.y0) / 100 * base.h;
      var s = Math.max(1, Math.min(8, Math.min(v.W / bw, v.H / bh) * .9));
      v.s = s;
      v.tx = v.W / 2 - base.x - (b.cx / 100) * base.w * s;
      v.ty = v.H / 2 - base.y - (b.cy / 100) * base.h * s;
      v.applyT(true);
    } catch (err) { /* viewer internals changed: the overlay still works without zoom */ }
  }
  function phaseSync() {
    var v = pvEl._pv; if (!v || !v.cur) return;
    var s = v.cur, list = s.mode === 'primary' ? validPhases(s.metaData) : null;
    var canvas = $('.pv-canvas', pvEl), ov = $('.ath-phov', pvEl), lb = $('.ath-phlbl', pvEl), sel = $('.ath-phsel', pvEl);
    if (!list || !canvas) { [ov, lb, sel].forEach(function (x) { if (x) x.remove(); }); return; }
    if (ov) return; // already built for this sheet
    var boxes = {};
    var hs = $('.pv-hs', canvas);
    ov = D.createElementNS('http://www.w3.org/2000/svg', 'svg');
    canvas.insertBefore(ov, hs);
    ov.setAttribute('class', 'ath-phov'); ov.setAttribute('viewBox', '0 0 100 100'); ov.setAttribute('preserveAspectRatio', 'none'); ov.setAttribute('aria-hidden', 'true');
    ov.innerHTML = list.map(function (ph) {
      boxes[ph.key] = bbox(ph.poly);
      return '<polygon data-k="' + ph.key + '" points="' + ph.poly.map(function (q) { return (+q[0]).toFixed(2) + ',' + (+q[1]).toFixed(2); }).join(' ') + '"/>';
    }).join('');
    lb = D.createElement('div'); lb.className = 'ath-phlbl'; lb.setAttribute('aria-hidden', 'true');
    lb.innerHTML = list.map(function (ph) { var b = boxes[ph.key]; return '<span data-k="' + ph.key + '" style="left:' + b.cx + '%;top:' + b.cy + '%">' + esc(phaseLabel(ph.key)) + '</span>'; }).join('');
    canvas.insertBefore(lb, hs);
    sel = D.createElement('div'); sel.className = 'ath-phsel'; sel.setAttribute('role', 'group'); sel.setAttribute('aria-label', 'Highlight a phase');
    sel.innerHTML = '<span class="ath-phsel-l" aria-hidden="true">Highlight</span><button type="button" data-k="" aria-pressed="true">Both</button>' + list.map(function (ph) { return '<button type="button" data-k="' + ph.key + '" aria-pressed="false">' + esc(phaseLabel(ph.key)) + '</button>'; }).join('');
    var bar = $('.pv-bar', pvEl), tabs = $('.pv-tabs', pvEl);
    bar.insertBefore(sel, tabs.nextSibling);
    sel.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-k]'); if (!b) return;
      var k = b.getAttribute('data-k');
      $$('button', sel).forEach(function (x) { x.setAttribute('aria-pressed', x === b); });
      [ov, lb].forEach(function (el) { if (k) el.setAttribute('data-on', k); else el.removeAttribute('data-on'); });
      $$('polygon', ov).forEach(function (pg) { var on = pg.getAttribute('data-k') === k; pg.setAttribute('class', k ? (on ? 'lit' : 'dim') : ''); });
      $$('span', lb).forEach(function (sp) { sp.className = k && sp.getAttribute('data-k') === k ? 'lit' : ''; });
      zoomTo(v, k ? boxes[k] : null);
    });
  }
  // the viewer rewrites its caption every time a sheet (and its meta) is rendered
  new MutationObserver(function (recs) {
    if (recs.some(function (r) { return r.target.classList && r.target.classList.contains('pv-cap'); })) phaseSync();
  }).observe(pvEl, { subtree: true, childList: true });
})();
