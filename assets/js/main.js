'use strict';

/* ── NAV SCROLL ─────────────────────────────────────────────────────────── */
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 60);
}, { passive: true });

/* ── BURGER ──────────────────────────────────────────────────────────────── */
const burger   = document.getElementById('burger');
const navLinks = document.getElementById('navLinks');
burger.addEventListener('click', () => {
  navLinks.classList.toggle('open');
});
navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => navLinks.classList.remove('open')));

/* ── SCROLL REVEAL ───────────────────────────────────────────────────────── */
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    const d = +e.target.dataset.delay || 0;
    setTimeout(() => e.target.classList.add('visible'), d);
    io.unobserve(e.target);
  });
}, { threshold: .1 });

document.querySelectorAll('.svc-card, .why-list li, .vc-card, .t-card, .sec-head, .ba-cap, .f-col, .about-txt > *').forEach(el => {
  el.classList.add('reveal');
  io.observe(el);
});

/* ── BEFORE / AFTER ──────────────────────────────────────────────────────── */
function initBA(slide) {
  const wrap   = slide.querySelector('.ba-wrap');
  const after  = slide.querySelector('.ba-after');
  const handle = slide.querySelector('.ba-handle-el');
  const range  = slide.querySelector('.ba-range');
  if (!wrap) return;

  function setPos(pct) {
    pct = Math.min(95, Math.max(5, pct));
    after.style.clipPath  = `inset(0 ${100 - pct}% 0 0)`;
    handle.style.left     = pct + '%';
    range.value           = pct;
  }

  range.addEventListener('input', () => setPos(+range.value));

  let drag = false;
  const start = () => drag = true;
  const stop  = () => drag = false;
  const move  = (x) => {
    if (!drag) return;
    const r = wrap.getBoundingClientRect();
    setPos(((x - r.left) / r.width) * 100);
  };

  wrap.addEventListener('mousedown',  start);
  wrap.addEventListener('touchstart', start, { passive: true });
  window.addEventListener('mouseup',  stop);
  window.addEventListener('touchend', stop);
  window.addEventListener('mousemove', e => move(e.clientX));
  window.addEventListener('touchmove', e => move(e.touches[0].clientX), { passive: true });

  setPos(50);
}

document.querySelectorAll('.ba-slide').forEach(initBA);

document.querySelectorAll('.ba-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    const idx = tab.dataset.idx;
    document.querySelectorAll('.ba-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.ba-slide').forEach(s => s.classList.remove('active'));
    tab.classList.add('active');
    const slide = document.querySelector(`.ba-slide[data-idx="${idx}"]`);
    if (slide) { slide.classList.add('active'); initBA(slide); }
  });
});

/* ── TESTIMONIALS ────────────────────────────────────────────────────────── */
(function() {
  const track = document.getElementById('testiTrack');
  const dots  = document.getElementById('tDots');
  const prev  = document.getElementById('tPrev');
  const next  = document.getElementById('tNext');
  if (!track) return;

  const cards = track.querySelectorAll('.t-card');
  track.style.transition = 'transform .5s cubic-bezier(.4,0,.2,1)';
  let cur = 0;
  let dotEls = [];

  function vis() { return window.innerWidth < 768 ? 1 : window.innerWidth < 1024 ? 2 : 3; }
  function pages() { return Math.ceil(cards.length / vis()); }

  function buildDots() {
    dots.innerHTML = ''; dotEls = [];
    for (let i = 0; i < pages(); i++) {
      const d = document.createElement('div');
      d.className = 't-dot' + (i === cur ? ' active' : '');
      d.onclick = () => go(i);
      dots.appendChild(d); dotEls.push(d);
    }
  }

  function go(page) {
    cur = (page + pages()) % pages();
    const v   = vis();
    const off = cur * v;
    const w   = 100 / v;
    const g   = 1.5;
    track.style.transform = `translateX(calc(-${off * w}% - ${off * g / v}rem))`;
    dotEls.forEach((d, i) => d.classList.toggle('active', i === cur));
  }

  buildDots(); go(0);
  prev.onclick = () => go(cur - 1);
  next.onclick = () => go(cur + 1);

  let auto = setInterval(() => go(cur + 1), 5200);
  track.addEventListener('mouseenter', () => clearInterval(auto));
  track.addEventListener('mouseleave', () => { auto = setInterval(() => go(cur + 1), 5200); });
  window.addEventListener('resize', () => { buildDots(); go(0); });
})();

/* ── VIGILANCE ───────────────────────────────────────────────────────────── */
(function() {
  const cfg = {
    vert:   { label: 'VERT',   desc: 'Pas de vigilance particulière',          icon: '✓',  pulse: '#22c55e' },
    jaune:  { label: 'JAUNE',  desc: 'Cyclone possible dans les 72h',          icon: '⚠',  pulse: '#f59e0b' },
    orange: { label: 'ORANGE', desc: 'Cyclone probable dans les 24h',          icon: '⚡', pulse: '#f97316' },
    rouge:  { label: 'ROUGE',  desc: 'Cyclone imminent — restez chez vous',    icon: '🔴', pulse: '#ef4444' },
    violet: { label: 'VIOLET', desc: 'Passage du cyclone sur l\'île',          icon: '🌀', pulse: '#a855f7' },
  };

  function set(level) {
    const c = cfg[level] || cfg.vert;
    const badge = document.getElementById('vigBadge');
    const pulse = document.getElementById('vigPulse');
    if (!badge) return;
    badge.className = 'vig-badge ' + level;
    document.getElementById('vigIcon').textContent  = c.icon;
    document.getElementById('vigLevel').textContent = c.label;
    document.getElementById('vigDesc').textContent  = c.desc;
    if (pulse) pulse.style.background = c.pulse;
    document.getElementById('vigDate').textContent = `Mis à jour le ${new Date().toLocaleDateString('fr-FR', { day:'2-digit', month:'long', year:'numeric', hour:'2-digit', minute:'2-digit' })}`;
    document.querySelectorAll('.vrow').forEach(r => r.classList.remove('active'));
    const key = level.charAt(0).toUpperCase() + level.slice(1);
    document.getElementById('lvl' + key)?.classList.add('active');
  }
  set('vert');
})();

/* ── CONTACT FORM ────────────────────────────────────────────────────────── */
document.getElementById('contactForm')?.addEventListener('submit', function(e) {
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

/* ── SMOOTH SCROLL ───────────────────────────────────────────────────────── */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const t = document.querySelector(a.getAttribute('href'));
    if (!t) return;
    e.preventDefault();
    window.scrollTo({ top: t.offsetTop - navbar.offsetHeight - 16, behavior: 'smooth' });
  });
});

/* ── FAB HIDE IN CONTACT ─────────────────────────────────────────────────── */
const fab = document.getElementById('fab');
const contactSec = document.getElementById('contact');
if (fab && contactSec) {
  new IntersectionObserver(([e]) => {
    fab.style.opacity = e.isIntersecting ? '0' : '1';
    fab.style.pointerEvents = e.isIntersecting ? 'none' : 'auto';
  }).observe(contactSec);
}
