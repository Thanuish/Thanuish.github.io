/* =========================================================
   Thanuish Kumar — AI Engineer Portfolio · Phase 1
   script.js  (vanilla JS, no dependencies)
   ========================================================= */
(() => {
  'use strict';

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch = window.matchMedia('(hover: none)').matches;

  /* ---------------------------------------------------------
     1. LOADING SCREEN — stealth boot sequence
     --------------------------------------------------------- */
  function bootSequence() {
    const loader = document.getElementById('loader');
    const lines = loader.querySelectorAll('.boot-line');
    document.body.classList.add('locked');

    if (prefersReduced) {
      finish();
      return;
    }

    loader.classList.add('run'); // starts progress bar
    const delays = [200, 900, 1500];
    lines.forEach((line, i) => setTimeout(() => line.classList.add('show'), delays[i]));

    setTimeout(finish, 2300);

    function finish() {
      loader.classList.add('done');
      document.body.classList.remove('locked');
      document.body.classList.add('ready'); // triggers hero reveal animations
      setTimeout(() => loader.remove(), 900);
    }
  }

  /* ---------------------------------------------------------
     2. FLOATING PARTICLES — lightweight canvas field
     --------------------------------------------------------- */
  function initParticles() {
    if (prefersReduced) return;
    const canvas = document.getElementById('particles');
    const ctx = canvas.getContext('2d');
    let w, h, particles, raf;

    const COUNT = () => Math.min(90, Math.floor((window.innerWidth * window.innerHeight) / 18000));
    const mouse = { x: -999, y: -999 };

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.width = window.innerWidth * dpr;
      h = canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      spawn();
    }

    function spawn() {
      particles = [];
      const n = COUNT();
      for (let i = 0; i < n; i++) {
        particles.push({
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
          vx: (Math.random() - 0.5) * 0.15,
          vy: -0.1 - Math.random() * 0.25,
          r: Math.random() * 1.6 + 0.4,
          a: Math.random() * 0.5 + 0.15
        });
      }
    }

    function tick() {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;

        // gentle mouse repulsion
        const dx = p.x - mouse.x, dy = p.y - mouse.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 120) {
          const f = (120 - dist) / 120 * 0.6;
          p.x += (dx / dist) * f;
          p.y += (dy / dist) * f;
        }

        // wrap
        if (p.y < -10) { p.y = window.innerHeight + 10; p.x = Math.random() * window.innerWidth; }
        if (p.x < -10) p.x = window.innerWidth + 10;
        if (p.x > window.innerWidth + 10) p.x = -10;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(150,180,255,${p.a})`;
        ctx.fill();
      }
      raf = requestAnimationFrame(tick);
    }

    window.addEventListener('resize', resize, { passive: true });
    if (!isTouch) {
      window.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true });
    }
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) cancelAnimationFrame(raf);
      else raf = requestAnimationFrame(tick);
    });

    resize();
    tick();
  }

  /* ---------------------------------------------------------
     3. MOUSE-FOLLOWING LIGHT
     --------------------------------------------------------- */
  function initCursorGlow() {
    if (prefersReduced || isTouch) return;
    const glow = document.getElementById('cursor-glow');
    let tx = window.innerWidth / 2, ty = window.innerHeight / 2;
    let cx = tx, cy = ty;

    window.addEventListener('mousemove', e => { tx = e.clientX; ty = e.clientY; }, { passive: true });

    (function follow() {
      cx += (tx - cx) * 0.12;
      cy += (ty - cy) * 0.12;
      glow.style.transform = `translate(${cx}px, ${cy}px) translate(-50%,-50%)`;
      requestAnimationFrame(follow);
    })();
  }

  /* ---------------------------------------------------------
     4. SCROLL REVEALS (IntersectionObserver)
     --------------------------------------------------------- */
  function initReveals() {
    const els = document.querySelectorAll('[data-reveal]');
    if (prefersReduced || !('IntersectionObserver' in window)) {
      els.forEach(el => el.classList.add('in'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
    els.forEach(el => io.observe(el));
  }

  /* ---------------------------------------------------------
     5. NAV state + scroll progress bar + hero parallax
     --------------------------------------------------------- */
  function initScrollFX() {
    const nav = document.getElementById('nav');
    const bar = document.getElementById('scroll-progress');
    const heroContent = document.querySelector('.hero__content');
    let ticking = false;

    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        nav.classList.toggle('scrolled', y > 24);
        const max = document.documentElement.scrollHeight - window.innerHeight;
        bar.style.width = (max > 0 ? (y / max) * 100 : 0) + '%';
        if (heroContent && !prefersReduced && y < window.innerHeight) {
          heroContent.style.transform = `translateY(${y * 0.18}px)`;
          heroContent.style.opacity = String(Math.max(0, 1 - y / (window.innerHeight * 0.8)));
        }
        ticking = false;
      });
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ---------------------------------------------------------
     6. MAGNETIC BUTTONS
     --------------------------------------------------------- */
  function initMagnetic() {
    if (prefersReduced || isTouch) return;
    document.querySelectorAll('[data-magnetic]').forEach(el => {
      const strength = 0.35;
      el.addEventListener('mousemove', e => {
        const r = el.getBoundingClientRect();
        const mx = e.clientX - (r.left + r.width / 2);
        const my = e.clientY - (r.top + r.height / 2);
        el.style.transform = `translate(${mx * strength}px, ${my * strength}px)`;
      });
      el.addEventListener('mouseleave', () => { el.style.transform = ''; });
    });
  }

  /* ---------------------------------------------------------
     7. Misc
     --------------------------------------------------------- */
  function initMisc() {
    const yr = document.getElementById('year');
    if (yr) yr.textContent = new Date().getFullYear();
  }

  /* ---------------------------------------------------------
     INIT
     --------------------------------------------------------- */
  document.addEventListener('DOMContentLoaded', () => {
    bootSequence();
    initParticles();
    initCursorGlow();
    initReveals();
    initScrollFX();
    initMagnetic();
    initMisc();
  });
})();
