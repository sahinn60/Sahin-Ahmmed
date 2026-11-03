(() => {
  'use strict';

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ---------- header state ---------- */
  const header = $('.site-header');
  const onScroll = () => {
    header.classList.toggle('is-scrolled', window.scrollY > 24);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- mobile menu ---------- */
  const menuToggle = $('.menu-toggle');
  const nav = $('.nav');
  const closeMenu = () => {
    document.body.classList.remove('menu-open');
    menuToggle.setAttribute('aria-expanded', 'false');
  };
  menuToggle.addEventListener('click', () => {
    const open = document.body.classList.toggle('menu-open');
    menuToggle.setAttribute('aria-expanded', String(open));
  });
  $$('a', nav).forEach((a) => a.addEventListener('click', closeMenu));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenu();
  });

  /* ---------- reveal on scroll ---------- */
  const revealEls = $$('[data-reveal]');
  if ('IntersectionObserver' in window && !reduced) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    revealEls.forEach((el, i) => {
      el.style.transitionDelay = `${(i % 3) * 90}ms`;
      io.observe(el);
    });
  } else {
    revealEls.forEach((el) => el.classList.add('is-in'));
  }

  /* ---------- active nav link ---------- */
  const sections = $$('main section[id]');
  if ('IntersectionObserver' in window) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        $$('.nav a').forEach((a) => {
          a.classList.toggle('is-active', a.getAttribute('href') === `#${entry.target.id}`);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach((s) => spy.observe(s));
  }

  /* ---------- work filters ---------- */
  const filters = $$('.filter');
  const cards = $$('.work-card');
  filters.forEach((btn) => {
    btn.addEventListener('click', () => {
      filters.forEach((b) => {
        b.classList.toggle('is-active', b === btn);
        b.setAttribute('aria-selected', String(b === btn));
      });
      const cat = btn.dataset.filter;
      cards.forEach((card) => {
        const hide = cat !== 'all' && card.dataset.cat !== cat;
        card.classList.toggle('is-hidden', hide);
        if (!hide && !reduced) {
          card.animate(
            [{ opacity: 0, transform: 'translateY(14px)' }, { opacity: 1, transform: 'none' }],
            { duration: 450, easing: 'cubic-bezier(.16,1,.3,1)' }
          );
        }
      });
    });
  });

  /* ---------- showreel modal ---------- */
  const modal = $('#reelModal');
  const video = $('#reelVideo');
  const openModal = () => {
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    if (video) {
      const playing = video.play();
      if (playing && playing.catch) playing.catch(() => {});
    }
  };
  const closeModal = () => {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    if (video) {
      video.pause();
      video.currentTime = 0;
    }
  };
  $$('[data-open-reel]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      openModal();
    });
  });
  $$('[data-close-reel]').forEach((el) => el.addEventListener('click', closeModal));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('is-open')) closeModal();
  });

  /* ---------- live clock (Dhaka) ---------- */
  const clock = $('#clock');
  const tick = () => {
    if (!clock) return;
    const now = new Date();
    const time = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Dhaka',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(now).replace(':', '.');
    clock.textContent = `${time} BST`;
  };
  tick();
  setInterval(tick, 15000);

  /* ---------- custom cursor + spark trail ---------- */
  if (finePointer && !reduced) {
    const dot = $('.cursor-dot');
    const trail = $('.cursor-trail');
    let mx = window.innerWidth / 2;
    let my = window.innerHeight / 2;
    let cx = mx;
    let cy = my;
    let lastSpark = 0;
    let cursorReady = false;

    window.addEventListener('mousemove', (e) => {
      mx = e.clientX;
      my = e.clientY;

      if (!cursorReady) {
        cursorReady = true;
        cx = mx;
        cy = my;
        dot.classList.add('is-ready');
      }

      const now = performance.now();
      if (now - lastSpark > 55) {
        lastSpark = now;
        const spark = document.createElement('span');
        spark.className = 'spark';
        spark.textContent = Math.random() > 0.55 ? '✦' : '·';
        const jitter = 10;
        spark.style.left = `${mx + (Math.random() - 0.5) * jitter}px`;
        spark.style.top = `${my + (Math.random() - 0.5) * jitter}px`;
        spark.style.fontSize = `${6 + Math.random() * 8}px`;
        spark.style.opacity = String(0.35 + Math.random() * 0.5);
        trail.appendChild(spark);
        spark.addEventListener('animationend', () => spark.remove());
      }
    }, { passive: true });

    const render = () => {
      cx += (mx - cx) * 0.22;
      cy += (my - cy) * 0.22;
      dot.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
      requestAnimationFrame(render);
    };
    render();

    const hoverables = 'a, button, .work-media, .tool, .filter';
    document.addEventListener('mouseover', (e) => {
      if (e.target.closest(hoverables)) dot.classList.add('is-hover');
    });
    document.addEventListener('mouseout', (e) => {
      if (e.target.closest(hoverables)) dot.classList.remove('is-hover');
    });
  }

  /* ---------- subtle hero parallax ---------- */
  if (!reduced && window.innerWidth > 980) {
    const portrait = $('.hero-portrait img');
    const watermark = $('.hero-watermark');
    let lastY = 0;
    window.addEventListener('scroll', () => {
      if (window.scrollY > window.innerHeight) return;
      lastY = window.scrollY;
      if (portrait) portrait.style.transform = `translateY(${lastY * 0.05}px)`;
      if (watermark) watermark.style.transform = `translateX(-46%) translateY(${lastY * 0.12}px)`;
    }, { passive: true });
  }
})();
