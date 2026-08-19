// ETHOSPHERE — shared interactivity

// Hero slideshow images — swap/reorder here, nothing else needs to change.
// Each entry can be `{ type: 'image', src, alt }` or `{ type: 'video', src, poster }`.
const HERO_SLIDES = [
  { type: 'image', src: 'images/hero-temple-colonnade.jpg', alt: 'Golden-hour light through a sculpted stone temple corridor' },
  { type: 'image', src: 'images/hero-2-khajuraho-silhouette.jpg', alt: 'Temple spires in silhouette against a Khajuraho sunset' },
  { type: 'image', src: 'images/hero-3-thar-dunes.jpg', alt: 'Sunset over the dunes of the Thar Desert, Rajasthan' },
  { type: 'image', src: 'images/hero-4-diya-ritual.jpg', alt: 'Rows of diyas lit at dusk during a festival ritual' },
  { type: 'image', src: 'images/hero-5-ghats-sunset.jpg', alt: 'The ghats of Varanasi along the Ganges' },
];

function buildHeroSlideEl(slide) {
  const el = document.createElement('div');
  el.className = 'hero-slide';
  if (slide.type === 'video') {
    const v = document.createElement('video');
    v.src = slide.src;
    if (slide.poster) v.poster = slide.poster;
    v.autoplay = true;
    v.muted = true;
    v.loop = true;
    v.playsInline = true;
    el.appendChild(v);
  } else {
    const img = document.createElement('img');
    img.src = slide.src;
    img.alt = slide.alt || '';
    el.appendChild(img);
  }
  return el;
}

function initHeroSlideshow() {
  const viewport = document.getElementById('heroSlideshow');
  const track = document.getElementById('heroTrack');
  const prevBtn = document.getElementById('heroPrev');
  const nextBtn = document.getElementById('heroNext');
  const dotsWrap = document.getElementById('heroDots');
  if (!viewport || !track || HERO_SLIDES.length < 2) return;

  const AUTOPLAY_MS = 7000;
  const TRANSITION_MS = 900;

  // Build track as [lastClone, ...real slides..., firstClone] for seamless looping
  track.innerHTML = '';
  const lastClone = buildHeroSlideEl(HERO_SLIDES[HERO_SLIDES.length - 1]);
  lastClone.setAttribute('aria-hidden', 'true');
  track.appendChild(lastClone);
  HERO_SLIDES.forEach(slide => track.appendChild(buildHeroSlideEl(slide)));
  const firstClone = buildHeroSlideEl(HERO_SLIDES[0]);
  firstClone.setAttribute('aria-hidden', 'true');
  track.appendChild(firstClone);

  let realIndex = 0; // 0-based index into HERO_SLIDES
  let trackIndex = 1; // position in the track (offset by the prepended clone)
  let timer = null;

  // Dots
  const dots = HERO_SLIDES.map((_, i) => {
    const b = document.createElement('button');
    b.className = 'hero-dot';
    b.setAttribute('aria-label', 'Go to slide ' + (i + 1));
    b.addEventListener('click', () => goTo(i));
    dotsWrap.appendChild(b);
    return b;
  });

  function updateDots() {
    dots.forEach((d, i) => d.classList.toggle('is-active', i === realIndex));
  }

  function setTrackPosition(withTransition) {
    track.classList.toggle('is-snapping', !withTransition);
    track.style.transform = 'translateX(-' + (trackIndex * 100) + '%)';
  }

  function goToTrackIndex(newTrackIndex) {
    trackIndex = newTrackIndex;
    setTrackPosition(true);
  }

  function handleTransitionEnd() {
    // Wrapped past the last real slide onto the clone of the first — snap back silently
    if (trackIndex === HERO_SLIDES.length + 1) {
      trackIndex = 1;
      setTrackPosition(false);
    }
    // Wrapped past the first real slide onto the clone of the last — snap forward silently
    else if (trackIndex === 0) {
      trackIndex = HERO_SLIDES.length;
      setTrackPosition(false);
    }
  }
  track.addEventListener('transitionend', handleTransitionEnd);

  function next() {
    realIndex = (realIndex + 1) % HERO_SLIDES.length;
    goToTrackIndex(trackIndex + 1);
    updateDots();
  }

  function prev() {
    realIndex = (realIndex - 1 + HERO_SLIDES.length) % HERO_SLIDES.length;
    goToTrackIndex(trackIndex - 1);
    updateDots();
  }

  function goTo(index) {
    if (index === realIndex) return;
    realIndex = index;
    trackIndex = index + 1;
    goToTrackIndex(trackIndex);
    updateDots();
  }

  function startAutoplay() {
    stopAutoplay();
    timer = setInterval(next, AUTOPLAY_MS);
  }
  function stopAutoplay() {
    if (timer) clearInterval(timer);
    timer = null;
  }
  function restartAutoplay() {
    // Manual navigation pauses the current cycle, then a fresh one begins —
    // it never permanently kills autoplay.
    startAutoplay();
  }

  if (prevBtn) prevBtn.addEventListener('click', () => { prev(); restartAutoplay(); });
  if (nextBtn) nextBtn.addEventListener('click', () => { next(); restartAutoplay(); });

  // Pause while the tab is hidden so slides don't pile up transitions on return
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopAutoplay();
    else startAutoplay();
  });

  setTrackPosition(false);
  updateDots();
  startAutoplay();
}

