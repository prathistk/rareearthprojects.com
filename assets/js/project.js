/* =====================================================================
   Rare Earth Projects · project.js  (shared by every project page)
   Runs on <body data-page="project" data-project="slug">, after
   projects-data.js, site.js, enquiry.js and plan-viewer.js (all defer).
   Styles: assets/css/project.css (injected if a page forgets the link).

   1. Removes sections whose data is missing:
        <section data-requires="plan|plots|amenities|connectivity|
                 approvals|gallery|landuse|phases">
   2. Fills data-driven blocks from projects-data.js. A container is only
      filled while empty (or when it carries data-auto-force):
        [data-auto="keys"]        key-details tiles
        [data-auto="specs"]       fact sheet (.specs) + RERA line
        [data-auto="highlights"]  .feat list
        [data-auto="plots"]       price call-out, plot mix bar, formats
                                  drawn to scale, plots table (+ phases)
        [data-auto="amenities"]   grouped amenity tabs, numbered 01..n
                                  straight through every group
        [data-auto="landuse"]     parks bar chart + land-use figures
        [data-auto="approvals"]   approvals ledger (+ copy / verify)
        [data-auto="location"]    real map (OSM crop) + distance list
        [data-auto="gallery"]     gallery grid with kind filter → lightbox
        [data-auto="explore"]     other communities + prev / next
        [data-auto="pfoot"]       project footer band
      Optional attributes on a slot:
        data-plots-visual="off"   (plots) skip mix bar + scale drawing
   3. Sticky sub-nav from section[data-nav] (scroll-spy by position,
      priority-plus "More", reading-progress hairline, chip row on
      mobile with the active chip kept in view).
   4. Consistency checks (console only): JSON-LD Residence / Breadcrumb /
      FAQPage against projects-data.js and the visible FAQs.
      (Static [data-fact] text is checked by site.js.)
   API: RE.projectPage = { has, subnav, kinds }
   ===================================================================== */
