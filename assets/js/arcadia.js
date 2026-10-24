/* =====================================================================
   Rare Earth Projects · arcadia.js  (Arcadia page only; load after
   project.js and project-ill.js)
   First-plot guide: each line of the "At a glance" card links to the
   matching question in the guide. Selecting a line opens that question
   (site.js keeps the accordion to one open item), scrolls it into view
   below the sticky bars and briefly highlights it. Opening a question
   by hand marks the matching line, and a deep link such as
   #ar-q-loan opens its question on load.
   No facts live here: all wording is in projects/arcadia/index.html.
   ===================================================================== */
(function () {
  'use strict';
  var RE = window.RE; if (!RE || !RE.current) return;
  var D = document, W = window, $ = RE.$, $$ = RE.$$;

  var card = $('[data-ar-checks]'); if (!card) return;
  var links = $$('a[href^="#ar-q-"]', card);
  var byId = function (id) { var d = D.getElementById(id); return d && d.tagName === 'DETAILS' ? d : null; };

  function mark(id) {
    links.forEach(function (a) {
      if (a.getAttribute('href') === '#' + id) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    });
  }
  function flash(d) {
    d.classList.remove('flash');
    void d.offsetWidth; // restart the highlight if the same line is chosen twice
    d.classList.add('flash');
    clearTimeout(d._flashT);
    d._flashT = setTimeout(function () { d.classList.remove('flash'); }, 1600);
  }
  function openQ(id, smooth) {
    var d = byId(id); if (!d) return false;
    d.open = true; // the toggle handler in site.js closes the others
    mark(id);
    // wait a frame so the closing items have collapsed before measuring
    requestAnimationFrame(function () {
      d.scrollIntoView({ behavior: smooth && !RE.reduce ? 'smooth' : 'auto', block: 'start' });
      var s = $('summary', d);
      if (s) { try { s.focus({ preventScroll: true }); } catch (e) { s.focus(); } }
      flash(d);
    });
    return true;
  }

  links.forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href').slice(1);
      if (!byId(id)) return;
      e.preventDefault();
      openQ(id, true);
      try { history.replaceState(null, '', '#' + id); } catch (err) { /* file:// in some browsers */ }
    });
  });

  // a question opened by hand marks its line in the card
  links.forEach(function (a) {
    var d = byId(a.getAttribute('href').slice(1)); if (!d) return;
    d.addEventListener('toggle', function () {
      if (d.open) mark(d.id);
      else if (a.getAttribute('aria-current') === 'true') a.removeAttribute('aria-current');
    });
    if (d.open) mark(d.id);
  });

  // deep link to a question
  function fromHash() {
    var h = location.hash;
    if (!/^#ar-q-/.test(h)) return;
    var id; try { id = decodeURIComponent(h.slice(1)); } catch (e) { return; }
    openQ(id, false);
  }
  fromHash();
  W.addEventListener('load', fromHash, { once: true });
  W.addEventListener('hashchange', fromHash);
})();
