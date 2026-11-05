/* Mondzorgpraktijk De Parel — site-scripts */
(() => {
  const PRACTICE_EMAIL = 'info@mondzorgpraktijkdeparel.nl';
  const PRACTICE_PHONE = '026 – 382 77 33';
  const store = {
    get(k){ try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v){ try { localStorage.setItem(k, v); } catch {} }
  };

  /* Foto-slots: toon het label zolang de foto nog niet in /img staat */
  document.querySelectorAll('.ph img').forEach(img => {
    const empty = () => { img.closest('.ph').classList.add('is-empty'); img.remove(); };
    if (img.complete && img.naturalWidth === 0) empty();
    else img.addEventListener('error', empty, { once: true });
  });

  /* Mobiel menu */
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.getElementById('nav');
  if (toggle && nav) {
    const mq = matchMedia('(min-width:1080px)');
    const setMenu = open => {
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Menu sluiten' : 'Menu openen');
      nav.hidden = !open && !mq.matches;
    };
    setMenu(false);
    mq.addEventListener('change', () => setMenu(false));
    toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') { setMenu(false); toggle.focus(); }
    });
  }

  /* Header-schaduw bij scrollen */
  const header = document.querySelector('.header');
  const onScroll = () => header && header.classList.toggle('is-scrolled', scrollY > 4);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* Rustige reveal-animatie */
  const reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); }
    }), { rootMargin: '0px 0px -6% 0px' });
    reveals.forEach(el => io.observe(el));
  } else reveals.forEach(el => el.classList.add('is-visible'));

  /* Openingstijden: markeer vandaag */
  const day = new Date().getDay(); // 0 = zondag
  document.querySelectorAll('.hours [data-day]').forEach(el => {
    if (Number(el.dataset.day) === day) {
      el.classList.add('is-today');
      const dd = el.nextElementSibling; if (dd) dd.classList.add('is-today');
    }
  });

  /* Google Maps: pas laden na toestemming (AVG) */
  document.querySelectorAll('[data-map]').forEach(box => {
    const src = box.dataset.map;
    const load = () => {
      box.innerHTML = '';
      const f = document.createElement('iframe');
      f.src = src; f.loading = 'lazy'; f.allowFullscreen = true;
      f.referrerPolicy = 'no-referrer-when-downgrade';
      f.title = 'Google Maps: Mondzorgpraktijk De Parel, Dordrechtweg 4 in Arnhem';
      box.appendChild(f);
    };
    if (store.get('deparel-maps') === 'ja') { load(); return; }
    const btn = box.querySelector('[data-map-load]');
    const remember = box.querySelector('[data-map-remember]');
    btn && btn.addEventListener('click', () => {
      if (remember && remember.checked) store.set('deparel-maps', 'ja');
      load();
    });
  });

  /* Formulieren: versturen naar endpoint, of anders via e-mail */
  const messages = {
    valueMissing: 'Vul dit veld in.',
    typeMismatch: 'Controleer de invoer, bijvoorbeeld naam@voorbeeld.nl.',
    checkbox: 'Geef toestemming om uw gegevens te verwerken.'
  };
  const validate = input => {
    const id = input.getAttribute('aria-describedby');
    const err = id && document.getElementById(id.split(' ')[0]);
    let msg = '';
    if (input.type === 'checkbox') msg = input.checked ? '' : messages.checkbox;
    else if (input.validity.valueMissing) msg = messages.valueMissing;
    else if (input.validity.typeMismatch) msg = messages.typeMismatch;
    input.setAttribute('aria-invalid', msg ? 'true' : 'false');
    if (err && err.classList.contains('error')) err.textContent = msg;
    return !msg;
  };
  document.querySelectorAll('form[data-form]').forEach(form => {
    const status = form.querySelector('.status');
    const required = [...form.querySelectorAll('[required]')];
    required.forEach(i => i.addEventListener('blur', () => validate(i)));
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const bad = required.filter(i => !validate(i));
      if (bad.length) { bad[0].focus(); return; }
      const data = new FormData(form);
      const endpoint = form.dataset.endpoint;
      if (endpoint) {
        status.textContent = 'Bezig met versturen…';
        try {
          const res = await fetch(endpoint, { method: 'POST', body: data, headers: { Accept: 'application/json' } });
          if (!res.ok) throw new Error();
          form.reset();
          status.textContent = 'Bedankt! We hebben uw bericht ontvangen en nemen zo snel mogelijk contact met u op.';
        } catch {
          status.textContent = `Het versturen is niet gelukt. Probeer het later opnieuw of bel ons op ${PRACTICE_PHONE}.`;
        }
        return;
      }
      // Zonder endpoint: open een vooraf ingevulde e-mail
      const labels = {};
      form.querySelectorAll('label[for]').forEach(l => { labels[l.htmlFor] = l.firstChild.textContent.trim(); });
      const lines = [];
      form.querySelectorAll('input:not([type=checkbox]), textarea').forEach(el => {
        if (el.value.trim()) lines.push(`${labels[el.id] || el.name}: ${el.value.trim()}`);
      });
      const subject = form.dataset.subject || 'Bericht via de website';
      location.href = `mailto:${PRACTICE_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join('\n'))}`;
      status.textContent = `Uw e-mailprogramma is geopend met uw gegevens. Verstuur de e-mail om uw aanvraag af te ronden. Lukt dit niet? Bel ons op ${PRACTICE_PHONE}.`;
    });
  });

  /* Jaartal in footer */
  document.querySelectorAll('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });
})();
