/* =====================================================================
   Rare Earth Projects · enquiry.js
   ONE enquiry dialog + ONE composer for the whole site.
   - Injects a native <dialog id="enquire"> and binds every [data-enquire]
     trigger (delegated). Attributes read on click:
       data-enquire / data-intent : visit | brochure | price | general
       data-project : slug (defaults to <body data-project>)
       data-phase   : 1 | 2      data-plot : "07"    data-format : "30x40"
       data-source  : short trigger id (hero-visit, plan-plot, edge-tab …)
       data-message : optional prefilled message
   - Inline forms: <div class="form-card" data-enquiry-form
       data-intent="visit" data-source="project-contact"
       [data-project="montira"]></div>  → the same fields are rendered
     inside (or inside a child [data-enq-slot] if present).
   - Static site: WhatsApp-first (wa.me) with mailto as the alternative.
     If RE_CONFIG.leadEndpoint is set, the payload is also POSTed
     (keepalive) — null by owner decision.
   API: RE.enquire({project, intent, phase, plot, format, source, message})
   ===================================================================== */
(function () {
  'use strict';
  var RE = window.RE; if (!RE) return;
  var D = document, W = window, $ = RE.$, $$ = RE.$$, esc = RE.esc, CFG = RE.config, PROJ = RE.projects;

  var INTENT = {
    visit: { chip: 'Site visit', title: function () { return 'Arrange a private viewing.'; }, line: 'Private viewing request', subj: 'Private viewing', interest: 'Site visit' },
    brochure: { chip: 'Brochure & layout', title: function (p) { return p ? 'Request the ' + p.name + ' brochure.' : 'Request a brochure.'; }, line: 'Brochure request', subj: 'Brochure request', interest: 'Brochure & layout' },
    price: { chip: 'Price & availability', title: function () { return 'Price & availability.'; }, line: 'Price & availability enquiry', subj: 'Price & availability', interest: 'Price & availability' },
    general: { chip: 'Something else', title: function () { return 'How can we help?'; }, line: 'Enquiry', subj: 'Enquiry', interest: 'General enquiry' }
  };
  var ORDER = ['visit', 'brochure', 'price', 'general'];
  var SUB = 'Share a few details and our team will be in touch personally.';
  var DRAFT_KEY = 're_enq_draft';
  var ROMAN = ['', 'I', 'II', 'III', 'IV'];
  var uid = 0;

  function projectLabel(p) { return p ? p.name + ' · ' + p.locality.label : ''; }
  function phaseLabel(n) { return n ? 'Phase ' + (ROMAN[+n] || n) : ''; }
  function tomorrowISO() { var d = new Date(); d.setDate(d.getDate() + 1); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function fmtDate(iso) {
    if (!iso) return '';
    var p = iso.split('-'), d = new Date(+p[0], +p[1] - 1, +p[2]);
    return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  }
  function formatLabel(f) {
    if (!f) return '';
    if (f.sqft) return f.label + ' ft · ' + RE.nf(f.sqft) + ' sq ft';
    if (f.sqft_max) return f.label + ' · up to ' + RE.nf(f.sqft_max) + ' sq ft';
    return f.label;
  }
  function clickLink(url, blank) {
    var a = D.createElement('a'); a.href = url;
    if (blank) { a.target = '_blank'; a.rel = 'noopener'; }
    a.style.display = 'none'; D.body.appendChild(a); a.click(); a.remove();
  }

  /* ---------------- field partial ---------------- */
  function fieldsHTML(u) {
    var codes = (CFG.phoneCodes || [{ code: '+91', label: 'India +91' }]).map(function (c) { return '<option value="' + c.code + '"' + (c.code === '+91' ? ' selected' : '') + (c.name ? ' title="' + esc(c.name) + '" aria-label="' + esc(c.name + ' ' + (c.code === 'other' ? '' : c.code)) + '"' : '') + '>' + esc(c.label) + '</option>'; }).join('');
    var opts = PROJ.map(function (p) { return '<option value="' + p.slug + '">' + esc(projectLabel(p)) + '</option>'; }).join('') + '<option value="">Not sure yet</option>';
    var privacy = RE.href('legal/#privacy');
    var tel = CFG.phones && CFG.phones[0];
    return '' +
      '<fieldset class="f"><legend>Interest</legend><div class="seg">' +
      ORDER.map(function (k) { return '<label><input type="radio" name="intent" value="' + k + '"><span>' + INTENT[k].chip + '</span></label>'; }).join('') +
      '</div></fieldset>' +
      '<div class="f2">' +
      '<div class="f" data-f="name"><label for="' + u + '-name">Name *</label><input id="' + u + '-name" name="name" autocomplete="name" maxlength="60" required aria-describedby="' + u + '-name-e"><span class="err" id="' + u + '-name-e"></span></div>' +
      '<div class="f" data-f="phone"><label for="' + u + '-phone">Phone *</label><div class="ph-row"><select name="cc" aria-label="Country code">' + codes + '</select>' +
      '<input id="' + u + '-phone" name="phone" type="tel" inputmode="tel" autocomplete="tel-national" maxlength="20" required aria-describedby="' + u + '-phone-e"></div><span class="err" id="' + u + '-phone-e"></span></div>' +
      '</div>' +
      '<div class="f" data-f="besttime" hidden><label for="' + u + '-bt">Best time to call (IST)</label><select id="' + u + '-bt" name="besttime"><option>Morning 9–12</option><option>Afternoon 12–4</option><option>Evening 4–8</option></select></div>' +
      '<div class="f" data-f="email"><label for="' + u + '-email">Email (optional)</label><input id="' + u + '-email" name="email" type="email" autocomplete="email" maxlength="80" aria-describedby="' + u + '-email-e"><span class="err" id="' + u + '-email-e"></span></div>' +
      '<div class="f2">' +
      '<div class="f" data-f="project"><label for="' + u + '-project">Community</label>' +
      '<div class="ro-chip" data-chip hidden><b></b><button type="button" class="chg">Change</button></div>' +
      '<select id="' + u + '-project" name="project">' + opts + '</select></div>' +
      '<div class="f" data-f="purpose"><label for="' + u + '-purpose">Purpose</label><select id="' + u + '-purpose" name="purpose"><option>A home to build</option><option>Investment</option><option>Both</option></select></div>' +
      '</div>' +
      '<div class="f" data-f="phase" hidden><label for="' + u + '-phase">Phase</label><select id="' + u + '-phase" name="phase"><option value="1">Phase I</option><option value="2">Phase II</option><option value="" selected>Either</option></select></div>' +
      '<div class="f2" data-f="visit" hidden>' +
      '<div class="f"><label for="' + u + '-date">Preferred date</label><input id="' + u + '-date" name="date" type="date" aria-describedby="' + u + '-date-e"><span class="err" id="' + u + '-date-e"></span></div>' +
      '<div class="f"><label for="' + u + '-time">Time</label><select id="' + u + '-time" name="time"><option value="">Any time</option><option>Morning</option><option>Afternoon</option><option>Evening</option></select></div>' +
      '</div>' +
      '<div class="f" data-f="format" hidden><label for="' + u + '-format">Plot size</label><select id="' + u + '-format" name="format"></select></div>' +
      '<div class="f" data-f="plot" hidden><span class="ro-chip"><b></b></span></div>' +
      '<div class="f" data-f="message"><label for="' + u + '-msg">Message (optional)</label><textarea id="' + u + '-msg" name="message" maxlength="1000" placeholder="Plot size, budget, preferred date for a visit"></textarea></div>' +
      '<label class="chk"><input type="checkbox" name="updates"><span>Keep me posted on new Rare Earth releases.</span></label>' +
      '<div class="hp" aria-hidden="true"><label>Website <input name="website" tabindex="-1" autocomplete="off"></label></div>' +
      '<div class="enq-actions"><button type="submit" class="pill solid">' + RE.icons.wa.replace('<svg ', '<svg fill="currentColor" ') + '<span>Send on WhatsApp</span></button>' +
      '<button type="button" class="link" data-act="email">Or send by email <span class="ln"></span></button></div>' +
      (tel ? '<p class="enq-talk">Prefer to talk? <a href="tel:' + tel.tel + '">' + esc(tel.label) + '</a></p>' : '') +
      '<p class="enq-fine">We’ll use these details only to respond to this enquiry. <a href="' + privacy + '">Privacy note</a></p>' +
      '<p class="enq-status" role="status" aria-live="polite"></p>';
  }

  /* ---------------- composer (one per form) ---------------- */
  function Composer(form, o) {
    this.form = form; this.o = o || {}; this.state = {}; this.done = null; this.lastMsg = '';
    this.u = form.dataset.uid;
    form.innerHTML = fieldsHTML(this.u);
    this.bind();
  }
  Composer.prototype.q = function (s) { return $(s, this.form); };
  Composer.prototype.field = function (k) { return $('[data-f="' + k + '"]', this.form); };
  Composer.prototype.bind = function () {
    var self = this, f = this.form;
    $$('input[name="intent"]', f).forEach(function (r) { r.addEventListener('change', function () { self.setIntent(r.value); }); });
    f.cc.addEventListener('change', function () { self.syncPhone(); });
    f.project.addEventListener('change', function () { self.state.project = f.project.value || null; self.syncProject(); self.save(); });
    $('.chg', this.field('project')).addEventListener('click', function () { self.showSelect(true); f.project.focus(); });
    f.phone.addEventListener('blur', function () { var n = self.normPhone(); if (n.ok && f.cc.value === '+91') f.phone.value = n.local.slice(0, 5) + ' ' + n.local.slice(5); });
    ['name', 'phone', 'email', 'date'].forEach(function (k) { f[k].addEventListener('input', function () { self.clearErr(k); }); });
    f.addEventListener('input', function () { self.save(); });
    f.addEventListener('submit', function (e) { e.preventDefault(); self.send('wa'); });
    $('[data-act="email"]', f).addEventListener('click', function () { self.send('mail'); });
    f.date.min = tomorrowISO();
  };
  Composer.prototype.set = function (o) {
    o = o || {};
    var f = this.form, s = this.state;
    s.intent = INTENT[o.intent] ? o.intent : (s.intent || 'general');
    s.project = o.project !== undefined ? (o.project || null) : (s.project || null);
    s.phase = o.phase || ''; s.plot = o.plot || ''; s.format = o.format || ''; s.source = o.source || this.o.source || '';
    s.lockedProject = !!(s.project && (o.lockProject || (RE.current && RE.current.slug === s.project)));
    $$('input[name="intent"]', f).forEach(function (r) { r.checked = r.value === s.intent; });
    f.project.value = s.project || '';
    this.showSelect(!s.lockedProject);
    this.syncProject();
    if (o.message && !f.message.value) f.message.value = o.message;
    this.setIntent(s.intent, true);
    this.syncPhone();
    this.restore();
  };
  Composer.prototype.showSelect = function (show) {
    var chip = $('[data-chip]', this.field('project')), sel = this.form.project, p = RE.project(this.state.project);
    if (!p) show = true;
    chip.hidden = show; sel.hidden = !show;
    if (p) $('b', chip).textContent = projectLabel(p);
  };
  Composer.prototype.syncProject = function () {
    var f = this.form, s = this.state, p = RE.project(s.project);
    var hasPhases = !!(p && p.phases && p.phases.length > 1);
    this.field('phase').hidden = !hasPhases;
    if (hasPhases) f.phase.value = s.phase ? String(s.phase) : '';
    // plot formats for the price intent
    var fmts = (p && p.plot_formats) || [];
    f.format.innerHTML = fmts.map(function (x) { return '<option value="' + x.key + '">' + esc(formatLabel(x)) + '</option>'; }).join('') + '<option value="">Not sure yet</option>';
    f.format.value = s.format && fmts.some(function (x) { return x.key === s.format; }) ? s.format : '';
    this.field('format').hidden = !(s.intent === 'price' && fmts.length);
    // plot chip
    var pc = this.field('plot');
    if (s.plot && p) {
      var fx = fmts.filter(function (x) { return x.key === s.format; })[0];
      $('b', pc).textContent = 'Plot ' + s.plot + (s.phase ? ' · ' + phaseLabel(s.phase) : '') + (fx ? ' · ' + fx.label : '');
      pc.hidden = false;
    } else pc.hidden = true;
    if (this.o.onProject) this.o.onProject(p);
  };
  Composer.prototype.setIntent = function (k, quiet) {
    var s = this.state; s.intent = INTENT[k] ? k : 'general';
    this.field('visit').hidden = s.intent !== 'visit';
    var p = RE.project(s.project);
    this.field('format').hidden = !(s.intent === 'price' && p && p.plot_formats && p.plot_formats.length);
    if (this.o.onIntent) this.o.onIntent(s.intent, p);
    if (!quiet) this.save();
  };
  Composer.prototype.syncPhone = function () {
    var cc = this.form.cc.value;
    this.field('besttime').hidden = cc === '+91';
    this.form.phone.placeholder = cc === '+91' ? '98765 43210' : '';
  };
  Composer.prototype.normPhone = function () {
    var cc = this.form.cc.value, raw = this.form.phone.value || '', d = raw.replace(/\D/g, '');
    if (cc === '+91') {
      if (d.length === 12 && d.indexOf('91') === 0) d = d.slice(2);
      else if (d.length === 11 && d[0] === '0') d = d.slice(1);
      return { ok: /^[6-9]\d{9}$/.test(d), local: d, full: '+91 ' + d.slice(0, 5) + ' ' + d.slice(5) };
    }
    if (cc === 'other') return { ok: d.length >= 6 && d.length <= 15, local: d, full: (raw.trim().charAt(0) === '+' ? '+' : '') + d };
    if (d.indexOf(cc.slice(1)) === 0 && d.length > 10) d = d.slice(cc.length - 1);
    d = d.replace(/^0+/, '');
    return { ok: d.length >= 6 && d.length <= 14, local: d, full: cc + ' ' + d };
  };
  Composer.prototype.err = function (k, msg) {
    var box = this.form[k] && this.form[k].closest('.f'), e = $('#' + this.u + '-' + (k === 'message' ? 'msg' : k) + '-e', this.form);
    if (box) box.classList.toggle('bad', !!msg);
    if (e) e.textContent = msg || '';
    if (this.form[k]) this.form[k].setAttribute('aria-invalid', msg ? 'true' : 'false');
  };
  Composer.prototype.clearErr = function (k) { this.err(k, ''); };
  Composer.prototype.validate = function () {
    var f = this.form, bad = [];
    var name = f.name.value.trim();
    if (name.length < 2) { this.err('name', 'Please share your name.'); bad.push(f.name); } else this.err('name', '');
    var ph = this.normPhone();
    if (!ph.ok) { this.err('phone', f.cc.value === '+91' ? 'Please enter a 10-digit mobile number starting 6–9.' : 'Please enter a valid phone number (6–14 digits).'); bad.push(f.phone); } else this.err('phone', '');
    var em = f.email.value.trim();
    if (em && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(em)) { this.err('email', 'Please check the email address.'); bad.push(f.email); } else this.err('email', '');
    if (this.state.intent === 'visit' && f.date.value && f.date.value < tomorrowISO()) { this.err('date', 'Please choose a date from tomorrow.'); bad.push(f.date); } else this.err('date', '');
    if (bad.length) { bad[0].focus(); return null; }
    return ph;
  };
  Composer.prototype.data = function (ph) {
    var f = this.form, s = this.state, p = RE.project(f.project.value || s.project);
    var fmts = (p && p.plot_formats) || [];
    var fmt = fmts.filter(function (x) { return x.key === (f.format.value || s.format); })[0];
    var phase = (p && p.phases && p.phases.length > 1) ? f.phase.value : '';
    var attr = RE.attribution();
    return {
      intent: s.intent, project: p ? p.slug : '', projectName: p ? p.name : '', community: p ? projectLabel(p) : 'Not sure yet',
      phase: phase, plot: s.plot || '', format: fmt ? fmt.key : '', formatLabel: fmt ? formatLabel(fmt) : '',
      name: f.name.value.trim(), phone: ph.full, email: f.email.value.trim(), purpose: f.purpose.value,
      besttime: f.cc.value !== '+91' ? f.besttime.value : '',
      date: s.intent === 'visit' ? f.date.value : '', time: s.intent === 'visit' ? f.time.value : '',
      message: f.message.value.trim(), updates: f.updates.checked,
      source: s.source || '', page: location.pathname + location.hash, ref: attr.ref || '',
      utm: attr, ts: new Date().toISOString()
    };
  };
  Composer.prototype.compose = function (d) {
    var I = INTENT[d.intent], L = [];
    L.push(I.line + (d.projectName ? ' – ' + d.projectName : ''));
    L.push('Name: ' + d.name);
    L.push('Phone: ' + d.phone);
    if (d.besttime) L.push('Best time to call (IST): ' + d.besttime);
    if (d.email) L.push('Email: ' + d.email);
    L.push('Community: ' + d.community + (d.phase ? ' (' + phaseLabel(d.phase) + ')' : ''));
    var interest = I.interest;
    if (d.intent === 'visit' && (d.date || d.time)) interest += ' · ' + [fmtDate(d.date), d.time ? d.time.toLowerCase() : ''].filter(Boolean).join(', ');
    if (d.plot) interest += ' · Plot ' + d.plot + (d.phase ? ', ' + phaseLabel(d.phase) : '') + (d.formatLabel ? ', ' + d.formatLabel : '');
    else if (d.formatLabel && d.intent === 'price') interest += ' · ' + d.formatLabel;
    L.push('Interest: ' + interest);
    L.push('Purpose: ' + d.purpose);
    if (d.message) L.push('Message: ' + d.message);
    if (d.updates) L.push('Updates: yes, keep me posted on new releases');
    var tail = ['via ' + d.page];
    if (d.source) tail.push(d.source);
    if (d.utm && d.utm.utm_campaign) tail.push('utm_campaign=' + d.utm.utm_campaign);
    if (d.utm && d.utm.utm_source) tail.push('utm_source=' + d.utm.utm_source);
    if (d.utm && d.utm.gclid) tail.push('gclid');
    L.push('— ' + tail.join(' · '));
    return L.join('\n');
  };
  Composer.prototype.subject = function (d) { return INTENT[d.intent].subj + ' – ' + (d.projectName || 'Rare Earth Projects'); };
  Composer.prototype.mailto = function (d, body) { return 'mailto:' + CFG.email + '?subject=' + encodeURIComponent(this.subject(d)) + '&body=' + encodeURIComponent(body); };
  Composer.prototype.send = function (channel) {
    var f = this.form, status = $('.enq-status', f);
    if (f.website.value) { this.showDone({ name: f.name.value.trim(), intent: this.state.intent }, channel, true); return; } // honeypot: drop silently
    var ph = this.validate(); if (!ph) { status.textContent = 'Please check the highlighted fields.'; return; }
    status.textContent = '';
    var d = this.data(ph), msg = this.compose(d);
    this.lastData = d; this.lastMsg = msg;
    if (CFG.leadEndpoint) {
      // text/plain keeps this a "simple" cross-origin request: no CORS preflight, which keepalive
      // requests can't always make; the lead inbox reads the body as JSON either way
      try { fetch(CFG.leadEndpoint, { method: 'POST', keepalive: true, headers: { 'Content-Type': 'text/plain;charset=UTF-8' }, body: JSON.stringify(Object.assign({}, d, { text: msg })) }).catch(function () {}); } catch (e) { /* offline */ }
    }
    if (channel === 'mail') clickLink(this.mailto(d, msg), false);
    else clickLink(RE.waLink(msg), true);
    RE.store.del(DRAFT_KEY);
    this.showDone(d, channel);
  };
  Composer.prototype.showDone = function (d, channel, dropped) {
    var self = this, p = RE.project(d.project), first = (d.name || '').split(/\s+/)[0] || 'you';
    var host = this.doneEl;
    var body = channel === 'mail'
      ? 'Your email is ready in your mail app — press send there and it reaches our team. ' + CFG.replyNote
      : 'Your message is ready in WhatsApp — press send there and it reaches our team. ' + CFG.replyNote;
    var acts = '';
    if (d.intent === 'brochure') {
      if (p && p.brochure_pdf) acts += '<a class="pill solid" href="' + RE.asset(p.brochure_pdf) + '" download>Download ' + esc(p.name) + ' brochure (PDF)</a>';
      if (p && p.layout_pdf) acts += '<a class="link" href="' + RE.asset(p.layout_pdf) + '" download>Download layout (PDF) <span class="ln"></span></a>';
      if (!(p && (p.brochure_pdf || p.layout_pdf))) acts += '<p>Our team will share the ' + (p ? esc(p.name) + ' ' : '') + 'brochure and layout with you directly.</p>';
    }
    if (d.intent === 'visit' && d.date) acts += '<button type="button" class="pill" data-act="ics">Add to calendar (.ics)</button>';
    host.innerHTML = '<span class="kicker">' + esc(p ? projectLabel(p) : 'Rare Earth Projects') + '</span>' +
      '<h3 tabindex="-1">Thank you, ' + esc(first) + '.</h3><p>' + body + '</p>' +
      (acts ? '<div class="acts">' + acts + '</div>' : '') +
      '<div class="mini">' +
      (dropped ? '' : '<button type="button" class="link" data-act="copy">Didn’t open? Copy message <span class="ln"></span></button>') +
      (dropped ? '' : (channel === 'mail' ? '<button type="button" class="link" data-act="wa">Try WhatsApp instead <span class="ln"></span></button>' : '<button type="button" class="link" data-act="mail">Try email instead <span class="ln"></span></button>')) +
      '<button type="button" class="link" data-act="again">New enquiry <span class="ln"></span></button></div>' +
      '<p class="enq-status" role="status" aria-live="polite"></p>';
    this.form.hidden = true; host.hidden = false;
    var h = $('h3', host); h && h.focus({ preventScroll: false });
    var st = $('.enq-status', host);
    host.onclick = function (e) {
      var b = e.target.closest('[data-act]'); if (!b) return;
      var a = b.getAttribute('data-act');
      if (a === 'copy') {
        var ok = function () { st.textContent = 'Message copied. Paste it into WhatsApp or an email to ' + CFG.email + '.'; };
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(self.lastMsg).then(ok, function () { st.textContent = self.lastMsg; });
        else st.textContent = self.lastMsg;
      }
      if (a === 'mail') clickLink(self.mailto(self.lastData, self.lastMsg), false);
      if (a === 'wa') clickLink(RE.waLink(self.lastMsg), true);
      if (a === 'ics') ics(self.lastData);
      if (a === 'again') self.reset();
    };
    if (this.o.onDone) this.o.onDone(d);
  };
  Composer.prototype.reset = function () {
    var f = this.form; f.reset();
    ['name', 'phone', 'email', 'date'].forEach(this.clearErr, this);
    this.doneEl.hidden = true; f.hidden = false;
    if (this.o.onReset) this.o.onReset();
    this.set({ intent: this.state.intent, project: this.state.project, source: this.state.source, lockProject: this.state.lockedProject });
  };
  Composer.prototype.save = function () {
    var f = this.form;
    var d = { name: f.name.value, phone: f.phone.value, cc: f.cc.value, email: f.email.value, purpose: f.purpose.value, message: f.message.value };
    if (!d.name && !d.phone && !d.email && !d.message) return;
    RE.store.set(DRAFT_KEY, JSON.stringify(d));
  };
  Composer.prototype.restore = function () {
    var f = this.form, raw = RE.store.get(DRAFT_KEY); if (!raw) return;
    try {
      var d = JSON.parse(raw);
      ['name', 'phone', 'email', 'message'].forEach(function (k) { if (!f[k].value && d[k]) f[k].value = d[k]; });
      if (d.cc) f.cc.value = d.cc;
      if (d.purpose) f.purpose.value = d.purpose;
      this.syncPhone();
    } catch (e) { /* ignore */ }
  };

  /* calendar file for a site visit (times are placeholders, IST) */
  function ics(d) {
    if (!d || !d.date) return;
    var p = RE.project(d.project), parts = d.date.split('-');
    var hour = { Morning: 10, Afternoon: 14, Evening: 16 }[d.time] || 11;
    var startUTC = new Date(Date.UTC(+parts[0], +parts[1] - 1, +parts[2], hour, 0) - 330 * 60000);
    var endUTC = new Date(startUTC.getTime() + 90 * 60000);
    var z = function (dt) { return dt.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, ''); };
    var escI = function (s) { return String(s).replace(/[\\;,]/g, function (c) { return '\\' + c; }).replace(/\n/g, '\\n'); };
    var tel = CFG.phones && CFG.phones[0] ? CFG.phones[0].label : '';
    var lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Rare Earth Projects//Private viewing//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'BEGIN:VEVENT',
      'UID:' + Date.now() + '-' + Math.random().toString(36).slice(2) + '@rareearthprojects.com', 'DTSTAMP:' + z(new Date()),
      'DTSTART:' + z(startUTC), 'DTEND:' + z(endUTC),
      'SUMMARY:' + escI('Private viewing – ' + (p ? p.name : 'Rare Earth Projects')),
      'LOCATION:' + escI(p ? p.address : CFG.office.short),
      'DESCRIPTION:' + escI('Requested ' + (d.time ? d.time.toLowerCase() : '') + ' visit. Our team will confirm the exact time with you. Questions: ' + tel + ' / ' + CFG.email),
      'END:VEVENT', 'END:VCALENDAR'];
    var blob = new Blob([lines.join('\r\n')], { type: 'text/calendar' });
    var url = URL.createObjectURL(blob), a = D.createElement('a');
    a.href = url; a.download = 'rare-earth-private-viewing.ics'; D.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
  }

  /* ---------------- the dialog ---------------- */
  var dlg, dlgC, trigger = null;
  function buildDialog() {
    dlg = D.createElement('dialog');
    dlg.id = 'enquire'; dlg.className = 'enq-dlg';
    dlg.setAttribute('aria-labelledby', 'enqTitle'); dlg.setAttribute('aria-describedby', 'enqSub');
    dlg.innerHTML = '<div class="enq-card"><span class="enq-grip" aria-hidden="true"></span>' +
      '<button type="button" class="enq-x" aria-label="Close">' + RE.icons.close + '</button>' +
      '<div class="enq-head"><span class="kicker" id="enqKicker">Rare Earth Projects</span><h2 id="enqTitle" tabindex="-1">How can we help?</h2><p id="enqSub">' + SUB + '</p></div>' +
      '<form class="enq-form" novalidate data-uid="dlg"></form><div class="enq-done" hidden></div></div>';
    D.body.appendChild(dlg);
    var form = $('form', dlg);
    dlgC = new Composer(form, {
      onIntent: function (k, p) { $('#enqTitle').textContent = INTENT[k].title(p); },
      onProject: function (p) { $('#enqKicker').textContent = p ? projectLabel(p) : 'Rare Earth Projects'; $('#enqTitle').textContent = INTENT[dlgC ? dlgC.state.intent : 'general'].title(p); },
      onDone: function () { $('.enq-head', dlg).hidden = true; dlg.scrollTop = 0; },
      onReset: function () { $('.enq-head', dlg).hidden = false; }
    });
    dlgC.doneEl = $('.enq-done', dlg);
    $('.enq-x', dlg).addEventListener('click', close);
    dlg.addEventListener('click', function (e) {
      if (e.target !== dlg) return;
      var r = dlg.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) close();
    });
    dlg.addEventListener('close', function () {
      D.body.classList.remove('enq-open');
      if (!D.body.classList.contains('menu-open') && !D.body.classList.contains('pv-full')) D.body.classList.remove('locked');
      if (trigger && trigger.isConnected && trigger.focus) trigger.focus({ preventScroll: true });
    });
  }
  function open(o) {
    if (!dlg) buildDialog();
    o = o || {};
    if (o.project === undefined) o.project = RE.current ? RE.current.slug : null;
    trigger = o.trigger || D.activeElement;
    if (D.body.classList.contains('menu-open')) RE.toggleMenu(false);
    dlgC.doneEl.hidden = true; dlgC.form.hidden = false; $('.enq-head', dlg).hidden = false;
    dlgC.set(o);
    var p = RE.project(dlgC.state.project);
    $('#enqKicker').textContent = p ? projectLabel(p) : 'Rare Earth Projects';
    $('#enqTitle').textContent = INTENT[dlgC.state.intent].title(p);
    if (!dlg.open) dlg.showModal();
    dlg.scrollTop = 0;
    D.body.classList.add('enq-open', 'locked');
    if (RE.finePointer) { var n = dlgC.form.name; (n.value ? $('#enqTitle') : n).focus(); }
    else $('#enqTitle').focus();
  }
  function close() { if (dlg && dlg.open) dlg.close(); }

  D.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('[data-enquire]');
    if (!t) return;
    if (t.closest('.enq-dlg')) return;
    e.preventDefault();
    var a = t.dataset;
    open({
      intent: a.enquire || a.intent || 'general',
      project: a.project !== undefined ? (a.project || null) : undefined,
      phase: a.phase, plot: a.plot, format: a.format, source: a.source || '', message: a.message || '', trigger: t
    });
  });

  /* ---------------- inline forms ---------------- */
  function mountInline(el) {
    if (el.dataset.enqReady) return el._composer; el.dataset.enqReady = '1';
    var slot = $('[data-enq-slot]', el) || el;
    var form;
    if (slot.tagName === 'FORM') { form = slot; form.setAttribute('novalidate', ''); }
    else { form = D.createElement('form'); form.setAttribute('novalidate', ''); slot.appendChild(form); }
    form.classList.add('enq-form');
    form.dataset.uid = 'in' + (++uid);
    var done = D.createElement('div'); done.className = 'enq-done'; done.hidden = true;
    form.parentNode.insertBefore(done, form.nextSibling);
    var c = new Composer(form, { source: el.dataset.source || 'inline' });
    c.doneEl = done;
    var pj = el.dataset.project !== undefined ? (el.dataset.project || null) : (RE.current ? RE.current.slug : null);
    c.set({ intent: el.dataset.intent || 'visit', project: pj, source: el.dataset.source || 'inline', lockProject: !!el.dataset.project });
    el._composer = c;
    return c;
  }
  $$('[data-enquiry-form]').forEach(mountInline);

  RE.enquire = open;
  RE.enquiry = { open: open, close: close, mountInline: mountInline, Composer: Composer, intents: INTENT };
})();