(function () {
  'use strict';
  var RE = window.RE; if (!RE || !RE.current) return;
  var D = document, W = window, $ = RE.$, $$ = RE.$$, esc = RE.esc, p = RE.current, CFG = RE.config, PROJ = RE.projects;
  var nf = RE.nf;
  var PLOT_COLORS = (RE.PlanViewer && RE.PlanViewer.colors) || { '30x40': '#e6d3ad', '30x50': '#e9c6a6', '40x60': '#c9d3a9', '50x80': '#bcc9b8', 'odd': '#cdbb9a' };
  var SQM_TO_SQFT = 10.7639;

  /* ---------- 0. stylesheet + theme sanity ---------- */
  if (!$('link[href$="assets/css/project.css"]')) {
    console.info('[RE] project.css was not linked in <head>; injecting it. Add <link rel="stylesheet" href="' + RE.root + 'assets/css/project.css">.');
    var lk = D.createElement('link'); lk.rel = 'stylesheet'; lk.href = RE.root + 'assets/css/project.css';
    var after = $('link[href$="assets/css/site.css"]');
    if (after && after.parentNode) after.parentNode.insertBefore(lk, after.nextSibling); else D.head.appendChild(lk);
  }
  var th = p.theme || {};
  [['data-mode', th.mode], ['data-paper', th.paper], ['data-hero', th.hero]].forEach(function (a) {
    var v = D.body.getAttribute(a[0]);
    if (a[1] && v && v !== a[1]) console.warn('[RE] <body ' + a[0] + '="' + v + '"> differs from projects-data theme "' + a[1] + '" for ' + p.slug);
  });

  /* ---------- 1. drop sections without data ---------- */
  var lu = p.land_use || {};
  var has = {
    plan: !!(p.plan && p.plan.sheets && p.plan.sheets.length),
    plots: !!((p.plot_formats && p.plot_formats.length) || (p.price && (p.price.from_inr || p.price.per_sqft))),
    amenities: !!(p.amenity_groups && p.amenity_groups.length),
    connectivity: !!(p.connectivity && p.connectivity.length),
    approvals: !!((p.approvals && p.approvals.length) || (p.rera && p.rera.length)),
    gallery: !!(p.images && p.images.gallery && p.images.gallery.length),
    landuse: !!((lu.parks && lu.parks.length) || lu.roads_sqm || lu.commercial_sqm),
    phases: !!(p.phases && p.phases.length > 1)
  };
  $$('[data-requires]').forEach(function (s) {
    var need = s.getAttribute('data-requires').split(/[\s,]+/);
    if (need.some(function (k) { return k && has[k] === false; })) s.remove();
  });

  /* ---------- helpers ---------- */
  function slot(name) {
    return $$('[data-auto="' + name + '"]').filter(function (el) { return !el.children.length || el.hasAttribute('data-auto-force'); });
  }
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function distLabel(c) {
    if (c.text) return c.text;
    if (c.mins != null && c.km != null) return c.mins + ' min (' + c.km + ' km)';
    if (c.mins != null) return c.mins + ' min';
    if (c.km != null) return (c.km < 10 && String(c.km).length === 1 ? '0' : '') + c.km + ' km';
    return '';
  }
  // big figure for the drive list: "10<small>min</small>"
  function distFigure(c) {
    if (c.text) return '<b class="tx">' + esc(c.text) + '</b>';
    if (c.mins != null) return '<b>' + c.mins + '<small>min</small></b>' + (c.km != null ? '<em>' + c.km + ' km</em>' : '');
    if (c.km != null) return '<b>' + c.km + '<small>km</small></b>';
    return '<b></b>';
  }
  function colorOf(key) {
    var custom = p.plan_colors || {};
    return custom[key] || PLOT_COLORS[key] || '#d8ccb6';
  }
  function fmtLabel(x) { return x.label + (x.w && x.d ? ' ft' : ''); }
  function sqmLine(sqm) { return nf(sqm) + ' sq m<small>' + nf(Math.round(sqm * SQM_TO_SQFT)) + ' sq ft</small>'; }

  /* ---------- 2a. key details ---------- */
  slot('keys').forEach(function (el) {
    var t = [];
    if (p.land_acres) t.push(['<b>' + p.land_acres + '<small>acres</small></b>', 'Land area']);
    if (p.plots_total) t.push(['<b>' + p.plots_total + '</b>', p.phases && p.phases.length > 1 ? 'Plots · ' + p.phases.length + ' phases' : 'Plots']);
    if (p.sizes_label) t.push(['<b class="sm">' + esc(p.sizes_label) + '</b>', 'Plot sizes']);
    if (lu.parks_pct) t.push(['<b>' + lu.parks_pct + '<small>%</small></b>', 'Parks & open space']);
    if (p.clubhouse_sqft) t.push(['<b>' + Math.round(p.clubhouse_sqft / 1000) + 'K<small>sq ft</small></b>', 'Clubhouse']);
    else if (p.parks_count) t.push(['<b>' + p.parks_count + '</b>', 'Parks']);
    if (p.price && (p.price.from_inr || p.price.per_sqft)) t.push(['<b class="sm">' + esc(p.price.short) + '</b>', p.price.per_sqft ? 'Indicative rate' : 'Starting price']);
    if (t.length < 2) { el.remove(); return; }
    el.classList.add('keys');
    el.innerHTML = t.map(function (x) { return '<div class="key">' + x[0] + '<span>' + esc(x[1]) + '</span></div>'; }).join('');
  });

  /* ---------- 2b. fact sheet ---------- */
  slot('specs').forEach(function (el) {
    el.innerHTML = '<ul class="specs">' + (p.specs || []).map(function (s) { return '<li><span>' + esc(s.k) + '</span><b>' + esc(s.v) + '</b></li>'; }).join('') + '</ul>' +
      (p.rera || []).map(function (r) { return '<p class="rera">' + esc(r.label) + ' · ' + esc(r.number) + '</p>'; }).join('');
  });

  /* ---------- 2c. highlights ---------- */
  slot('highlights').forEach(function (el) {
    if (!(p.highlights || []).length) { el.remove(); return; }
    el.innerHTML = '<ul class="feat">' + p.highlights.map(function (h) { return '<li>' + esc(h) + '</li>'; }).join('') + '</ul>';
  });

  /* ---------- 2d. plots & prices ---------- */
  function mixBar(f) {
    var counted = f.filter(function (x) { return x.count; });
    if (counted.length < 2) return '';
    var total = counted.reduce(function (a, x) { return a + x.count; }, 0);
    var segs = counted.map(function (x) {
      var pct = x.count / total * 100;
      return '<span class="pm-seg" style="flex:' + x.count + ' 1 0;background:' + colorOf(x.key) + '" title="' + esc(fmtLabel(x)) + ': ' + x.count + ' plots"></span>';
    }).join('');
    var keys = counted.map(function (x) {
      var pct = Math.round(x.count / total * 100);
      return '<li><span class="pm-sw" style="background:' + colorOf(x.key) + '"></span><span>' + esc(fmtLabel(x)) + '</span><b>' + x.count + '</b><i>' + pct + '%</i></li>';
    }).join('');
    var drawn = p.plots_drawn && p.plots_total && p.plots_drawn !== p.plots_total;
    return '<figure class="pmix" aria-label="Plot mix">' +
      '<figcaption><span class="pm-k">Plot mix</span><span class="pm-t"><b>' + total + '</b> plots' + (drawn ? ' on the layout drawings' : '') + '</span></figcaption>' +
      '<div class="pm-bar" aria-hidden="true">' + segs + '</div><ul class="pm-key">' + keys + '</ul></figure>';
  }
  function scaleDrawing(f) {
    var std = f.filter(function (x) { return x.w && x.d; }).slice().sort(function (a, b) { return a.w * a.d - b.w * b.d; });
    if (std.length < 2) return '';
    var gap = 24, mx = 6, top = 15, bot = 24, maxD = 0, x = mx, shapes = '';
    std.forEach(function (s) { maxD = Math.max(maxD, s.d); });
    std.forEach(function (s) {
      var y = top + (maxD - s.d), cx = x + s.w / 2, cy = y + s.d / 2, rx = x + s.w + 4;
      shapes +=
        '<g class="ps-plot">' +
        '<rect x="' + x + '" y="' + y + '" width="' + s.w + '" height="' + s.d + '" fill="' + colorOf(s.key) + '"/>' +
        '<path class="ps-dim" d="M' + x + ' ' + (y - 5) + 'h' + s.w + 'M' + x + ' ' + (y - 7) + 'v4M' + (x + s.w) + ' ' + (y - 7) + 'v4' +
        'M' + rx + ' ' + y + 'v' + s.d + 'M' + (rx - 2) + ' ' + y + 'h4M' + (rx - 2) + ' ' + (y + s.d) + 'h4"/>' +
        '<text class="ps-t" x="' + cx + '" y="' + (y - 8) + '" text-anchor="middle">' + s.w + ' ft</text>' +
        '<text class="ps-t" transform="translate(' + (rx + 6.5) + ' ' + cy + ') rotate(-90)" text-anchor="middle">' + s.d + ' ft</text>' +
        '<text class="ps-a" x="' + cx + '" y="' + (cy + 1) + '" text-anchor="middle">' + nf(s.sqft || s.w * s.d) + '</text>' +
        '<text class="ps-u" x="' + cx + '" y="' + (cy + 7) + '" text-anchor="middle">sq ft</text>' +
        (s.count ? '<text class="ps-c" x="' + cx + '" y="' + (top + maxD + 12) + '" text-anchor="middle">' + s.count + ' plots</text>' : '') +
        '</g>';
      x += s.w + gap;
    });
    var Wd = x - gap + 14 + mx, Hd = top + maxD + bot;
    return '<figure class="pscale"><svg viewBox="0 0 ' + Wd + ' ' + Hd + '" role="img" aria-label="Standard plot formats drawn to the same scale: ' +
      std.map(function (s) { return s.w + ' by ' + s.d + ' feet'; }).join(', ') + '">' +
      '<path class="ps-ground" d="M0 ' + (top + maxD + .5) + 'H' + Wd + '"/>' + shapes + '</svg>' +
      '<figcaption>Standard formats, drawn to the same scale</figcaption></figure>';
  }
  slot('plots').forEach(function (el) {
    var f = p.plot_formats || [], pr = p.price || {}, out = '';
    if (pr.from_inr || pr.per_sqft) {
      out += '<div class="price-call"><span>' + (pr.per_sqft ? 'Indicative rate' : 'Starting from') + '</span><b data-fact="price">' + esc(pr.short) + '</b>' +
        '<button type="button" class="btn-txt" data-enquire="price" data-source="plots-price">Get the exact price →</button></div>';
    }
    if (f.length) {
      if (el.getAttribute('data-plots-visual') !== 'off') {
        var mix = mixBar(f), sc = scaleDrawing(f);
        if (mix || sc) out += '<div class="pvis' + (mix && sc ? '' : ' one') + '">' + mix + sc + '</div>';
      }
      var hasFacing = f.some(function (x) { return x.facing && x.facing.length; });
      var cols = 5 + (hasFacing ? 1 : 0);
      out += '<table class="ptable"><caption class="sr-only">Plot formats at ' + esc(p.name) + '</caption><thead><tr>' +
        '<th scope="col">Format</th><th scope="col">Area</th>' + (hasFacing ? '<th scope="col">Facing</th>' : '') +
        '<th scope="col" class="ct">Plots</th><th scope="col">Price</th><th scope="col"><span class="sr-only">Enquire</span></th></tr></thead><tbody>' +
        f.map(function (x) {
          var areaTxt = x.sqft ? nf(x.sqft) + ' sq ft<small>' + RE.area.sqyd(x.sqft) + ' sq yd · ' + RE.area.sqm(x.sqft) + ' sq m</small>' :
            (x.sqft_max ? 'Up to ' + nf(x.sqft_max) + ' sq ft<small>Corner &amp; individually shaped plots</small>' : 'Varies<small>Individually shaped plots</small>');
          var from = x.price_from ? 'From ' + RE.money(x.price_from) + '*' : (pr.per_sqft && x.sqft ? '₹' + nf(pr.per_sqft) + ' / sq ft*' : 'Price on request');
          return '<tr><th scope="row" class="fmt"><span class="pt-sw" style="background:' + colorOf(x.key) + '" aria-hidden="true"></span>' + esc(x.label) + (x.w && x.d ? ' <small>ft</small>' : '') + '</th>' +
            '<td class="ar">' + areaTxt + '</td>' +
            (hasFacing ? '<td class="fc">' + esc((x.facing || []).join(' / ') || '—') + '</td>' : '') +
            '<td class="ct">' + (x.count != null ? x.count + ' plots' : '') + '</td>' +
            '<td class="pr' + (x.price_from || (pr.per_sqft && x.sqft) ? '' : ' por') + '">' + esc(from) + '</td>' +
            '<td class="go"><button type="button" class="btn-txt" data-enquire="price" data-format="' + esc(x.key) + '" data-source="plots-table" aria-label="Enquire about ' + esc(fmtLabel(x)) + ' plots">Enquire →</button></td></tr>';
        }).join('') + '</tbody><tfoot><tr><td colspan="' + cols + '">' + esc(CFG.priceNote) +
        (p.plots_drawn && p.plots_total && p.plots_drawn !== p.plots_total ? ' Format counts are taken from the layout drawings, which show ' + p.plots_drawn + ' plots.' : '') + '</td></tr></tfoot></table>';
    } else {
      out += '<p class="body-l">Plot sizes and current availability are shared on request.</p><div class="acts" style="margin-top:24px"><button type="button" class="pill" data-enquire="price" data-source="plots-empty">Ask for plot sizes</button></div>';
    }
    if (has.phases) {
      out += '<div class="phases" style="margin-top:40px">' + p.phases.map(function (ph) {
        return '<div class="phase"><small>' + esc(ph.label) + (ph.rera ? ' · RERA Registered' : ' · ' + esc(ph.survey)) + '</small><b>' + ph.plots + '</b><span>' + esc(ph.summary) + '</span></div>';
      }).join('') + '</div>';
    }
    el.innerHTML = out;
  });

  /* ---------- 2e. amenities (numbered straight through the groups) ---------- */
  slot('amenities').forEach(function (el) {
    var g = p.amenity_groups || [];
    if (!g.length) { el.remove(); return; }
    var id = 'am-' + p.slug, n = 0, total = g.reduce(function (a, x) { return a + x.items.length; }, 0);
    var tabs = g.length > 1 ? '<div class="tabs-l" data-tabs aria-label="Amenity groups">' + g.map(function (x, i) {
      return '<button type="button" role="tab" id="' + id + '-t' + i + '" aria-controls="' + id + '-p' + i + '" aria-selected="' + (i === 0) + '">' + esc(x.label) + '<small>' + x.items.length + '</small></button>';
    }).join('') + '</div>' : '';
    el.innerHTML = tabs + g.map(function (x, i) {
      var start = n; n += x.items.length;
      return '<div' + (g.length > 1 ? ' role="tabpanel" id="' + id + '-p' + i + '" aria-labelledby="' + id + '-t' + i + '"' + (i ? ' hidden' : '') : '') + '>' +
        '<ol class="amen-list" start="' + (start + 1) + '" style="counter-reset:am ' + start + '">' +
        x.items.map(function (it) { return '<li>' + esc(it) + '</li>'; }).join('') + '</ol></div>';
    }).join('') + (g.length > 1 ? '<p class="am-total">' + total + ' amenities across ' + g.length + ' groups</p>' : '');
  });

  /* ---------- 2f. land use (parks bar chart + figures) ---------- */
  slot('landuse').forEach(function (el) {
    var parks = (lu.parks || []).filter(function (k) { return k.sqm; });
    var figs = [];
    if (lu.roads_sqm) figs.push(['Internal roads', lu.roads_sqm]);
    if (lu.commercial_sqm) figs.push(['Commercial plot', lu.commercial_sqm]);
    (lu.civic || []).forEach(function (c) { figs.push(['Civic amenity · ' + c.name, c.sqm]); });
    if (lu.shop_sqm) figs.push(['Neighbourhood shop', lu.shop_sqm]);
    if (!parks.length && !figs.length) { el.remove(); return; }
    var out = '';
    if (parks.length) {
      var max = Math.max.apply(null, parks.map(function (k) { return k.sqm; }));
      var sum = lu.parks_sqm || Math.round(parks.reduce(function (a, k) { return a + k.sqm; }, 0) * 100) / 100;
      var sorted = parks.slice().sort(function (a, b) { return b.sqm - a.sqm; });
      out += '<div class="lu-parks"><div class="lu-head"><span class="kicker">Parks &amp; open space</span>' +
        '<p><b>' + nf(sum) + '</b> sq m across ' + parks.length + ' park' + (parks.length > 1 ? 's' : '') + (lu.parks_pct ? ', about <b>' + lu.parks_pct + '%</b> of the site' : '') + '</p></div>' +
        '<ul class="lu-bars">' + sorted.map(function (k) {
          return '<li><span class="lu-n">' + esc(k.name) + (k.note ? '<small>' + esc(k.note) + '</small>' : '') + '</span>' +
            '<span class="lu-b" aria-hidden="true"><i style="--w:' + (k.sqm / max * 100).toFixed(1) + '%"></i></span>' +
            '<b>' + sqmLine(k.sqm) + '</b></li>';
        }).join('') + '</ul></div>';
    }
    if (figs.length) {
      out += '<ul class="lu-figs">' + figs.map(function (x) { return '<li><b>' + nf(x[1]) + '<small>sq m</small></b><span>' + esc(x[0]) + '</span></li>'; }).join('') + '</ul>';
    }
    el.classList.add('lu');
    el.innerHTML = out + '<p class="ph-note lu-note">Areas from the approved layout drawings.</p>';
  });

  /* ---------- 2g. approvals ledger ---------- */
  slot('approvals').forEach(function (el) {
    var rows = (p.approvals || []).slice();
    el.innerHTML = '<ul class="ledger">' + rows.map(function (a) {
      var acts = a.rera ? '<div class="la"><button type="button" data-copy="' + esc(a.v) + '">Copy</button><a href="' + CFG.reraSite + '" target="_blank" rel="noopener">Verify on rera.karnataka.gov.in ↗</a></div>' : '<div class="la"></div>';
      return '<li><span>' + esc(a.k) + '</span><b' + (a.rera ? ' class="rn"' : '') + '>' + (a.rera ? esc(a.v).replace(/\//g, '/<wbr>') : esc(a.v)) + '</b>' + acts + '</li>';
    }).join('') + '</ul>' +
      '<div class="acts" style="margin-top:34px"><button type="button" class="pill" data-enquire="general" data-source="approvals-docs" data-message="Please share the approval and title documents for ' + esc(p.name) + '.">Request the document set</button></div>';
  });
  D.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-copy]'); if (!b) return;
    var v = b.getAttribute('data-copy'), t0 = b.textContent;
    var done = function () { b.textContent = 'Copied'; setTimeout(function () { b.textContent = t0; }, 1600); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(v).then(done, function () { W.prompt('Copy the registration number', v); });
    else W.prompt('Copy the registration number', v);
  });

  /* ---------- 2h. location ---------- */
  slot('location').forEach(function (el) {
    var M = CFG.map || {}, items = p.connectivity || [], xy = p.map_xy || { x: 230, y: 280 };
    var numbered = items.map(function (c, i) { return { c: c, n: i + 1 }; });
    /* the real map (owner, 23 Oct 2026: the same real map on every page): a crop of the
       OpenStreetMap-derived base (assets/maps/presence-base.svg, 1000 x 1226 units),
       850 x 666 units centred on the project, with every Rare Earth community pinned.
       map_xy is in the 460 x 563.96 viewBox, so units = map_xy x 1000/460. */
    var K = 1000 / 460, CW = 850, CH = 666;
    var cx = xy.x * K, cy = xy.y * K;
    var x0 = Math.max(0, Math.min(1000 - CW, cx - CW / 2)), y0 = Math.max(0, Math.min(1226 - CH, cy - CH / 2));
    var f1 = function (v) { return v.toFixed(1); };
    var others = PROJ.filter(function (o) { return o !== p && o.map_xy; }).map(function (o) {
      var x = o.map_xy.x * K, y = o.map_xy.y * K;
      if (x < x0 + 10 || x > x0 + CW - 10 || y < y0 + 10 || y > y0 + CH - 10) return '';
      var left = (o.map_xy.lx != null && o.map_xy.lx < o.map_xy.x) || x > x0 + CW - 130;
      if (left && x < x0 + 130) left = false;
      return '<a href="' + RE.href(o.url) + '" aria-label="' + esc(o.name + ', ' + o.locality_line) + '"><g transform="translate(' + f1(x) + ' ' + f1(y) + ')"><circle class="hit" r="22"/><circle class="dot" r="6"/>' +
        '<text x="' + (left ? -14 : 14) + '" y="6"' + (left ? ' text-anchor="end"' : '') + '>' + esc(o.name) + '</text></g></a>';
    }).join('');
    var pinLeft = cx > x0 + CW - 230;
    var mapHTML = '<figure class="locm-map rmap"><div class="rmap-in">' +
      '<img class="rmap-base" src="' + RE.href(M.base || 'assets/maps/presence-base.svg') + '" width="1000" height="1226" alt="" loading="lazy" decoding="async" style="left:' + f1(-x0 / CW * 100) + '%;top:' + f1(-y0 / CH * 100) + '%">' +
      '<svg class="rmap-pins" viewBox="' + f1(x0) + ' ' + f1(y0) + ' ' + CW + ' ' + CH + '" role="group" aria-label="Map of the area around ' + esc(p.name) + ' at ' + esc(p.locality_line) + ', with the other Rare Earth communities. Drawn to scale from OpenStreetMap data.">' +
      '<rect class="plate" x="' + f1(x0 + CW - 210) + '" y="' + f1(y0 + CH - 78) + '" width="210" height="78"/>' +
      '<g class="rmap-scale" transform="translate(' + f1(x0 + CW - 174) + ' ' + f1(y0 + CH - 28) + ')" aria-hidden="true"><path d="M0 0H149.8M0 -7V0M74.9 -4V0M149.8 -7V0"/><text x="0" y="-13">0</text><text x="149.8" y="-13" text-anchor="end">5 KM</text></g>' +
      // the base map carries its own north arrow at (960, 46); draw ours only when that one is cropped out
      (x0 + CW >= 975 && y0 <= 20 ? '' : '<g class="rmap-north" transform="translate(' + f1(x0 + 40) + ' ' + f1(y0 + 38) + ')" aria-hidden="true"><path d="M0 -18L7 4L0 -1L-7 4Z"/><text y="24" text-anchor="middle">N</text></g>') +
      '<g class="rmap-others">' + others + '</g>' +
      '<g class="rmap-pin" transform="translate(' + f1(cx) + ' ' + f1(cy) + ')"><circle class="halo" r="30"/><rect x="-16" y="-16" width="32" height="32" rx="7"/>' +
      '<text text-anchor="middle" dy="7.5" aria-hidden="true">' + esc(p.name.charAt(0)) + '</text><text class="lb" x="' + (pinLeft ? -26 : 26) + '" y="-6"' + (pinLeft ? ' text-anchor="end"' : '') + '>' + esc(p.name) + '</text></g>' +
      '</svg></div><figcaption><span>Drawn to scale from OpenStreetMap data</span><i>' + esc(M.attribution || 'Map data © OpenStreetMap contributors') + '</i></figcaption></figure>';
    var hasMins = items.some(function (c) { return c.mins != null; }), hasKm = items.some(function (c) { return c.km != null; });
    var list = items.length ? '<ol class="locm-list' + (hasMins || hasKm ? ' big' : '') + '">' + numbered.map(function (x) {
      return '<li data-n="' + x.n + '"><span class="n">' + x.n + '</span><span class="pl">' + esc(x.c.place) + '<small>' + esc(x.c.cat || '') + '</small></span>' + distFigure(x.c) + '</li>';
    }).join('') + '</ol><p class="ph-note" style="margin-top:14px">' + (hasMins && hasKm ? 'Approximate off-peak drive times and distances.' : hasMins ? 'Approximate off-peak drive times.' : hasKm ? 'Approximate distances.' : '') + '</p>' : '';
    el.innerHTML = '<div class="locm">' + mapHTML + '<div class="locm-side">' + list +
      '<p class="locm-addr"><span class="kicker" style="display:block;margin-bottom:8px">Site</span>' + esc(p.address) + '</p>' +
      '<div class="locm-acts"><a class="link" href="' + RE.mapsLink(p) + '" target="_blank" rel="noopener">Get directions <span class="ln"></span></a>' +
      '<button type="button" class="link" data-map-load>Load interactive map <span class="ln"></span></button></div>' +
      '<div class="locm-embed" hidden></div></div></div>';
    var pinned = 0;
    var sync = function (nn) {
      $$('.locm-list li', el).forEach(function (li) { li.classList.toggle('on', !!nn && li.dataset.n === String(nn)); });
    };
    el.addEventListener('mouseover', function (e) { var t = e.target.closest('[data-n]'); if (t) sync(t.dataset.n); });
    el.addEventListener('focusin', function (e) { var t = e.target.closest('[data-n]'); if (t) sync(t.dataset.n); });
    el.addEventListener('mouseout', function (e) { if (!e.relatedTarget || !e.relatedTarget.closest || !e.relatedTarget.closest('[data-n]')) sync(pinned); });
    el.addEventListener('click', function (e) { var t = e.target.closest('[data-n]'); if (!t) return; pinned = String(pinned) === t.dataset.n ? 0 : t.dataset.n; sync(pinned); });
    var ml = $('[data-map-load]', el);
    if (ml) ml.addEventListener('click', function () {
      var box = $('.locm-embed', el); box.hidden = false;
      box.innerHTML = '<iframe title="Map of ' + esc(p.name) + '" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="https://www.google.com/maps?q=' + encodeURIComponent(p.maps_query || p.address) + '&output=embed"></iframe>';
      this.remove();
    });
  });

  /* ---------- 2i. gallery (kind filter + lightbox) ---------- */
  var KIND = { photo: 'Photographs', render: "Architect's renders", illustrative: 'Visualisations', plan: 'Plans' };
  function kindOf(it) {
    if (it.kind) return it.kind;
    if (it.sheet) return 'plan';
    if (/^renders\//.test(it.src || '')) return /illustrative/i.test(it.note || '') ? 'illustrative' : 'render';
    return 'photo';
  }
  function galleryPlaceholder(grid) {
    grid.innerHTML = [0, 1, 2].map(function (i) {
      return '<figure class="ph-tile" style="cursor:default">' + RE.artHTML(p, { alt: '' }) + (i === 0 ? '<figcaption><span>Site photography to follow</span></figcaption>' : '') + '</figure>';
    }).join('');
    RE.fillContours(grid);
  }
  slot('gallery').forEach(function (el) {
    var g = (p.images && p.images.gallery) || [];
    var group = 'gal-' + p.slug;
    el.classList.add('galw');
    el.innerHTML = '<div class="gal-bar" hidden><div class="gal-f" role="group" aria-label="Show images"></div><span class="gal-n" aria-live="polite"></span></div><div class="gal"></div>';
    var grid = $('.gal', el), bar = $('.gal-bar', el), fbox = $('.gal-f', el), count = $('.gal-n', el);
    if (!g.length) { galleryPlaceholder(grid); return; }
    grid.innerHTML = g.map(function (it, i) {
      var k = kindOf(it);
      return '<figure class="' + (it.sheet ? 'sheet ' : '') + 'k-' + k + '" data-kind="' + k + '" data-opt-wrap data-lightbox="' + group + '" data-src="' + RE.asset(it.src) + '" data-title="' + esc(it.cap || p.name) + '" data-sub="' + esc(p.name + ' · ' + p.locality_line) + '" data-right="' + esc(it.note || (k === 'photo' ? 'Site photograph' : '')) + '"' + (it.sheet ? ' data-sheet' : '') +
        ' tabindex="0" role="button" aria-label="Open image: ' + esc(it.cap || it.alt || p.name) + '">' +
        RE.imgHTML(it, { sizes: i % 6 === 0 ? '(max-width:767px) 100vw, 66vw' : '(max-width:767px) 50vw, 33vw', optional: !!it.optional }) +
        '<figcaption><span>' + esc(it.cap || '') + '</span>' + (it.note ? '<i>' + esc(it.note) + '</i>' : '') + '</figcaption></figure>';
    }).join('');
    var all = $$('figure', grid), active = 'all';
    function live() { return all.filter(function (f) { return f.isConnected || f._parked; }); }
    function apply() {
      var keep = live();
      keep.forEach(function (f) {
        var on = active === 'all' || f.dataset.kind === active;
        f._parked = !on;
        f.setAttribute('data-lightbox', on ? group : group + '-off');
        if (on) grid.appendChild(f); else if (f.parentNode) f.parentNode.removeChild(f);
      });
      var shown = keep.filter(function (f) { return !f._parked; }).length;
      count.textContent = shown + (shown === 1 ? ' image' : ' images');
    }
    function chips() {
      var keep = live().filter(function (f) { return !f._gone; });
      var kinds = {};
      keep.forEach(function (f) { kinds[f.dataset.kind] = (kinds[f.dataset.kind] || 0) + 1; });
      var ks = Object.keys(kinds);
      if (!keep.length) { bar.hidden = true; galleryPlaceholder(grid); return; }
      if (ks.length < 2) { active = 'all'; bar.hidden = true; apply(); return; }
      if (active !== 'all' && !kinds[active]) active = 'all';
      bar.hidden = false;
      fbox.innerHTML = '<button type="button" data-k="all" aria-pressed="' + (active === 'all') + '">All<small>' + keep.length + '</small></button>' +
        ['photo', 'render', 'illustrative', 'plan'].filter(function (k) { return kinds[k]; }).map(function (k) {
          return '<button type="button" data-k="' + k + '" aria-pressed="' + (active === k) + '">' + KIND[k] + '<small>' + kinds[k] + '</small></button>';
        }).join('');
      apply();
    }
    fbox.addEventListener('click', function (e) {
      var b = e.target.closest('[data-k]'); if (!b) return;
      active = b.dataset.k;
      $$('[data-k]', fbox).forEach(function (x) { x.setAttribute('aria-pressed', x === b); });
      apply();
    });
    // an optional render that fails is removed by site.js → rebuild chips
    D.addEventListener('re:img-removed', function (e) {
      var img = e.detail && e.detail.img;
      all.forEach(function (f) { if (img && f.contains(img)) { f._gone = true; f._parked = false; } });
      all = all.filter(function (f) { return !f._gone; });
      chips();
    });
    chips();
    W.addEventListener('load', function () { RE.sweepImages(grid); });
  });

  /* ---------- 2j. explore other communities ---------- */
  slot('explore').forEach(function (el) {
    var i = PROJ.indexOf(p), n = PROJ.length, prev = PROJ[(i - 1 + n) % n], next = PROJ[(i + 1) % n];
    var others = PROJ.filter(function (o) { return o !== p; });
    el.innerHTML = '<div class="ex-grid" role="list">' + others.map(function (o) {
      var th0 = o.images && o.images.thumb, sheet = th0 && /plan|svg/.test(th0.src);
      var media = th0 ? RE.imgHTML(th0, { art: o.slug, alt: '', sizes: '(max-width:767px) 70vw, 25vw' }) : RE.artHTML(o, { alt: '' });
      var line = o.price && (o.price.from_inr || o.price.per_sqft) ? o.price.display : (o.type && o.type.label);
      return '<a class="ex-card" role="listitem" href="' + RE.href(o.url) + '"><div class="ex-m' + (sheet ? ' sheet' : '') + '">' + media + '<i class="ex-st">' + esc(o.stage.label) + '</i></div>' +
        '<b>' + esc(o.name) + '</b><span>' + esc(o.locality_line) + '</span><em>' + esc(line || '') + '<span aria-hidden="true">→</span></em></a>';
    }).join('') + '</div>' +
      '<nav class="ex-nav" aria-label="More communities"><a href="' + RE.href(prev.url) + '"><small>← Previous</small><b>' + esc(prev.name) + '</b></a>' +
      '<a class="link" href="' + RE.href('projects/') + '" style="align-self:center">View all projects <span class="ln"></span></a>' +
      '<a class="nx" href="' + RE.href(next.url) + '"><small>Next →</small><b>' + esc(next.name) + '</b></a></nav>';
  });

  /* ---------- 2k. project footer band ---------- */
  slot('pfoot').forEach(function (el) {
    var t = CFG.phones && CFG.phones[0];
    el.classList.add('pfoot');
    el.innerHTML = '<div class="wrap"><div class="pf-grid">' +
      '<div><h6>Site</h6><p>' + esc(p.address) + '</p></div>' +
      '<div><h6>Office</h6><p>' + esc(CFG.office.short) + '</p></div>' +
      '<div><h6>' + (p.rera && p.rera.length ? 'RERA' : 'Status') + '</h6>' + (p.rera && p.rera.length ? p.rera.map(function (r) { return '<p class="rn">' + (r.label && r.label !== 'RERA' ? esc(r.label) + '<br>' : '') + esc(r.number) + '</p>'; }).join('') : '<p>' + esc(p.registration || p.stage.label) + '</p>') + '</div>' +
      '<div><h6>Talk to us</h6>' + (t ? '<a href="tel:' + t.tel + '">' + esc(t.label) + '</a><br>' : '') + '<a href="' + RE.waLink('Hello Rare Earth, I’d like to know more about ' + p.name + '.') + '" target="_blank" rel="noopener">WhatsApp</a><br><a href="mailto:' + CFG.email + '">' + esc(CFG.email) + '</a>' +
      (p.external_site ? '<br><a href="' + esc(p.external_site) + '" target="_blank" rel="noopener">' + esc(p.external_site.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')) + ' ↗</a>' : '') + '</div>' +
      '<div><button type="button" class="pill sm" data-enquire="brochure" data-source="pfoot-brochure">Request brochure</button></div>' +
      '</div><p class="pf-disc">' + esc(CFG.disclaimer) + (p.rera && p.rera.length ? ' RERA details at rera.karnataka.gov.in.' : '') + '</p></div>';
  });

  /* ---------- 2l. layout plans stay folded until asked for (owner, 23 Oct 2026) ----------
     <button data-layout-open aria-controls="ID"> toggles <div id="ID" data-layout-reveal hidden>.
     Deep links (#layout/<sheet>) and Athena's "on the layout" links open it too. */
  $$('[data-layout-reveal]').forEach(function (box) {
    var btn = $('[data-layout-open][aria-controls="' + box.id + '"]');
    var label = btn && btn.querySelector('span:not(.ln)');
    var open = function (yes) {
      box.hidden = !yes;
      if (btn) { btn.setAttribute('aria-expanded', String(yes)); if (label) label.textContent = yes ? 'Hide the layout plan' : 'View the layout plan'; }
      if (yes) W.dispatchEvent(new Event('resize'));
    };
    if (btn) btn.addEventListener('click', function () { open(box.hidden); });
    if (/^#layout\//.test(location.hash)) open(true);
    D.addEventListener('click', function (e) { if (box.hidden && e.target.closest && e.target.closest('[data-ph-go]')) open(true); }, true);
  });

  /* ---------- 3. sticky sub-nav ---------- */
  var hero = $('.p-hero') || $('#top');
  var secs = $$('section[data-nav]').filter(function (s) { return !s.hidden && s.id; });
  var nav = null;
  if (hero && secs.length) {
    nav = D.createElement('nav');
    nav.className = 'subnav'; nav.setAttribute('aria-label', 'On this page');
    nav.innerHTML = '<div class="wrap subnav-in">' +
      '<a class="sn-back" href="' + RE.href('projects/') + '">' + RE.icons.left.replace('<svg ', '<svg width="14" height="14" ') + '<span>All projects</span></a>' +
      '<a class="sn-name" href="#top">' + esc(p.name) + '</a>' +
      '<div class="sn-links">' + secs.map(function (s) { return '<a href="#' + s.id + '">' + esc(s.getAttribute('data-nav')) + '</a>'; }).join('') + '</div>' +
      '<div class="sn-more" hidden><button type="button" aria-expanded="false">More ' + RE.icons.chev + '</button><div class="sn-more-p"></div></div>' +
      '<button type="button" class="sn-cta" data-enquire="general" data-source="subnav">Enquire</button>' +
      '</div><span class="sn-prog" aria-hidden="true"></span>';
    hero.parentNode.insertBefore(nav, hero.nextSibling);
    var linksBox = $('.sn-links', nav), more = $('.sn-more', nav), morePanel = $('.sn-more-p', nav), moreBtn = $('.sn-more>button', nav);
    var allLinks = $$('.sn-links a', nav);
    var layoutLinks = function () {
      allLinks.forEach(function (a) { linksBox.appendChild(a); });
      more.hidden = true;
      if (W.innerWidth < 1025) return;
      if (linksBox.scrollWidth <= linksBox.clientWidth + 1) return;
      more.hidden = false;
      var moved = [];
      while (linksBox.scrollWidth > linksBox.clientWidth + 1 && linksBox.children.length > 2) {
        moved.unshift(linksBox.lastElementChild); linksBox.lastElementChild.remove();
      }
      moved.forEach(function (a) { morePanel.appendChild(a); });
    };
    var closeMore = function () { more.classList.remove('open'); moreBtn.setAttribute('aria-expanded', 'false'); };
    moreBtn.addEventListener('click', function () { var o = !more.classList.contains('open'); more.classList.toggle('open', o); moreBtn.setAttribute('aria-expanded', o); });
    D.addEventListener('click', function (e) { if (!more.contains(e.target)) closeMore(); });
    D.addEventListener('keydown', function (e) { if (e.key === 'Escape' && more.classList.contains('open')) { closeMore(); moreBtn.focus(); } });
    morePanel.addEventListener('click', closeMore);
    var rt; W.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { layoutLinks(); spy(); }, 120); });
    if (D.fonts && D.fonts.ready) D.fonts.ready.then(layoutLinks); layoutLinks();

    // scroll-spy by position: the active section is the last one whose top
    // has passed a reading line just below the sticky bars
    var curId = null;
    var setOn = function (id) {
      if (id === curId) return; curId = id;
      allLinks.forEach(function (a) {
        var on = a.getAttribute('href') === '#' + id;
        a.classList.toggle('on', on);
        if (on) {
          a.setAttribute('aria-current', 'location');
          if (a.parentNode === linksBox && linksBox.scrollWidth > linksBox.clientWidth && W.innerWidth < 1025) {
            linksBox.scrollTo({ left: a.offsetLeft - linksBox.clientWidth / 2 + a.offsetWidth / 2, behavior: RE.reduce ? 'auto' : 'smooth' });
          }
        } else a.removeAttribute('aria-current');
      });
      moreBtn.classList.toggle('on', !!$('a.on', morePanel));
    };
    var prog = $('.sn-prog', nav), last = secs[secs.length - 1];
    var spy = function () {
      var lineY = nav.getBoundingClientRect().bottom + W.innerHeight * .22, id = null;
      for (var i = 0; i < secs.length; i++) {
        var r = secs[i].getBoundingClientRect();
        if (r.top <= lineY) id = secs[i].id; else break;
      }
      if (id === last.id && last.getBoundingClientRect().bottom < lineY - 40) id = null;
      setOn(id);
      // a sticky bar's offsetTop follows its stuck position, so measure from the hero's end
      var start = hero.offsetTop + hero.offsetHeight, end = last.offsetTop + last.offsetHeight - W.innerHeight;
      var k = end > start ? (W.scrollY - start) / (end - start) : 0;
      prog.style.transform = 'scaleX(' + Math.max(0, Math.min(1, k)).toFixed(4) + ')';
    };
    var spyQ = false;
    D.addEventListener('re:scroll', function () { if (!spyQ) { spyQ = true; requestAnimationFrame(function () { spyQ = false; spy(); }); } });
    W.addEventListener('load', spy);
    spy();
  }

  /* ---------- 4. consistency checks (console only) ---------- */
  function norm(s) { return String(s == null ? '' : s).replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, ' ').trim(); }
  function checkLD() {
    var reraNos = (p.rera || []).map(function (r) { return r.number; });
    $$('script[type="application/ld+json"]').forEach(function (s) {
      var data;
      try { data = JSON.parse(s.textContent); } catch (err) { console.error('[RE] invalid JSON-LD block: ' + err.message); return; }
      (Array.isArray(data) ? data : [data]).forEach(function (d) {
        var t = [].concat(d['@type'] || []);
        if (t.indexOf('Residence') > -1 || t.indexOf('Place') > -1) {
          if (d.name && d.name !== p.name) console.warn('[RE] JSON-LD name "' + d.name + '" differs from data "' + p.name + '"');
          var id = d.identifier && d.identifier.value;
          if (id && reraNos.indexOf(id) < 0) console.warn('[RE] JSON-LD RERA "' + id + '" is not in projects-data.js (' + (reraNos.join(', ') || 'none') + ')');
          if (!id && reraNos.length) console.warn('[RE] JSON-LD Residence has no RERA identifier; data has ' + reraNos.join(', '));
        }
        if (t.indexOf('BreadcrumbList') > -1) {
          var items = d.itemListElement || [], lastI = items[items.length - 1];
          if (lastI && lastI.name !== p.name) console.warn('[RE] Breadcrumb JSON-LD ends with "' + lastI.name + '", expected "' + p.name + '"');
        }
        if (t.indexOf('FAQPage') > -1) {
          var ld = (d.mainEntity || []).map(function (q) { return { q: norm(q.name), a: norm(q.acceptedAnswer && q.acceptedAnswer.text) }; });
          var vis = $$('#faqs details').map(function (x) { var sm = $('summary', x), b = $('.acc-b', x); return { q: norm(sm && sm.textContent), a: norm(b && b.textContent) }; });
          if (ld.length !== vis.length) console.warn('[RE] FAQPage JSON-LD has ' + ld.length + ' questions; the page shows ' + vis.length);
          ld.forEach(function (x, i) {
            var v = vis[i]; if (!v) return;
            if (x.q !== v.q) console.warn('[RE] FAQ ' + (i + 1) + ' question differs: JSON-LD "' + x.q + '" vs page "' + v.q + '"');
            else if (x.a !== v.a) console.warn('[RE] FAQ ' + (i + 1) + ' answer differs between JSON-LD and page ("' + x.q + '")');
          });
        }
      });
    });
  }
  W.addEventListener('load', checkLD);

  /* ---------- 5. deep links, refresh ---------- */
  function goHash() {
    var h = location.hash; if (!h || h.length < 2) return;
    var id;
    try { id = /^#layout\//.test(h) ? 'layout' : decodeURIComponent(h.slice(1)); } catch (e) { return; }
    var t = D.getElementById(id);
    if (t && t.closest('main')) setTimeout(function () { t.scrollIntoView({ behavior: 'auto' }); }, 60);
  }
  goHash(); W.addEventListener('load', goHash, { once: true });
  RE.refresh(D);
  RE.projectPage = { has: has, subnav: nav, kinds: KIND };
})();
