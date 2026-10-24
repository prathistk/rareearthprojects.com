/* =====================================================================
   Rare Earth Projects · serenity.js  (Serenity page only; load after
   project.js and project-ill.js)
   1. "Work nearby" rings: hovering a ring, its number or a list row
      highlights the matching place in both.
   2. Indicative plot value: plot area × the indicative rate from
      projects-data.js (price.per_sqft). No plot sizes are assumed;
      the "Try" sizes are common reference formats only. The result
      pre-fills the price enquiry.
   ===================================================================== */
(function () {
  'use strict';
  var RE = window.RE; if (!RE || !RE.current) return;
  var D = document, $ = RE.$, $$ = RE.$$, p = RE.current, nf = RE.nf;

  /* ---------- 1. rings ---------- */
  $$('[data-sr-rings]').forEach(function (box) {
    var pinned = null;
    var sync = function (r) {
      $$('[data-r]', box).forEach(function (el) { el.classList.toggle('on', r != null && el.getAttribute('data-r') === String(r)); });
    };
    box.addEventListener('mouseover', function (e) { var t = e.target.closest('[data-r]'); if (t) sync(t.getAttribute('data-r')); });
    box.addEventListener('mouseout', function (e) {
      if (!e.relatedTarget || !e.relatedTarget.closest || !e.relatedTarget.closest('[data-r]')) sync(pinned);
    });
    box.addEventListener('click', function (e) {
      var t = e.target.closest('[data-r]'); if (!t) return;
      var r = t.getAttribute('data-r'); pinned = pinned === r ? null : r; sync(pinned);
    });
  });

  /* ---------- 2. indicative value ---------- */
  var rate = p.price && p.price.per_sqft;
  $$('[data-sr-calc]').forEach(function (box) {
    if (!rate) { box.remove(); return; }
    var num = $('input[type="number"]', box), rng = $('input[type="range"]', box);
    var out = $('.sc-out b', box), line = $('.sc-out span', box), sub = $('.sc-sub', box);
    var cta = $('[data-enquire]', box), tries = $$('.sc-try button', box);
    var MIN = +num.min || 300, MAX = +num.max || 20000;
    function lakh(v) {
      if (v >= 1e7) return 'about ₹' + (+(v / 1e7).toFixed(2)) + ' Cr';
      return 'about ₹' + (+(v / 1e5).toFixed(1)) + ' L';
    }
    function render(a, from) {
      a = Math.round(a);
      var ok = isFinite(a) && a >= MIN && a <= MAX;
      if (from !== 'num') num.value = a;
      if (from !== 'rng') rng.value = Math.max(+rng.min, Math.min(+rng.max, a));
      var pct = ((+rng.value - rng.min) / (rng.max - rng.min) * 100).toFixed(1) + '%';
      rng.style.setProperty('--fill', pct);
      tries.forEach(function (b) { b.setAttribute('aria-pressed', String(+b.getAttribute('data-a') === a)); });
      if (!ok) {
        out.textContent = '—';
        line.textContent = 'Enter an area between ' + nf(MIN) + ' and ' + nf(MAX) + ' sq ft.';
        if (sub) sub.textContent = '';
        return;
      }
      var v = a * rate;
      out.textContent = '₹' + nf(v) + '*';
      line.textContent = nf(a) + ' sq ft × ₹' + nf(rate) + ' / sq ft*, ' + lakh(v);
      if (sub) sub.textContent = nf(RE.area.sqyd(a)) + ' sq yd · ' + nf(RE.area.sqm(a)) + ' sq m';
      if (cta) cta.setAttribute('data-message', 'I’m interested in a plot of about ' + nf(a) + ' sq ft at Serenity. Please share the exact price and the plot sizes available.');
    }
    num.addEventListener('input', function () { if (num.value !== '') render(+num.value, 'num'); });
    num.addEventListener('change', function () {
      var a = +num.value;
      if (!isFinite(a) || num.value === '') a = 2400;
      render(Math.max(MIN, Math.min(MAX, a)));
    });
    rng.addEventListener('input', function () { render(+rng.value, 'rng'); });
    tries.forEach(function (b) { b.addEventListener('click', function () { render(+b.getAttribute('data-a')); }); });
    render(+num.value || 2400);
  });
})();
