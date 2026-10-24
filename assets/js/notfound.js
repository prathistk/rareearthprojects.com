/* =====================================================================
   Rare Earth Projects · notfound.js  (404.html only)
   - Rebuilds the community pins from projects-data.js.
   - If the missing URL mentions a community (e.g. /athena, /montira-plots,
     /projects/serenity/old-page) suggests its page.
   - 404.html sets <base> to the site root, so in-page "#" links would
     resolve against the root; the skip link is pointed back at this page.
   Loads after projects-data.js, site.js and enquiry.js (defer).
   ===================================================================== */
(function () {
  'use strict';
  var RE = window.RE; if (!RE) return;
  var D = document, $ = RE.$, $$ = RE.$$, esc = RE.esc, PROJ = RE.projects;

  // only the skip link is in-page; "#about" etc. in the header rightly resolve to the home page via <base>
  var here = location.href.split('#')[0];
  $$('a.skip[href^="#"]').forEach(function (a) { a.href = here + a.getAttribute('href'); });

  // the communities as points on the hero's contour field, as on the home page
  RE.fillPins($('#nfPins'), 'hero');

  // suggest a community named in the missing path
  var path = decodeURIComponent(location.pathname || '').toLowerCase();
  var match = null;
  PROJ.forEach(function (p) {
    if (match) return;
    var keys = [p.slug, (p.name || '').toLowerCase(), (p.village || '').toLowerCase()].filter(function (k) { return k && k.length > 3; });
    if (keys.some(function (k) { return path.indexOf(k) > -1; })) match = p;
  });
  var hint = $('#nfHint');
  if (hint && match && !/\/404(\.html)?$/.test(path)) {
    hint.innerHTML = 'Looking for <a href="' + RE.href(match.url) + '"><em>' + esc(match.name) + '</em> · ' + esc(match.locality_line) + ' <span aria-hidden="true">→</span></a>';
    hint.hidden = false;
  }
})();
