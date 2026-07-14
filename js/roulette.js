(function () {
  const canvas = document.getElementById('wheelCanvas');
  if (!canvas) return; // roulette only lives on index.html

  const ctx = canvas.getContext('2d');
  const spinBtn = document.getElementById('spinBtn');
  const hint = document.getElementById('rouletteHint');

  const modal = document.getElementById('prizeModal');
  const modalPrizeText = document.getElementById('modalPrizeText');
  const promoCodeBox = document.getElementById('promoCodeBox');
  const promoCodeEl = document.getElementById('promoCode');
  const copyBtn = document.getElementById('copyCodeBtn');
  const modalClose = document.getElementById('modalClose');
  const modalCloseBtn = document.getElementById('modalCloseBtn');

  const SIZE = canvas.width;
  const CENTER = SIZE / 2;
  const RADIUS = SIZE / 2;

  // Editable prize table. "weight" controls how often each prize is won,
  // it does not need to match the visual slice size.
  const PRIZES = [
    { label: '10% OFF',          icon: '💵', weight: 20, prefix: 'CASINO10' },
    { label: 'Papas Gratis',     icon: '🍟', weight: 18, prefix: 'FRIES' },
    { label: 'Bebida Gratis',    icon: '🥤', weight: 18, prefix: 'DRINK' },
    { label: '20% OFF',          icon: '💰', weight: 12, prefix: 'CASINO20' },
    { label: 'Postre Gratis',    icon: '🍰', weight: 12, prefix: 'DESSERT' },
    { label: '2x1 en Combo',     icon: '🍔', weight: 10, prefix: 'COMBO2X1' },
    { label: 'Sigue Intentando', icon: '🎲', weight: 20, prefix: null },
    { label: 'JACKPOT 30% OFF',  icon: '👑', weight: 5,  prefix: 'JACKPOT30' },
  ];

  const SLICE_ANGLE = (Math.PI * 2) / PRIZES.length;
  // Rich wheel-of-fortune palette: one distinct color per slice.
  const COLORS = ['#e63946', '#f4a300', '#1d3557', '#2a9d8f', '#d81159', '#111015', '#8338ec', '#e8c766'];

  let currentRotation = 0;

  function drawWheel() {
    ctx.clearRect(0, 0, SIZE, SIZE);
    ctx.save();
    ctx.translate(CENTER, CENTER);
    ctx.rotate(currentRotation);

    PRIZES.forEach((prize, i) => {
      const start = i * SLICE_ANGLE;
      const end = start + SLICE_ANGLE;

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, RADIUS - 6, start, end);
      ctx.closePath();
      ctx.fillStyle = COLORS[i % COLORS.length];
      ctx.fill();
      ctx.strokeStyle = 'rgba(232,199,102,0.5)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // label
      ctx.save();
      ctx.rotate(start + SLICE_ANGLE / 2);
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#f4ecd8';
      ctx.font = '20px sans-serif';
      ctx.fillText(prize.icon, RADIUS - 20, 0);
      ctx.font = 'bold 12px Poppins, sans-serif';
      ctx.fillText(prize.label, RADIUS - 44, 0);
      ctx.restore();
    });

    ctx.restore();

    // marquee bulbs around the rim (fixed, do not spin with the wheel)
    const BULB_COUNT = 16;
    const BULB_RADIUS = RADIUS - 16;
    for (let i = 0; i < BULB_COUNT; i++) {
      const angle = (i / BULB_COUNT) * Math.PI * 2;
      const bx = CENTER + Math.cos(angle) * BULB_RADIUS;
      const by = CENTER + Math.sin(angle) * BULB_RADIUS;
      ctx.beginPath();
      ctx.arc(bx, by, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#ffe9a8';
      ctx.shadowColor = 'rgba(255, 223, 128, 0.9)';
      ctx.shadowBlur = 6;
      ctx.fill();
    }
    ctx.shadowBlur = 0;

    // hub
    ctx.beginPath();
    ctx.arc(CENTER, CENTER, 14, 0, Math.PI * 2);
    ctx.fillStyle = '#e8c766';
    ctx.fill();
  }

  function pickPrizeIndex() {
    const total = PRIZES.reduce((sum, p) => sum + p.weight, 0);
    let roll = Math.random() * total;
    for (let i = 0; i < PRIZES.length; i++) {
      roll -= PRIZES[i].weight;
      if (roll <= 0) return i;
    }
    return PRIZES.length - 1;
  }

  function generateCode(prefix) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let suffix = '';
    for (let i = 0; i < 4; i++) {
      suffix += chars[Math.floor(Math.random() * chars.length)];
    }
    return `${prefix}-${suffix}`;
  }

  function todayKey() {
    return new Date().toISOString().slice(0, 10);
  }

  function getStoredSpin() {
    try {
      const raw = localStorage.getItem('jackpotSpin');
      if (!raw) return null;
      const data = JSON.parse(raw);
      return data.date === todayKey() ? data : null;
    } catch (e) {
      return null;
    }
  }

  function storeSpin(data) {
    try {
      localStorage.setItem('jackpotSpin', JSON.stringify({ ...data, date: todayKey() }));
    } catch (e) {
      /* localStorage unavailable, ignore */
    }
  }

  function showModal(prizeIndex, code) {
    const prize = PRIZES[prizeIndex];
    modalPrizeText.textContent = `${prize.icon} ${prize.label}`;

    if (code) {
      promoCodeBox.hidden = false;
      promoCodeEl.textContent = code;
    } else {
      promoCodeBox.hidden = true;
    }

    modal.hidden = false;
  }

  function closeModal() {
    modal.hidden = true;
  }

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function spinToIndex(prizeIndex, onDone) {
    const targetSliceCenter = prizeIndex * SLICE_ANGLE + SLICE_ANGLE / 2;
    // Pointer is fixed at the top (angle = -PI/2 in canvas space).
    // We rotate the wheel so the chosen slice ends up under the pointer.
    const pointerAngle = -Math.PI / 2;
    const extraSpins = Math.PI * 2 * (5 + Math.floor(Math.random() * 2));
    const normalizedCurrent = currentRotation % (Math.PI * 2);
    const targetRotation =
      currentRotation - normalizedCurrent + extraSpins + (pointerAngle - targetSliceCenter);

    const startRotation = currentRotation;
    const delta = targetRotation - startRotation;
    const duration = 4200;
    const startTime = performance.now();

    function frame(now) {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      currentRotation = startRotation + delta * easeOutCubic(t);
      drawWheel();

      if (t < 1) {
        requestAnimationFrame(frame);
      } else {
        onDone();
      }
    }

    requestAnimationFrame(frame);
  }

  function handleSpin() {
    const stored = getStoredSpin();
    if (stored) {
      hint.textContent = stored.code
        ? `Ya jugaste hoy. Tu premio: ${stored.prizeLabel} — código ${stored.code}`
        : 'Ya jugaste hoy. ¡Volvé mañana para intentar de nuevo!';
      showModal(stored.prizeIndex, stored.code);
      return;
    }

    spinBtn.disabled = true;
    hint.textContent = 'Girando...';

    const prizeIndex = pickPrizeIndex();
    const prize = PRIZES[prizeIndex];
    const code = prize.prefix ? generateCode(prize.prefix) : null;

    spinToIndex(prizeIndex, () => {
      storeSpin({ prizeIndex, prizeLabel: prize.label, code });
      showModal(prizeIndex, code);
      hint.textContent = code
        ? `¡Ganaste! Mostrá el código ${code} en caja.`
        : 'Sin premio esta vez. ¡Volvé mañana!';
      spinBtn.disabled = false;
    });
  }

  copyBtn.addEventListener('click', () => {
    const text = promoCodeEl.textContent;
    navigator.clipboard.writeText(text).then(() => {
      copyBtn.textContent = '¡Copiado!';
      setTimeout(() => (copyBtn.textContent = 'Copiar'), 1500);
    });
  });

  modalClose.addEventListener('click', closeModal);
  modalCloseBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  spinBtn.addEventListener('click', handleSpin);

  // initial paint + resume "already played today" state
  drawWheel();
  const stored = getStoredSpin();
  if (stored) {
    hint.textContent = stored.code
      ? `Ya jugaste hoy. Tu premio: ${stored.prizeLabel} — código ${stored.code}`
      : 'Ya jugaste hoy. ¡Volvé mañana para intentar de nuevo!';
  }
})();
