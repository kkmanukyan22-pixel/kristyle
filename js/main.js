/* Kristyle — анимации и интерактив */
(() => {
  const NS = 'http://www.w3.org/2000/svg';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(pointer: fine)').matches;

  /* ---------- звёзды-блики ---------- */
  // фильтр «рваного» края, как у нарисованных от руки звёзд
  const defs = document.createElementNS(NS, 'svg');
  defs.setAttribute('width', 0); defs.setAttribute('height', 0);
  defs.setAttribute('aria-hidden', 'true');
  defs.style.position = 'absolute';
  defs.innerHTML = '<filter id="rough"><feTurbulence type="fractalNoise" baseFrequency=".06" numOctaves="2" seed="3"/><feDisplacementMap in="SourceGraphic" scale="5"/></filter>';
  document.body.prepend(defs);

  function starPath(n, R, r) {
    let d = '';
    for (let i = 0; i < n * 2; i++) {
      const a = Math.PI * i / n - Math.PI / 2, rad = i % 2 ? r : R;
      d += (i ? 'L' : 'M') + (50 + Math.cos(a) * rad).toFixed(1) + ' ' + (50 + Math.sin(a) * rad).toFixed(1);
    }
    return d + 'Z';
  }
  function makeStar(n = 4, cls = '') {
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 100 100');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('class', ('star ' + cls).trim());
    const p = document.createElementNS(NS, 'path');
    p.setAttribute('d', starPath(n, 48, n === 4 ? 10 : 14));
    p.setAttribute('filter', 'url(#rough)');
    svg.appendChild(p);
    return svg;
  }
  // <i data-star="4" data-cls="twinkle"></i> → svg-звезда
  document.querySelectorAll('[data-star]').forEach(el => {
    el.replaceWith(makeStar(+el.dataset.star || 4, el.dataset.cls || ''));
  });

  /* ---------- название на первом экране ---------- */
  const wm = document.querySelector('.wordmark');
  if (wm) {
    const text = wm.textContent.trim();
    wm.setAttribute('aria-label', text);
    wm.textContent = '';
    [...text].forEach((ch, i) => {
      const s = document.createElement('span');
      s.setAttribute('aria-hidden', 'true');
      s.textContent = ch;
      s.style.transitionDelay = (0.35 + i * 0.06) + 's';
      if (i === 2) { s.className = 'i'; s.appendChild(makeStar(4, 'twinkle')); }
      // data-break="3": перенос строки после третьей буквы (KRI / STYLE)
      if (wm.dataset.break && i === +wm.dataset.break) { const br = document.createElement('i'); br.className = 'wm-break'; wm.appendChild(br); }
      wm.appendChild(s);
    });
  }
  // «Русская сказка»: оба слова растягиваются на всю ширину, матрёшка по высоте текста
  const tale = document.querySelector('.tale-title');
  if (tale) {
    const fit = () => {
      tale.querySelectorAll('span').forEach(w => {
        w.style.fontSize = '';
        const k = tale.clientWidth / w.scrollWidth;
        w.style.fontSize = (parseFloat(getComputedStyle(w).fontSize) * k * .98) + 'px';
      });
      const h = tale.offsetHeight;
      tale.parentElement.style.setProperty('--dh', h * 1.3 + 'px');
      tale.parentElement.style.paddingBlock = h * .15 + 'px';
    };
    (document.fonts ? document.fonts.ready : Promise.resolve()).then(fit);
    addEventListener('resize', fit);
  }

  // подсветка за курсором на цветной обложке
  document.querySelectorAll('[data-spot]').forEach(el => {
    el.addEventListener('pointermove', e => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      el.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });

  const hero = document.querySelector('.hero');
  if (hero) requestAnimationFrame(() => requestAnimationFrame(() => hero.classList.add('in')));

  /* ---------- шапка: цвет по секции под ней, прячется при прокрутке вниз ---------- */
  const header = document.querySelector('.header');
  const themed = [...document.querySelectorAll('[data-theme]')];
  let lastY = scrollY;
  function updateHeader() {
    const y = scrollY;
    const probe = 34;
    const sec = themed.find(s => { const r = s.getBoundingClientRect(); return r.top <= probe && r.bottom > probe; });
    const theme = sec ? sec.dataset.theme : 'black';
    header.classList.toggle('on-red', theme === 'red');
    header.classList.toggle('solid', theme !== 'red');
    const open = document.body.classList.contains('menu-open');
    header.classList.toggle('hide', !open && y > lastY && y > 300);
    lastY = y;
  }
  if (header) { addEventListener('scroll', updateHeader, { passive: true }); updateHeader(); }

  /* ---------- мобильное меню ---------- */
  const burger = document.querySelector('.burger');
  if (burger) {
    const toggle = force => {
      const open = document.body.classList.toggle('menu-open', force);
      burger.setAttribute('aria-expanded', open);
      document.body.style.overflow = open ? 'hidden' : '';
    };
    burger.addEventListener('click', () => toggle());
    document.querySelectorAll('.nav a').forEach(a => a.addEventListener('click', () => toggle(false)));
    addEventListener('keydown', e => { if (e.key === 'Escape') toggle(false); });
  }

  /* ---------- появление блоков при прокрутке ---------- */
  const io = new IntersectionObserver(entries => entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.reveal').forEach(el => {
    const sibs = [...el.parentElement.children].filter(c => c.classList.contains('reveal'));
    el.style.transitionDelay = (sibs.indexOf(el) % 4) * 0.1 + 's';
    io.observe(el);
  });

  /* ---------- блики за курсором на красных экранах ---------- */
  if (finePointer && !reduced) {
    document.querySelectorAll('[data-glints]').forEach(area => {
      let last = 0;
      area.addEventListener('pointermove', e => {
        const t = performance.now();
        if (t - last < 55) return;
        last = t;
        const r = area.getBoundingClientRect();
        const g = makeStar(4, 'glint');
        g.style.color = Math.random() < 0.35 ? '#000' : '#D1C0A6';
        g.style.left = (e.clientX - r.left - 9) + 'px';
        g.style.top = (e.clientY - r.top - 9) + 'px';
        area.appendChild(g);
        setTimeout(() => g.remove(), 900);
      });
    });
  }

  /* ---------- галерея кейса: просмотр на весь экран ---------- */
  const gallery = document.querySelector('.gallery');
  if (gallery) {
    const items = [...gallery.querySelectorAll('button')];
    const lb = document.createElement('div');
    lb.className = 'lightbox';
    lb.setAttribute('role', 'dialog');
    lb.setAttribute('aria-modal', 'true');
    lb.setAttribute('aria-label', 'Просмотр фото');
    lb.innerHTML = '<div class="lb-stage"></div><button class="lb-close" aria-label="Закрыть">✕</button><button class="lb-prev" aria-label="Предыдущее фото">←</button><button class="lb-next" aria-label="Следующее фото">→</button><div class="lb-count"></div>';
    document.body.appendChild(lb);
    const stage = lb.querySelector('.lb-stage'), count = lb.querySelector('.lb-count');
    let idx = 0, opener = null;
    const show = i => {
      idx = (i + items.length) % items.length;
      const img = items[idx].querySelector('img');
      stage.innerHTML = '';
      if (img) {
        const big = new Image();
        big.src = img.dataset.full || img.src;
        big.alt = img.alt;
        stage.appendChild(big);
      } else {
        const ph = items[idx].querySelector('.ph').cloneNode(true);
        ph.classList.add('lb-ph');
        stage.appendChild(ph);
      }
      count.textContent = (idx + 1) + ' / ' + items.length;
    };
    const open = i => { opener = document.activeElement; show(i); lb.classList.add('open'); document.body.style.overflow = 'hidden'; lb.querySelector('.lb-close').focus(); };
    const close = () => { lb.classList.remove('open'); document.body.style.overflow = ''; if (opener) opener.focus(); };
    items.forEach((b, i) => b.addEventListener('click', () => open(i)));
    lb.querySelector('.lb-close').addEventListener('click', close);
    lb.querySelector('.lb-prev').addEventListener('click', () => show(idx - 1));
    lb.querySelector('.lb-next').addEventListener('click', () => show(idx + 1));
    lb.addEventListener('click', e => { if (e.target === lb || e.target === stage) close(); });
    addEventListener('keydown', e => {
      if (!lb.classList.contains('open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') show(idx - 1);
      if (e.key === 'ArrowRight') show(idx + 1);
    });
    let x0 = null;
    lb.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', e => {
      if (x0 === null) return;
      const dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 50) show(idx + (dx < 0 ? 1 : -1));
      x0 = null;
    });
  }

  /* ---------- форма заявки ---------- */
  // Заявки отправляются на адрес из data-endpoint у формы (сейчас FormSubmit → почта).
  const form = document.querySelector('.form');
  if (form) {
    const msg = form.querySelector('.form-msg');
    form.addEventListener('submit', async e => {
      e.preventDefault();
      if (!form.reportValidity()) return;
      const endpoint = form.dataset.endpoint;
      if (!endpoint) {
        msg.textContent = 'Форма пока не подключена. Напишите, пожалуйста, в Telegram.';
        return;
      }
      msg.textContent = 'Отправляю…';
      try {
        const res = await fetch(endpoint, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } });
        if (!res.ok) throw new Error(res.status);
        form.reset();
        msg.innerHTML = 'Спасибо! Заявка отправлена, я свяжусь с вами удобным способом. Если ответа нет в течение двух дней, напишите мне в <a href="https://t.me/youcancallmekris" target="_blank" rel="noopener">Telegram</a> или по любому из контактов выше.';
      } catch {
        msg.textContent = 'Не получилось отправить. Напишите, пожалуйста, в Telegram.';
      }
    });
  }

  /* ---------- год в подвале ---------- */
  document.querySelectorAll('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });
})();
