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
  '.service-card, .why-list li, .vig-action-card, .ba-slide, .section-header, .contact-info > *, .footer-col'
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
    after.style.clipPath    = `inset(0 ${100 - pct}% 0 0)`;
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

/* ── TESTIMONIALS CAROUSEL ───────────────────────────────────────────────── */
(function() {
  const track   = document.getElementById('testimonialsTrack');
  const cards   = track ? Array.from(track.querySelectorAll('.testimonial-card')) : [];
  const dotsEl  = document.getElementById('tDots');
  const prevBtn = document.getElementById('tPrev');
  const nextBtn = document.getElementById('tNext');
  if (!track || !cards.length) return;

  const visible = () => window.innerWidth < 768 ? 1 : window.innerWidth < 1024 ? 2 : 3;
  let current = 0;
  let dots = [];

  function buildDots() {
    dotsEl.innerHTML = '';
    dots = [];
    const pages = Math.ceil(cards.length / visible());
    for (let i = 0; i < pages; i++) {
      const d = document.createElement('div');
      d.className = 't-dot' + (i === 0 ? ' active' : '');
      d.addEventListener('click', () => goTo(i));
      dotsEl.appendChild(d);
      dots.push(d);
    }
  }

  function goTo(page) {
    const pages = Math.ceil(cards.length / visible());
    current = (page + pages) % pages;
    const offset = current * visible();
    track.style.transform = `translateX(calc(-${offset * (100 / visible())}% - ${offset * (1.5 / visible())}rem))`;
    dots.forEach((d, i) => d.classList.toggle('active', i === current));
  }

  track.style.transition = 'transform .5s cubic-bezier(.4,0,.2,1)';
  buildDots();

  prevBtn.addEventListener('click', () => goTo(current - 1));
  nextBtn.addEventListener('click', () => goTo(current + 1));

  let autoplay = setInterval(() => goTo(current + 1), 5000);
  track.addEventListener('mouseenter', () => clearInterval(autoplay));
  track.addEventListener('mouseleave', () => {
    autoplay = setInterval(() => goTo(current + 1), 5000);
  });

  window.addEventListener('resize', () => { buildDots(); goTo(0); });
})();

/* ── VIGILANCE WIDGET ────────────────────────────────────────────────────── */
(function() {
  const LEVELS = {
    vert:   { label: 'VERT',   desc: 'Pas de vigilance particulière',          icon: '✓',  pulse: '#22c55e' },
    jaune:  { label: 'JAUNE',  desc: 'Cyclone tropical possible dans les 72h', icon: '⚠',  pulse: '#f59e0b' },
    orange: { label: 'ORANGE', desc: 'Cyclone probable dans les 24h',          icon: '⚡', pulse: '#f97316' },
    rouge:  { label: 'ROUGE',  desc: 'Cyclone imminent — restez chez vous',    icon: '🔴', pulse: '#ef4444' },
    violet: { label: 'VIOLET', desc: 'Passage du cyclone sur l\'île',          icon: '🌀', pulse: '#a855f7' },
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
