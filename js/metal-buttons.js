/* Kristyle — кнопки «жидкий металл».
   Металлический ободок рисует шейдер Paper Shaders (liquid metal).
   Если шейдер не загрузился или нет WebGL, остаётся серебряный градиент из CSS. */
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const SPEED = { idle: 0.6, hover: 1, click: 2.4 };

const buttons = [...document.querySelectorAll('.btn')];

// разметка: ободок, чёрная серединка, текст, слой для «волн» от клика
buttons.forEach(btn => {
  const label = document.createElement('span');
  label.className = 'lm-label';
  while (btn.firstChild) label.appendChild(btn.firstChild);
  const shader = document.createElement('span');
  shader.className = 'lm-shader';
  shader.setAttribute('aria-hidden', 'true');
  const inner = document.createElement('span');
  inner.className = 'lm-inner';
  inner.setAttribute('aria-hidden', 'true');
  const ripples = document.createElement('span');
  ripples.className = 'lm-ripples';
  ripples.setAttribute('aria-hidden', 'true');
  btn.append(shader, inner, label, ripples);

  let hovered = false;
  const setSpeed = v => { if (btn._mount?.setSpeed) btn._mount.setSpeed(reduced ? 0 : v); };

  btn.addEventListener('pointerenter', () => { hovered = true; setSpeed(SPEED.hover); });
  btn.addEventListener('pointerleave', () => { hovered = false; btn.classList.remove('is-pressed'); setSpeed(SPEED.idle); });
  btn.addEventListener('pointerdown', () => btn.classList.add('is-pressed'));
  btn.addEventListener('pointerup', () => btn.classList.remove('is-pressed'));
  btn.addEventListener('click', e => {
    setSpeed(SPEED.click);
    setTimeout(() => setSpeed(hovered ? SPEED.hover : SPEED.idle), 300);
    if (reduced) return;
    const r = btn.getBoundingClientRect();
    const dot = document.createElement('span');
    dot.className = 'lm-ripple';
    dot.style.left = (e.clientX - r.left) + 'px';
    dot.style.top = (e.clientY - r.top) + 'px';
    ripples.appendChild(dot);
    setTimeout(() => dot.remove(), 600);
  });
});

// шейдер подгружается отдельно, чтобы кнопки работали и без него
try {
  const { liquidMetalFragmentShader, ShaderMount } =
    await import('https://cdn.jsdelivr.net/npm/@paper-design/shaders@0.0.79/+esm');
  buttons.forEach(btn => {
    try {
      btn._mount = new ShaderMount(
        btn.querySelector('.lm-shader'),
        liquidMetalFragmentShader,
        {
          u_repetition: 4, u_softness: 0.5, u_shiftRed: 0.3, u_shiftBlue: 0.3,
          u_distortion: 0, u_contour: 0, u_angle: 45, u_scale: 8, u_shape: 1,
          u_offsetX: 0.1, u_offsetY: -0.1,
        },
        undefined,
        reduced ? 0 : SPEED.idle,
      );
    } catch (e) { /* без WebGL остаётся градиент */ }
  });
} catch (e) { /* CDN недоступен: остаётся градиент */ }
