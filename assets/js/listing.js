/* =====================================================================
   Rare Earth Projects · listing.js  (projects/index.html only)
   Builds the Projects listing from projects-data.js:
   - page-head count word + Now selling / Upcoming tabs
   - sticky filter bar (view, plot type, location, stage, plot size,
     budget, RERA) with faceted counts, chips, live count, Clear all,
     all synced to the query string (history.replaceState)
   - list rows with image strips (lightbox) and Explore / Enquire
   - schematic map view: markers, anchored card / bottom sheet, list
   - empty state, "Also worth a look" row (unknown size / price data)
   - mobile filter sheet (<dialog>)
   Unknown data never matches a size or budget filter; such projects
   are offered in the "Also worth a look" row instead.
   Depends on window.RE (site.js) and enquiry.js ([data-enquire]).
   ===================================================================== */
(function () {
  'use strict';
  var RE = window.RE; if (!RE) return;
  var D = document, W = window, B = D.body, $ = RE.$, $$ = RE.$$, esc = RE.esc, CFG = RE.config, I = RE.icons;
  var ALL = RE.projects.slice().sort(function (a, b) { return a.order - b.order; });
  var KEYS = ['type', 'loc', 'stage', 'size', 'budget'];
  var LABEL = { type: 'Plot type', loc: 'Location', stage: 'Stage', size: 'Plot size', budget: 'Budget', rera: 'RERA' };
  var OPTS = { type: CFG.types || [], loc: CFG.localities || [], stage: CFG.stages || [], size: CFG.sizeBands || [], budget: CFG.budgetBands || [] };
  var NUM = ['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve'];
  var MAX_ROWS = 10;
  // stage tabs: All · Now selling · Sold out · Upcoming (a tab only appears when it has projects)
  var GROUP = function (p) { return p.stage.key === 'upcoming' ? 'upcoming' : p.stage.key === 'sold-out' ? 'sold' : 'now'; };
  var TABS = [['all', 'All'], ['now', 'Now selling'], ['sold', 'Sold out'], ['upcoming', 'Upcoming']];
  var countOf = function (k) { return k === 'all' ? ALL.length : ALL.filter(function (p) { return GROUP(p) === k; }).length; };
  var S = { type: '', loc: '', stage: '', size: '', budget: '', rera: false, view: 'list', tab: 'all', all: false };
  var mqMobile = W.matchMedia('(max-width:767px)');
  var ICON = {
    list: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true"><path d="M8 6.5h12M8 12h12M8 17.5h12M4 6.5h.01M4 12h.01M4 17.5h.01" stroke-linecap="round"/></svg>',
    map: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true"><path d="M3 6.5l6-2.2 6 2.2 6-2.2v13.2l-6 2.2-6-2.2-6 2.2z"/><path d="M9 4.3v13.2M15 6.5v13.2"/></svg>',
    filter: '<svg viewBox="0 0 24 24" stroke-width="1.3" aria-hidden="true"><path d="M3 7h11M18 7h3M3 17h4M11 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="9" cy="17" r="2"/></svg>',
    ext: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true"><path d="M14 4h6v6M20 4l-9 9M18 14v6H4V6h6"/></svg>'
  };

  /* ------------------------------------------------------------------
     helpers
     ------------------------------------------------------------------ */
  function opt(k, v) { var l = OPTS[k] || []; for (var i = 0; i < l.length; i++) if (l[i].key === v) return l[i]; return null; }
  function optText(k, o) { return o.label + (k === 'size' && o.sub ? ' (' + o.sub + ')' : ''); }
  function plural(n) { return n + ' ' + (n === 1 ? 'community' : 'communities'); }
  function priceLine(p) { return (p.price && p.price.display) || 'Price on request'; }
  function typeLine(p) { return p.type.label + (p.plots_total ? ' · ' + p.plots_total : ''); }
  function hasRera(p) { return !!(p.rera && p.rera.length); }
  function active() { return KEYS.filter(function (k) { return S[k]; }).length + (S.rera ? 1 : 0); }
  function ucFirst(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  /* ------------------------------------------------------------------
     matching: true | false | null (null = data not published yet)
     ------------------------------------------------------------------ */
  function sizeRanges(p) {
    var out = [];
    (p.plot_formats || []).forEach(function (f) {
      var hi = f.sqft || f.sqft_max; if (!hi) return;
      out.push([f.sqft || p.size_min || hi, hi]);
    });
    if (!out.length && p.size_min) out.push([p.size_min, p.size_max || p.size_min]);
    return out.length ? out : null;
  }
  function priceRange(p) {
    var pr = p.price || {};
    if (pr.from_inr) return [pr.from_inr, pr.to_inr || null];
    if (pr.per_sqft) {
      var r = sizeRanges(p); if (!r) return null;
      var lo = Math.min.apply(null, r.map(function (x) { return x[0]; })), hi = Math.max.apply(null, r.map(function (x) { return x[1]; }));
      return [pr.per_sqft * lo, pr.per_sqft * hi];
    }
    return null;
  }
  function test(p, k, v) {
    if (!v) return true;
    var b;
    switch (k) {
      case 'type': return p.type.key === v;
      case 'loc': return p.locality.key === v;
      case 'stage': return p.stage.key === v;
      case 'rera': return hasRera(p);
      case 'size':
        var r = sizeRanges(p); b = opt('size', v); if (!r) return null;
        return r.some(function (x) { return x[1] > b.min && x[0] <= b.max; });
      case 'budget':
        var pr = priceRange(p); b = opt('budget', v); if (!pr) return null;
        if (pr[0] > b.max) return false;
        if (pr[1] == null) return pr[0] > b.min ? true : null; // only a starting price is published
        return pr[1] > b.min;
    }
    return true;
  }
  function inTab(p, st) { return st.tab === 'all' || GROUP(p) === st.tab; }
  function verdict(p, st) {
    if (!inTab(p, st)) return 'no';
    var maybe = false, ks = KEYS.concat('rera');
    for (var i = 0; i < ks.length; i++) {
      var r = test(p, ks[i], st[ks[i]]);
      if (r === false) return 'no';
      if (r === null) maybe = true;
    }
    return maybe ? 'maybe' : 'yes';
  }
  // yes = confirmed matches (shown as the count); any = yes + unconfirmed (an option is
  // disabled only when nothing could match it, so unpublished prices never trap the user)
  function countWith(k, v) {
    var st = {}, c = { yes: 0, any: 0 };
    for (var x in S) st[x] = S[x];
    st[k] = v;
    ALL.forEach(function (p) { var r = verdict(p, st); if (r === 'yes') c.yes++; if (r !== 'no') c.any++; });
    return c;
  }
  function lookingFor() {
    var parts = [];
    KEYS.forEach(function (k) {
      var o = S[k] && opt(k, S[k]); if (!o) return;
      parts.push(k === 'size' ? o.label.charAt(0).toLowerCase() + o.label.slice(1) : o.label);
    });
    if (S.rera) parts.push('RERA registered');
    return parts.length ? 'Looking for: ' + parts.join(' · ') : '';
  }

  /* ------------------------------------------------------------------
     URL state
     ------------------------------------------------------------------ */
  function readURL() {
    var q, any = false;
    try { q = new URLSearchParams(location.search); } catch (e) { return false; }
    KEYS.forEach(function (k) { var v = q.get(k); if (v && opt(k, v)) { S[k] = v; any = true; } });
    if (q.get('rera') === '1') { S.rera = true; any = true; }
    var v = q.get('view');
    if (v === 'map' || v === 'list') { S.view = v; any = true; }
    else if (location.hash === '#map') { S.view = 'map'; any = true; }
    if (location.hash === '#list' || location.hash === '#results') any = true;
    var tq = q.get('tab');
    if (tq && tq !== 'all' && TABS.some(function (t) { return t[0] === tq; }) && countOf(tq)) { S.tab = tq; any = true; }
    return any;
  }
  function writeURL() {
    var q = [];
    KEYS.forEach(function (k) { if (S[k]) q.push(k + '=' + encodeURIComponent(S[k])); });
    if (S.rera) q.push('rera=1');
    if (S.tab !== 'all') q.push('tab=' + S.tab);
    if (S.view === 'map') q.push('view=map');
    var h = location.hash;
    if (h === '#list' || h === '#map') h = '#' + S.view;
    try { history.replaceState(null, '', location.pathname + (q.length ? '?' + q.join('&') : '') + h); } catch (e) { /* file:// in some browsers */ }
  }

  /* ------------------------------------------------------------------
     image probing (renders may not exist yet) → deterministic strips
     ------------------------------------------------------------------ */
  var probes = {};
  function imgProbe(url, cb) { var i = new Image(); i.onload = function () { cb(true); }; i.onerror = function () { cb(false); }; i.src = url; }
  function probe(path) {
    if (probes[path]) return probes[path];
    var url = RE.asset(path);
    probes[path] = new Promise(function (res) {
      var t = setTimeout(function () { res(false); }, 6000);
      var done = function (ok) { clearTimeout(t); res(ok); };
      if (!RE.isFile && W.fetch) W.fetch(url, { method: 'HEAD' }).then(function (r) { done(r.ok); }, function () { imgProbe(url, done); });
      else imgProbe(url, done);
    });
    return probes[path];
  }
  function first(list) {
    return list.filter(Boolean).reduce(function (pr, path) {
      return pr.then(function (found) { return found || probe(path).then(function (ok) { return ok ? path : null; }); });
    }, Promise.resolve(null));
  }
  var resolved = {};
  function resolveProject(p) {
    var g = (p.images && p.images.gallery) || [];
    // site photographs only: layout sheets and plan thumbnails stay on the project page
    var photos = g.filter(function (x) { return !x.sheet; }).sort(function (a, b) { return (a.optional ? 1 : 0) - (b.optional ? 1 : 0); });
    var use = function (x) { return x.optional ? first([x.sm || x.src]) : Promise.resolve(x.sm || x.src); };
    return Promise.all(photos.map(use)).then(function (r) {
      var R = { photos: photos.map(function (x, i) { return { item: x, use: r[i] }; }).filter(function (x) { return x.use; }).slice(0, 4) };
      resolved[p.slug] = R;
      return R;
    });
  }

  /* ------------------------------------------------------------------
     tiles (row strips + map-card mini strips)
     ------------------------------------------------------------------ */
  function lbAttrs(p, group, title, sub) {
    return ' data-lightbox="' + group + '" data-title="' + esc(title) + '" data-sub="' + esc(sub) + '" data-right="' + esc(p.locality.label) + '"' +
      ' data-left2="' + esc(typeLine(p)) + '" data-right2="' + esc(priceLine(p)) + '"';
  }
  function photoTile(p, t, group, kind) {
    var it = t.item, full = it.sm && t.use === it.sm && it.src ? it.src : t.use;
    var cap = kind === 'sheet' ? (it.cap || '') : (it.note || '');
    var ar = it.w && it.h ? it.w + '/' + it.h : (kind === 'sheet' ? '1/1' : '16/9');
    return '<figure class="lt' + (kind === 'sheet' ? ' lt-sheet' : '') + '" style="aspect-ratio:' + ar + '">' +
      '<button type="button"' + lbAttrs(p, group, p.name + (it.cap ? ' · ' + it.cap : ''), it.note || it.alt || p.locality_line) +
      ' data-src="' + esc(RE.asset(full)) + '"' + (full !== t.use ? ' data-fb="' + esc(RE.asset(t.use)) + '"' : '') + (kind === 'sheet' ? ' data-sheet' : '') + '>' +
      '<img src="' + esc(RE.asset(t.use)) + '" alt="' + esc(it.alt || p.name) + '" loading="lazy" decoding="async" draggable="false"' + (it.w && it.h ? ' width="' + it.w + '" height="' + it.h + '"' : '') + '>' +
      '</button>' + (cap ? '<figcaption>' + esc(cap) + '</figcaption>' : '') + '</figure>';
  }
  function artTile(p) {
    return '<figure class="lt lt-art" aria-hidden="true"><a href="' + RE.href(p.url) + '" tabindex="-1">' + RE.artHTML(p, { alt: '' }) + '</a></figure>';
  }
  // Outside a project's own page we show site photographs or the project's name panel, never a
  // layout plan (owner, 23 Oct 2026); plans live on each project page.
  function tilesHTML(p, R, group, max) {
    var out = R.photos.slice(0, max).map(function (t) { return photoTile(p, t, group, 'photo'); });
    if (!out.length) out.push(artTile(p));
    return out.join('');
  }

  /* ------------------------------------------------------------------
     page head: count word + tabs
     ------------------------------------------------------------------ */
  var nw = $('[data-num-word]'); if (nw) nw.textContent = NUM[ALL.length] || String(ALL.length);
  function buildTabs() {
    var host = $('#lstTabs'); if (!host) return;
    var groups = TABS.slice(1).filter(function (t) { return countOf(t[0]); });
    if (groups.length < 2) { host.innerHTML = '<p class="lst-only">' + esc(groups.length ? groups[0][1] : 'All') + ' <small>(' + ALL.length + ')</small></p>'; return; }
    var tab = function (k, l, n) { return '<button type="button" role="tab" id="tab-' + k + '" data-tab="' + k + '" aria-controls="results" aria-selected="' + (S.tab === k) + '" tabindex="' + (S.tab === k ? 0 : -1) + '">' + l + '<small>(' + n + ')</small></button>'; };
    host.innerHTML = '<div class="tabs-l" role="tablist" aria-label="Project stage">' + [TABS[0]].concat(groups).map(function (t) { return tab(t[0], t[1], countOf(t[0])); }).join('') + '</div>';
    var tabs = $$('[role="tab"]', host);
    var pickTab = function (t, focus) {
      S.tab = t.dataset.tab; S.stage = ''; S.all = false;
      tabs.forEach(function (x) { var on = x === t; x.setAttribute('aria-selected', on); x.tabIndex = on ? 0 : -1; });
      if (focus) t.focus();
      apply();
    };
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { pickTab(t); jumpToResults(); });
      t.addEventListener('keydown', function (e) {
        var n = e.key === 'ArrowRight' ? tabs[(i + 1) % tabs.length] : e.key === 'ArrowLeft' ? tabs[(i - 1 + tabs.length) % tabs.length] : null;
        if (n) { e.preventDefault(); pickTab(n, true); }
      });
    });
  }

  /* ------------------------------------------------------------------
     filter bar + mobile sheet
     ------------------------------------------------------------------ */
  var form = $('#filterForm'), sheet;
  function buildBar() {
    var h = '<div class="fb-view" role="group" aria-label="View"><span class="fb-lbl" aria-hidden="true">View</span>' +
      '<button type="button" class="fb-vbtn" data-view="list" aria-pressed="true" aria-label="List view">' + ICON.list + '</button>' +
      '<button type="button" class="fb-vbtn" data-view="map" aria-pressed="false" aria-label="Map view">' + ICON.map + '</button></div>';
    KEYS.forEach(function (k) {
      h += '<label class="fb-field"><span class="fb-lbl">' + LABEL[k] + '</span><select name="' + k + '" data-k="' + k + '"><option value="">Any</option>' +
        OPTS[k].map(function (o) { return '<option value="' + esc(o.key) + '">' + esc(optText(k, o)) + '</option>'; }).join('') + '</select></label>';
    });
    h += '<div class="fb-sw"><label class="sw"><input type="checkbox" role="switch" name="rera" data-k="rera"> RERA registered</label></div>' +
      '<button type="button" class="fb-mbtn" aria-haspopup="dialog" aria-controls="fsheet">' + ICON.filter + '<span>Filters</span><span class="fb-mn"></span></button>' +
      '<div class="fb-meta"><span class="fb-count" id="fbCount" aria-live="polite" aria-atomic="true"></span><button type="button" class="fb-clear" data-clear hidden>Clear all</button></div>';
    form.innerHTML = h;
    form.addEventListener('submit', function (e) { e.preventDefault(); });
  }
  function buildSheet() {
    sheet = D.createElement('dialog');
    sheet.className = 'sheet-dlg fsheet'; sheet.id = 'fsheet'; sheet.setAttribute('aria-labelledby', 'fshH');
    var rchip = function (k, v, t) { return '<label class="rchip"><input type="radio" name="m-' + k + '" value="' + esc(v) + '" data-k="' + k + '"><span>' + esc(t) + (v ? '<i></i>' : '') + '</span></label>'; };
    var h = '<div class="sheet-in"><div class="fsh-head"><h2 id="fshH">Filters</h2><button type="button" class="fsh-x" data-close aria-label="Close filters">' + I.close + '</button></div>';
    KEYS.forEach(function (k) {
      h += '<fieldset class="fsh-g"><legend class="fb-lbl">' + LABEL[k] + '</legend><div class="rchips">' + rchip(k, '', 'Any') +
        OPTS[k].map(function (o) { return rchip(k, o.key, optText(k, o)); }).join('') + '</div></fieldset>';
    });
    h += '<div class="fsh-g"><label class="sw"><input type="checkbox" role="switch" data-k="rera"> RERA registered</label></div></div>' +
      '<div class="sheet-foot"><button type="button" class="fb-clear" data-clear>Clear</button><button type="button" class="pill solid sm" data-close data-show></button></div>';
    sheet.innerHTML = h;
    B.appendChild(sheet);
    sheet.addEventListener('click', function (e) { if (e.target === sheet || e.target.closest('[data-close]')) sheet.close(); });
    sheet.addEventListener('close', function () { B.classList.remove('locked'); var b = $('.fb-mbtn', form); if (b) b.focus({ preventScroll: true }); });
  }
  function openSheet() { if (!sheet.open) { sheet.showModal(); B.classList.add('locked'); var c = $('input:checked', sheet) || $('input', sheet); if (c) c.focus(); } }
  function syncControls(yesN) {
    KEYS.forEach(function (k) {
      var counts = {};
      OPTS[k].forEach(function (o) { counts[o.key] = countWith(k, o.key); });
      var sel = $('select[data-k="' + k + '"]', form);
      if (sel) {
        $$('option', sel).forEach(function (op) {
          if (!op.value) return;
          var c = counts[op.value], o = opt(k, op.value);
          // the closed select shows the selected option: keep it short (no count, no sq yd)
          op.textContent = op.value === S[k] ? o.label : optText(k, o) + '  (' + c.yes + ')';
          op.disabled = !c.any && op.value !== S[k];
        });
        sel.value = S[k]; sel.classList.toggle('any', !S[k]);
        // a set field widens to fit its value; fields showing "Any" give up the room
        sel.parentNode.style.flexGrow = S[k] ? Math.max(1, Math.min(2.2, opt(k, S[k]).label.length / 8)).toFixed(2) : '';
      }
      $$('input[data-k="' + k + '"]', sheet).forEach(function (inp) {
        inp.checked = inp.value === S[k];
        if (!inp.value) return;
        var c = counts[inp.value];
        inp.disabled = !c.any && inp.value !== S[k];
        var i = $('i', inp.parentNode); if (i) i.textContent = c.yes;
      });
    });
    var reraN = countWith('rera', true).any;
    $$('input[data-k="rera"]').forEach(function (c) { c.checked = S.rera; c.disabled = !reraN && !S.rera; });
    var n = active();
    var mn = $('.fb-mn', form); if (mn) mn.innerHTML = n ? '(' + n + '<span class="sr-only"> active</span>)' : '';
    $$('[data-clear]', form).forEach(function (b) { b.hidden = !n; });
    var show = $('[data-show]', sheet); if (show) show.textContent = 'Show ' + plural(yesN);
    $$('[data-view]', form).forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.view === S.view); });
  }

  /* ------------------------------------------------------------------
     list rows
     ------------------------------------------------------------------ */
  var rowsEl = $('#rows'), rowEl = {};
  // each project's own logo (on-dark version: the listing is on obsidian)
  function logoImg(p) {
    return '<img class="lr-wmi lr-logo" src="' + esc(RE.asset(p.logo.dark)) + '" width="' + p.logo.w + '" height="' + p.logo.h + '" alt="' + esc(p.logo.alt || p.name) + '" decoding="async">';
  }
  function rowHTML(p) {
    var badges = (p.badges || []).map(function (b) { return '<span class="bdg' + (/RERA/.test(b) ? ' bdg-rera' : '') + '">' + esc(b) + '</span>'; }).join('');
    var wm = p.logo ? logoImg(p) : p.wordmark ? '<img class="lr-wmi" src="' + esc(RE.asset(p.wordmark)) + '" alt="' + esc(p.name) + '" decoding="async">' : '<span class="lr-wmt">' + esc(p.name) + '</span>';
    var phases = (p.phases || []).length > 1 ? '<p class="lr-phase">' + p.phases.map(function (ph) {
      return '<span>' + esc(ph.label) + ' · ' + ph.plots + ' plots' + (ph.rera ? ' · RERA' : '') + '</span>';
    }).join('<i aria-hidden="true">|</i>') + '</p>' : '';
    return '<article class="lrow rv" id="row-' + p.slug + '" data-slug="' + p.slug + '" aria-labelledby="lrn-' + p.slug + '">' +
      '<div class="lr-text">' +
      '<div class="lr-badges">' + badges + '</div>' +
      '<h3 class="lr-wm" id="lrn-' + p.slug + '">' + wm + '</h3>' +
      '<p class="lr-loc">' + esc(p.locality_line) + '</p>' +
      '<ul class="lr-specs">' +
      '<li>' + I.plot + '<span>' + esc(typeLine(p)) + '</span></li>' +
      '<li>' + I.rupee + '<span' + (p.price && (p.price.from_inr || p.price.per_sqft) ? '' : ' class="na"') + '>' + esc(priceLine(p)) + '</span></li>' +
      '<li>' + I.ruler + '<span' + (p.sizes_label ? '' : ' class="na"') + '>' + esc(p.sizes_label || 'Plot sizes on request') + '</span></li></ul>' +
      phases +
      '<div class="lr-acts"><a class="link lr-go" href="' + RE.href(p.url) + '">Explore ' + esc(p.name) + ' <span class="ln"></span></a>' +
      '<button type="button" class="btn-txt lr-enq" data-enquire="general" data-project="' + p.slug + '" data-source="listing-row">Enquire</button></div>' +
      '</div>' +
      '<div class="lr-media"><div class="lr-strip is-loading" role="group" aria-label="' + esc(p.name) + ' images"><span class="lt-sk"></span><span class="lt-sk"></span><span class="lt-sk"></span></div></div>' +
      '</article>';
  }
  function dragScroll(el) {
    var x0 = 0, s0 = 0, down = false, moved = false;
    el.addEventListener('pointerdown', function (e) { if (e.pointerType !== 'mouse' || e.button) return; down = true; moved = false; x0 = e.clientX; s0 = el.scrollLeft; });
    W.addEventListener('pointermove', function (e) {
      if (!down) return;
      var dx = e.clientX - x0;
      if (!moved && Math.abs(dx) > 6) { moved = true; el.classList.add('drag'); }
      if (moved) el.scrollLeft = s0 - dx;
    });
    W.addEventListener('pointerup', function () { if (!down) return; down = false; el.classList.remove('drag'); });
    el.addEventListener('click', function (e) { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);
    var edge = function () { el.classList.toggle('more', el.scrollWidth - el.clientWidth - el.scrollLeft > 4); };
    el.addEventListener('scroll', edge, { passive: true });
    W.addEventListener('resize', edge);
    edge();
  }
  function buildRows() {
    rowsEl.innerHTML = ALL.map(rowHTML).join('');
    ALL.forEach(function (p) {
      var row = rowEl[p.slug] = $('#row-' + p.slug);
      var go = $('.lr-go', row);
      $('.lr-text', row).addEventListener('click', function (e) { if (!e.target.closest('a,button')) location.href = go.href; });
      var wmi = $('.lr-wmi', row);
      if (wmi) {
        var fit = function () { if (wmi.naturalWidth && wmi.naturalWidth / wmi.naturalHeight > 4) wmi.classList.add('wide'); };
        wmi.complete ? fit() : wmi.addEventListener('load', fit);
      }
    });
  }
  function fillStrip(p, R) {
    var row = rowEl[p.slug], strip = row && $('.lr-strip', row);
    if (!strip) return;
    strip.innerHTML = tilesHTML(p, R, 'lr-' + p.slug, 4);
    strip.classList.remove('is-loading');
    RE.sweepImages(strip);
    dragScroll(strip);
  }

  /* ------------------------------------------------------------------
     map view
     ------------------------------------------------------------------ */
  var stage = $('#mapStage'), card = $('#mapCard'), panel = $('#mapPanel'), mapList = $('#mapList'), mkEl = {}, openMk = null;
  function mapSVG() {
    var M = CFG.map || {}, LM = {}, k;
    // Real map (OpenStreetMap-derived base image) when configured; markers are positioned over it by buildMap().
    if (M.base) return '<img class="lm-base" src="' + RE.href(M.base) + '" alt="" width="1000" height="1226" decoding="async">';
    for (k in (M.landmarks || {})) LM[k] = M.landmarks[k];
    // Landmarks the listing names that the shared map does not place: drawn beside their
    // neighbouring community (Arcadia is next to SLK Tech Park; Serenity neighbours KIADB).
    LM.slk = LM.slk || { label: 'SLK Tech Park', x: 252, y: 254, lx: 260, ly: 257 };
    LM.kiadb = LM.kiadb || { label: 'KIADB Aerospace Park', x: 314, y: 293, lx: 322, ly: 296 };
    var label = function (k, l) {
      if (k === 'airport') return '<text x="' + l.lx + '" y="' + l.ly + '">KEMPEGOWDA<tspan x="' + l.lx + '" dy="11">INTERNATIONAL</tspan><tspan x="' + l.lx + '" dy="11">AIRPORT</tspan></text>';
      return '<text x="' + l.lx + '" y="' + l.ly + '"' + (k === 'strr' ? ' fill="#caa773"' : '') + (k === 'bengaluru' ? ' letter-spacing="3"' : '') + '>' + esc(l.label.toUpperCase()) + '</text>';
    };
    var labels = Object.keys(LM).map(function (k) { return label(k, LM[k]); }).join('');
    var dots = ['devanahalli', 'yelahanka', 'hebbal', 'budigere'].filter(function (k) { return LM[k]; }).map(function (k) { return '<circle cx="' + LM[k].x + '" cy="' + LM[k].y + '" r="2.5"/>'; }).join('') +
      ['slk', 'kiadb'].map(function (k) { return '<rect x="' + (LM[k].x - 2.5) + '" y="' + (LM[k].y - 2.5) + '" width="5" height="5" transform="rotate(45 ' + LM[k].x + ' ' + LM[k].y + ')"/>'; }).join('');
    return '<svg class="lm-base" viewBox="' + (M.viewBox || '0 0 460 560') + '" aria-hidden="true" focusable="false">' +
      '<g fill="none" stroke="#caa773" stroke-width=".8" opacity=".5"><ellipse cx="95" cy="70" rx="20" ry="13"/><ellipse cx="95" cy="70" rx="36" ry="24"/><ellipse cx="95" cy="72" rx="52" ry="36"/><ellipse cx="95" cy="74" rx="68" ry="48" opacity=".5"/></g>' +
      '<g fill="none" stroke="rgba(244,239,230,.22)" stroke-linecap="round"><path d="M140 560 C160 460 180 380 210 300 S250 140 230 10" stroke-width="2.4"/><path d="M20 520 C140 500 220 490 300 500 S420 515 460 520" stroke-width="1.4"/><path d="M345 560 C345 460 360 380 370 300 S360 200 330 160" stroke-width="1.4"/></g>' +
      '<path d="M20 150 C120 170 200 150 300 130 S420 110 460 120" fill="none" stroke="#caa773" stroke-width="1" stroke-dasharray="6 6" opacity=".7"/>' +
      '<g fill="rgba(244,239,230,.45)">' + dots + '</g>' +
      '<path transform="translate(288 205) scale(.8)" d="M0 -9 L3 -2 L10 2 L10 4 L3 2 L2 8 L5 10 L5 11 L0 10 L-5 11 L-5 10 L-2 8 L-3 2 L-10 4 L-10 2 L-3 -2Z" fill="rgba(244,239,230,.7)"/>' +
      '<g font-family="Manrope, sans-serif" font-size="8.5" letter-spacing="1.4" fill="rgba(244,239,230,.55)">' + labels + '</g>' +
      '<text x="330" y="24" font-family="Manrope, sans-serif" font-size="8.5" letter-spacing="2" fill="rgba(244,239,230,.35)">NOT TO SCALE</text></svg>';
  }
  function buildMap() {
    if (!stage) return;
    var vb = ((CFG.map && CFG.map.viewBox) || '0 0 460 560').split(/\s+/).map(Number);
    stage.innerHTML = mapSVG() + ALL.filter(function (p) { return p.map_xy; }).map(function (p) {
      var xy = p.map_xy, left = xy.lx != null && xy.lx < xy.x;
      return '<button type="button" class="lm-mk' + (left ? ' l' : '') + '" data-slug="' + p.slug + '" style="left:' + ((xy.x - vb[0]) / vb[2] * 100).toFixed(2) + '%;top:' + ((xy.y - vb[1]) / vb[3] * 100).toFixed(2) + '%"' +
        ' aria-expanded="false" aria-controls="mapCard" aria-label="' + esc(p.name + ', ' + p.locality_line + ': show details') + '">' +
        '<span class="lm-tile" aria-hidden="true">' + esc(p.name.charAt(0)) + '</span><span class="lm-nm" aria-hidden="true">' + esc(p.name) + '</span></button>';
    }).join('');
    $$('.lm-mk', stage).forEach(function (m) { mkEl[m.dataset.slug] = m; });
    mapList.innerHTML = ALL.map(function (p) {
      return '<li data-slug="' + p.slug + '"><a href="' + RE.href(p.url) + '"><span class="lm-i" aria-hidden="true">' + esc(p.name.charAt(0)) + '</span>' +
        '<span class="lm-t"><b>' + esc(p.name) + '</b><small>' + esc(p.locality_line) + '</small></span><span class="lm-s">' + esc(p.stage.label) + '</span></a></li>';
    }).join('');
    stage.addEventListener('click', function (e) {
      var m = e.target.closest('.lm-mk'); if (!m) return;
      if (openMk === m) closeCard(); else openCard(RE.project(m.dataset.slug), m);
    });
    var hl = function (e, on) { var li = e.target.closest && e.target.closest('li[data-slug]'); if (li && mkEl[li.dataset.slug]) mkEl[li.dataset.slug].classList.toggle('hl', on); };
    mapList.addEventListener('mouseover', function (e) { hl(e, true); });
    mapList.addEventListener('mouseout', function (e) { hl(e, false); });
    mapList.addEventListener('focusin', function (e) { hl(e, true); });
    mapList.addEventListener('focusout', function (e) { hl(e, false); });
    D.addEventListener('click', function (e) {
      if (!openMk || card.hidden) return;
      if (e.target.closest('#mapCard, .lm-mk, dialog')) return;
      closeCard();
    });
    D.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape' || card.hidden || D.querySelector('dialog[open]')) return;
      closeCard(true);
    });
    W.addEventListener('resize', function () { if (openMk && !card.hidden) placeCard(openMk); });
  }
  function cardHTML(p) {
    var R = resolved[p.slug];
    var badges = (p.badges || []).map(function (b) { return '<span class="bdg' + (/RERA/.test(b) ? ' bdg-rera' : '') + '">' + esc(b) + '</span>'; }).join('');
    var wm = p.logo ? logoImg(p) : p.wordmark ? '<img class="lr-wmi" src="' + esc(RE.asset(p.wordmark)) + '" alt="' + esc(p.name) + '">' : esc(p.name);
    var mini = R ? tilesHTML(p, R, 'lm-' + p.slug, 2) : '';
    return '<button type="button" class="lm-x" data-card-close aria-label="Close">' + I.close + '</button>' +
      '<div class="lr-badges">' + badges + '</div>' +
      '<h3 class="lm-cn" id="mapCardName">' + wm + '</h3>' +
      '<p class="lr-loc">' + esc(p.locality_line) + '</p>' +
      '<ul class="lr-specs">' +
      '<li>' + I.plot + '<span>' + esc(typeLine(p)) + '</span></li>' +
      '<li>' + I.rupee + '<span>' + esc(priceLine(p)) + '</span></li>' +
      '<li>' + I.ruler + '<span' + (p.sizes_label ? '' : ' class="na"') + '>' + esc(p.sizes_label || 'Plot sizes on request') + '</span></li></ul>' +
      (mini ? '<div class="lm-mini">' + mini + '</div>' : '') +
      '<div class="lm-acts"><a class="pill solid sm" href="' + RE.href(p.url) + '">Explore project</a>' +
      '<button type="button" class="btn-txt" data-enquire="general" data-project="' + p.slug + '" data-source="listing-map">Enquire</button>' +
      '<a class="btn-txt" href="' + esc(RE.mapsLink(p)) + '" target="_blank" rel="noopener">Directions ' + ICON.ext + '<span class="sr-only">(opens Google Maps in a new tab)</span></a></div>';
  }
  function placeCard(m) {
    if (mqMobile.matches) { card.style.left = card.style.top = ''; return; }
    var pr = panel.getBoundingClientRect(), mr = $('.lm-tile', m).getBoundingClientRect(), br = m.getBoundingClientRect();
    var cw = card.offsetWidth, ch = card.offsetHeight, gap = 16;
    var cy = mr.top - pr.top + mr.height / 2;
    // beside the whole marker (tile + name) so the card never covers the label
    var left = (m.classList.contains('l') ? mr.right : br.right) - pr.left + gap;
    if (left + cw > pr.width - 12) left = (m.classList.contains('l') ? br.left : mr.left) - pr.left - gap - cw;
    left = Math.max(12, Math.min(left, pr.width - cw - 12));
    var top = Math.max(12, Math.min(cy - 70, pr.height - ch - 12));
    card.style.left = left + 'px'; card.style.top = top + 'px';
  }
  function openCard(p, m) {
    if (!p) return;
    if (openMk) openMk.setAttribute('aria-expanded', 'false');
    card.innerHTML = cardHTML(p);
    card.hidden = false;
    openMk = m; m.setAttribute('aria-expanded', 'true');
    $('[data-card-close]', card).addEventListener('click', function () { closeCard(true); });
    RE.sweepImages(card);
    placeCard(m);
    card.focus({ preventScroll: true });
  }
  function closeCard(refocus) {
    if (card.hidden) return;
    card.hidden = true; card.innerHTML = '';
    if (openMk) { openMk.setAttribute('aria-expanded', 'false'); if (refocus) openMk.focus({ preventScroll: true }); }
    openMk = null;
  }

  /* ------------------------------------------------------------------
     chips, empty state, "also worth a look"
     ------------------------------------------------------------------ */
  var chipsEl = $('#chips');
  function renderChips() {
    var chip = function (k, t) { return '<span class="chip">' + esc(t) + '<button type="button" data-rm="' + k + '" aria-label="Remove filter: ' + esc(LABEL[k] + ' ' + t) + '">' + I.close + '</button></span>'; };
    var h = '';
    KEYS.forEach(function (k) { var o = S[k] && opt(k, S[k]); if (o) h += chip(k, o.label); });
    if (S.rera) h += chip('rera', 'RERA registered');
    chipsEl.innerHTML = h;
  }
  function renderAlso(maybe) {
    var box = $('#also');
    if (!maybe.length) { box.hidden = true; box.innerHTML = ''; return; }
    var why = { size: false, budget: false };
    var msg = lookingFor();
    var items = maybe.map(function (p) {
      var sz = S.size && test(p, 'size', S.size) === null, bd = S.budget && test(p, 'budget', S.budget) === null;
      if (sz) why.size = true; if (bd) why.budget = true;
      return '<li><a href="' + RE.href(p.url) + '"><b>' + esc(p.name) + '</b><span>' + esc(p.locality_line) + '</span></a>' +
        '<span class="la-v">' + esc(sz ? (p.sizes_label || 'Plot sizes on request') : priceLine(p)) + '</span>' +
        '<button type="button" class="btn-txt" data-enquire="price" data-project="' + p.slug + '" data-source="listing-also"' + (msg ? ' data-message="' + esc(msg) + '"' : '') + '>Enquire</button></li>';
    }).join('');
    var tail = why.size && why.budget ? 'details on request' : why.size ? 'plot sizes on request' : 'price on request';
    box.innerHTML = '<h2 class="kicker">Also worth a look · ' + tail + '</h2><ul>' + items + '</ul>';
    box.hidden = false;
  }

  /* ------------------------------------------------------------------
     apply
     ------------------------------------------------------------------ */
  function apply(quiet) {
    var yes = [], maybe = [], shown = 0;
    ALL.forEach(function (p) {
      var v = verdict(p, S);
      if (v === 'yes') yes.push(p); else if (v === 'maybe') maybe.push(p);
      var row = rowEl[p.slug];
      if (row) { if (v === 'yes') shown++; row.hidden = v !== 'yes' || (!S.all && shown > MAX_ROWS); }
      var m = mkEl[p.slug]; if (m) m.classList.toggle('off', v !== 'yes');
      var li = mapList && $('li[data-slug="' + p.slug + '"]', mapList); if (li) li.hidden = v !== 'yes';
    });
    var more = $('#more');
    if (more) {
      more.hidden = S.all || yes.length <= MAX_ROWS;
      var mb = $('[data-show-all]', more); if (mb) mb.firstChild.nodeValue = 'Show all ' + plural(yes.length) + ' ';
    }
    var txt = plural(yes.length);
    $('#fbCount').textContent = txt;
    var lc = $('#lstCount'); if (lc) lc.textContent = txt;
    var mc = $('#mapCount'); if (mc) mc.textContent = txt;
    // views
    var isMap = S.view === 'map';
    $('#list').hidden = isMap; $('#map').hidden = !isMap;
    if (!isMap) closeCard();
    // empty + also
    var empty = $('#empty');
    empty.hidden = yes.length > 0;
    var ask = $('#emptyAsk'), lf = lookingFor();
    if (ask) { if (lf) ask.setAttribute('data-message', lf); else ask.removeAttribute('data-message'); }
    renderAlso(maybe);
    renderChips();
    syncControls(yes.length);
    if (!quiet) writeURL();
  }

  /* ------------------------------------------------------------------
     events
     ------------------------------------------------------------------ */
  function jumpToResults(force) {
    var r = $('#results'); if (!r) return;
    var y = r.getBoundingClientRect().top + W.scrollY;
    if (!force && W.scrollY <= y + 2) return;
    var html = D.documentElement, sb = html.style.scrollBehavior;
    html.style.scrollBehavior = 'auto'; W.scrollTo(0, y); html.style.scrollBehavior = sb;
  }
  function setView(v) {
    if (v === S.view) return;
    S.view = v;
    apply();
    jumpToResults();
  }
  function clearAll() { KEYS.forEach(function (k) { S[k] = ''; }); S.rera = false; S.all = false; apply(); }

  D.addEventListener('change', function (e) {
    var t = e.target, k = t.dataset && t.dataset.k;
    if (!k || !t.closest('#filterForm, #fsheet')) return;
    if (k === 'rera') S.rera = t.checked; else S[k] = t.value;
    S.all = false;
    apply();
  });
  D.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('[data-view], [data-clear], [data-rm], [data-show-all], .fb-mbtn');
    if (!t) return;
    if (t.matches('[data-view]')) setView(t.dataset.view);
    else if (t.matches('.fb-mbtn')) openSheet();
    else if (t.matches('[data-clear]')) { clearAll(); if (t.closest('#empty')) { var f = $('select', form); if (f && !mqMobile.matches) f.focus(); } }
    else if (t.matches('[data-show-all]')) { S.all = true; apply(true); }
    else if (t.matches('[data-rm]')) {
      var k = t.dataset.rm, idx = $$('[data-rm]', chipsEl).indexOf(t);
      if (k === 'rera') S.rera = false; else S[k] = '';
      S.all = false;
      apply();
      var next = $$('[data-rm]', chipsEl)[Math.max(0, idx - 1)] || (mqMobile.matches ? $('.fb-mbtn', form) : $('select[data-k="' + (k === 'rera' ? 'type' : k) + '"]', form));
      if (next) next.focus({ preventScroll: true });
    }
  });

  /* ------------------------------------------------------------------
     boot
     ------------------------------------------------------------------ */
  var fromURL = readURL();
  buildTabs();
  buildBar();
  buildSheet();
  buildRows();
  buildMap();
  apply(true);
  RE.ready(function () { RE.observeReveals(rowsEl); });
  var wa = $('#ctaWa'); if (wa) wa.href = RE.waLink('Hello Rare Earth, I’d like to arrange a private viewing.');

  ALL.forEach(function (p) {
    resolveProject(p).then(function (R) { fillStrip(p, R); if (openMk && openMk.dataset.slug === p.slug) openCard(p, openMk); });
  });

  if (fromURL) {
    var userScrolled = false;
    var mark = function () { userScrolled = true; };
    W.addEventListener('wheel', mark, { passive: true, once: true });
    W.addEventListener('touchmove', mark, { passive: true, once: true });
    W.addEventListener('keydown', mark, { once: true });
    W.requestAnimationFrame(function () { jumpToResults(true); });
    W.addEventListener('load', function () { if (!userScrolled) jumpToResults(true); }, { once: true });
  }
})();
