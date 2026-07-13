(function () {
  // Mobile nav toggle
  const navToggle = document.getElementById('navToggle');
  const mainNav = document.getElementById('mainNav');
  if (navToggle && mainNav) {
    navToggle.addEventListener('click', () => {
      const isOpen = mainNav.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', String(isOpen));
    });
    mainNav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        mainNav.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // Countdown to the special event date.
  // EDIT THIS to the real event date/time.
  const EVENT_DATE = new Date('2026-08-15T20:00:00');

  const daysEl = document.getElementById('cd-days');
  const hoursEl = document.getElementById('cd-hours');
  const minsEl = document.getElementById('cd-mins');
  const secsEl = document.getElementById('cd-secs');

  function pad(n) {
    return String(n).padStart(2, '0');
  }

  function updateCountdown() {
    if (!daysEl) return;
    const diff = EVENT_DATE.getTime() - Date.now();

    if (diff <= 0) {
      daysEl.textContent = hoursEl.textContent = minsEl.textContent = secsEl.textContent = '00';
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const mins = Math.floor((diff / (1000 * 60)) % 60);
    const secs = Math.floor((diff / 1000) % 60);

    daysEl.textContent = pad(days);
    hoursEl.textContent = pad(hours);
    minsEl.textContent = pad(mins);
    secsEl.textContent = pad(secs);
  }

  if (daysEl) {
    updateCountdown();
    setInterval(updateCountdown, 1000);
  }

  // Reservation form (demo only, no backend wired up)
  const reserveForm = document.getElementById('reserveForm');
  const formNote = document.getElementById('formNote');
  if (reserveForm) {
    reserveForm.addEventListener('submit', (e) => {
      e.preventDefault();
      formNote.textContent = '¡Listo! Te contactaremos para confirmar tu mesa.';
      reserveForm.reset();
    });
  }
})();
