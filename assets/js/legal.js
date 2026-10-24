/* =====================================================================
   Rare Earth Projects · legal.js  (legal/index.html only)
   - Rebuilds the RERA register (#reraRegister) and the "other
     communities" list from projects-data.js: every rera[] number of
     every project, shown at project level (owner rule: no phase-level
     RERA statements). Projects without a number are listed neutrally
     with their confirmed approvals; no RERA claim is made for them.
   - Fills company details and contact lines from RE_CONFIG.
   - Copy buttons for registration numbers, TOC scroll-spy.
   Loads after projects-data.js, site.js and enquiry.js (defer).
   ===================================================================== */
(function () {
  'use strict';
  var RE = window.RE; if (!RE) return;
  var D = document, W = window, $ = RE.$, $$ = RE.$$, esc = RE.esc, CFG = RE.config, PROJ = RE.projects;

  /* ---------------- company + contact details from config ---------------- */
  var phones = CFG.phones || [];
  var FILL = {
    company: function (el) { el.textContent = CFG.company; },
    brand: function (el) { el.textContent = CFG.brand; },
    cin: function (el) { el.textContent = CFG.cin; },
    gst: function (el) { el.textContent = CFG.gst; },
    established: function (el) { if (CFG.established) el.textContent = CFG.established; },
    md: function (el) { if (CFG.md) el.textContent = CFG.md; },
    officeLines: function (el) { el.innerHTML = (CFG.office.lines || []).map(esc).join('<br> '); }, // legal.css hides the <br>s on phones
    officeInline: function (el) { el.textContent = (CFG.office.lines || []).join(' ').replace(/^Rarearth Projects Pvt\. Ltd\.,\s*/, '').replace(/\s+/g, ' ').trim(); },
    phones: function (el) { el.innerHTML = phones.map(function (p) { return '<a href="tel:' + p.tel + '">' + esc(p.label) + '</a>'; }).join(' · '); },
    phone0: function (el) { if (phones[0]) { el.href = 'tel:' + phones[0].tel; el.textContent = phones[0].label; } },
    emailLink: function (el) { el.href = 'mailto:' + CFG.email + '?subject=Privacy'; el.textContent = CFG.email; },
    emailPlain: function (el) { el.href = 'mailto:' + CFG.email; el.textContent = CFG.email; },
    reraLink: function (el) { if (CFG.reraSite) el.href = CFG.reraSite; },
    priceNote: function (el) { if (CFG.priceNote) el.textContent = CFG.priceNote; }
  };
  $$('[data-cfg]').forEach(function (el) { var f = FILL[el.getAttribute('data-cfg')]; if (f) f(el); });

  /* ---------------- RERA register from data ----------------
     Owner rule (2026-10-17): registrations are presented at PROJECT level
     ("Athena is RERA registered"), never phase by phase, and no phase is
     singled out as unregistered. So the register lists one row per
     registration number with no phase column; a phase label from the data
     is shown only if one project ever carries more than one number.
     Projects without a number go to the neutral "other communities" list. */
  var reraSite = CFG.reraSite || 'https://rera.karnataka.gov.in/';
  var rows = [], others = [];
  PROJ.forEach(function (p) {
    var regs = (p.rera || []).filter(function (r) { return r && r.number; });
    regs.forEach(function (r) {
      rows.push({ p: p, number: r.number, note: regs.length > 1 ? (r.label || '') : '', fact: p.slug + ':rera' });
    });
    if (!regs.length) {
      var ap = (p.approvals || []).filter(function (a) { return !a.rera; }).map(function (a) { return a.k + ': ' + a.v; });
      others.push({ p: p, label: p.name, note: ap.length ? ap.join(' · ') : 'Status on request' });
    }
  });
  var tbody = $('#reraRegister tbody');
  if (tbody && rows.length) {
    tbody.innerHTML = rows.map(function (r) {
      var p = r.p;
      return '<tr><th scope="row"><a href="' + RE.href(p.url) + '">' + esc(p.name) + '</a><small>' + esc(p.locality_line) + '</small></th>' +
        '<td class="rn" data-fact="' + esc(r.fact) + '">' + esc(r.number) + (r.note ? '<small>' + esc(r.note) + '</small>' : '') + '</td>' +
        '<td class="la"><button type="button" data-copy="' + esc(r.number) + '" aria-label="Copy the ' + esc(p.name) + ' registration number">Copy</button>' +
        '<a href="' + esc(reraSite) + '" target="_blank" rel="noopener" aria-label="Verify the ' + esc(p.name) + ' registration on rera.karnataka.gov.in (opens in a new tab)">Verify ↗</a></td></tr>';
    }).join('');
  }
  var ol = $('#reraOthers');
  if (ol) {
    if (others.length) ol.innerHTML = others.map(function (o) { return '<li><a href="' + RE.href(o.p.url) + '">' + esc(o.label) + '</a><span>' + esc(o.note) + '</span></li>'; }).join('');
    else { ol.hidden = true; var prev = ol.previousElementSibling; if (prev) { prev.hidden = true; if (prev.previousElementSibling && prev.previousElementSibling.tagName === 'H3') prev.previousElementSibling.hidden = true; } }
  }

  /* ---------------- copy registration numbers ---------------- */
  D.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-copy]'); if (!b) return;
    var v = b.getAttribute('data-copy'), t0 = b.textContent;
    var done = function () { b.textContent = 'Copied'; setTimeout(function () { b.textContent = t0; }, 1600); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(v).then(done, function () { W.prompt('Copy the registration number', v); });
    else W.prompt('Copy the registration number', v);
  });

  /* ---------------- table of contents: scroll-spy ---------------- */
  var links = $$('#lglToc a'), secs = links.map(function (a) { return D.getElementById(a.getAttribute('href').slice(1)); }).filter(Boolean);
  function mark(id) { links.forEach(function (a) { var on = a.getAttribute('href') === '#' + id; a.classList.toggle('is-on', on); if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); }); }
  function spy() {
    var best = null;
    secs.forEach(function (s) { var r = s.getBoundingClientRect(); if (r.top < W.innerHeight * .35 && r.bottom > 80) best = s.id; });
    mark(best || (secs[0] && secs[0].id));
  }
  if (secs.length) { D.addEventListener('re:scroll', spy); W.addEventListener('load', spy); spy(); }
  if (location.hash && D.getElementById(location.hash.slice(1))) mark(location.hash.slice(1));
})();
