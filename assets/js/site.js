/* =====================================================================
   Rare Earth Projects · site.js  (shared behaviour for every page)
   - Injects the global header (Projects dropdown, project badge where
     the hero has no logo),
     overlay menu, footer, WhatsApp FAB, edge "Enquire" tab and mobile
     action bar, all generated from projects-data.js.
   - Header solid/hide on scroll + CSS var --hdr-offset, reveals,
     counters, contour generator, parallax, custom cursor, preloader
     (once per session), image fallbacks, lightbox, tabs, accordions,
     featured band, data-fact checks, first-touch attribution.
   Exposes window.RE for page scripts. Classic script, load with defer
   AFTER projects-data.js.

   Page contract (set on <body>):
     data-root="../../"   relative path to the site root ("" on home)
     data-page="home|projects|project|contact|legal|404"
     data-project="slug"  (project pages: switches theme)
     data-hero="light"    when the hero is light (dark header ink)
     data-mode / data-paper = light|dark (project section tones)
   Optional placeholders: <div data-site="header"></div>,
     <div data-site="footer"></div>. Otherwise header is prepended to
     <body> and footer appended after <main>.
   ===================================================================== */
(function () {
  'use strict';
  var W = window, D = document, B = D.body;
  var CFG = W.RE_CONFIG || {}, PROJ = W.RE_PROJECTS || [];
  var root = B.getAttribute('data-root') || '';
  var page = B.getAttribute('data-page') || '';
  var isFile = location.protocol === 'file:';
  var reduce = W.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = W.matchMedia('(hover: hover) and (pointer: fine)').matches;
  D.documentElement.classList.remove('no-js');

  /* ------------------------------------------------------------------
     helpers
     ------------------------------------------------------------------ */
  var $ = function (s, c) { return (c || D).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || D).querySelectorAll(s)); };
  var esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  function fixFile(u) {
    if (!isFile || !u) return u;
    var parts = u.split('#'), path = parts[0];
    if (path === '' && parts.length > 1) return u;
    if (/^(?:[a-z]+:|\/\/)/i.test(path)) return u;
    if (path === '' || /\/$/.test(path)) path += 'index.html';
    return path + (parts.length > 1 ? '#' + parts.slice(1).join('#') : '');
  }
  function href(p) { return fixFile(root + (p || '')); }
  function asset(p) { return /^(?:[a-z]+:|\/\/|data:)/i.test(p) ? p : root + 'assets/' + p; }
  function project(slug) {
    if (!slug) return null;
    for (var i = 0; i < PROJ.length; i++) if (PROJ[i].slug === slug) return PROJ[i];
    // a renamed project keeps answering to its old slug (e.g. poojanahalli → arcadia)
    for (var j = 0; j < PROJ.length; j++) if ((PROJ[j].former_slugs || []).indexOf(slug) > -1) return PROJ[j];
    return null;
  }
  var current = project(B.getAttribute('data-project'));
  var store = {
    get: function (k) { try { return W.sessionStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { W.sessionStorage.setItem(k, v); } catch (e) { /* storage blocked */ } },
    del: function (k) { try { W.sessionStorage.removeItem(k); } catch (e) { /* storage blocked */ } }
  };
  function waLink(text) { return 'https://wa.me/' + CFG.whatsapp + (text ? '?text=' + encodeURIComponent(text) : ''); }
  function nf(n) { return Number(n).toLocaleString('en-IN'); }
  function money(inr) {
    if (!inr) return '';
    if (inr >= 1e7) return '₹' + (+(inr / 1e7).toFixed(2)) + ' Cr';
    if (inr >= 1e5) return '₹' + (+(inr / 1e5).toFixed(1)) + ' L';
    return '₹' + nf(inr);
  }
  var area = {
    sqyd: function (sqft) { return Math.round(sqft / 9); },
    sqm: function (sqft) { return Math.round(sqft * 0.09290304); },
    label: function (sqft) { return nf(sqft) + ' sq ft'; }
  };
  function mapsLink(p) {
    if (p.lat != null && p.lng != null) return 'https://www.google.com/maps/dir/?api=1&destination=' + p.lat + ',' + p.lng;
    return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(p.maps_query || p.address || p.name);
  }

  /* icons (stroke icons use currentColor) */
  var I = {
    wa: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 3C8.8 3 3 8.7 3 15.8c0 2.5.7 4.9 2 7L3 29l6.4-2c2 1.1 4.3 1.7 6.6 1.7 7.2 0 13-5.7 13-12.8S23.2 3 16 3zm0 23.4c-2.1 0-4.1-.6-5.9-1.7l-.4-.3-3.8 1.2 1.2-3.7-.3-.4a10.4 10.4 0 01-1.6-5.6C5.2 10 10 5.3 16 5.3S26.8 10 26.8 15.8 22 26.4 16 26.4zm5.9-7.9c-.3-.2-1.9-.9-2.2-1-.3-.1-.5-.2-.7.2l-1 1.2c-.2.2-.4.2-.7.1-.3-.2-1.4-.5-2.6-1.6-1-.9-1.6-1.9-1.8-2.2-.2-.3 0-.5.1-.7l.5-.6.3-.5c.1-.2 0-.4 0-.6l-1-2.4c-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4-.3.3-1.2 1.1-1.2 2.8s1.2 3.2 1.4 3.5c.2.2 2.4 3.6 5.8 5 .8.3 1.4.5 1.9.7.8.3 1.5.2 2.1.1.6-.1 1.9-.8 2.2-1.5.3-.7.3-1.4.2-1.5-.1-.2-.3-.3-.6-.4z"/></svg>',
    phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true"><path d="M5 3h4l2 5-2.5 1.5a11 11 0 006 6L16 13l5 2v4a2 2 0 01-2 2A16 16 0 013 5a2 2 0 012-2"/></svg>',
    chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true"><path d="M4 5h16v11H9l-5 4z"/><path d="M8 9.5h8M8 12.5h5"/></svg>',
    left: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true"><path d="M20 12H4M10 6l-6 6 6 6"/></svg>',
    right: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true"><path d="M4 12h16M14 6l6 6-6 6"/></svg>',
    chev: '<svg viewBox="0 0 12 8" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true"><path d="M1 1l5 5 5-5"/></svg>',
    close: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true"><path d="M2 2l12 12M14 2L2 14"/></svg>',
    plot: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6l9-3 9 3v12l-9 3-9-3z"/><path d="M12 3v18M3 12h18"/></svg>',
    rupee: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4h11M7 9h11M7 4c6 0 7 5 0 5h-1l9 11"/></svg>',
    ruler: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 15l12-12 6 6-12 12z"/><path d="M7 11l2 2M10 8l2 2M13 5l2 2"/></svg>',
    pin: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0112 2.5a7 7 0 017 7C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>'
  };

  /* ------------------------------------------------------------------
     contours (echoes the logo) + art panels
     ------------------------------------------------------------------ */
  function contours(seed, count, cx, cy, size) {
    var s = seed; var rnd = function () { return (s = (s * 9301 + 49297) % 233280) / 233280; };
    var ph = [rnd() * 6, rnd() * 6, rnd() * 6], out = '';
    for (var i = 1; i <= count; i++) {
      var r = i * size / count, pts = [];
      for (var a = 0; a <= 64; a++) {
        var t = a / 64 * Math.PI * 2, k = 1 + .18 * Math.sin(3 * t + ph[0] + i * .12) + .1 * Math.sin(5 * t + ph[1]) + .06 * Math.cos(2 * t + ph[2] + i * .05);
        pts.push([cx + Math.cos(t) * r * k * 1.25, cy + Math.sin(t) * r * k * .85]);
      }
      var d = 'M' + pts[0][0].toFixed(1) + ',' + pts[0][1].toFixed(1);
      for (var j = 1; j < pts.length - 1; j++) {
        var mx = (pts[j][0] + pts[j + 1][0]) / 2, my = (pts[j][1] + pts[j + 1][1]) / 2;
        d += ' Q' + pts[j][0].toFixed(1) + ',' + pts[j][1].toFixed(1) + ' ' + mx.toFixed(1) + ',' + my.toFixed(1);
      }
      out += '<path d="' + d + 'Z"/>';
    }
    return out;
  }
  function cn(seed) { return '<svg class="cn" viewBox="0 0 600 600" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' + contours(seed, 18, 520, 80, 540) + '</svg>'; }
  function artHTML(p, opts) {
    opts = opts || {};
    var a = p.art || {}, cls = 'art ' + (a.cls || 'a-tranq') + (opts.cls ? ' ' + opts.cls : '');
    // the project's own logo wherever its name panel appears (owner, 2026-10-23): the on-dark
    // version over photos and dark panels, the on-light one on the pale panels
    var lg = p.logo, dark = !!a.photo || /\ba-tranq\b/.test(a.cls || 'a-tranq');
    var logo = lg ? '<img class="wmi logo" src="' + asset(dark ? lg.dark : lg.light) + '" width="' + lg.w + '" height="' + lg.h + '" alt="' + esc(opts.alt != null ? opts.alt : (lg.alt || p.name)) + '" loading="lazy">' : '';
    if (a.photo) return '<div class="' + cls + '"><img class="ph" src="' + asset(a.photo) + '" alt="" loading="lazy">' + logo + '</div>';
    var mark = '';
    if (logo) mark = logo;
    else if (a.mark && a.mark.img) mark = '<img class="wmi" src="' + asset(a.mark.img) + '" alt="' + esc(opts.alt != null ? opts.alt : (a.mark.alt || p.name)) + '">';
    else if (a.mark && a.mark.text) mark = '<div class="wm"><small>' + esc(a.mark.text[0]) + '</small><span>' + esc(a.mark.text[1]) + '</span></div>';
    else mark = '<div class="wm"><small>Rare Earth</small><span>' + esc(p.name) + '</span></div>';
    return '<div class="' + cls + '">' + cn(a.seed || 7) + mark + '</div>';
  }

  /* ------------------------------------------------------------------
     community pins: every project as a gold point on a contour field.
     'hero' (home, 404) floats them over the right of the hero: HERO_PINS
     are % of the hero, placed by hand so the points keep their real
     north-south / east-west order without touching the headline; s is the
     label side (r right, l left, b below). A project missing there, and
     every point in a 'panel' (contact), is placed from its map_xy
     (460 x 564 map viewBox).
     ------------------------------------------------------------------ */
  var HERO_PINS = {
    montira: { x: 80, y: 22, s: 'r' },
    arcadia: { x: 73, y: 45, s: 'r' },
    athena: { x: 91, y: 53, s: 'b' },
    elysia: { x: 70, y: 59, s: 'r' },
    tranquility: { x: 64, y: 67, s: 'r' },
    serenity: { x: 84, y: 76, s: 'r' }
  };
  function pinSpot(p, layout) {
    var m = p.map_xy;
    if (layout === 'hero' && HERO_PINS[p.slug]) return HERO_PINS[p.slug];
    if (!m) return null;
    if (layout === 'hero') return { x: Math.round(58 + m.x / 460 * 36), y: Math.round(16 + m.y / 564 * 66), s: 'r' };
    // panel: stretch the projects' own spread on the map across the box
    var xs = [], ys = [];
    PROJ.forEach(function (q) { if (q.map_xy) { xs.push(q.map_xy.x); ys.push(q.map_xy.y); } });
    var x0 = Math.min.apply(null, xs), x1 = Math.max.apply(null, xs), y0 = Math.min.apply(null, ys), y1 = Math.max.apply(null, ys);
    var x = 8 + (m.x - x0) / ((x1 - x0) || 1) * 76, y = 12 + (m.y - y0) / ((y1 - y0) || 1) * 72;
    return { x: Math.round(x), y: Math.round(y), s: x > 88 ? 'l' : 'r' };
  }
  function pinsHTML(layout) {
    return PROJ.map(function (p, i) {
      var q = pinSpot(p, layout), live = p.footer_group === 'Now selling';
      if (!q) return '';
      return '<a class="pin ' + q.s + (live ? ' live' : '') + '" href="' + href(p.url) + '" style="--x:' + q.x + '%;--y:' + q.y + '%;--i:' + i + '"' +
        (live ? ' aria-label="' + esc(p.name + ', ' + p.locality.label + ', now selling') + '"' : '') + '>' +
        '<span class="dot" aria-hidden="true"></span><span class="lab"><b>' + esc(p.name) + '</b><span>' + esc(p.locality.label) + '</span></span></a>';
    }).join('');
  }
  function fillPins(nav, layout) {
    if (!nav || !PROJ.length) return;
    nav.innerHTML = pinsHTML(layout);
    var key = nav.parentNode && $('.pins-key .k-live', nav.parentNode);
    if (key && !PROJ.some(function (p) { return p.footer_group === 'Now selling'; })) key.remove();
  }

  /* image helper: <img> with fallbacks; item = {src, sm, fb[], alt, w, h} */
  function imgHTML(item, o) {
    o = o || {};
    if (!item) return '';
    var first = o.full ? item.src : (item.sm || item.src);
    var srcset = (!o.full && item.sm && item.src && item.sm !== item.src) ? ' srcset="' + asset(item.sm) + ' 1200w, ' + asset(item.src) + ' 2400w" sizes="' + (o.sizes || '100vw') + '"' : '';
    var fb = (item.fb || []).map(asset).join('|');
    return '<img src="' + asset(first) + '"' + srcset + ' alt="' + esc(o.alt != null ? o.alt : (item.alt || '')) + '"' +
      (o.cls ? ' class="' + o.cls + '"' : '') +
      (item.w && item.h ? ' width="' + item.w + '" height="' + item.h + '"' : '') +
      (o.eager ? ' fetchpriority="high"' : ' loading="lazy"') + ' decoding="async"' +
      (fb ? ' data-fb="' + esc(fb) + '"' : '') +
      (o.art ? ' data-fb-art="' + esc(o.art) + '"' : '') +
      (o.optional || item.optional ? ' data-optional' : '') + '>';
  }
  function imgFail(img) {
    if (img.dataset.failing === 'done') return;
    var list = (img.dataset.fb || '').split('|').filter(Boolean);
    if (list.length) {
      var next = list.shift();
      img.dataset.fb = list.join('|');
      img.removeAttribute('srcset'); img.removeAttribute('sizes');
      img.src = next;
      return;
    }
    img.dataset.failing = 'done';
    var slug = img.dataset.fbArt;
    if (slug && project(slug)) {
      var host = D.createElement('div');
      host.innerHTML = artHTML(project(slug), { alt: '' });
      var art = host.firstChild;
      art.classList.add('fb-art');
      art.style.cssText = 'position:absolute;inset:0;width:100%;height:100%';
      img.replaceWith(art);
      return;
    }
    if (img.hasAttribute('data-optional')) {
      var wrap = img.closest('[data-opt-wrap]') || img.closest('figure') || img;
      wrap.remove();
      D.dispatchEvent(new CustomEvent('re:img-removed', { detail: { img: img } }));
      return;
    }
    img.style.visibility = 'hidden';
  }
  D.addEventListener('error', function (e) { var t = e.target; if (t && t.tagName === 'IMG') imgFail(t); }, true);
  function sweepImages(scope) {
    $$('img', scope).forEach(function (img) { if (img.complete && img.naturalWidth === 0 && img.getAttribute('src')) imgFail(img); });
  }

  /* ------------------------------------------------------------------
     global chrome: header, overlay, footer, floating set
     ------------------------------------------------------------------ */
  var onHome = page === 'home';
  var L = {
    home: onHome ? '#top' : href(''),
    about: onHome ? '#about' : href('#about'),
    projects: href('projects/'),
    standard: onHome ? '#standard' : href('#standard'),
    presence: onHome ? '#presence' : href('#presence'),
    contact: onHome ? '#viewing' : href('contact/'),
    contactHub: href('contact/'),
    legal: href('legal/')
  };
  var inProjects = page === 'projects' || page === 'project';
  var phonesHTML = (CFG.phones || []).map(function (p) { return '<a href="tel:' + p.tel + '">' + esc(p.label) + '</a>'; });

  function headerHTML() {
    var cur = current;
    return '<header class="hdr" id="hdr">' +
      '<div class="brand"><a href="' + L.home + '" class="logo" aria-label="Rare Earth Projects, home">' +
      '<img class="lg-l" src="' + asset('logo-vertical-light.png') + '" alt="Rare Earth" width="39" height="70">' +
      '<img class="lg-d" src="' + asset('logo-vertical.png') + '" alt="" aria-hidden="true" width="39" height="70"></a>' +
      // the "Rare Earth | Project" badge shows only where the hero has no project logo (Athena keeps its original design)
      (cur && !D.querySelector('.p-hero h1.p-logo') ? '<a class="lk" href="' + href(cur.url) + '" aria-label="' + esc(cur.name) + ' overview">' + esc(cur.name) + '</a>' : '') + '</div>' +
      '<nav class="quick" aria-label="Primary">' +
      '<a href="' + L.about + '">About</a>' +
      '<div class="dd" id="ddProjects"><a href="' + L.projects + '"' + (inProjects ? ' aria-current="page"' : '') + '>Projects</a>' +
      '<button type="button" class="dd-t" aria-expanded="false" aria-controls="ddPanel" aria-label="Show all projects">' + I.chev + '</button>' +
      '<div class="dd-panel" id="ddPanel">' +
      PROJ.map(function (p) {
        return '<a href="' + href(p.url) + '"' + (cur === p ? ' aria-current="page"' : '') + '><b>' + esc(p.name) + '</b><span>' + esc(p.locality_line) + '</span><i>' + esc(p.stage.label) + '</i></a>';
      }).join('') +
      '<a class="all" href="' + L.projects + '"><span>View all projects</span><span aria-hidden="true">→</span></a></div></div>' +
      '<a href="' + L.standard + '">Our Standard</a>' +
      '<a href="' + L.contact + '"' + (page === 'contact' ? ' aria-current="page"' : '') + '>Contact</a>' +
      '</nav>' +
      '<div class="hdr-r"><button type="button" class="enq" data-enquire="visit" data-source="header">Private Viewing</button>' +
      '<button type="button" class="menu-t" id="menuT" aria-expanded="false" aria-controls="overlay"><span id="menuLbl">Menu</span><span class="bars"><i></i><i></i></span></button></div>' +
      '</header>';
  }
  function overlayHTML() {
    var n = 0, num = function () { n++; return '<small>' + (n < 10 ? '0' : '') + n + '</small>'; };
    return '<div class="overlay" id="overlay"><nav aria-label="Menu">' +
      '<a href="' + L.home + '">' + num() + 'Home</a>' +
      '<a href="' + L.about + '">' + num() + 'About Rare Earth</a>' +
      '<a href="' + L.projects + '">' + num() + 'Our Communities</a>' +
      PROJ.map(function (p) { return '<a class="sub' + (current === p ? ' is-cur' : '') + '" href="' + href(p.url) + '"' + (current === p ? ' aria-current="page"' : '') + '>' + esc(p.name) + '</a>'; }).join('') +
      '<a href="' + L.standard + '">' + num() + 'Our Standard</a>' +
      '<a href="' + L.contactHub + '">' + num() + 'Contact</a>' +
      '<a href="' + (onHome ? '#viewing' : L.contactHub) + '" data-enquire="visit" data-source="menu">' + num() + 'Private Viewing</a>' +
      '</nav><aside><img class="vlogo" src="' + asset('logo-vertical-light.png') + '" alt="Rare Earth"><div>' +
      '<div style="margin-bottom:28px"><h6>Enquiries</h6>' + phonesHTML.slice(0, 2).join('') + '<a href="mailto:' + CFG.email + '">' + esc(CFG.email) + '</a></div>' +
      '<div><h6>Office</h6><p>' + (CFG.office.menu || []).map(esc).join('<br>') + '</p></div></div></aside></div>';
  }
  function footerHTML() {
    var groups = {};
    PROJ.forEach(function (p) { (groups[p.footer_group] = groups[p.footer_group] || []).push(p); });
    var comm = Object.keys(groups).map(function (g) {
      return '<p class="ft-grp">' + esc(g) + '</p><ul>' + groups[g].map(function (p) { return '<li><a href="' + href(p.url) + '">' + esc(p.name) + '</a></li>'; }).join('') + '</ul>';
    }).join('');
    var yr = new Date().getFullYear();
    return '<footer class="site-ft"><div class="wrap"><div class="ft-top five">' +
      '<div><img class="vlogo" src="' + asset('logo-vertical-light.png') + '" alt="Rare Earth" loading="lazy"><p class="quote">' + esc(CFG.quote) + '</p></div>' +
      '<div><h6>Communities</h6>' + comm + '<a class="all" href="' + L.projects + '">All projects →</a></div>' +
      '<div><h6>Company</h6><ul><li><a href="' + L.about + '">About</a></li><li><a href="' + L.standard + '">Our Standard</a></li><li><a href="' + L.presence + '">Where We Build</a></li><li><a href="' + L.contactHub + '">Contact</a></li></ul></div>' +
      '<div><h6>Connect</h6><ul>' + (CFG.contactTabs || []).map(function (t) { return '<li><a href="' + href('contact/#' + t.key) + '">' + esc(t.label) + '</a></li>'; }).join('') +
      '<li><button type="button" data-enquire="visit" data-source="footer">Private viewing</button></li></ul></div>' +
      '<div><h6>Contact</h6><ul>' + phonesHTML.slice(0, 2).map(function (a) { return '<li>' + a + '</li>'; }).join('') +
      '<li><a href="mailto:' + CFG.email + '">' + esc(CFG.email) + '</a></li><li>' + esc(CFG.office.short) + '</li></ul></div>' +
      '</div><div class="ft-bot">' +
      '<span>© ' + yr + ' ' + esc(CFG.company) + '</span>' +
      '<span>CIN ' + esc(CFG.cin) + ' · GST ' + esc(CFG.gst) + '</span>' +
      '<span>' + esc(CFG.footNote) + '</span>' +
      '<span><a href="' + href('legal/#privacy') + '">Privacy</a> · <a href="' + href('legal/#disclaimer') + '">Disclaimer</a> · <a href="' + href('legal/#rera') + '">RERA</a></span>' +
      '</div></div></footer>';
  }
  function waPrefill() {
    return current ? 'Hello Rare Earth, I’d like to know more about ' + current.name + '.' : 'Hello Rare Earth, I’d like to arrange a private viewing.';
  }
  function floatHTML() {
    var tel = (CFG.phones && CFG.phones[0]) ? CFG.phones[0].tel : '';
    return '<a class="fab" id="fab" href="' + waLink(waPrefill()) + '" target="_blank" rel="noopener" aria-label="Message Rare Earth on WhatsApp">' + I.wa + '</a>' +
      '<button type="button" class="edge-tab" id="edgeTab" data-enquire="general" data-source="edge-tab">Enquire</button>' +
      '<nav class="mbar" id="mbar" aria-label="Quick contact">' +
      '<a href="tel:' + tel + '">' + I.phone + '<span>Call</span></a>' +
      '<a href="' + waLink(waPrefill()) + '" target="_blank" rel="noopener"><svg viewBox="0 0 32 32" fill="currentColor" aria-hidden="true">' + I.wa.replace(/^<svg[^>]*>|<\/svg>$/g, '') + '</svg><span>WhatsApp</span></a>' +
      '<button type="button" class="go" data-enquire="general" data-source="mobile-bar">' + I.chat + '<span>Enquire</span></button></nav>';
  }
  function mount(html, placeholder, fallback) {
    var host = D.createElement('div'); host.innerHTML = html;
    var nodes = Array.prototype.slice.call(host.childNodes);
    if (placeholder) { nodes.forEach(function (n) { placeholder.parentNode.insertBefore(n, placeholder); }); placeholder.remove(); }
    else fallback(nodes);
  }

  // skip link
  if (!$('.skip')) {
    var main = $('main');
    if (main && !main.id) main.id = 'main';
    B.insertAdjacentHTML('afterbegin', '<a class="skip" href="#' + (main ? main.id : 'main') + '">Skip to content</a>');
  }
  var builtHeader = false;
  if (!$('.hdr') || $('[data-site="header"]')) {
    mount(headerHTML() + overlayHTML(), $('[data-site="header"]'), function (nodes) {
      var skip = $('.skip'); var ref = skip ? skip.nextSibling : B.firstChild;
      nodes.forEach(function (n) { B.insertBefore(n, ref); });
    });
    builtHeader = true;
  }
  if (!$('body>footer, .site-ft') || $('[data-site="footer"]')) {
    mount(footerHTML(), $('[data-site="footer"]'), function (nodes) {
      var m = $('main'); var after = m ? m.nextSibling : null;
      nodes.forEach(function (n) { B.insertBefore(n, after); });
    });
  }
  if (!$('#fab')) B.insertAdjacentHTML('beforeend', floatHTML());
  else if (!$('#edgeTab')) B.insertAdjacentHTML('beforeend', floatHTML().replace(/^<a class="fab"[\s\S]*?<\/a>/, ''));
  var hdr = $('#hdr'), fab = $('#fab'), edge = $('#edgeTab'), mbar = $('#mbar');
  if (mbar) B.classList.add('has-mbar');

  /* ------------------------------------------------------------------
     menu overlay + projects dropdown
     ------------------------------------------------------------------ */
  var menuT = $('#menuT');
  function toggleMenu(force) {
    var on = force != null ? force : !B.classList.contains('menu-open');
    if (on === B.classList.contains('menu-open')) return;
    B.classList.toggle('menu-open', on);
    B.classList.toggle('locked', on);
    if (menuT) { menuT.setAttribute('aria-expanded', on); var l = $('#menuLbl'); if (l) l.textContent = on ? 'Close' : 'Menu'; }
    if (on) { hdr && hdr.classList.remove('hide'); setTimeout(function () { var f = $('.overlay nav a'); if (f) f.focus({ preventScroll: true }); }, 350); }
  }
  if (menuT && builtHeader) menuT.addEventListener('click', function () { toggleMenu(); });
  if (builtHeader) $$('.overlay nav a').forEach(function (a) { a.addEventListener('click', function () { toggleMenu(false); }); });
  var dd = $('#ddProjects'), ddBtn = dd && $('.dd-t', dd), ddTimer;
  function setDD(on) {
    if (!dd) return;
    clearTimeout(ddTimer);
    dd.classList.toggle('open', on);
    ddBtn.setAttribute('aria-expanded', on);
  }
  if (dd) {
    ddBtn.addEventListener('click', function () { setDD(!dd.classList.contains('open')); if (dd.classList.contains('open')) { var f = $('.dd-panel a', dd); f && f.focus(); } });
    if (finePointer) {
      dd.addEventListener('mouseenter', function () { setDD(true); });
      dd.addEventListener('mouseleave', function () { ddTimer = setTimeout(function () { setDD(false); }, 180); });
    }
    dd.addEventListener('focusout', function (e) { if (!dd.contains(e.relatedTarget)) setDD(false); });
    dd.addEventListener('keydown', function (e) {
      var links = $$('.dd-panel a', dd), i = links.indexOf(D.activeElement);
      if (e.key === 'ArrowDown') { e.preventDefault(); setDD(true); (links[i + 1] || links[0]).focus(); }
      if (e.key === 'ArrowUp' && i > -1) { e.preventDefault(); (links[i - 1] || ddBtn).focus(); }
      if (e.key === 'Escape') { setDD(false); ddBtn.focus(); }
    });
  }
  D.addEventListener('keydown', function (e) { if (e.key === 'Escape' && B.classList.contains('menu-open')) { toggleMenu(false); menuT && menuT.focus(); } });

  /* ------------------------------------------------------------------
     header offset + scroll effects
     ------------------------------------------------------------------ */
  var hdrH = hdr ? hdr.offsetHeight : 0, lastY = W.scrollY, ticking = false;
  if (hdr && 'ResizeObserver' in W) new ResizeObserver(function () { hdrH = hdr.offsetHeight; setOffset(); }).observe(hdr);
  function setOffset() {
    var hidden = !hdr || hdr.classList.contains('hide');
    D.documentElement.style.setProperty('--hdr-offset', (hidden ? 0 : hdrH) + 'px');
  }
  var heroFields = $$('.hero-field'), medias = $$('.proj-cover .media');
  var mbarHush = false;
  function onScroll() {
    ticking = false;
    var y = W.scrollY, vh = W.innerHeight;
    if (hdr) {
      hdr.classList.toggle('solid', y > 80);
      var hide = y > lastY && y > 500 && !B.classList.contains('menu-open') && !(dd && dd.classList.contains('open'));
      if (y < lastY - 2 || y < 500) hide = false;
      if (Math.abs(y - lastY) > 2 || y < 500) hdr.classList.toggle('hide', hide);
      setOffset();
    }
    var past = y > vh * .8;
    fab && fab.classList.toggle('show', past);
    edge && edge.classList.toggle('show', past);
    mbar && mbar.classList.toggle('show', past && !mbarHush);
    lastY = y;
    if (!reduce) {
      heroFields.forEach(function (f) { f.style.transform = y < vh * 1.2 ? 'translateY(' + (y * .25) + 'px)' : ''; });
      medias.forEach(function (m) { var r = m.parentElement.getBoundingClientRect(); if (r.bottom > 0 && r.top < vh) m.style.transform = 'translateY(' + ((r.top / vh) * -7) + '%)'; });
    }
    D.dispatchEvent(new CustomEvent('re:scroll', { detail: { y: y } }));
  }
  W.addEventListener('scroll', function () { if (!ticking) { ticking = true; W.requestAnimationFrame(onScroll); } }, { passive: true });
  W.addEventListener('resize', function () { hdrH = hdr ? hdr.offsetHeight : 0; onScroll(); });
  // mobile bar steps aside while an inline enquiry form is on screen
  if (mbar && 'IntersectionObserver' in W) {
    var vis = new Set();
    var mio = new IntersectionObserver(function (es) {
      es.forEach(function (e) { e.isIntersecting ? vis.add(e.target) : vis.delete(e.target); });
      mbarHush = vis.size > 0; mbar.classList.toggle('hush', mbarHush); onScroll();
    }, { threshold: .15 });
    W.addEventListener('DOMContentLoaded', function () { $$('[data-enquiry-form], #contact, #viewing').forEach(function (el) { mio.observe(el); }); });
    $$('[data-enquiry-form], #contact, #viewing').forEach(function (el) { mio.observe(el); });
  }

  /* ------------------------------------------------------------------
     reveals, counters
     ------------------------------------------------------------------ */
  function countUp(el) {
    var end = +el.dataset.count, t0 = performance.now(), d = reduce ? 0 : 1800;
    (function step(t) { var k = d ? Math.min(1, (t - t0) / d) : 1; el.textContent = Math.round(end * (1 - Math.pow(1 - k, 4))); if (k < 1) requestAnimationFrame(step); })(t0);
  }
  var io = 'IntersectionObserver' in W ? new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add('in'); io.unobserve(e.target);
      // counters only: svg[data-contours] also carries data-count (its line count) and must keep its paths
      $$('[data-count]:not([data-contours])', e.target).forEach(countUp);
      if (e.target.dataset.count && !e.target.hasAttribute('data-contours')) countUp(e.target);
    });
  }, { threshold: .12, rootMargin: '0px 0px -5% 0px' }) : null;
  function observeReveals(scope) {
    $$('.rv,.split,.render', scope).forEach(function (el) {
      if (el.classList.contains('in') || el.hasAttribute('data-autostart')) return;
      if (io) io.observe(el); else el.classList.add('in');
    });
  }

  /* ------------------------------------------------------------------
     contour fills
     ------------------------------------------------------------------ */
  function fillContours(scope) {
    $$('.media.art[data-seed], .art[data-seed]', scope).forEach(function (m) { if (!$('svg.cn', m)) m.insertAdjacentHTML('afterbegin', cn(+m.dataset.seed)); });
    $$('svg[data-contours]', scope).forEach(function (s) {
      if (s.childElementCount) return;
      var d = s.dataset;
      s.innerHTML = contours(+(d.seed || 42), +(d.count || 30), +(d.cx || 1250), +(d.cy || 560), +(d.size || 1500));
    });
    $$('[data-art-of]', scope).forEach(function (el) {
      var p = project(el.getAttribute('data-art-of'));
      if (p) { el.outerHTML = artHTML(p, { cls: el.className }); }
    });
  }
  function drawLines(svg, delay) {
    if (reduce || !svg) return;
    $$('path', svg).forEach(function (p, i) {
      var Lh = p.getTotalLength(); p.style.strokeDasharray = Lh;
      p.animate([{ strokeDashoffset: Lh }, { strokeDashoffset: 0 }], { duration: 2800 + i * 60, delay: delay + i * 40, easing: 'cubic-bezier(.6,.05,.3,1)', fill: 'both' });
    });
  }

  /* ------------------------------------------------------------------
     custom cursor (desktop only)
     ------------------------------------------------------------------ */
  if (finePointer && !reduce) {
    var cur = $('#cur') || $('.cur');
    if (!cur) { cur = D.createElement('div'); cur.className = 'cur'; cur.id = 'cur'; cur.setAttribute('aria-hidden', 'true'); B.appendChild(cur); }
    cur.style.transform = 'translate(-100px,-100px)';
    var cxp = -100, cyp = -100, curMoved = false;
    W.addEventListener('mousemove', function (e) { cxp = e.clientX; cyp = e.clientY; if (!curMoved) { curMoved = true; loopCur(); } }, { passive: true });
    D.addEventListener('mouseover', function (e) { cur.classList.toggle('big', !!(e.target.closest && e.target.closest('a,button,select,input,textarea,label,summary,[role="tab"]'))); });
    var loopCur = function () { cur.style.transform = 'translate(' + cxp + 'px,' + cyp + 'px)'; requestAnimationFrame(loopCur); };
  }

  /* ------------------------------------------------------------------
     lightbox (shared)
     ------------------------------------------------------------------ */
  var LB = (function () {
    var dlg, items = [], idx = 0, opener = null, sx = null;
    function build() {
      dlg = D.createElement('dialog');
      dlg.className = 'lbx'; dlg.setAttribute('aria-label', 'Image viewer');
      dlg.innerHTML = '<div class="lbx-top"><button type="button" class="lbx-back">' + I.left + '<span>Back</span></button><span class="lbx-n" aria-live="polite"></span></div>' +
        '<div class="lbx-stage"><img alt=""><button type="button" class="lbx-nav lbx-prev" aria-label="Previous image">' + I.left + '</button><button type="button" class="lbx-nav lbx-next" aria-label="Next image">' + I.right + '</button></div>' +
        '<div class="lbx-cap"><b></b><span></span><em class="r"></em><div class="lbx-strip"></div></div>';
      B.appendChild(dlg);
      $('.lbx-back', dlg).addEventListener('click', close);
      $('.lbx-prev', dlg).addEventListener('click', function () { go(-1); });
      $('.lbx-next', dlg).addEventListener('click', function () { go(1); });
      dlg.addEventListener('close', function () { B.classList.remove('lbx-open'); if (opener && opener.focus) opener.focus({ preventScroll: true }); });
      dlg.addEventListener('keydown', function (e) { if (e.key === 'ArrowLeft') go(-1); if (e.key === 'ArrowRight') go(1); });
      var st = $('.lbx-stage', dlg);
      st.addEventListener('pointerdown', function (e) { sx = e.clientX; });
      st.addEventListener('pointerup', function (e) { if (sx != null && Math.abs(e.clientX - sx) > 50) go(e.clientX < sx ? 1 : -1); sx = null; });
      st.addEventListener('click', function (e) { if (e.target === st) close(); });
    }
    function show() {
      var it = items[idx], img = $('.lbx-stage img', dlg);
      img.className = it.sheet ? 'sheet' : '';
      img.removeAttribute('data-failing');
      img.dataset.fb = (it.fb || []).join('|');
      img.src = it.src; img.alt = it.alt || '';
      $('.lbx-n', dlg).textContent = items.length > 1 ? (idx + 1) + ' / ' + items.length : '';
      $('.lbx-cap b', dlg).textContent = it.title || '';
      $('.lbx-cap span', dlg).textContent = it.sub || '';
      $('.lbx-cap .r', dlg).textContent = it.right || '';
      var strip = $('.lbx-strip', dlg);
      strip.innerHTML = (it.left2 || it.right2) ? '<span>' + esc(it.left2 || '') + '</span><span>' + esc(it.right2 || '') + '</span>' : '';
      var old = $('.lbx-cap .lnk', dlg); if (old) old.remove();
      if (it.link) $('.lbx-cap', dlg).insertAdjacentHTML('beforeend', '<a class="link lnk" href="' + esc(it.link) + '">' + esc(it.linkLabel || 'Open') + ' <span class="ln"></span></a>');
      $$('.lbx-nav', dlg).forEach(function (b) { b.hidden = items.length < 2; });
    }
    function go(d) { if (items.length < 2) return; idx = (idx + d + items.length) % items.length; show(); }
    function open(list, i, from) {
      if (!dlg) build();
      items = list; idx = i || 0; opener = from || D.activeElement;
      show();
      if (!dlg.open) { dlg.showModal(); B.classList.add('lbx-open'); }
    }
    function close() { if (dlg && dlg.open) dlg.close(); }
    return { open: open, close: close };
  })();
  function lbItem(el) {
    var img = el.tagName === 'IMG' ? el : $('img', el);
    var src = el.dataset.src || (el.tagName === 'A' ? el.getAttribute('href') : '') || (img ? (img.currentSrc || img.src) : '');
    return {
      src: src, alt: img ? img.alt : '', fb: (el.dataset.fb || (img && img.dataset.fb) || '').split('|').filter(Boolean),
      title: el.dataset.title || el.dataset.cap || '', sub: el.dataset.sub || '', right: el.dataset.right || '',
      left2: el.dataset.left2 || '', right2: el.dataset.right2 || '',
      link: el.dataset.link || '', linkLabel: el.dataset.linkLabel || '', sheet: el.hasAttribute('data-sheet')
    };
  }
  D.addEventListener('click', function (e) {
    var el = e.target.closest && e.target.closest('[data-lightbox]');
    if (!el) return;
    e.preventDefault();
    var g = el.getAttribute('data-lightbox');
    var group = $$('[data-lightbox="' + g + '"]').filter(function (x) { return x.isConnected; });
    LB.open(group.map(lbItem), Math.max(0, group.indexOf(el)), el);
  });
  D.addEventListener('keydown', function (e) {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches('[data-lightbox]:not(a):not(button)')) { e.preventDefault(); e.target.click(); }
  });

  /* ------------------------------------------------------------------
     tabs + accordions (generic)
     ------------------------------------------------------------------ */
  function initTabs(scope) {
    $$('[data-tabs]', scope).forEach(function (list) {
      if (list.dataset.tabsReady) return; list.dataset.tabsReady = '1';
      if (!list.getAttribute('role')) list.setAttribute('role', 'tablist');
      var tabs = $$('[role="tab"]', list), useHash = list.hasAttribute('data-tabs-hash');
      function select(t, focus, quiet) {
        tabs.forEach(function (x) {
          var on = x === t; x.setAttribute('aria-selected', on); x.tabIndex = on ? 0 : -1;
          var p = D.getElementById(x.getAttribute('aria-controls')); if (p) p.hidden = !on;
        });
        if (focus) t.focus();
        if (useHash && !quiet) history.replaceState(null, '', '#' + (t.dataset.hash || t.id));
        list.dispatchEvent(new CustomEvent('tabchange', { bubbles: true, detail: { tab: t } }));
      }
      tabs.forEach(function (t, i) {
        t.addEventListener('click', function () { select(t); });
        t.addEventListener('keydown', function (e) {
          var n = null;
          if (e.key === 'ArrowRight' || e.key === 'ArrowDown') n = tabs[(i + 1) % tabs.length];
          if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') n = tabs[(i - 1 + tabs.length) % tabs.length];
          if (e.key === 'Home') n = tabs[0];
          if (e.key === 'End') n = tabs[tabs.length - 1];
          if (n) { e.preventDefault(); select(n, true); }
        });
      });
      function fromHash() {
        if (!useHash || !location.hash) return null;
        var h = decodeURIComponent(location.hash.slice(1));
        return tabs.filter(function (t) { return (t.dataset.hash || t.id) === h; })[0] || null;
      }
      var init = fromHash() || tabs.filter(function (t) { return t.getAttribute('aria-selected') === 'true'; })[0] || tabs[0];
      if (init) select(init, false, true);
      if (useHash) W.addEventListener('hashchange', function () { var t = fromHash(); if (t) select(t, false, true); });
    });
  }
  function initAcc(scope) {
    $$('[data-acc]', scope).forEach(function (g) {
      if (g.dataset.accReady) return; g.dataset.accReady = '1';
      $$('details', g).forEach(function (d) {
        d.addEventListener('toggle', function () { if (d.open) $$('details', g).forEach(function (o) { if (o !== d && o.open) o.open = false; }); });
      });
    });
  }

  /* ------------------------------------------------------------------
     featured band (landing + projects listing)
     ------------------------------------------------------------------ */
  function renderFeatured(el, opts) {
    opts = opts || {};
    var list = PROJ.filter(function (p) { return p.featured; }).sort(function (a, b) { return a.featured - b.featured; });
    if (!list.length) { el.hidden = true; return; }
    var pad = function (n) { return (n < 10 ? '0' : '') + n; };
    var slides = list.map(function (p, i) {
      var m = (p.images && (p.images.feature || p.images.cover)) || null;
      var plots = p.plots_total ? ' · ' + p.plots_total : '';
      var sizes = p.sizes_label || p.headline_sizes || '';
      var lead = p.featured_line || (p.price && p.price.display) || p.stage.label;
      return '<article class="fslide' + (i === 0 ? ' is-cur' : '') + '" aria-roledescription="slide" aria-label="' + (i + 1) + ' of ' + list.length + ': ' + esc(p.name) + '"' + (i ? ' aria-hidden="true"' : '') + '>' +
        '<div class="fs-info"><span class="fs-tag">' + esc(p.badges.join(' · ')) + '</span>' +
        '<a class="fs-name' + (p.logo ? ' fs-logo' : '') + '" href="' + href(p.url) + '"' + (i ? ' tabindex="-1"' : '') + '>' +
          (p.logo ? '<img src="' + asset(p.logo.dark) + '" width="' + p.logo.w + '" height="' + p.logo.h + '" alt="' + esc(p.logo.alt || p.name) + '" loading="lazy">' : esc(p.name)) + '</a>' +
        '<p class="fs-line">' + esc(p.tagline) + '</p>' +
        '<ul class="fs-specs">' +
        '<li>' + I.plot + '<span>' + esc(p.type.label + plots) + '</span></li>' +
        (sizes ? '<li>' + I.ruler + '<span>' + esc(sizes) + '</span></li>' : '') +
        '<li>' + I.pin + '<span>' + esc(p.locality_line) + '</span></li></ul>' +
        '<button type="button" class="btn-txt fs-enq" data-enquire="general" data-project="' + p.slug + '" data-source="' + esc(opts.source || 'featured') + '"' + (i ? ' tabindex="-1"' : '') + '>Enquire →</button>' +
        '<div class="fs-bar"><span>' + esc(lead) + '</span><span>Explore ' + esc(p.name) + ' →</span></div></div>' +
        '<div class="fs-media' + (m && m.sheet ? ' sheet' : '') + '">' + (m ? imgHTML(m, { sizes: '(max-width:767px) 100vw, 68vw', art: p.slug }) : artHTML(p)) +
        (m && m.cap ? '<span class="fs-cap">' + esc(m.cap) + '</span>' : '') + '</div></article>';
    }).join('');
    el.classList.add('featb');
    el.innerHTML = '<div class="wrap"><div class="featb-head"><div><span class="kicker">' + esc(opts.kicker || 'Featured') + '</span>' + (opts.heading || '') + '</div>' +
      (list.length > 1 ? '<div class="featb-ctl"><button type="button" class="fb-prev" aria-label="Previous featured community">' + I.left + '</button><span class="featb-n" aria-live="polite"><b>01</b> / ' + pad(list.length) + '</span><button type="button" class="fb-next" aria-label="Next featured community">' + I.right + '</button></div>' : '') +
      '</div><div class="featb-vp" tabindex="0" role="region" aria-roledescription="carousel" aria-label="Featured communities"><div class="featb-track">' + slides + '</div></div></div>';
    var track = $('.featb-track', el), vp = $('.featb-vp', el), n = $('.featb-n b', el), cur = 0, sx = null;
    function go(i) {
      cur = (i + list.length) % list.length;
      track.style.transform = 'translateX(' + (-100 * cur) + '%)';
      $$('.fslide', el).forEach(function (s, k) {
        var on = k === cur; s.classList.toggle('is-cur', on);
        if (on) s.removeAttribute('aria-hidden'); else s.setAttribute('aria-hidden', 'true');
        $$('a,button', s).forEach(function (a) { if (on) a.removeAttribute('tabindex'); else a.tabIndex = -1; });
      });
      if (n) n.textContent = pad(cur + 1);
    }
    var pb = $('.fb-prev', el), nb = $('.fb-next', el);
    pb && pb.addEventListener('click', function () { go(cur - 1); });
    nb && nb.addEventListener('click', function () { go(cur + 1); });
    vp.addEventListener('keydown', function (e) { if (e.target !== vp) return; if (e.key === 'ArrowLeft') go(cur - 1); if (e.key === 'ArrowRight') go(cur + 1); });
    track.addEventListener('pointerdown', function (e) { sx = e.clientX; });
    track.addEventListener('pointerup', function (e) { if (sx != null && Math.abs(e.clientX - sx) > 50) go(cur + (e.clientX < sx ? 1 : -1)); sx = null; });
    track.addEventListener('click', function (e) { if (Math.abs((e.clientX || 0) - (sx || e.clientX || 0)) > 50) e.preventDefault(); }, true);
    $$('.fslide', el).forEach(function (s, k) {
      s.addEventListener('click', function (e) {
        if (e.target.closest('a,button')) return;
        if (k === cur) { var a = $('.fs-name', s); a && (location.href = a.href); }
      });
      s.style.cursor = 'pointer';
    });
    sweepImages(el);
    return { go: go };
  }

  /* ------------------------------------------------------------------
     data-fact consistency check (static text vs projects-data.js)
     ------------------------------------------------------------------ */
  function checkFacts(scope) {
    $$('[data-fact]', scope).forEach(function (el) {
      var k = el.getAttribute('data-fact'), p = current, key = k;
      if (k.indexOf(':') > -1) { p = project(k.split(':')[0]); key = k.split(':')[1]; }
      var v = p && p.fact ? p.fact[key] : null;
      if (v == null) { console.warn('[RE] data-fact "' + k + '" has no value in projects-data.js'); return; }
      var t = el.textContent.replace(/\s+/g, ' ').trim();
      if (!t) el.textContent = v;
      else if (t !== String(v)) console.warn('[RE] data-fact mismatch "' + k + '": page says "' + t + '", data says "' + v + '"');
    });
  }

  /* ------------------------------------------------------------------
     first-touch attribution (sessionStorage, guarded)
     ------------------------------------------------------------------ */
  (function () {
    if (store.get('re_attr')) return;
    var a = {};
    try {
      var q = new URLSearchParams(location.search);
      ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'fbclid'].forEach(function (k) { var v = q.get(k); if (v) a[k] = v.slice(0, 120); });
      if (D.referrer) { var r = new URL(D.referrer); if (r.host && r.host !== location.host) a.ref = r.host; }
    } catch (e) { /* ignore malformed */ }
    a.landing = location.pathname; a.ts = new Date().toISOString();
    store.set('re_attr', JSON.stringify(a));
  })();
  function attribution() { try { return JSON.parse(store.get('re_attr') || '{}'); } catch (e) { return {}; } }

  /* file:// convenience: folder links → index.html */
  if (isFile) D.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a || a.target === '_blank') return;
    var h = a.getAttribute('href'); var f = fixFile(h);
    if (f !== h) { e.preventDefault(); location.href = f; }
  });

  /* ------------------------------------------------------------------
     start sequence (+ preloader once per session)
     ------------------------------------------------------------------ */
  var started = false, readyQ = [];
  function start() {
    if (started) return; started = true;
    var loader = $('#loader'); if (loader) loader.classList.add('done');
    B.classList.remove('locked');
    setTimeout(function () { $$('[data-autostart], #heroTitle').forEach(function (e) { e.classList.add('in'); }); }, 250);
    observeReveals(D);
    onScroll();
    readyQ.forEach(function (f) { try { f(); } catch (err) { console.error(err); } }); readyQ = [];
    D.dispatchEvent(new CustomEvent('re:start'));
  }
  function ready(fn) { if (started) fn(); else readyQ.push(fn); }

  fillContours(D);
  initTabs(D); initAcc(D);
  sweepImages(D);
  $$('[data-featured]').forEach(function (el) { renderFeatured(el, { heading: el.getAttribute('data-heading') || '', source: el.getAttribute('data-source') || 'featured' }); });

  (function boot() {
    var loader = $('#loader'), mark = $('#loaderMark');
    var seen = store.get('re_intro') === '1';
    if (!loader) { start(); return; }
    if (seen || reduce) {
      loader.classList.add('skip');
      drawLines($('svg[data-draw]'), 0);
      start(); return;
    }
    store.set('re_intro', '1');
    if (mark) {
      mark.innerHTML = contours(42, 9, 120, 10, 190);
      $$('path', mark).forEach(function (p, i) { var Lh = p.getTotalLength(); p.style.strokeDasharray = Lh; p.animate([{ strokeDashoffset: Lh, opacity: 1 }, { strokeDashoffset: 0, opacity: 1 }, { opacity: 0 }], { duration: 2000, delay: i * 60, easing: 'cubic-bezier(.6,.05,.3,1)', fill: 'both' }); });
    }
    drawLines($('svg[data-draw]'), 1400);
    var go = function () { setTimeout(start, 1700); };
    D.readyState === 'complete' ? go() : W.addEventListener('load', go, { once: true });
    setTimeout(start, 4000);
  })();

  W.addEventListener('load', function () { checkFacts(D); sweepImages(D); });

  /* ------------------------------------------------------------------
     public API
     ------------------------------------------------------------------ */
  W.RE = {
    $: $, $$: $$, esc: esc, root: root, page: page, isFile: isFile, reduce: reduce, finePointer: finePointer,
    href: href, asset: asset, project: project, projects: PROJ, config: CFG, current: current,
    store: store, waLink: waLink, nf: nf, money: money, area: area, mapsLink: mapsLink, icons: I,
    contours: contours, cn: cn, artHTML: artHTML, imgHTML: imgHTML, sweepImages: sweepImages,
    pinsHTML: pinsHTML, fillPins: fillPins, fillContours: fillContours, observeReveals: observeReveals, initTabs: initTabs, initAcc: initAcc,
    lightbox: LB, renderFeatured: renderFeatured, checkFacts: checkFacts, attribution: attribution,
    ready: ready, refresh: function (scope) { fillContours(scope || D); initTabs(scope || D); initAcc(scope || D); sweepImages(scope || D); observeReveals(scope || D); },
    setOffset: setOffset, onScroll: onScroll, toggleMenu: toggleMenu
  };
})();
