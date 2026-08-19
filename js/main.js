// ETHOSPHERE — shared interactivity

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
