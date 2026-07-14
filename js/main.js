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

  function setDigit(el, value) {
    if (el.textContent === value) return;
    el.textContent = value;
    el.classList.remove('flip');
    // eslint-disable-next-line no-void
    void el.offsetWidth; // restart the animation
    el.classList.add('flip');
  }

  function updateCountdown() {
    if (!daysEl) return;
    const diff = EVENT_DATE.getTime() - Date.now();

    if (diff <= 0) {
      setDigit(daysEl, '00');
      setDigit(hoursEl, '00');
      setDigit(minsEl, '00');
      setDigit(secsEl, '00');
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const mins = Math.floor((diff / (1000 * 60)) % 60);
    const secs = Math.floor((diff / 1000) % 60);

    setDigit(daysEl, pad(days));
    setDigit(hoursEl, pad(hours));
    setDigit(minsEl, pad(mins));
    setDigit(secsEl, pad(secs));
  }

  if (daysEl) {
    updateCountdown();
    setInterval(updateCountdown, 1000);
  }

  // Tournament banner countdown (a rolling ~7h30m timer that loops)
  const bannerCd = document.getElementById('bannerCd');
  if (bannerCd) {
    let remaining = 7 * 3600 + 22 * 60 + 52; // 07h 22m 52s
    const tickBanner = () => {
      remaining = remaining <= 0 ? 7 * 3600 + 30 * 60 : remaining - 1;
      const h = Math.floor(remaining / 3600);
      const m = Math.floor((remaining % 3600) / 60);
      const s = remaining % 60;
      bannerCd.textContent = `${pad(h)}h : ${pad(m)}m : ${pad(s)}s`;
    };
    tickBanner();
    setInterval(tickBanner, 1000);
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
