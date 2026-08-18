// Ethosphere — shared site behavior

document.addEventListener('DOMContentLoaded', () => {
  const header = document.getElementById('siteHeader');
  const toggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');

  if (toggle && navLinks) {
    toggle.addEventListener('click', () => {
      navLinks.classList.toggle('is-open');
    });
  }

  if (header && header.classList.contains('has-hero')) {
    const onScroll = () => {
      if (window.scrollY > 80) {
        header.classList.add('is-scrolled');
      } else {
        header.classList.remove('is-scrolled');
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }
});
