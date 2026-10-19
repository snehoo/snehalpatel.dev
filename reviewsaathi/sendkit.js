/* ReviewSaathi send kit.
   One place for the WhatsApp wording and the three buttons, used by every page:
   the new report page, Find shops results, Reports, and Send.
   Buttons everywhere: Save PDF, Open WhatsApp, Send follow-up. */
(function () {
  var SITE = 'https://snehalpatel.dev/reviewsaathi/';

  /* ---------- wording: fixed templates, only nouns and numbers change ---------- */
  var kindOf = function (c) {
    return /dent|clinic|doctor|physio|skin|eye|ortho|hospital|pharm|vet/.test(c) ? 'clinic'
      : /lab|diagnos/.test(c) ? 'lab'
      : /salon|parlour|parlor|spa|beauty/.test(c) ? 'salon'
      : /gym|fitness|yoga/.test(c) ? 'gym'
      : /coach|tuition|class|academy|institute|school|training/.test(c) ? 'class'
      : /garage|workshop|mechanic|tyre|service cent/.test(c) ? 'garage'
      : /restaurant|cafe|bakery|dhaba|hotel|sweet|kitchen/.test(c) ? 'restaurant'
      : /shop|store|mart|computer|mobile|electronic|retail|furniture|cloth|hardware/.test(c) ? 'shop' : 'business';
  };
  var NOUNS = {
    clinic: ['clinic', 'patients'], lab: ['lab', 'patients'], salon: ['salon', 'clients'], gym: ['gym', 'members'],
    'class': ['class', 'students and parents'], garage: ['garage', 'customers'], restaurant: ['restaurant', 'guests'],
    shop: ['shop', 'customers'], business: ['business', 'customers']
  };

  function messages(r) {
    var T = NOUNS[kindOf(String(r.category || '').toLowerCase())], place = T[0], people = T[1];
    var People = people.charAt(0).toUpperCase() + people.slice(1);
    var n = Number(r.unanswered || 0), tot = Number(r.checked || 0);
    var line = n === tot
      ? (tot === 1 ? 'Your latest Google review is still awaiting a reply.' : 'All ' + tot + ' of your latest Google reviews are still awaiting a reply.')
      : n + ' of your latest ' + tot + ' Google reviews are still awaiting a reply.';
    var m1 = 'Hello ' + r.shop + ' team,\n\n'
      + 'I came across your Google page and prepared a short sample report for you.\n\n'
      + People + ' often read reviews before choosing a ' + place + '. Fresh updates and replies also help build trust.\n\n'
      + 'Right now, ' + line.charAt(0).toLowerCase() + line.slice(1) + '\n\n'
      + 'I have written a few sample replies and one Google update for your ' + place + '. Please open the attached PDF to see how they could look.\n\n'
      + 'If you would like us to take care of this for you every month, reply YES and I will share how it works.\n\n'
      + 'ReviewSaathi\nMake every review count.';
    var m2 = 'Hi again from ReviewSaathi. Did you get a chance to open the PDF I sent for ' + r.shop + '? '
      + 'If you would like us to take care of your Google replies and updates every month, reply YES and I will share how it works.';
    return { m1: m1, m2: m2, place: place, people: people };
  }

  /* ---------- helpers ---------- */
  function phoneInfo(phone) {
    var raw = String(phone || '').replace(/\D/g, '');
    var num = raw.indexOf('91') === 0 && raw.length === 12 ? raw.slice(2) : raw;
    return { num: num, mobile: /^[6-9]\d{9}$/.test(num) };
  }
  function openWhatsApp(num, text) {
    var web = 'https://api.whatsapp.com/send?phone=91' + num + '&text=' + encodeURIComponent(text);
    var app = 'whatsapp://send?phone=91' + num + '&text=' + encodeURIComponent(text);
    var t = setTimeout(function () { window.location.href = web; }, 1200);
    document.addEventListener('visibilitychange', function () { if (document.hidden) clearTimeout(t); });
    window.location.href = app;
  }
  function pdfUrl(r) { return SITE + 'r/' + encodeURIComponent(r.id) + '.pdf'; }
  function copyText(text, btn) {
    var o = btn.textContent, done = function () { btn.textContent = 'Copied'; setTimeout(function () { btn.textContent = o; }, 1400); };
    var fb = function () { var a = document.createElement('textarea'); a.value = text; a.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(a); a.focus(); a.select(); try { document.execCommand('copy'); done(); } catch (e) {} document.body.removeChild(a); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, fb); else fb();
  }

  /* ---------- styles (self-contained so every page looks the same) ---------- */
  var css = '.rsk{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}'
    + '.rsk button,.rsk a{flex:1 1 150px;display:flex;align-items:center;justify-content:center;min-height:44px;border-radius:10px;font:600 16px/1.2 var(--f-body,system-ui,-apple-system,Segoe UI,sans-serif);text-decoration:none;cursor:pointer;border:2px solid var(--ink,#16201c);background:var(--surface,#fff);color:var(--ink,#16201c);padding:8px 14px}'
    + '.rsk button.main,.rsk a.main{background:var(--ink,#16201c);color:var(--bg,#fff)}'
    + '.rsk button:disabled{opacity:.55}.rsk button:focus-visible,.rsk a:focus-visible{outline:3px solid var(--accent,#17703f);outline-offset:2px}'
    + '.rsk .n{flex:1 1 100%;font:400 14px/1.4 var(--f-body,system-ui,sans-serif);color:var(--muted,#66736c);margin:-2px 0 4px}'
    + '.rsk.compact .n{display:none}'
    + '.rsk details{flex:1 1 100%;border:1px solid var(--line,#d5dad3);border-radius:10px;padding:2px 14px;background:var(--surface,#fff);color:var(--ink,#16201c)}'
    + '.rsk summary{cursor:pointer;font:600 15px var(--f-body,system-ui,sans-serif);padding:10px 0}'
    + '.rsk .msg{white-space:pre-wrap;background:var(--sunk,#eceee8);border-radius:8px;padding:12px;font:400 15px/1.5 var(--f-body,system-ui,sans-serif);margin:2px 0 8px;color:var(--ink,#16201c)}'
    + '.rsk details button{flex:none;width:100%;margin:0 0 10px}';
  var styled = false;
  function addStyles() { if (styled) return; var s = document.createElement('style'); s.textContent = css; document.head.appendChild(s); styled = true; }

  /* ---------- the three buttons ---------- */
  function mount(el, r, opts) {
    opts = opts || {}; addStyles();
    var msgs = messages(r), ph = phoneInfo(r.phone), url = pdfUrl(r);
    var file = null, loading = null;
    el.className = 'rsk' + (opts.compact ? ' compact' : ''); el.textContent = '';
    var mk = function (tag, cls, text) { var x = document.createElement(tag); if (cls) x.className = cls; if (text) x.textContent = text; return x; };

    // 1. Save PDF: shares the PDF file itself, so iPhone offers Save to Files and WhatsApp
    var save = mk('button', '', 'Save PDF'); save.type = 'button';
    function getFile() {
      if (file) return Promise.resolve(file);
      if (opts.blob) { file = new File([opts.blob], r.name || 'ReviewSaathi.pdf', { type: 'application/pdf' }); return Promise.resolve(file); }
      if (!loading) loading = fetch(url).then(function (x) { if (!x.ok) throw new Error('missing'); return x.blob(); }).then(function (b) { file = new File([b], r.name || 'ReviewSaathi.pdf', { type: 'application/pdf' }); return file; });
      return loading;
    }
    ['pointerdown', 'touchstart', 'mouseenter', 'focus'].forEach(function (ev) { save.addEventListener(ev, function () { getFile().catch(function () { loading = null; }); }, { passive: true }); });
    save.addEventListener('click', function () {
      var o = 'Save PDF'; save.disabled = true; save.textContent = 'Getting the PDF...';
      getFile().then(function (f) {
        save.disabled = false; save.textContent = o;
        if (navigator.canShare && navigator.canShare({ files: [f] })) {
          return navigator.share({ files: [f] }).catch(function (e) { if (e && e.name === 'NotAllowedError') { save.textContent = 'PDF ready. Tap Save PDF again'; } });
        }
        window.open(url + '?dl=1', '_blank');
      }).catch(function () { save.disabled = false; save.textContent = 'Could not get the PDF. Tap to try again'; loading = null; });
    });
    el.appendChild(save);
    if (!opts.compact) el.appendChild(mk('div', 'n', 'Choose Save to Files, or send it straight to WhatsApp.'));

    // 2. Open WhatsApp, with the message typed
    if (ph.mobile) {
      var wa = mk('button', 'main', 'Open WhatsApp'); wa.type = 'button';
      wa.addEventListener('click', function () { openWhatsApp(ph.num, msgs.m1); });
      el.appendChild(wa);
      if (!opts.compact) el.appendChild(mk('div', 'n', 'The message is typed. Attach the saved PDF, then send.'));
      // 3. Follow-up, with its message typed
      var fu = mk('button', '', 'Send follow-up'); fu.type = 'button';
      fu.addEventListener('click', function () { openWhatsApp(ph.num, msgs.m2); });
      el.appendChild(fu);
      if (!opts.compact) el.appendChild(mk('div', 'n', 'For two days later, if there is no reply.'));
    } else if (r.phone) {
      var call = mk('a', 'main', 'Call ' + r.phone); call.href = 'tel:' + String(r.phone).replace(/\s+/g, '');
      el.appendChild(call);
      if (!opts.compact) el.appendChild(mk('div', 'n', 'This looks like a landline, so there is no WhatsApp. Call them and say you are sending the report.'));
    }

    // the wording, with copy buttons
    if (opts.showMessages) {
      [['The message', msgs.m1, 'Copy message'], ['The follow-up', msgs.m2, 'Copy follow-up']].forEach(function (x) {
        var d = mk('details'), s = mk('summary', '', x[0]), m = mk('div', 'msg', x[1]), c = mk('button', '', x[2]); c.type = 'button';
        c.addEventListener('click', function () { copyText(x[1], c); });
        d.appendChild(s); d.appendChild(m); d.appendChild(c); el.appendChild(d);
      });
    }
    return { prefetch: getFile };
  }

  /* Save PDF for a page that makes its own PDF (the monthly report) */
  function savePdf(el, makeBlob, filename) {
    addStyles(); el.className = 'rsk compact'; el.textContent = '';
    var btn = document.createElement('button'); btn.type = 'button'; btn.textContent = 'Preparing PDF...'; btn.disabled = true; el.appendChild(btn);
    var file = null;
    makeBlob().then(function (b) { file = new File([b], filename, { type: 'application/pdf' }); btn.disabled = false; btn.textContent = 'Save PDF'; })
      .catch(function () { btn.textContent = 'Could not make the PDF'; });
    btn.addEventListener('click', function () {
      if (!file) return;
      if (navigator.canShare && navigator.canShare({ files: [file] })) { navigator.share({ files: [file] }).catch(function () {}); return; }
      var u = URL.createObjectURL(file), a = document.createElement('a'); a.href = u; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
    });
  }

  /* Monthly report: open it, or send it to the owner on WhatsApp */
  function monthlyMessage(r) {
    var url = SITE + 'm/' + encodeURIComponent(r.id) + (r.has_pdf ? '.pdf' : '');
    var month = ''; try { month = new Date(r.period_to).toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata', month: 'long', year: 'numeric' }); } catch (e) {}
    var greet = r.owner_name ? 'Hello ' + r.owner_name + ',' : 'Hello ' + r.shop + ' team,';
    return { url: url, text: greet + '\n\nYour ReviewSaathi report for ' + r.shop + (month ? ' (' + month + ')' : '') + ' is ready:\n' + url
      + '\n\nIt shows what changed on your Google page and what we did. Reply here if you have any question.\n\nReviewSaathi' };
  }
  function mountMonthly(el, r) {
    addStyles(); el.className = 'rsk compact'; el.textContent = '';
    var m = monthlyMessage(r), ph = phoneInfo(r.owner_phone);
    var open = document.createElement('a'); open.textContent = 'Open report'; open.href = SITE + 'm/' + encodeURIComponent(r.id); open.target = '_blank'; open.rel = 'noopener'; el.appendChild(open);
    if (ph.mobile) { var wa = document.createElement('button'); wa.type = 'button'; wa.className = 'main'; wa.textContent = 'Open WhatsApp'; wa.addEventListener('click', function () { openWhatsApp(ph.num, m.text); }); el.appendChild(wa); }
    else if (r.owner_phone) { var c = document.createElement('a'); c.className = 'main'; c.textContent = 'Call ' + r.owner_phone; c.href = 'tel:' + String(r.owner_phone).replace(/\s+/g, ''); el.appendChild(c); }
  }

  window.RSKit = { messages: messages, mount: mount, pdfUrl: pdfUrl, savePdf: savePdf, mountMonthly: mountMonthly, SITE: SITE };
})();
