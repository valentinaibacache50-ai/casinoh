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
  // Two-tone purple wheel (deep violet + pale lavender), alternating.
  const COLORS = ['#3d1f7a', '#c9b0ec'];
  // Text color per slice tone: white on the dark violet, deep violet on lavender.
  const TEXT_COLORS = ['#f4ecd8', '#2a1150'];

  let currentRotation = 0;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function drawWheel(now) {
    now = now || 0;
    ctx.clearRect(0, 0, SIZE, SIZE);

    // outer gold rim + dark bezel behind the slices
    ctx.beginPath();
    ctx.arc(CENTER, CENTER, RADIUS - 2, 0, Math.PI * 2);
    ctx.fillStyle = '#1a0f33';
    ctx.fill();

    ctx.save();
    ctx.translate(CENTER, CENTER);
    ctx.rotate(currentRotation);

    const rSlice = RADIUS - 22;

    PRIZES.forEach((prize, i) => {
      const start = i * SLICE_ANGLE;
      const end = start + SLICE_ANGLE;
      const tone = i % 2;

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, rSlice, start, end);
      ctx.closePath();
      // subtle radial shading (a touch lighter toward the rim, like the ref)
      const grad = ctx.createRadialGradient(0, 0, rSlice * 0.15, 0, 0, rSlice);
      grad.addColorStop(0, shade(COLORS[tone], 0.9));
      grad.addColorStop(1, shade(COLORS[tone], 1.08));
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.12)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // label
      ctx.save();
      ctx.rotate(start + SLICE_ANGLE / 2);
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = TEXT_COLORS[tone];
      ctx.font = '20px sans-serif';
      ctx.fillText(prize.icon, rSlice - 16, 0);
      ctx.font = '700 12px Poppins, sans-serif';
      ctx.fillText(prize.label, rSlice - 40, 0);
      ctx.restore();
    });

    ctx.restore();

    // gold rim ring
    ctx.beginPath();
    ctx.arc(CENTER, CENTER, rSlice + 2, 0, Math.PI * 2);
    ctx.lineWidth = 8;
    const rimGrad = ctx.createLinearGradient(0, 0, SIZE, SIZE);
    rimGrad.addColorStop(0, '#ffe9a8');
    rimGrad.addColorStop(0.5, '#c99a2e');
    rimGrad.addColorStop(1, '#ffe9a8');
    ctx.strokeStyle = rimGrad;
    ctx.stroke();

    // marquee bulbs sit on the gold rim with a chasing blink pattern
    const BULB_COUNT = PRIZES.length * 2;
    const BULB_RADIUS = rSlice + 2;
    const chase = reduceMotion ? -1 : Math.floor(now / 90) % BULB_COUNT;
    for (let i = 0; i < BULB_COUNT; i++) {
      const angle = (i / BULB_COUNT) * Math.PI * 2 - Math.PI / 2;
      const bx = CENTER + Math.cos(angle) * BULB_RADIUS;
      const by = CENTER + Math.sin(angle) * BULB_RADIUS;
      const lit = reduceMotion ? true : (i % 2 === (Math.floor(now / 300) % 2));
      const isChase = i === chase;
      ctx.beginPath();
      ctx.arc(bx, by, isChase ? 4.5 : 3.2, 0, Math.PI * 2);
      ctx.fillStyle = isChase ? '#ffffff' : (lit ? '#fff4d6' : '#6b5a9a');
      ctx.shadowColor = 'rgba(255,255,255,0.9)';
      ctx.shadowBlur = (isChase || lit) ? 9 : 0;
      ctx.fill();
    }
    ctx.shadowBlur = 0;
  }

  // Lighten/darken a hex color by a factor (>1 lighter, <1 darker)
  function shade(hex, factor) {
    const n = parseInt(hex.slice(1), 16);
    let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    r = Math.min(255, Math.round(r * factor));
    g = Math.min(255, Math.round(g * factor));
    b = Math.min(255, Math.round(b * factor));
    return `rgb(${r},${g},${b})`;
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

  // Smoother, more dramatic deceleration than plain cubic.
  function easeOutQuint(t) {
    return 1 - Math.pow(1 - t, 5);
  }

  let spinning = false;

  function spinToIndex(prizeIndex, onDone) {
    const targetSliceCenter = prizeIndex * SLICE_ANGLE + SLICE_ANGLE / 2;
    // Pointer is fixed at the top (angle = -PI/2 in canvas space).
    // We rotate the wheel so the chosen slice ends up under the pointer.
    const pointerAngle = -Math.PI / 2;
    const extraSpins = Math.PI * 2 * (7 + Math.floor(Math.random() * 3));
    const normalizedCurrent = currentRotation % (Math.PI * 2);
    const targetRotation =
      currentRotation - normalizedCurrent + extraSpins + (pointerAngle - targetSliceCenter);

    const startRotation = currentRotation;
    const delta = targetRotation - startRotation;
    const duration = reduceMotion ? 600 : 5200;
    const anticipation = reduceMotion ? 0 : 0.06; // small wind-up backspin
    const startTime = performance.now();
    spinning = true;

    function frame(now) {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      // brief backward wind-up in the first 8% of the animation
      let eased;
      if (t < 0.08 && anticipation > 0) {
        const wt = t / 0.08;
        eased = -anticipation * Math.sin(wt * Math.PI);
      } else {
        eased = easeOutQuint(t);
      }
      currentRotation = startRotation + delta * eased;
      drawWheel(now);

      if (t < 1) {
        requestAnimationFrame(frame);
      } else {
        currentRotation = targetRotation;
        spinning = false;
        onDone();
      }
    }

    requestAnimationFrame(frame);
  }

  // Idle loop: keeps the marquee bulbs blinking while the wheel is at rest.
  function idleTick(now) {
    if (!spinning) drawWheel(now);
    requestAnimationFrame(idleTick);
  }
  if (!reduceMotion) requestAnimationFrame(idleTick);

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
  drawWheel(0);
  const stored = getStoredSpin();
  if (stored) {
    hint.textContent = stored.code
      ? `Ya jugaste hoy. Tu premio: ${stored.prizeLabel} — código ${stored.code}`
      : 'Ya jugaste hoy. ¡Volvé mañana para intentar de nuevo!';
  }
})();
