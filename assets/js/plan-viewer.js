/* =====================================================================
   Rare Earth Projects · plan-viewer.js
   Interactive layout viewer for raster (or SVG-as-image) site plans.
   - Sheets come from projects-data.js  p.plan.sheets[]:
       {key,label,sub,src,sm,meta,w,h,caption,rera,legend[],optional,
        fallback:{src,w,h,caption,legend[]}}
   - meta JSON (renders/<slug>-plan.meta.json):
       {view,w,h,hotspots:[{kind,name,left,top}], plotTypes:{type:count},
        planColors:{type:hex}}   left/top are % of the image.
   - Features: phase/sheet tabs (hash #layout/<key>), zoom 1–8x via
     buttons, Ctrl/⌘+wheel, pinch, double-click, keyboard (+ − 0 arrows),
     drag-to-pan, fullscreen overlay, mini-map, numbered hotspots synced
     both ways with the legend, plot-type colour key, layer chip, text
     alternative, graceful fallback chain (sm → full → fallback image).
   Usage: <div data-plan-viewer [data-project="athena"]></div>
          (auto-mounted near the viewport) or RE.PlanViewer.mount(el, p)
   ===================================================================== */
(function () {
  'use strict';
  var RE = window.RE; if (!RE) return;
  var D = document, W = window, $ = RE.$, $$ = RE.$$, esc = RE.esc;
  var MAXZ = 8;
  var DEFAULT_COLORS = { '30x40': '#e6d3ad', '30x50': '#e9c6a6', '40x60': '#c9d3a9', '50x80': '#bcc9b8', 'odd': '#cdbb9a' };
  var SVG = {
    plus: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M8 2v12M2 8h12"/></svg>',
    minus: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M2 8h12"/></svg>',
    fit: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true"><path d="M1.5 5.5v-4h4M10.5 1.5h4v4M14.5 10.5v4h-4M5.5 14.5h-4v-4"/></svg>',
    full: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true"><path d="M6 1.5H1.5V6M10 1.5h4.5V6M14.5 10v4.5H10M6 14.5H1.5V10M1.5 1.5l5 5M14.5 1.5l-5 5M14.5 14.5l-5-5M1.5 14.5l5-5"/></svg>',
    close: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true"><path d="M2 2l12 12M14 2L2 14"/></svg>'
  };
  var nid = 0;

  function normType(t) { return String(t || '').toLowerCase().replace(/\s+/g, '').replace(/[×*]/g, 'x'); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function loadImg(list, cb) {
    var i = 0;
    (function next() {
      if (i >= list.length) { cb(null); return; }
      var src = list[i++], im = new Image();
      im.onload = function () { cb({ src: src, w: im.naturalWidth || 1000, h: im.naturalHeight || 1000, index: i - 1 }); };
      im.onerror = next;
      im.src = src;
    })();
  }

  function Viewer(el, p, opts) {
    this.el = el; this.p = p; this.o = opts || {};
    this.id = 'pv' + (++nid);
    this.sheets = (p.plan.sheets || []).map(function (s) { return Object.assign({ state: s.optional ? 'probe' : 'idle' }, s); });
    this.s = 1; this.tx = 0; this.ty = 0; this.base = { x: 0, y: 0, w: 1, h: 1 };
    this.ptrs = new Map(); this.hinted = false; this.full = false; this.active = null; this.pinned = null;
    this.build();
    this.probe();
  }
  var P = Viewer.prototype;

  P.build = function () {
    var p = this.p, id = this.id, el = this.el;
    el.classList.add('pv');
    el.setAttribute('role', 'group');
    el.setAttribute('aria-label', (p.plan.title || p.name + ' layout') + ', interactive');
    el.innerHTML =
      '<div class="pv-bar">' +
      '<div class="pv-tabs" role="tablist" aria-label="Layout sheets"></div>' +
      '<div class="pv-layers"><button type="button" class="pv-chip" data-layer="amen" aria-pressed="true">Amenities</button></div>' +
      '<button type="button" class="pv-close">' + SVG.close + '<span>Close</span></button>' +
      '</div>' +
      '<div class="pv-grid"><div class="pv-main">' +
      '<div class="pv-sheet"><div class="pv-stage" id="' + id + '-stage" tabindex="0" aria-roledescription="zoomable layout" aria-label="Layout drawing. Plus and minus keys zoom, arrow keys pan, zero resets." aria-describedby="' + id + '-cap">' +
      '<div class="pv-load">Loading layout…</div>' +
      '<div class="pv-canvas"><img alt="" draggable="false"><div class="pv-hs"></div></div>' +
      '<div class="pv-mini" aria-hidden="true"><img alt=""><i></i></div>' +
      '<div class="pv-ctl">' +
      '<button type="button" data-z="in" aria-label="Zoom in">' + SVG.plus + '</button>' +
      '<button type="button" data-z="out" aria-label="Zoom out" disabled>' + SVG.minus + '</button>' +
      '<button type="button" data-z="fit" aria-label="Fit to view" disabled>' + SVG.fit + '</button>' +
      '<button type="button" data-z="full" class="pv-fs-in" aria-label="Open full-screen layout">' + SVG.full + '</button>' +
      '</div><div class="pv-hint" aria-hidden="true">Hold Ctrl / ⌘ and scroll to zoom</div>' +
      '</div></div>' +
      '<button type="button" class="link pv-explore" data-z="full">Explore layout ⤢ <span class="ln"></span></button>' +
      '<p class="pv-cap" id="' + id + '-cap"></p>' +
      '<details class="pv-alt"><summary>Read the layout as text</summary><div class="pv-alt-b"></div></details>' +
      '</div>' +
      '<aside class="pv-side" aria-label="Layout key">' +
      '<div class="pv-seg" role="tablist" aria-label="Layout panels"><button type="button" role="tab" data-pane="key" aria-selected="true">Key</button><button type="button" role="tab" data-pane="amen" aria-selected="false">Amenities</button></div>' +
      '<section class="pv-sec is-cur" data-pane="key"><h3>Plot sizes</h3><ul class="pv-key"></ul></section>' +
      '<section class="pv-sec" data-pane="amen"><h3>Amenities &amp; open space</h3><ol class="pv-legend"></ol></section>' +
      '<section class="pv-sec keep pv-actsec"><div class="pv-acts"></div></section>' +
      '</aside></div>';
    this.stage = $('.pv-stage', el); this.canvas = $('.pv-canvas', el); this.img = $('.pv-canvas>img', el);
    this.hs = $('.pv-hs', el); this.mini = $('.pv-mini', el); this.cap = $('.pv-cap', el);
    this.key = $('.pv-key', el); this.legend = $('.pv-legend', el); this.acts = $('.pv-acts', el);
    this.tabs = $('.pv-tabs', el); this.alt = $('.pv-alt-b', el);
    this.renderTabs();
    this.bind();
  };

  P.renderTabs = function () {
    var self = this;
    this.tabs.innerHTML = this.sheets.length > 1 ? this.sheets.map(function (s, i) {
      return '<button type="button" role="tab" id="' + self.id + '-t-' + s.key + '" data-key="' + s.key + '" aria-controls="' + self.id + '-stage" aria-selected="false" tabindex="-1"' + (s.state === 'probe' || s.state === 'gone' ? ' hidden' : '') + '>' + esc(s.label) + (s.sub ? '<small>' + esc(s.sub) + '</small>' : '') + '</button>';
    }).join('') : '';
  };

  P.visibleTabs = function () { return $$('[role="tab"]:not([hidden])', this.tabs); };

  P.probe = function () {
    // optional sheets: show their tab only if the image exists
    var self = this, pending = 0;
    var hashKey = (location.hash.match(/^#layout\/([\w-]+)/) || [])[1];
    this.sheets.forEach(function (s) {
      if (s.state !== 'probe') return;
      pending++;
      loadImg([RE.asset(s.sm || s.src), RE.asset(s.src)], function (r) {
        s.state = r ? 'idle' : 'gone';
        var t = $('[data-key="' + s.key + '"]', self.tabs); if (t) t.hidden = !r;
        // first paint waits for the probe (max 1.2 s); after that a late probe only reveals its tab
        if (--pending === 0 && !self.cur) self.select(self.initialKey(hashKey), true);
      });
    });
    if (!pending) this.select(this.initialKey(hashKey), true);
    else {
      // don't keep the user waiting more than a moment
      setTimeout(function () { if (!self.cur) self.select(self.initialKey(hashKey, true), true); }, 1200);
    }
  };
  P.initialKey = function (hashKey, skipProbe) {
    var ok = this.sheets.filter(function (s) { return s.state === 'idle' || (!skipProbe && s.state === 'probe'); });
    if (hashKey && ok.some(function (s) { return s.key === hashKey; })) return hashKey;
    ok = ok.filter(function (s) { return s.state === 'idle'; });
    return ok.length ? ok[0].key : (this.sheets[0] && this.sheets[0].key);
  };

  P.select = function (key, quiet) {
    var self = this, s = this.sheets.filter(function (x) { return x.key === key; })[0];
    if (!s) return;
    if (this.cur === s && s.loaded) return;
    this.cur = s;
    $$('[role="tab"]', this.tabs).forEach(function (t) { var on = t.dataset.key === key; t.setAttribute('aria-selected', on); t.tabIndex = on ? 0 : -1; });
    if (!quiet && this.sheets.length > 1) { try { history.replaceState(null, '', '#layout/' + key); } catch (e) { /* file:// */ } }
    this.fit(false);
    this.load(s);
  };

  P.load = function (s) {
    var self = this, list = [];
    if (s.sm) list.push({ src: RE.asset(s.sm), mode: 'primary', hi: !!s.src && s.src !== s.sm });
    if (s.src) list.push({ src: RE.asset(s.src), mode: 'primary', hi: false });
    if (s.fallback && s.fallback.src) list.push({ src: RE.asset(s.fallback.src), mode: 'fallback', hi: false });
    this.stage.classList.add('loading');
    loadImg(list.map(function (x) { return x.src; }), function (r) {
      if (self.cur !== s) return;
      self.stage.classList.remove('loading');
      var ld = $('.pv-load', self.stage);
      if (!r) {
        if (s.optional) { s.state = 'gone'; var t = $('[data-key="' + s.key + '"]', self.tabs); if (t) t.hidden = true; var nk = self.initialKey(null, true); if (nk && nk !== s.key) { self.select(nk, true); return; } }
        ld.textContent = 'Layout coming soon';
        self.img.removeAttribute('src');
        self.renderSide(s, 'none', null);
        return;
      }
      ld.textContent = '';
      var pick = list[r.index];
      s.loaded = true; s.mode = pick.mode; s.hiPending = pick.hi; s.nat = { w: r.w, h: r.h };
      self.img.classList.remove('fade'); void self.img.offsetWidth; self.img.classList.add('fade');
      self.img.src = r.src; self.img.alt = (self.p.plan.title || self.p.name + ' layout') + ' · ' + s.label;
      $('img', self.mini).src = r.src;
      self.stage.style.setProperty('--pv-ar', (r.w / r.h).toFixed(4));
      self.measure(); self.fit(false);
      if (pick.mode === 'primary' && s.meta) self.loadMeta(s); else self.renderSide(s, pick.mode, null);
    });
  };

  P.loadMeta = function (s) {
    var self = this;
    if (s.metaData !== undefined) { this.renderSide(s, s.mode, s.metaData); return; }
    if (!W.fetch || RE.isFile) { s.metaData = null; this.renderSide(s, s.mode, null); return; }
    fetch(RE.asset(s.meta), { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (m) { s.metaData = m; })
      .catch(function () { s.metaData = null; })
      .then(function () { if (self.cur === s) self.renderSide(s, s.mode, s.metaData); });
  };

  /* ---------- side panel, hotspots, caption, text alternative ---------- */
  P.groups = function (meta) {
    var map = {}, out = [];
    ((meta && meta.hotspots) || []).forEach(function (h) {
      var l = +h.left, t = +h.top;
      if (!isFinite(l) || !isFinite(t) || l < 0 || l > 100 || t < 0 || t > 100 || !h.name) return;
      var name = String(h.name).replace(/\s+/g, ' ').trim(), k = name.toLowerCase();
      if (!map[k]) { map[k] = { id: out.length + 1, name: name, kind: h.kind || '', pts: [] }; out.push(map[k]); }
      map[k].pts.push([l, t]);
    });
    return out;
  };
  P.renderSide = function (s, mode, meta) {
    var self = this, p = this.p, fmts = p.plot_formats || [];
    var groups = mode === 'primary' ? this.groups(meta) : [];
    this.groupsData = groups;
    // plot-type key
    var rows = [], colors = (meta && meta.planColors) || {};
    var colorOf = function (k) { var c = null; Object.keys(colors).forEach(function (x) { if (normType(x) === k) c = colors[x]; }); return c || DEFAULT_COLORS[k] || '#ddd'; };
    if (meta && meta.plotTypes && Object.keys(meta.plotTypes).length) {
      var keys = Object.keys(meta.plotTypes);
      var order = fmts.map(function (f) { return f.key; });
      keys.sort(function (a, b) { var ia = order.indexOf(normType(a)), ib = order.indexOf(normType(b)); return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib); });
      keys.forEach(function (k) {
        var nk = normType(k), f = fmts.filter(function (x) { return x.key === nk; })[0];
        rows.push({ sw: colorOf(nk), label: f ? f.label + (f.sqft ? ' ft' : '') : k, sub: f && f.sqft ? RE.nf(f.sqft) + ' sq ft · ' + RE.area.sqyd(f.sqft) + ' sq yd' : (f && f.sqft_max ? 'Up to ' + RE.nf(f.sqft_max) + ' sq ft' : (nk === 'odd' ? 'Individually shaped plots' : '')), n: meta.plotTypes[k] });
      });
    } else {
      fmts.forEach(function (f) {
        rows.push({ sw: colorOf(f.key), label: f.label + (f.sqft ? ' ft' : ''), sub: f.sqft ? RE.nf(f.sqft) + ' sq ft · ' + RE.area.sqyd(f.sqft) + ' sq yd' : (f.sqft_max ? 'Up to ' + RE.nf(f.sqft_max) + ' sq ft' : 'Individually shaped plots'), n: f.count });
      });
    }
    var multiPhase = p.phases && p.phases.length > 1, phaseSheet = /^phase-/.test(s.key);
    $('.pv-sec[data-pane="key"] h3', this.el).textContent = 'Plot sizes' + (phaseSheet && multiPhase && !(meta && meta.plotTypes) ? ' · counts for both phases' : '');
    var lu = p.land_use || {};
    var extra = [];
    if (lu.parks && lu.parks.length) extra.push({ sw: '#6c7a44', label: 'Parks & open space', sub: lu.parks_pct ? lu.parks_pct + '% of the site' : lu.parks.length + ' parks', n: '' });
    if (p.roads && p.roads.internal_m) extra.push({ sw: '#3b3a36', label: 'Internal roads', sub: p.roads.internal_m.join(' m & ') + ' m', n: '' });
    this.key.innerHTML = rows.concat(extra).map(function (r) {
      return '<li><span class="pv-sw" style="background:' + r.sw + '"></span><span>' + esc(r.label) + (r.sub ? '<small>' + esc(r.sub) + '</small>' : '') + '</span><b>' + (r.n === '' || r.n == null ? '' : esc(r.n)) + '</b></li>';
    }).join('') || '<li><span></span><span>Plot sizes on request</span><b></b></li>';
    // amenity legend
    var staticLegend = mode === 'fallback' ? (s.fallback && s.fallback.legend) : (groups.length ? null : s.legend);
    var amenSec = $('.pv-sec[data-pane="amen"]', this.el);
    if (groups.length) {
      this.legend.className = 'pv-legend' + (groups.length < 7 ? ' single' : '');
      this.legend.innerHTML = groups.map(function (g) { return '<li><button type="button" data-id="' + g.id + '" aria-pressed="false"><span class="n">' + g.id + '</span><span>' + esc(g.name) + '</span></button></li>'; }).join('');
      amenSec.hidden = false;
    } else if (staticLegend && staticLegend.length) {
      this.legend.className = 'pv-legend static' + (staticLegend.length < 7 ? ' single' : '');
      this.legend.innerHTML = staticLegend.map(function (t, i) { return '<li><div class="lg-row"><span class="n">' + (i + 1) + '</span><span>' + esc(t) + '</span></div></li>'; }).join('');
      amenSec.hidden = false;
    } else { this.legend.innerHTML = ''; amenSec.hidden = true; }
    $('.pv-seg [data-pane="amen"]', this.el).hidden = amenSec.hidden;
    $('.pv-layers', this.el).hidden = !groups.length;
    // hotspot markers
    this.hs.innerHTML = groups.map(function (g) {
      return g.pts.map(function (pt, j) {
        return '<button type="button" class="pv-mk" data-id="' + g.id + '" style="left:' + pt[0] + '%;top:' + pt[1] + '%;--i:' + (g.id + j) + '" aria-label="' + g.id + '. ' + esc(g.name) + '"><i>' + g.id + '</i><span class="tip">' + esc(g.name) + '</span></button>';
      }).join('');
    }).join('');
    this.hs.classList.toggle('off', $('.pv-chip', this.el).getAttribute('aria-pressed') === 'false');
    // caption
    var capTxt = mode === 'fallback' ? (s.fallback.caption || s.caption) : s.caption;
    this.cap.innerHTML = esc(capTxt || '') + (s.rera && mode !== 'none' ? '<br><b>' + esc(s.rera) + '</b>' : '');
    // actions
    var phaseNo = (s.key.match(/^phase-(\d)/) || [])[1] || '';
    this.acts.innerHTML =
      '<button type="button" class="pill solid" data-enquire="visit" data-project="' + p.slug + '"' + (phaseNo ? ' data-phase="' + phaseNo + '"' : '') + ' data-source="plan-visit">Arrange a site visit</button>' +
      '<button type="button" class="btn-txt" data-enquire="brochure" data-project="' + p.slug + '"' + (phaseNo ? ' data-phase="' + phaseNo + '"' : '') + ' data-source="plan-layout-pdf">Request the layout (PDF) →</button>';
    // text alternative
    var alt = '';
    if (fmts.length) {
      alt += '<table><caption class="sr-only">Plot formats</caption><thead><tr><th scope="col">Format</th><th scope="col">Area</th><th scope="col">Plots</th></tr></thead><tbody>' +
        fmts.map(function (f) { return '<tr><td>' + esc(f.label) + (f.sqft ? ' ft' : '') + '</td><td>' + (f.sqft ? RE.nf(f.sqft) + ' sq ft (' + RE.area.sqyd(f.sqft) + ' sq yd)' : (f.sqft_max ? 'Up to ' + RE.nf(f.sqft_max) + ' sq ft' : 'Varies')) + '</td><td>' + (f.count != null ? f.count : '') + '</td></tr>'; }).join('') +
        '</tbody></table>';
    }
    var names = groups.length ? groups.map(function (g) { return g.name; }) : (staticLegend || []);
    if (names.length) alt += '<p style="margin-top:14px">Marked on this sheet: ' + names.map(esc).join(', ') + '.</p>';
    if (lu.parks && lu.parks.length) alt += '<p style="margin-top:8px">Parks: ' + lu.parks.map(function (k) { return esc(k.name) + ' ' + RE.nf(k.sqm) + ' sq m'; }).join(', ') + (lu.parks_pct ? ' (' + lu.parks_pct + '% of the site)' : '') + '.</p>';
    this.alt.innerHTML = alt || '<p>Details of this layout are available on request.</p>';
    // sync markers <-> legend
    this.activate(null);
    if (groups.length && !this.dropped) this.observeDrop();
    this.applyT(false);
  };

  P.activate = function (id, opts) {
    opts = opts || {};
    this.active = id;
    var self = this;
    $$('.pv-mk', this.hs).forEach(function (m) { m.classList.toggle('on', id != null && m.dataset.id === String(id)); });
    $$('.pv-legend button', this.el).forEach(function (b) {
      var on = id != null && b.dataset.id === String(id);
      b.classList.toggle('on', on); b.setAttribute('aria-pressed', on);
      if (on && opts.scrollLegend) {
        var list = self.legend, top = b.offsetTop - list.offsetTop;
        if (top < list.scrollTop || top > list.scrollTop + list.clientHeight - b.offsetHeight) list.scrollTo({ top: top - 40, behavior: RE.reduce ? 'auto' : 'smooth' });
        if (W.matchMedia('(max-width:1024px)').matches) self.pane('amen');
      }
    });
    if (id != null && opts.pan && this.s > 1.01) {
      var g = (this.groupsData || []).filter(function (x) { return x.id === id; })[0];
      if (g) {
        var cx = 0, cy = 0; g.pts.forEach(function (pt) { cx += pt[0]; cy += pt[1]; }); cx /= g.pts.length; cy /= g.pts.length;
        var b = this.base;
        this.tx = this.W / 2 - b.x - (cx / 100) * b.w * this.s;
        this.ty = this.H / 2 - b.y - (cy / 100) * b.h * this.s;
        this.applyT(true);
      }
    }
  };
  P.observeDrop = function () {
    var self = this;
    if (RE.reduce || !('IntersectionObserver' in W)) { this.dropped = true; return; }
    var io = new IntersectionObserver(function (es) {
      if (es[0].isIntersecting) { self.dropped = true; self.el.classList.add('drop'); io.disconnect(); setTimeout(function () { self.el.classList.remove('drop'); }, 1600); }
    }, { threshold: .3 });
    io.observe(this.stage);
  };
  P.pane = function (k) {
    $$('.pv-seg [role="tab"]', this.el).forEach(function (b) { b.setAttribute('aria-selected', b.dataset.pane === k); });
    $$('.pv-sec[data-pane]', this.el).forEach(function (s) { s.classList.toggle('is-cur', s.dataset.pane === k); });
  };

  /* ---------- geometry ---------- */
  P.measure = function () {
    var r = this.stage.getBoundingClientRect();
    this.W = r.width || 1; this.H = r.height || 1;
    var nat = (this.cur && this.cur.nat) || { w: 1, h: 1 }, ar = nat.w / nat.h, b = this.base;
    if (this.W / this.H > ar) { b.h = this.H; b.w = this.H * ar; } else { b.w = this.W; b.h = this.W / ar; }
    b.x = (this.W - b.w) / 2; b.y = (this.H - b.h) / 2;
    this.canvas.style.left = b.x + 'px'; this.canvas.style.top = b.y + 'px';
    this.canvas.style.width = b.w + 'px'; this.canvas.style.height = b.h + 'px';
  };
  P.clampT = function () {
    var b = this.base, cw = b.w * this.s, ch = b.h * this.s;
    if (cw <= this.W) this.tx = this.W / 2 - cw / 2 - b.x; else this.tx = clamp(this.tx, this.W - cw - b.x, -b.x);
    if (ch <= this.H) this.ty = this.H / 2 - ch / 2 - b.y; else this.ty = clamp(this.ty, this.H - ch - b.y, -b.y);
  };
  P.applyT = function (anim) {
    this.clampT();
    this.canvas.classList.toggle('anim', !!anim && !RE.reduce);
    this.canvas.style.transform = 'translate(' + this.tx + 'px,' + this.ty + 'px) scale(' + this.s + ')';
    this.canvas.style.setProperty('--inv', (1 / this.s).toFixed(4));
    var zoomed = this.s > 1.01;
    this.stage.classList.toggle('zoomed', zoomed);
    this.stage.style.touchAction = (this.full || zoomed) ? 'none' : 'pan-y';
    $('[data-z="out"]', this.el).disabled = !zoomed;
    $('[data-z="fit"]', this.el).disabled = !zoomed;
    $('[data-z="in"]', this.el).disabled = this.s >= MAXZ - .01;
    // mini-map
    var showMini = this.s > 2;
    this.mini.classList.toggle('show', showMini);
    if (showMini) {
      var b = this.base, i = $('i', this.mini);
      var vx = (-b.x - this.tx) / (b.w * this.s), vy = (-b.y - this.ty) / (b.h * this.s);
      i.style.left = clamp(vx, 0, 1) * 100 + '%'; i.style.top = clamp(vy, 0, 1) * 100 + '%';
      i.style.width = Math.min(1, this.W / (b.w * this.s)) * 100 + '%'; i.style.height = Math.min(1, this.H / (b.h * this.s)) * 100 + '%';
    }
    // hi-res swap on demand
    var s = this.cur;
    if (s && s.hiPending && (this.s > 1.6 || this.full)) {
      s.hiPending = false; var self = this, want = RE.asset(s.src);
      loadImg([want], function (r) { if (r && self.cur === s) self.img.src = r.src; });
    }
  };
  P.zoomAt = function (px, py, ns, anim) {
    ns = clamp(ns, 1, MAXZ);
    var b = this.base, lx = (px - b.x - this.tx) / this.s, ly = (py - b.y - this.ty) / this.s;
    this.s = ns; this.tx = px - b.x - lx * ns; this.ty = py - b.y - ly * ns;
    this.applyT(anim);
  };
  P.fit = function (anim) { this.s = 1; this.tx = 0; this.ty = 0; this.applyT(anim); };
  P.local = function (e) { var r = this.stage.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };

  /* ---------- fullscreen ---------- */
  P.toggleFull = function (on) {
    on = on == null ? !this.full : on;
    if (on === this.full) return;
    this.full = on;
    var el = this.el;
    if (on) {
      this.ph = D.createElement('div'); this.ph.style.height = el.offsetHeight + 'px';
      el.parentNode.insertBefore(this.ph, el); D.body.appendChild(el);
      el.classList.add('is-full'); el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true');
      D.body.classList.add('pv-full', 'locked');
      this.returnFocus = D.activeElement;
      setTimeout(function () { var c = $('.pv-close', el); c && c.focus(); }, 30);
    } else {
      el.classList.remove('is-full'); el.setAttribute('role', 'group'); el.removeAttribute('aria-modal');
      if (this.ph) { this.ph.parentNode.insertBefore(el, this.ph); this.ph.remove(); this.ph = null; }
      D.body.classList.remove('pv-full');
      if (!D.body.classList.contains('menu-open') && !D.body.classList.contains('enq-open')) D.body.classList.remove('locked');
      if (this.returnFocus && this.returnFocus.focus) this.returnFocus.focus({ preventScroll: true });
    }
    var self = this;
    requestAnimationFrame(function () { self.measure(); self.fit(false); });
  };

  /* ---------- events ---------- */
  P.bind = function () {
    var self = this, st = this.stage, el = this.el;
    // tabs
    this.tabs.addEventListener('click', function (e) { var t = e.target.closest('[role="tab"]'); if (!t) return; self.userPicked = true; self.select(t.dataset.key); });
    this.tabs.addEventListener('keydown', function (e) {
      var tabs = self.visibleTabs(), i = tabs.indexOf(D.activeElement); if (i < 0) return;
      var n = null;
      if (e.key === 'ArrowRight') n = tabs[(i + 1) % tabs.length];
      if (e.key === 'ArrowLeft') n = tabs[(i - 1 + tabs.length) % tabs.length];
      if (e.key === 'Home') n = tabs[0]; if (e.key === 'End') n = tabs[tabs.length - 1];
      if (n) { e.preventDefault(); n.focus(); self.userPicked = true; self.select(n.dataset.key); }
    });
    // controls
    el.addEventListener('click', function (e) {
      var z = e.target.closest('[data-z]'); if (!z) return;
      var k = z.dataset.z;
      if (k === 'in') self.zoomAt(self.W / 2, self.H / 2, self.s * 1.6, true);
      if (k === 'out') self.zoomAt(self.W / 2, self.H / 2, self.s / 1.6, true);
      if (k === 'fit') self.fit(true);
      if (k === 'full') self.toggleFull();
    });
    $('.pv-close', el).addEventListener('click', function () { self.toggleFull(false); });
    $('.pv-chip', el).addEventListener('click', function () {
      var on = this.getAttribute('aria-pressed') !== 'true'; this.setAttribute('aria-pressed', on); self.hs.classList.toggle('off', !on);
    });
    $('.pv-seg', el).addEventListener('click', function (e) { var b = e.target.closest('[data-pane]'); if (b) self.pane(b.dataset.pane); });
    // legend <-> markers
    var legendEv = function (e, pin) {
      var b = e.target.closest('.pv-legend button'); if (!b) return;
      var id = +b.dataset.id;
      if (pin) { self.pinned = self.pinned === id ? null : id; self.activate(self.pinned, { pan: true }); }
      else self.activate(id);
    };
    this.legend.addEventListener('click', function (e) { legendEv(e, true); });
    this.legend.addEventListener('mouseover', function (e) { legendEv(e, false); });
    this.legend.addEventListener('focusin', function (e) { legendEv(e, false); });
    this.legend.addEventListener('mouseleave', function () { self.activate(self.pinned); });
    this.hs.addEventListener('click', function (e) {
      var m = e.target.closest('.pv-mk'); if (!m) return;
      e.stopPropagation(); var id = +m.dataset.id;
      self.pinned = self.pinned === id ? null : id; self.activate(self.pinned, { scrollLegend: true });
    });
    this.hs.addEventListener('mouseover', function (e) { var m = e.target.closest('.pv-mk'); if (m) self.activate(+m.dataset.id); });
    this.hs.addEventListener('focusin', function (e) { var m = e.target.closest('.pv-mk'); if (m) self.activate(+m.dataset.id, { scrollLegend: true }); });
    this.hs.addEventListener('mouseout', function (e) { if (!e.relatedTarget || !e.relatedTarget.closest || !e.relatedTarget.closest('.pv-mk')) self.activate(self.pinned); });
    // wheel
    st.addEventListener('wheel', function (e) {
      if (e.ctrlKey || e.metaKey || self.full) {
        e.preventDefault();
        var pt = self.local(e); self.zoomAt(pt.x, pt.y, self.s * Math.exp(-e.deltaY * (e.ctrlKey && !e.metaKey && Math.abs(e.deltaY) < 50 ? 0.012 : 0.0022)), false);
      } else if (!self.hinted) {
        self.hinted = true; var h = $('.pv-hint', st); h.classList.add('show'); setTimeout(function () { h.classList.remove('show'); }, 1600);
      }
    }, { passive: false });
    // pointer: drag + pinch + double-tap
    var start = null, pinch = null, lastTap = 0, moved = false;
    st.addEventListener('pointerdown', function (e) {
      if (e.target.closest('.pv-ctl,.pv-mk')) return;
      self.ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
      moved = false;
      if (self.ptrs.size === 2) {
        var a = Array.from(self.ptrs.values());
        var mid = self.local({ clientX: (a[0].x + a[1].x) / 2, clientY: (a[0].y + a[1].y) / 2 });
        pinch = { d: Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y) || 1, s: self.s, tx: self.tx, ty: self.ty, mid: mid };
        start = null;
      } else if (self.ptrs.size === 1 && (self.s > 1.01 || self.full)) {
        start = { x: e.clientX, y: e.clientY, tx: self.tx, ty: self.ty };
        try { st.setPointerCapture(e.pointerId); } catch (err) { /* noop */ }
        st.classList.add('drag');
      }
    });
    st.addEventListener('pointermove', function (e) {
      if (!self.ptrs.has(e.pointerId)) return;
      self.ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pinch && self.ptrs.size >= 2) {
        e.preventDefault();
        var a = Array.from(self.ptrs.values());
        var d = Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y) || 1;
        var mid = self.local({ clientX: (a[0].x + a[1].x) / 2, clientY: (a[0].y + a[1].y) / 2 });
        var ns = clamp(pinch.s * d / pinch.d, 1, MAXZ), b = self.base;
        var lx = (pinch.mid.x - b.x - pinch.tx) / pinch.s, ly = (pinch.mid.y - b.y - pinch.ty) / pinch.s;
        self.s = ns; self.tx = mid.x - b.x - lx * ns; self.ty = mid.y - b.y - ly * ns;
        self.applyT(false); moved = true;
      } else if (start) {
        var dx = e.clientX - start.x, dy = e.clientY - start.y;
        if (Math.abs(dx) + Math.abs(dy) > 3) moved = true;
        self.tx = start.tx + dx; self.ty = start.ty + dy; self.applyT(false);
      }
    });
    var end = function (e) {
      self.ptrs.delete(e.pointerId);
      if (self.ptrs.size < 2) pinch = null;
      if (!self.ptrs.size) { start = null; st.classList.remove('drag'); }
      if (e.type === 'pointerup' && e.pointerType !== 'mouse' && !moved) {
        var now = Date.now();
        if (now - lastTap < 320) { var pt = self.local(e); self.zoomAt(pt.x, pt.y, self.s < 3.5 ? self.s * 2 : 1, true); lastTap = 0; }
        else lastTap = now;
      }
    };
    st.addEventListener('pointerup', end); st.addEventListener('pointercancel', end); st.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') end(e); });
    st.addEventListener('dblclick', function (e) { if (e.target.closest('.pv-ctl,.pv-mk')) return; var pt = self.local(e); self.zoomAt(pt.x, pt.y, self.s < 3.5 ? self.s * 2 : 1, true); });
    st.addEventListener('click', function (e) { if (!e.target.closest('.pv-mk,.pv-ctl') && !moved) { self.pinned = null; self.activate(null); } });
    // keyboard
    st.addEventListener('keydown', function (e) {
      var k = e.key, step = 60;
      if (k === '+' || k === '=') { e.preventDefault(); self.zoomAt(self.W / 2, self.H / 2, self.s * 1.4, true); }
      else if (k === '-' || k === '_') { e.preventDefault(); self.zoomAt(self.W / 2, self.H / 2, self.s / 1.4, true); }
      else if (k === '0') { e.preventDefault(); self.fit(true); }
      else if (/^Arrow/.test(k) && self.s > 1.01) {
        e.preventDefault();
        if (k === 'ArrowLeft') self.tx += step; if (k === 'ArrowRight') self.tx -= step;
        if (k === 'ArrowUp') self.ty += step; if (k === 'ArrowDown') self.ty -= step;
        self.applyT(true);
      } else if (k === 'f' || k === 'F') { self.toggleFull(); }
    });
    D.addEventListener('keydown', function (e) {
      if (!self.full || D.querySelector('dialog[open]')) return;
      if (e.key === 'Escape') { e.preventDefault(); self.toggleFull(false); return; }
      if (e.key === 'Tab') { // keep focus inside the full-screen viewer
        var f = $$('button:not([disabled]):not([hidden]),[tabindex="0"],a[href],summary', el).filter(function (x) { return x.offsetParent !== null; });
        if (!f.length) return;
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && D.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && D.activeElement === last) { e.preventDefault(); first.focus(); }
        else if (!el.contains(D.activeElement)) { e.preventDefault(); first.focus(); }
      }
    });
    // resize
    if ('ResizeObserver' in W) new ResizeObserver(function () { self.measure(); self.applyT(false); }).observe(st);
    W.addEventListener('hashchange', function () { var m = location.hash.match(/^#layout\/([\w-]+)/); if (m) self.select(m[1], true); });
  };

  /* ---------- mounting ---------- */
  function mount(el, p, opts) {
    if (!el || el._pv) return el && el._pv;
    p = p || RE.project(el.getAttribute('data-project')) || RE.current;
    if (!p || !p.plan || !p.plan.sheets || !p.plan.sheets.length) { el.hidden = true; return null; }
    el._pv = new Viewer(el, p, opts);
    return el._pv;
  }
  function auto() {
    var els = $$('[data-plan-viewer]');
    if (!els.length) return;
    if (!('IntersectionObserver' in W)) { els.forEach(function (el) { mount(el); }); return; }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { io.unobserve(e.target); mount(e.target); } });
    }, { rootMargin: '100% 0px' });
    els.forEach(function (el) {
      if (/^#layout/.test(location.hash)) mount(el); else io.observe(el);
    });
  }
  RE.PlanViewer = { mount: mount, Viewer: Viewer, auto: auto };
  auto();
})();
