'use strict';

/* NAV */
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => nav.classList.toggle('scrolled', window.scrollY > 50), { passive: true });

const burger = document.getElementById('burger');
const navLinks = document.getElementById('navLinks');
burger.addEventListener('click', () => navLinks.classList.toggle('open'));
navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => navLinks.classList.remove('open')));

/* SCROLL REVEAL */
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    setTimeout(() => e.target.classList.add('visible'), +e.target.dataset.delay || 0);
    io.unobserve(e.target);
  });
}, { threshold: .12 });

document.querySelectorAll('.svc-card, .testi-card, .vc-card, .sh, .check-list li, .g-sm, .g-wide, .foot-col').forEach((el, i) => {
  el.classList.add('reveal');
  el.dataset.delay = (i % 4) * 80;
  io.observe(el);
});

/* BEFORE / AFTER */
function initBA(panel) {
  const wrap   = panel.querySelector('.ba-wrap');
  const after  = panel.querySelector('.ba-after');
  const handle = panel.querySelector('.ba-handle');
  const range  = panel.querySelector('.ba-range');
  if (!wrap) return;

  function setPos(pct) {
    pct = Math.min(95, Math.max(5, pct));
    after.style.clipPath = `inset(0 ${100 - pct}% 0 0)`;
    handle.style.left    = pct + '%';
    range.value          = pct;
  }

  range.addEventListener('input', () => setPos(+range.value));

  let drag = false;
  wrap.addEventListener('mousedown',  () => drag = true, { passive: true });
  wrap.addEventListener('touchstart', () => drag = true, { passive: true });
  window.addEventListener('mouseup',  () => drag = false);
  window.addEventListener('touchend', () => drag = false);
  window.addEventListener('mousemove', e => { if (drag) { const r = wrap.getBoundingClientRect(); setPos(((e.clientX - r.left) / r.width) * 100); } });
  window.addEventListener('touchmove', e => { if (drag) { const r = wrap.getBoundingClientRect(); setPos(((e.touches[0].clientX - r.left) / r.width) * 100); } }, { passive: true });

  setPos(50);
}

document.querySelectorAll('.ba-panel.active').forEach(initBA);

document.querySelectorAll('.ba-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    const idx = tab.dataset.tab;
    document.querySelectorAll('.ba-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.ba-panel').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    const panel = document.querySelector(`.ba-panel[data-panel="${idx}"]`);
    if (panel) { panel.classList.add('active'); initBA(panel); }
  });
});

/* TESTIMONIALS */
(function () {
  const track = document.getElementById('testiTrack');
  const dotsEl = document.getElementById('tDots');
  const prev = document.getElementById('tPrev');
  const next = document.getElementById('tNext');
  if (!track) return;

  const cards = track.querySelectorAll('.testi-card');
  let cur = 0, dots = [];

  function vis() { return window.innerWidth < 768 ? 1 : window.innerWidth < 1024 ? 2 : 3; }
  function pages() { return Math.ceil(cards.length / vis()); }

  function buildDots() {
    dotsEl.innerHTML = ''; dots = [];
    for (let i = 0; i < pages(); i++) {
      const d = document.createElement('div');
      d.className = 't-dot' + (i === cur ? ' active' : '');
      d.onclick = () => go(i);
      dotsEl.appendChild(d); dots.push(d);
    }
  }

  function go(page) {
    cur = (page + pages()) % pages();
    const v = vis(), off = cur * v, w = 100 / v, g = 1.5;
    track.style.transform = `translateX(calc(-${off * w}% - ${off * g / v}rem))`;
    dots.forEach((d, i) => d.classList.toggle('active', i === cur));
  }

  buildDots(); go(0);
  prev.onclick = () => go(cur - 1);
  next.onclick = () => go(cur + 1);

  let auto = setInterval(() => go(cur + 1), 5000);
  track.addEventListener('mouseenter', () => clearInterval(auto));
  track.addEventListener('mouseleave', () => { auto = setInterval(() => go(cur + 1), 5000); });
  window.addEventListener('resize', () => { buildDots(); go(0); });
})();

/* VIGILANCE */
(function () {
  const cfg = {
    vert:   { label: 'VERT',   desc: 'Pas de vigilance particulière',       ico: '✓',  pulse: '#22c55e', row: 'rowVert'   },
    jaune:  { label: 'JAUNE',  desc: 'Cyclone possible dans les 72h',       ico: '⚠',  pulse: '#f59e0b', row: 'rowJaune'  },
    orange: { label: 'ORANGE', desc: 'Cyclone probable dans les 24h',       ico: '⚡', pulse: '#f97316', row: 'rowOrange' },
    rouge:  { label: 'ROUGE',  desc: 'Cyclone imminent — restez chez vous', ico: '🔴', pulse: '#ef4444', row: 'rowRouge'  },
    violet: { label: 'VIOLET', desc: 'Passage du cyclone sur l\'île',       ico: '🌀', pulse: '#a855f7', row: 'rowViolet' },
  };

  function set(level) {
    const c = cfg[level] || cfg.vert;
    const badge = document.getElementById('vigBadge');
    if (!badge) return;
    badge.className = 'vig-badge ' + level;
    document.getElementById('vigIco').textContent   = c.ico;
    document.getElementById('vigLevel').textContent = c.label;
    document.getElementById('vigDesc').textContent  = c.desc;
    const pulse = document.getElementById('vigPulse');
    if (pulse) pulse.style.background = c.pulse;
    document.getElementById('vigDate').textContent =
      'Mis à jour le ' + new Date().toLocaleDateString('fr-FR', { day:'2-digit', month:'long', year:'numeric', hour:'2-digit', minute:'2-digit' });
    document.querySelectorAll('.vig-row').forEach(r => r.classList.remove('active'));
    document.getElementById(c.row)?.classList.add('active');
  }

  set('vert');
})();

/* CONTACT */
const form = document.getElementById('contactForm');
if (form) {
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    let ok = true;
    this.querySelectorAll('[required]').forEach(f => {
      f.style.borderColor = '';
      if (!f.value.trim()) { f.style.borderColor = '#ef4444'; ok = false; }
    });
    if (!ok) return;
    const btn = this.querySelector('button[type=submit]');
    btn.disabled = true; btn.textContent = 'Envoi…';
    setTimeout(() => document.getElementById('formSuccess').classList.add('show'), 1200);
  });
}

/* SMOOTH SCROLL */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const t = document.querySelector(a.getAttribute('href'));
    if (!t) return;
    e.preventDefault();
    window.scrollTo({ top: t.offsetTop - nav.offsetHeight - 12, behavior: 'smooth' });
  });
});

/* FAB */
const fab = document.getElementById('fab');
const contactSec = document.getElementById('contact');
if (fab && contactSec) {
  new IntersectionObserver(([e]) => {
    fab.style.opacity = e.isIntersecting ? '0' : '1';
    fab.style.pointerEvents = e.isIntersecting ? 'none' : 'auto';
  }).observe(contactSec);
}
