(function () {
  const section = document.querySelector('.cinematic-section');
  if (!section) return;

  const heroText = section.querySelector('.cine-hero-text');
  const ctaLayer = section.querySelector('.cine-cta-layer');
  const mainCard = section.querySelector('.cine-main-card');
  const cardBrand = section.querySelector('.cine-card-brand');
  const mockupScale = section.querySelector('.cine-mockup-scale');
  const cardText = section.querySelector('.cine-card-text');
  const widgets = Array.from(section.querySelectorAll('.cine-widget-row'));
  const badges = Array.from(section.querySelectorAll('.cine-badge-item'));
  const ring = section.querySelector('.cine-progress-ring');
  const counter = section.querySelector('.cine-counter');
  const phone = section.querySelector('.cine-phone');
  const cardEl = section.querySelector('.cine-card');
  const scrollCue = section.querySelector('.cine-scroll-cue');

  const METRIC_VALUE = 777;
  const RING_CIRCUMFERENCE = 402;

  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }
  function lerp(a, b, t) {
    return a + (b - a) * t;
  }
  function localP(p, start, end) {
    return clamp((p - start) / (end - start), 0, 1);
  }
  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function reveal(el, p, inStart, inEnd, outStart, outEnd, transformFn) {
    let t;
    if (p < inStart) t = 0;
    else if (p < inEnd) t = localP(p, inStart, inEnd);
    else if (p < outStart) t = 1;
    else if (p < outEnd) t = 1 - localP(p, outStart, outEnd);
    else t = 0;
    el.style.opacity = String(t);
    if (transformFn) el.style.transform = transformFn(t);
    return t;
  }

  function isDesktop() {
    return window.innerWidth >= 1024;
  }

  function render(p) {
    // 1. Hero tagline fades/blurs away as the card starts rising
    const heroT = localP(p, 0.03, 0.22);
    heroText.style.opacity = String(1 - heroT);
    heroText.style.filter = `blur(${heroT * 16}px)`;
    heroText.style.transform = `scale(${lerp(1, 1.1, heroT)})`;
    heroText.style.pointerEvents = heroT > 0.5 ? 'none' : 'auto';

    // 2. Card slides up from below the fold
    const slideT = easeOutCubic(localP(p, 0.05, 0.35));
    const slideY = lerp(100, 0, slideT);

    // 3. Card grows to fullscreen, then later shrinks back before exiting
    const growT = localP(p, 0.35, 0.5);
    const shrinkT = localP(p, 0.82, 0.94);
    const restW = isDesktop() ? 85 : 92;
    const restH = isDesktop() ? 85 : 92;
    const restRadius = isDesktop() ? 40 : 32;
    let w, h, radius;
    if (p < 0.35) {
      w = 92; h = 92; radius = 32;
    } else if (p < 0.5) {
      w = lerp(92, 100, growT); h = lerp(92, 100, growT); radius = lerp(32, 0, growT);
    } else if (p < 0.82) {
      w = 100; h = 100; radius = 0;
    } else if (p < 0.94) {
      w = lerp(100, restW, shrinkT); h = lerp(100, restH, shrinkT); radius = lerp(0, restRadius, shrinkT);
    } else {
      w = restW; h = restH; radius = restRadius;
    }
    mainCard.style.width = w + 'vw';
    mainCard.style.height = h + 'vh';
    mainCard.style.borderRadius = radius + 'px';

    // 4. Final exit: whole card slides up and out
    const exitT = localP(p, 0.94, 1);
    const exitY = lerp(0, -120, exitT);
    const totalY = p < 0.5 ? slideY : exitY;
    mainCard.style.transform = `translate(-50%, ${totalY}vh)`;

    // 5. Inner content: staggered reveal, synced exit
    reveal(cardBrand, p, 0.5, 0.62, 0.8, 0.9, (t) => `translateY(${lerp(20, 0, t)}px)`);
    reveal(mockupScale, p, 0.42, 0.58, 0.8, 0.9, (t) => `scale(${lerp(0.85, 1, t)})`);
    reveal(cardText, p, 0.48, 0.6, 0.8, 0.9, (t) => `translateY(${lerp(20, 0, t)}px)`);
    widgets.forEach((w2, i) => {
      reveal(w2, p, 0.5 + i * 0.04, 0.62 + i * 0.04, 0.8, 0.9, (t) => `translateY(${lerp(20, 0, t)}px)`);
    });
    badges.forEach((b, i) => {
      reveal(b, p, 0.52 + i * 0.05, 0.66 + i * 0.05, 0.8, 0.9, (t) => `translateY(${lerp(30, 0, t)}px) scale(${lerp(0.85, 1, t)})`);
    });

    // 6. Progress ring + counter climb together
    const ringT = localP(p, 0.5, 0.72);
    if (ring) ring.style.strokeDashoffset = String(lerp(RING_CIRCUMFERENCE, 60, ringT));
    if (counter) counter.textContent = String(Math.round(lerp(0, METRIC_VALUE, ringT)));

    // 7. Scroll cue disappears once the story starts moving
    if (scrollCue) scrollCue.style.opacity = String(1 - localP(p, 0.02, 0.08));

    // 8. Closing CTA layer
    const ctaT = localP(p, 0.82, 0.96);
    ctaLayer.style.opacity = String(ctaT);
    ctaLayer.style.filter = `blur(${lerp(30, 0, ctaT)}px)`;
    ctaLayer.style.transform = `scale(${lerp(0.8, 1, ctaT)})`;
    ctaLayer.style.pointerEvents = ctaT > 0.5 ? 'auto' : 'none';
  }

  function getProgress() {
    const rect = section.getBoundingClientRect();
    const scrollable = section.offsetHeight - window.innerHeight;
    if (scrollable <= 0) return 0;
    const scrolled = -rect.top;
    return clamp(scrolled / scrollable, 0, 1);
  }

  let ticking = false;
  function onScroll() {
    render(getProgress());
    ticking = false;
  }
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(onScroll);
      ticking = true;
    }
  });
  window.addEventListener('resize', () => render(getProgress()));
  render(getProgress());

  // Mouse parallax: subtle phone tilt + card sheen, only while the section is in play
  const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (canHover && phone && cardEl) {
    document.addEventListener('mousemove', (e) => {
      const p = getProgress();
      if (p <= 0 || p >= 1) return;

      const rect = cardEl.getBoundingClientRect();
      cardEl.style.setProperty('--mx', `${e.clientX - rect.left}px`);
      cardEl.style.setProperty('--my', `${e.clientY - rect.top}px`);

      const xVal = (e.clientX / window.innerWidth - 0.5) * 2;
      const yVal = (e.clientY / window.innerHeight - 0.5) * 2;
      phone.style.transform = `rotateY(${xVal * 12}deg) rotateX(${-yVal * 12}deg)`;
    });
  }
})();