function initEthosphere() {
  const header = document.querySelector('.site-header');
  const toggle = document.querySelector('.nav-toggle');
  const mobileNav = document.querySelector('.mobile-nav');
  const mobileClose = document.querySelector('.mobile-nav-close');

  // Header background on scroll
  const onScroll = () => {
    if (!header) return;
    if (window.scrollY > 40) header.classList.add('is-scrolled');
    else header.classList.remove('is-scrolled');
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // Mobile nav toggle
  if (toggle && mobileNav) {
    toggle.addEventListener('click', () => mobileNav.classList.add('is-open'));
  }
  if (mobileClose && mobileNav) {
    mobileClose.addEventListener('click', () => mobileNav.classList.remove('is-open'));
  }
  document.querySelectorAll('.mobile-nav a').forEach(a => {
    a.addEventListener('click', () => mobileNav.classList.remove('is-open'));
  });

  // Mark active nav link based on current page
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-main a, .mobile-nav a').forEach(a => {
    const href = a.getAttribute('href');
    if (href === path || (path === '' && href === 'index.html')) {
      a.classList.add('active');
    }
  });

  // Hero slideshow (only present on pages with a hero carousel)
  initHeroSlideshow();

  // Scroll reveal
  const revealEls = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window && revealEls.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('in-view'));
  }

  // Enquiry form — submit via fetch so we can show an inline thank-you
  // instead of redirecting to Formspree's own page
  const enquiryForm = document.getElementById('enquiryForm');
  if (enquiryForm) {
    const note = document.getElementById('enquiryFormNote');
    const success = document.getElementById('enquirySuccess');
    const submitBtn = enquiryForm.querySelector('button[type="submit"]');
    const noteDefault = note ? note.textContent : '';

    enquiryForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending…';
      if (note) { note.textContent = noteDefault; note.classList.remove('is-error'); }

      try {
        const res = await fetch(enquiryForm.action, {
          method: 'POST',
          body: new FormData(enquiryForm),
          headers: { 'Accept': 'application/json' },
        });
        if (res.ok) {
          enquiryForm.style.display = 'none';
          if (success) success.style.display = 'block';
        } else {
          throw new Error('Submission failed');
        }
      } catch (err) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send Enquiry';
        if (note) {
          note.textContent = 'Something went wrong sending that — please try again, or email us directly.';
          note.classList.add('is-error');
        }
      }
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initEthosphere);
} else {
  // DOMContentLoaded already fired (e.g. script loaded/ran after parsing finished) —
  // run immediately instead of waiting for an event that will never come.
  initEthosphere();
}
