/* =====================================================================
   Rare Earth Projects · contact.js  (contact/index.html only)
   - Tabs come from site.js initTabs ([data-tabs][data-tabs-hash]);
     this file adds the scroll-to-tabs behaviour for #buy / #landowners /
     #partners deep links (footer "Connect" links).
   - Buy a plot: the stock inline composer from enquiry.js
     ([data-enquiry-form]); ?project=slug&intent=price preselects it.
   - Landowners and Channel partners: the SAME Composer class from
     enquiry.js (validation, phone normaliser, honeypot, WhatsApp-first
     send, email fallback, success state, copy message), mounted here with
     extra fields and its own message / subject. No new send path.
   - Phones, email, WhatsApp, office and the community index are
     regenerated from projects-data.js (static HTML is the fallback).
   Loads after projects-data.js, site.js and enquiry.js (defer).
   ===================================================================== */
(function () {
  'use strict';
  var RE = window.RE; if (!RE || !RE.enquiry) return;
  var D = document, W = window, $ = RE.$, $$ = RE.$$, esc = RE.esc, CFG = RE.config, PROJ = RE.projects;
  var DRAFT_KEY = 're_enq_draft'; // same session draft as enquiry.js (name / phone / email only here)
  var TABS = ['buy', 'landowners', 'partners'];

  /* ------------------------------------------------------------------
     contact lines, office, community index (from data)
     ------------------------------------------------------------------ */
  var WA_TEXT = {
    buy: 'Hello Rare Earth, I’d like to arrange a private viewing.',
    landowners: 'Hello Rare Earth, I’d like to discuss a land parcel.',
    partners: 'Hello Rare Earth, I’m a channel partner and would like to work with you.'
  };
  var MAIL_SUBJ = { buy: 'Private viewing', landowners: 'Land offer', partners: 'Channel partner' };
  var PARTNER_TEMPLATE = [
    'Firm name:', 'Contact person:', 'Phone:', 'City / area of operation:',
    'Karnataka RERA agent registration no.:', 'Communities your clients ask about:', ''
  ].join('\n');
  function mailto(subject, body) {
    return 'mailto:' + CFG.email + '?subject=' + encodeURIComponent(subject) + (body ? '&body=' + encodeURIComponent(body) : '');
  }
  // the office pin: RE_CONFIG.office.lat/lng when present, else the page's data-lat/lng, else the address
  function officeQuery() {
    var o = CFG.office || {}, sec = $('#office');
    var lat = o.lat || (sec && sec.getAttribute('data-lat')), lng = o.lng || (sec && sec.getAttribute('data-lng'));
    if (lat && lng) return lat + ',' + lng;
    return 'Rarearth Projects, ' + (o.menu || o.lines || []).join(' ').replace(/,\s*$/, '');
  }
  function linesHTML(kind) {
    var phones = CFG.phones || [];
    var shown = kind === 'buy' ? phones : phones.slice(0, 2);
    var html = '<li><small>Call</small><div>' + shown.map(function (p) { return '<a href="tel:' + p.tel + '">' + esc(p.label) + '</a>'; }).join('<br>') + '</div></li>' +
      '<li><small>Write</small><a href="' + mailto(MAIL_SUBJ[kind], kind === 'partners' ? PARTNER_TEMPLATE : '') + '">' + esc(CFG.email) + '</a></li>' +
      '<li><small>WhatsApp</small><a href="' + RE.waLink(WA_TEXT[kind]) + '" target="_blank" rel="noopener">Message us directly</a></li>';
    if (kind === 'buy') html += '<li><small>Office</small><span>' + (CFG.office.lines || []).map(esc).join('<br>') + '</span><a class="ct-to-map" href="#office">Map &amp; directions ↓</a></li>';
    return html;
  }
  $$('[data-ct-lines]').forEach(function (ul) { ul.innerHTML = linesHTML(ul.getAttribute('data-ct-lines')); });
  $$('[data-ct-mailcard] a').forEach(function (a) { a.href = mailto(MAIL_SUBJ.partners, PARTNER_TEMPLATE); });
  $$('[data-ct-addr]').forEach(function (el) { el.innerHTML = (CFG.office.lines || []).map(esc).join('<br> '); }); // the space lets the address reflow on phones, where contact.css hides the <br>s
  $$('[data-ct-maps]').forEach(function (a) { a.href = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(officeQuery()); });
  $$('[data-ct-dir]').forEach(function (a) { a.href = 'https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(officeQuery()); });

  // "Explore before you visit": the communities as points on a contour panel, as on the home hero
  RE.fillPins($('#ctPins'), 'panel');

  /* ------------------------------------------------------------------
     tabs: scroll the tab bar into view for deep links
     ------------------------------------------------------------------ */
  var tabsEl = $('#ctTabs');
  function hashKey() { var h = decodeURIComponent((location.hash || '').slice(1)); return TABS.indexOf(h) > -1 ? h : null; }
  function docTop(el) { var y = 0; while (el) { y += el.offsetTop; el = el.offsetParent; } return y; } // ignores reveal transforms
  function toTabs(smooth) {
    if (!tabsEl) return;
    var y = docTop(tabsEl), hdr = $('#hdr');
    // the header stays visible above 500px of scroll (site.js), so clear it there
    y -= (y - 24 > 500 || !hdr) ? 24 : hdr.offsetHeight + 12;
    W.scrollTo({ top: Math.max(0, y), behavior: smooth && !RE.reduce ? 'smooth' : 'instant' });
  }
  W.addEventListener('hashchange', function () { if (hashKey()) toTabs(true); });
  if (hashKey()) {
    // after layout and the header measure; again on load in case fonts shifted the page
    W.requestAnimationFrame(function () { toTabs(false); });
    W.addEventListener('load', function () { toTabs(false); }, { once: true });
  }
  // the "Map & directions" line in the Buy panel
  D.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a.ct-to-map'); if (!a) return;
    e.preventDefault();
    var o = $('#office'); if (o) o.scrollIntoView({ behavior: RE.reduce ? 'auto' : 'smooth', block: 'start' });
  });
  D.body.classList.add('ct-ready');

  /* ------------------------------------------------------------------
     Buy a plot: preselect from the query string
     ------------------------------------------------------------------ */
  var buy = $('#buyForm');
  (function () {
    if (!buy || !buy._composer) return;
    var q; try { q = new URLSearchParams(location.search); } catch (e) { return; }
    var slug = q.get('project'), intent = q.get('intent');
    var p = slug ? RE.project(slug) : null;
    if (!p && !RE.enquiry.intents[intent]) return;
    buy._composer.set({ intent: RE.enquiry.intents[intent] ? intent : 'visit', project: p ? p.slug : null, source: 'contact-buy', format: q.get('format') || '' });
  })();

  /* ------------------------------------------------------------------
     Alternative forms on the shared Composer
     ------------------------------------------------------------------ */
  var Composer = RE.enquiry.Composer;
  var baseValidate = Composer.prototype.validate;

  function seg(name, opts, type, checked) {
    return '<div class="seg ct-seg' + (opts.length === 3 ? ' three' : '') + '">' + opts.map(function (o) {
      return '<label><input type="' + (type || 'radio') + '" name="' + name + '" value="' + esc(o.v) + '"' + (checked === o.v ? ' checked' : '') + '><span>' + esc(o.l) + '</span></label>';
    }).join('') + '</div>';
  }
  function fieldHTML(u, k, label, attrs, hint) {
    return '<div class="f" data-f="' + k + '"><label for="' + u + '-' + k + '">' + label + '</label>' +
      '<input id="' + u + '-' + k + '" name="' + k + '" ' + (attrs || '') + ' aria-describedby="' + u + '-' + k + '-e' + (hint ? ' ' + u + '-' + k + '-h' : '') + '">' +
      (hint ? '<span class="hint" id="' + u + '-' + k + '-h">' + hint + '</span>' : '') +
      '<span class="err" id="' + u + '-' + k + '-e"></span></div>';
  }

  var KINDS = {
    landowners: {
      placeholder: 'Road access, conversion status, anything else we should know',
      hideUpdates: true,
      fields: function (u) {
        return '<div class="f2">' +
          '<div class="f" data-f="relation"><label for="' + u + '-relation">You are</label><select id="' + u + '-relation" name="relation">' +
          '<option>The owner</option><option>One of the owners / family</option><option>Representing the owner</option></select></div>' +
          fieldHTML(u, 'village', 'Village, hobli &amp; taluk', 'autocomplete="off" maxlength="120" placeholder="e.g. village, taluk"') +
          '</div>' +
          '<fieldset class="f" data-f="considering"><legend>Considering</legend>' +
          seg('considering', [{ v: 'Selling', l: 'Selling' }, { v: 'Joint development', l: 'Joint development' }, { v: 'Open to both', l: 'Open to both' }], 'radio', 'Open to both') +
          '</fieldset>' +
          '<div class="f2">' +
          fieldHTML(u, 'survey', 'Survey number(s)', 'autocomplete="off" maxlength="80" placeholder="e.g. 12/3, 12/4"') +
          '<div class="f" data-f="extent"><span class="lbl" id="' + u + '-extent-l">Extent</span><div class="ct-extent" role="group" aria-labelledby="' + u + '-extent-l">' +
          '<label class="ct-unit"><input id="' + u + '-acres" name="acres" inputmode="decimal" maxlength="8" aria-describedby="' + u + '-acres-e" placeholder="0"><span>acres</span></label>' +
          '<label class="ct-unit"><input id="' + u + '-guntas" name="guntas" inputmode="decimal" maxlength="5" aria-describedby="' + u + '-guntas-e" placeholder="0"><span>guntas</span></label></div>' +
          '<span class="err" id="' + u + '-acres-e"></span><span class="err" id="' + u + '-guntas-e"></span></div>' +
          '</div>';
      },
      validate: function (c) {
        var f = c.form, bad = null;
        var a = (f.acres.value || '').trim(), g = (f.guntas.value || '').trim();
        if (a && !/^\d{1,5}(\.\d{1,2})?$/.test(a)) { c.err('acres', 'Please enter acres as a number, e.g. 2 or 2.5.'); bad = bad || f.acres; } else c.err('acres', '');
        if (g && !(/^\d{1,2}(\.\d{1,2})?$/.test(g) && parseFloat(g) < 40)) { c.err('guntas', 'Guntas run from 0 to 39 (40 guntas make an acre).'); bad = bad || f.guntas; } else c.err('guntas', '');
        return bad;
      },
      data: function (c, d) {
        var f = c.form;
        d.kind = 'landowner';
        d.relation = f.relation.value;
        d.village = f.village.value.trim();
        d.considering = (($('input[name="considering"]:checked', f) || {}).value) || '';
        d.survey = f.survey.value.trim();
        var a = f.acres.value.trim(), g = f.guntas.value.trim();
        d.extent = [a ? a + ' acre' + (a === '1' ? '' : 's') : '', g ? g + ' gunta' + (g === '1' ? '' : 's') : ''].filter(Boolean).join(' ');
        return d;
      },
      lines: function (d) {
        var L = [];
        L.push('Land offer' + (d.village ? ' – ' + d.village : ''));
        L.push('Name: ' + d.name);
        L.push('Phone: ' + d.phone);
        if (d.besttime) L.push('Best time to call (IST): ' + d.besttime);
        if (d.email) L.push('Email: ' + d.email);
        L.push('Relation to the land: ' + d.relation);
        if (d.considering) L.push('Considering: ' + d.considering);
        if (d.village) L.push('Location: ' + d.village);
        if (d.survey) L.push('Survey no.: ' + d.survey);
        if (d.extent) L.push('Extent: ' + d.extent);
        if (d.message) L.push('Message: ' + d.message);
        return L;
      },
      subject: function (d) { return 'Land offer' + (d.village ? ' – ' + d.village : ''); }
    },
    partners: {
      placeholder: 'Your experience, the buyers you work with, the areas you cover',
      hideUpdates: false,
      fields: function (u) {
        var opts = PROJ.map(function (p) { return { v: p.name, l: p.name }; });
        return '<div class="f2">' +
          fieldHTML(u, 'firm', 'Firm name', 'autocomplete="organization" maxlength="80"') +
          fieldHTML(u, 'city', 'City / area', 'autocomplete="address-level2" maxlength="60"') +
          '</div>' +
          fieldHTML(u, 'reraagent', 'RERA agent registration no.', 'autocomplete="off" maxlength="60" spellcheck="false"', 'As issued by Karnataka RERA') +
          '<fieldset class="f" data-f="interest"><legend>Communities your clients ask about</legend>' +
          seg('comm', opts.concat([{ v: 'All', l: 'All of them' }]), 'checkbox') +
          '</fieldset>';
      },
      validate: function () { return null; },
      data: function (c, d) {
        var f = c.form;
        d.kind = 'partner';
        d.firm = f.firm.value.trim();
        d.city = f.city.value.trim();
        d.reraAgent = f.reraagent.value.trim();
        var picked = $$('input[name="comm"]:checked', f).map(function (x) { return x.value; });
        d.communities = picked.indexOf('All') > -1 ? 'All communities' : picked.join(', ');
        return d;
      },
      lines: function (d) {
        var L = [];
        L.push('Channel partner' + (d.firm ? ' – ' + d.firm : ''));
        L.push('Name: ' + d.name);
        L.push('Phone: ' + d.phone);
        if (d.besttime) L.push('Best time to call (IST): ' + d.besttime);
        if (d.email) L.push('Email: ' + d.email);
        if (d.firm) L.push('Firm: ' + d.firm);
        if (d.city) L.push('City / area: ' + d.city);
        L.push('RERA agent registration: ' + (d.reraAgent || 'not given'));
        if (d.communities) L.push('Communities of interest: ' + d.communities);
        if (d.message) L.push('Message: ' + d.message);
        if (d.updates) L.push('Updates: yes, keep me posted on new releases');
        return L;
      },
      subject: function (d) { return 'Channel partner' + (d.firm ? ' – ' + d.firm : ''); }
    }
  };

  function tail(d) {
    var t = ['via ' + d.page];
    if (d.source) t.push(d.source);
    if (d.utm && d.utm.utm_campaign) t.push('utm_campaign=' + d.utm.utm_campaign);
    if (d.utm && d.utm.utm_source) t.push('utm_source=' + d.utm.utm_source);
    if (d.utm && d.utm.gclid) t.push('gclid');
    return '— ' + t.join(' · ');
  }

  function mountAlt(el) {
    var kind = el.getAttribute('data-ct-form'), K = KINDS[kind];
    if (!K || el._composer) return;
    var form = D.createElement('form');
    form.setAttribute('novalidate', '');
    form.className = 'enq-form';
    form.dataset.uid = 'ct' + kind.slice(0, 4);
    el.appendChild(form);
    var done = D.createElement('div'); done.className = 'enq-done'; done.hidden = true;
    form.parentNode.insertBefore(done, form.nextSibling);
    var c = new Composer(form, { source: el.getAttribute('data-source') || 'contact-' + kind });
    c.doneEl = done;
    var u = c.u;

    // strip the buyer-only parts, add this audience's fields
    var intentSet = $('fieldset.f', form); if (intentSet) intentSet.hidden = true;
    var pp = c.field('project'); if (pp && pp.closest('.f2')) pp.closest('.f2').hidden = true;
    if (K.hideUpdates) { var chk = $('.chk', form); if (chk) chk.hidden = true; }
    c.field('message').insertAdjacentHTML('beforebegin', K.fields(u));
    form.message.placeholder = K.placeholder;
    ['village', 'acres', 'guntas', 'firm', 'city', 'reraagent'].forEach(function (k) {
      if (form[k] && form[k].addEventListener) form[k].addEventListener('input', function () { c.clearErr(k); });
    });
    // "All of them" and individual communities are mutually exclusive
    form.addEventListener('change', function (e) {
      if (e.target.name !== 'comm') return;
      if (e.target.value === 'All' && e.target.checked) $$('input[name="comm"]', form).forEach(function (x) { if (x.value !== 'All') x.checked = false; });
      else if (e.target.checked) { var all = $('input[name="comm"][value="All"]', form); if (all) all.checked = false; }
    });

    // instance overrides: same Composer, different message
    c.validate = function () {
      var ph = baseValidate.call(this);
      if (!ph) return null;
      var bad = K.validate(this);
      if (bad) { bad.focus(); return null; }
      return ph;
    };
    c.data = function (ph) {
      var f = this.form, attr = RE.attribution();
      var d = {
        intent: 'general', project: '', projectName: '', community: '', phase: '', plot: '', format: '', formatLabel: '',
        name: f.name.value.trim(), phone: ph.full, email: f.email.value.trim(), purpose: '',
        besttime: f.cc.value !== '+91' ? f.besttime.value : '', date: '', time: '',
        message: f.message.value.trim(), updates: !K.hideUpdates && f.updates.checked,
        source: this.state.source || '', page: location.pathname + '#' + kind, ref: attr.ref || '', utm: attr, ts: new Date().toISOString()
      };
      return K.data(this, d);
    };
    c.compose = function (d) { return K.lines(d).concat([tail(d)]).join('\n'); };
    c.subject = function (d) { return K.subject(d); };
    // share only name / phone / email with the session draft (never the land or firm details)
    c.save = function () {
      var f = this.form, d = { name: f.name.value, phone: f.phone.value, cc: f.cc.value, email: f.email.value };
      if (!d.name && !d.phone && !d.email) return;
      var prev = {}; try { prev = JSON.parse(RE.store.get(DRAFT_KEY) || '{}') || {}; } catch (e) { prev = {}; }
      Object.keys(d).forEach(function (k) { if (d[k] || k === 'cc') prev[k] = d[k]; });
      RE.store.set(DRAFT_KEY, JSON.stringify(prev));
    };
    c.restore = function () {
      var f = this.form, raw = RE.store.get(DRAFT_KEY); if (!raw) return;
      try {
        var d = JSON.parse(raw);
        ['name', 'phone', 'email'].forEach(function (k) { if (!f[k].value && d[k]) f[k].value = d[k]; });
        if (d.cc) f.cc.value = d.cc;
        this.syncPhone();
      } catch (e) { /* ignore */ }
    };
    c.set({ intent: 'general', project: null, source: el.getAttribute('data-source') || 'contact-' + kind });
    el._composer = c;
    return c;
  }
  $$('[data-ct-form]').forEach(mountAlt);

  // carry name / phone / email typed in one tab into the next tab's (empty) form
  if (tabsEl) tabsEl.addEventListener('tabchange', function (e) {
    var t = e.detail && e.detail.tab, panel = t && D.getElementById(t.getAttribute('aria-controls'));
    if (!panel) return;
    $$('[data-enquiry-form], [data-ct-form]', panel).forEach(function (el) { if (el._composer && el._composer.form && !el._composer.form.hidden) el._composer.restore(); });
  });
})();
