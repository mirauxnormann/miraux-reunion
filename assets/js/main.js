'use strict';

/* ── NAV SCROLL ─────────────────────────────────────────────────────────── */
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 60);
}, { passive: true });

/* ── BURGER MENU ─────────────────────────────────────────────────────────── */
const burger = document.getElementById('burger');
const navLinks = document.getElementById('navLinks');
burger.addEventListener('click', () => {
  navLinks.classList.toggle('open');
  burger.classList.toggle('active');
});
navLinks.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => {
    navLinks.classList.remove('open');
    burger.classList.remove('active');
  });
});

/* ── SCROLL REVEAL ───────────────────────────────────────────────────────── */
const revealEls = document.querySelectorAll(
  '.svc-row, .svc-mini-card, .gallery-fig, .why-list li, .vig-action-card, .ba-slide, .section-header, .contact-info > *, .footer-col'
);
revealEls.forEach(el => el.classList.add('reveal'));

const io = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      const delay = e.target.dataset.delay || 0;
      setTimeout(() => e.target.classList.add('visible'), +delay);
      io.unobserve(e.target);
    }
  });
}, { threshold: 0.12 });

revealEls.forEach(el => io.observe(el));

/* ── BEFORE / AFTER SLIDER ──────────────────────────────────────────────── */
function initBaSlider(slide) {
  const wrapper = slide.querySelector('.ba-wrapper');
  const after   = slide.querySelector('.ba-after');
  const handle  = slide.querySelector('.ba-handle');
  const range   = slide.querySelector('.ba-range');
  if (!wrapper || !after || !handle || !range) return;

  function setPos(pct) {
    pct = Math.min(95, Math.max(5, pct));
    after.style.clipPath    = `inset(0 0 0 ${pct}%)`;
    handle.style.left       = pct + '%';
    range.value             = pct;
  }

  range.addEventListener('input', () => setPos(+range.value));

  let dragging = false;
  wrapper.addEventListener('mousedown',  () => dragging = true);
  wrapper.addEventListener('touchstart', () => dragging = true, { passive: true });
  window.addEventListener('mouseup',    () => dragging = false);
  window.addEventListener('touchend',   () => dragging = false);

  window.addEventListener('mousemove', (e) => {
    if (!dragging) return;
    const rect = wrapper.getBoundingClientRect();
    setPos(((e.clientX - rect.left) / rect.width) * 100);
  });
  window.addEventListener('touchmove', (e) => {
    if (!dragging) return;
    const rect = wrapper.getBoundingClientRect();
    setPos(((e.touches[0].clientX - rect.left) / rect.width) * 100);
  }, { passive: true });

  setPos(50);
}

document.querySelectorAll('.ba-slide').forEach(initBaSlider);

/* ── BA TABS ─────────────────────────────────────────────────────────────── */
document.querySelectorAll('.ba-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    const idx = tab.dataset.idx;
    document.querySelectorAll('.ba-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.ba-slide').forEach(s => s.classList.remove('active'));
    tab.classList.add('active');
    const slide = document.querySelector(`.ba-slide[data-idx="${idx}"]`);
    if (slide) {
      slide.classList.add('active');
      initBaSlider(slide);
    }
  });
});

/* Testimonials supprimés — remplacés par Carte & Météo */

/* ── VIGILANCE WIDGET ────────────────────────────────────────────────────── */
(function() {
  const LEVELS = {
    vert:   { label: 'VERT',   desc: 'Pas de vigilance particulière',          icon: '✓',  pulse: '#22c55e' },
    jaune:  { label: 'JAUNE',  desc: 'Cyclone tropical possible dans les 72h', icon: '⚠',  pulse: '#f59e0b' },
    orange: { label: 'ORANGE', desc: 'Cyclone probable dans les 24h',          icon: '⚡', pulse: '#f97316' },
    rouge:  { label: 'ROUGE',  desc: 'Cyclone imminent — restez chez vous',    icon: '!',  pulse: '#ef4444' },
    violet: { label: 'VIOLET', desc: 'Passage du cyclone sur l\'île',          icon: '~',  pulse: '#a855f7' },
  };

  function setVigilance(level) {
    const cfg = LEVELS[level] || LEVELS.vert;
    const badge   = document.getElementById('vigBadge');
    const lvlEl   = document.getElementById('vigLevel');
    const descEl  = document.getElementById('vigDesc');
    const iconEl  = badge.querySelector('.vig-icon');
    const pulse   = badge.parentElement.querySelector('.vig-pulse');
    const updateEl = document.getElementById('vigUpdate');

    badge.className = `vig-badge ${level}`;
    lvlEl.textContent  = cfg.label;
    descEl.textContent = cfg.desc;
    if (iconEl) iconEl.textContent = cfg.icon;
    if (pulse)  pulse.style.background = cfg.pulse;
    updateEl.textContent = `Mis à jour le ${new Date().toLocaleDateString('fr-FR', { day:'2-digit', month:'long', year:'numeric', hour:'2-digit', minute:'2-digit' })}`;

    document.querySelectorAll('.vig-item').forEach(el => el.classList.remove('active'));
    const active = document.getElementById(`lvl${level.charAt(0).toUpperCase() + level.slice(1)}`);
    if (active) active.classList.add('active');

    if (level === 'rouge' || level === 'violet') {
      document.getElementById('urgenceCard')?.classList.add('pulse-urgent');
    }
  }

  setVigilance('vert');
})();

