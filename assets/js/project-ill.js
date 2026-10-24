/* =====================================================================
   Rare Earth Projects · project-ill.js
   Shared by the project pages whose imagery is ILLUSTRATIVE (no layout
   drawings yet): Serenity, Tranquility, Arcadia.
   Load with defer AFTER project.js (the sub-nav is already built).
   Styles: assets/css/project-ill.css

   1. Render-or-art: any [data-ill-render] container holding an
      <img class="ill-r"> gets .has-render once a file from
      assets/renders/ has actually loaded. Until then (or if it never
      arrives) the contour art panel underneath stays visible and the
      "Illustrative 3D visualisation" caption stays hidden, so art is
      never captioned as a render.
   2. Layout on request: <div data-ill-plan data-ph="…">. These projects
      have no layout drawing to show and no 3D layout (owner, 23 Oct 2026),
      so the host shows a "layout on request" sheet. Nothing is probed or
      requested.
   3. Gallery intro copy switches to its data-ph-text while the gallery
      shows placeholder art (no site photographs yet).
   4. Project footer disclaimer worded for illustrative imagery.
   ===================================================================== */
(function () {
  'use strict';
  var RE = window.RE; if (!RE || !RE.current) return;
  var D = document, W = window, $ = RE.$, $$ = RE.$$, esc = RE.esc, p = RE.current;

  /* ---------- 1. render-or-art containers ---------- */
  function watch(box) {
    var img = $('img.ill-r', box); if (!img) return;
    var sync = function () {
      var src = img.currentSrc || img.src || '';
      var ok = img.naturalWidth > 0 && /\/renders\//.test(src) && img.style.visibility !== 'hidden';
      box.classList.toggle('has-render', ok);
      if (box.hasAttribute('data-lightbox')) box.tabIndex = ok ? 0 : -1;
    };
    img.addEventListener('load', sync);
    img.addEventListener('error', function () { setTimeout(sync, 0); });
    if (img.complete) sync();
  }
  $$('[data-ill-render]').forEach(watch);

  /* ---------- 2. layout on request ---------- */
  function placeholder(host) {
    host.classList.add('is-ph');
    host.innerHTML = '<div class="ill-ph">' + RE.artHTML(p, { alt: '' }) +
      '<div class="ill-ph-in"><span class="kicker">The layout</span>' +
      '<p class="display">The layout, <em>on request.</em></p>' +
      '<p>' + esc(host.getAttribute('data-ph') || 'Ask us for the layout drawing, or walk the site with our team and see the plots for yourself.') + '</p>' +
      '<div class="acts"><button type="button" class="pill" data-enquire="brochure" data-source="layout-on-request">Request the layout</button>' +
      '<button type="button" class="link" data-enquire="visit" data-source="layout-on-request-visit">Arrange a site visit <span class="ln"></span></button></div></div></div>';
  }
  function mountPlan(host) {
    if (host._ill) return; host._ill = true;
    placeholder(host);
  }
  $$('[data-ill-plan]').forEach(function (host) {
    if (/^#layout/.test(location.hash) || !('IntersectionObserver' in W)) { mountPlan(host); return; }
    var io = new IntersectionObserver(function (es) {
      if (es[0].isIntersecting) { io.disconnect(); mountPlan(host); }
    }, { rootMargin: '100% 0px' });
    io.observe(host);
  });

  /* ---------- 3. gallery with no images yet ----------
     project.js shows contour art tiles when a project has no gallery images;
     the intro copy then says so instead of describing images that are not
     there. Text comes from data-ph-text on the intro paragraph. */
  $$('#gallery').forEach(function (sec) {
    var gal = $('.gal', sec), intro = $('[data-ph-text]', sec);
    if (!gal) return;
    var orig = intro ? intro.innerHTML : '';
    var check = function () {
      var ph = !!$('.ph-tile', gal);
      sec.classList.toggle('is-ph', ph);
      if (intro) intro.innerHTML = ph ? esc(intro.getAttribute('data-ph-text')) : orig;
    };
    if ('MutationObserver' in W) new MutationObserver(check).observe(gal, { childList: true });
    check();
  });

  /* ---------- 4. project footer band: an accurate disclaimer ----------
     (the shared one says "plans are representations of approved layouts",
     which is not true of an illustrative drawing) */
  var pr = p.price || {};
  $$('.pfoot .pf-disc').forEach(function (el) {
    var drawn = p.plan && p.plan.sheets && p.plan.sheets.length;
    el.textContent = (drawn ? 'The layout plan on this page is drawn from the layout drawing and is indicative.' : 'The layout on this page is an illustrative drawing, not the approved plan.') +
      ' Photographs are of Montira, our flagship, or are captioned stock images; none show this site.' +
      (pr.from_inr || pr.per_sqft ? ' *Prices indicative & subject to availability; registration, stamp duty and other charges extra.' : '');
  });

  RE.illustrative = { watch: watch, mountPlan: mountPlan };
})();