/* ── CONTACT FORM ────────────────────────────────────────────────────────── */
document.getElementById('contactForm')?.addEventListener('submit', function(e) {
  e.preventDefault();
  const required = this.querySelectorAll('[required]');
  let valid = true;
  required.forEach(f => {
    f.style.borderColor = '';
    if (!f.value.trim()) {
      f.style.borderColor = '#ef4444';
      valid = false;
    }
  });
  if (!valid) return;

  const btn = this.querySelector('.btn');
  btn.disabled = true;
  btn.querySelector('.btn-text').textContent = 'Envoi en cours…';

  setTimeout(() => {
    document.getElementById('formSuccess').classList.add('show');
  }, 1200);
});

/* ── VIGILANCE CYCLONIQUE ────────────────────────────────────────────────── */
(function() {
  const LEVELS = {
    vert:   { label:'VERT',   desc:'Pas de vigilance particulière',       icon:'✓',  pulse:'#22c55e' },
    jaune:  { label:'JAUNE',  desc:'Cyclone possible dans les 72h',       icon:'⚠',  pulse:'#f59e0b' },
    orange: { label:'ORANGE', desc:'Cyclone probable dans les 24h',       icon:'⚡', pulse:'#f97316' },
    rouge:  { label:'ROUGE',  desc:'Cyclone imminent — restez chez vous', icon:'!',  pulse:'#ef4444' },
    violet: { label:'VIOLET', desc:'Passage du cyclone sur l\'île',       icon:'~',  pulse:'#a855f7' },
  };

  function setVigilance(level) {
    const cfg    = LEVELS[level] || LEVELS.vert;
    const badge  = document.getElementById('vigBadge');
    const pulse  = document.getElementById('vigPulse');
    if (!badge) return;

    badge.className = 'vig-inline-badge ' + level;
    const icon = badge.querySelector('.vig-icon');
    if (icon)  icon.textContent = cfg.icon;
    if (pulse) pulse.style.background = cfg.pulse;

    const lvlEl  = document.getElementById('vigLevel');
    const descEl = document.getElementById('vigDesc');
    const updEl  = document.getElementById('vigUpdate');
    if (lvlEl)  lvlEl.textContent  = cfg.label;
    if (descEl) descEl.textContent = cfg.desc;
    if (updEl)  updEl.textContent  = new Date().toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' });

    document.querySelectorAll('.vig-sdot').forEach(d => d.classList.remove('active'));
    const active = document.getElementById('lvl' + level.charAt(0).toUpperCase() + level.slice(1));
    if (active) active.classList.add('active');
  }

  setVigilance('vert');
})();

/* ── CHANTIERS EN COURS CAROUSEL ─────────────────────────────────────────── */
(function() {
  const track  = document.getElementById('chantierTrack');
  const dotsEl = document.getElementById('chantierDots');
  const prev   = document.getElementById('chantierPrev');
  const next   = document.getElementById('chantierNext');
  if (!track) return;

  const cards = track.querySelectorAll('.chantier-card');
  const total = cards.length;
  let idx = 0, startX = 0, isDragging = false;

  cards.forEach((_, i) => {
    const d = document.createElement('button');
    d.className = 'chantier-dot' + (i === 0 ? ' active' : '');
    d.setAttribute('aria-label', `Photo ${i + 1}`);
    d.addEventListener('click', () => goTo(i));
    dotsEl.appendChild(d);
  });

  function goTo(n) {
    idx = (n + total) % total;
    track.style.transform = `translateX(-${idx * 100}%)`;
    dotsEl.querySelectorAll('.chantier-dot').forEach((d, i) => d.classList.toggle('active', i === idx));
  }

  prev.addEventListener('click', () => goTo(idx - 1));
  next.addEventListener('click', () => goTo(idx + 1));

  track.addEventListener('touchstart', e => { startX = e.touches[0].clientX; isDragging = true; }, { passive: true });
  track.addEventListener('touchmove',  () => {}, { passive: true });
  track.addEventListener('touchend',   e => {
    if (!isDragging) return;
    isDragging = false;
    const diff = startX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) goTo(diff > 0 ? idx + 1 : idx - 1);
  });

  setInterval(() => goTo(idx + 1), 5000);
})();

/* ── SMOOTH ANCHOR LINKS ─────────────────────────────────────────────────── */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    const offset = navbar.offsetHeight + 16;
    window.scrollTo({ top: target.offsetTop - offset, behavior: 'smooth' });
  });
});

/* ── URGENCE FAB HIDE ON CONTACT ─────────────────────────────────────────── */
const fab = document.getElementById('urgenceFab');
if (fab) {
  const contactSection = document.getElementById('contact');
  new IntersectionObserver(([e]) => {
    fab.style.opacity = e.isIntersecting ? '0' : '1';
    fab.style.pointerEvents = e.isIntersecting ? 'none' : 'auto';
  }).observe(contactSection);
}
