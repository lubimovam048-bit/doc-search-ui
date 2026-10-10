/**
 * Кольцо документов на стартовом экране.
 * Карточки стоят на цилиндре, камера в его центре: 3D-перспектива, а не плоская карусель.
 * При burst() листы подбрасывает взрывом воздуха: они кувыркаются в 3D, замедляются, падают и гаснут.
 */

export interface RingItem {
  title: string;
  page: string;
  kind: 'PDF' | 'XLS';
  before?: string;
  frag?: string;
  after?: string;
  /** Для таблиц: заголовок, строки и номер подсвеченной строки. */
  table?: { head: string[]; rows: string[][]; hl: number };
}

export interface DocRing {
  burst: () => void;
  destroy: () => void;
}

const CARD_W = 150;
const CARD_H = 212;
const DESIGN_W = 1196;
const N = 30; // карточек в кольце
const STEP = 360 / N;
const CULL = 50; // дальше этого угла карточки не рисуем
const DRIFT = 2.6; // градусов в секунду
const R0 = 891; // радиус цилиндра = расстояние до камеры

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const ease = (x: number) => 1 - Math.pow(1 - x, 4);

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, text?: string): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}

/** Содержимое карточки: мини-страница документа. */
function buildPage(item: RingItem): HTMLElement {
  const page = el('div', 'rc__in');
  const top = el('div', 'rc__top');
  top.append(el('span', undefined, item.page), el('span', undefined, item.kind));
  page.append(top, el('h4', 'rc__h', item.title));
  if (item.table) {
    const t = el('table', 'rc__table');
    const head = el('tr');
    item.table.head.forEach((h) => head.append(el('th', undefined, h)));
    t.append(head);
    item.table.rows.forEach((r, i) => {
      const tr = el('tr', i === item.table!.hl ? 'rc__hl' : undefined);
      r.forEach((c) => tr.append(el('td', undefined, c)));
      t.append(tr);
    });
    page.append(t);
  } else {
    if (item.before) page.append(el('p', undefined, item.before));
    if (item.frag) { const p = el('p'); p.append(el('mark', undefined, item.frag)); page.append(p); }
    if (item.after) page.append(el('p', undefined, item.after));
    page.append(el('div', 'rc__ln'), el('div', 'rc__ln rc__ln--s'), el('div', 'rc__ln'));
  }
  return page;
}

export function createRing(host: HTMLElement, items: RingItem[]): DocRing {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ring = el('div', 'ring3d');
  host.append(ring);

  const cards: HTMLElement[] = [];
  for (let i = 0; i < N; i++) {
    const c = el('div', 'rc');
    c.append(buildPage(items[i % items.length]));
    ring.append(c);
    cards.push(c);
  }

  let W = 1, H = 1, k = 1, cardY = 0;
  let raf = 0;
  let bursting = false;
  let destroyed = false;
  let introOpen = false;
  const t0 = performance.now();

  const layout = () => {
    const r = host.getBoundingClientRect();
    W = r.width || 1;
    H = r.height || 1;
    k = clamp(W / DESIGN_W, 0.55, 1.3);
    cardY = H - 56; // центр карточки на верхней кромке плашки: нижняя половина под стеклом
    ring.style.perspective = `${R0 * k}px`;
    ring.style.perspectiveOrigin = `${W / 2}px ${cardY + 320 * k}px`;
    cards.forEach((c) => { c.style.left = `${W / 2}px`; c.style.top = `${cardY}px`; });
  };

  // карточки следуют углу a: касательно к цилиндру, края плавно растворяются
  const place = (t: number) => {
    const off = 90 * Math.pow(1 - Math.min(1, t / 2.2), 3); // плавный «влёт», затем дрейф
    const phase = -2 - DRIFT * t + off;
    const R = R0 * k;
    cards.forEach((c, i) => {
      const a = (((i * STEP + phase) % 360) + 540) % 360 - 180;
      if (Math.abs(a) > CULL) { c.style.visibility = 'hidden'; return; }
      c.style.visibility = 'visible';
      const r = (a * Math.PI) / 180;
      const cs = Math.cos(r);
      c.style.transform = `translate3d(${R * Math.sin(r)}px,0,${R * (1 - cs)}px) rotateY(${-a}deg) scale(${k})`;
      const edge = Math.abs(a) / CULL;
      const kk = clamp((edge - 0.5) / 0.5, 0, 1);
      const sm = kk * kk * (3 - 2 * kk);
      c.style.opacity = (1 - sm).toFixed(3);
    });
    // после появления эти свойства больше не меняются: лишние записи в стиль каждый кадр не нужны
    if (t < 1 || introOpen === false) {
      const appear = ease(Math.min(1, t / 0.9));
      ring.style.opacity = String(appear);
      ring.style.translate = `0 ${22 * (1 - appear)}px`;
      introOpen = appear >= 1;
    }
  };

  const loop = (now: number) => {
    place((now - t0) / 1000);
    raf = requestAnimationFrame(loop);
  };

  layout();
  const ro = new ResizeObserver(() => { layout(); if (reduce) place(6); });
  ro.observe(host);
  if (reduce) place(6); else raf = requestAnimationFrame(loop);


  const destroy = () => {
    if (destroyed) return;
    destroyed = true;
    cancelAnimationFrame(raf);
    ro.disconnect();
    ring.remove();
  };

  const burst = () => {
    if (bursting || destroyed) return;
    bursting = true;
    cancelAnimationFrame(raf);

    if (reduce) {
      ring.style.transition = 'opacity .35s ease';
      ring.style.opacity = '0';
      window.setTimeout(destroy, 400);
      return;
    }

    const finishes: Promise<unknown>[] = [];
    const rnd = (min: number, max: number) => min + Math.random() * (max - min);
    const DT = 1 / 120; // шаг расчёта, с
    const SAMPLES = 36; // ключевых кадров на карточку

    cards.forEach((c) => {
      if (c.style.visibility === 'hidden') return;
      const op = parseFloat(c.style.opacity || '1');
      if (op < 0.05) return;
      const m = /translate3d\(([-\d.]+)px,\s*0(?:px)?,\s*([-\d.]+)px\)\s*rotateY\(([-\d.]+)deg\)/.exec(c.style.transform);
      if (!m) return;
      const x0 = parseFloat(m[1]), z0 = parseFloat(m[2]), a0 = parseFloat(m[3]);

      // Взрыв воздуха под кольцом: листы подбрасывает вверх и в стороны, потом их тормозит воздух
      // и тянет вниз. Каждый лист чуть тяжелее или легче остальных.
      const air = rnd(1.35, 2.0); // сопротивление воздуха, 1/с
      const T = rnd(1.9, 2.3); // длительность, с
      const side = x0 === 0 ? (Math.random() < 0.5 ? -1 : 1) : Math.sign(x0);
      let vx = (side * rnd(380, 900) + (x0 / (R0 * k)) * 1100) * k;
      let vy = -rnd(750, 1350) * k;
      let vz = rnd(260, 620) * k; // и на зрителя
      const g = rnd(1500, 2000) * k;
      const sp = Math.hypot(vx, vy) || 1;
      // ось кувырка лежит в плоскости экрана, поперёк направления полёта: лист переворачивается на лету
      const axis = [-vy / sp, vx / sp, rnd(-0.25, 0.25)];
      let w = (Math.random() < 0.5 ? -1 : 1) * rnd(520, 920); // град/с
      let wz = rnd(-140, 140);
      const airW = rnd(1.1, 1.6);
      let px = 0, py = 0, pz = 0, th = rnd(-10, 10), ph = 0;

      const frames: Keyframe[] = [];
      const back: Keyframe[] = [];
      const stepsPerSample = Math.max(1, Math.round(T / DT / SAMPLES));
      for (let i = 0; i <= SAMPLES; i++) {
        const o = i / SAMPLES;
        const z = Math.min(z0 + pz, R0 * k * 0.62); // не подпускаем к камере вплотную
        const tf = `translate3d(${(x0 + px).toFixed(1)}px,${py.toFixed(1)}px,${z.toFixed(1)}px) rotateY(${a0}deg) rotate3d(${axis[0].toFixed(3)},${axis[1].toFixed(3)},${axis[2].toFixed(3)},${th.toFixed(1)}deg) rotateZ(${ph.toFixed(1)}deg) scale(${k})`;
        const fade = o < 0.55 ? op : op * Math.max(0, 1 - (o - 0.55) / 0.4);
        frames.push({ offset: o, transform: tf, opacity: fade, easing: 'linear' });
        back.push({ offset: o, transform: `${tf} rotateY(180deg)`, opacity: fade, easing: 'linear' });
        for (let j = 0; j < stepsPerSample; j++) {
          vx -= vx * air * DT; vy += g * DT; vy -= vy * air * DT; vz -= vz * air * DT;
          px += vx * DT; py += vy * DT; pz += vz * DT;
          w -= w * airW * DT; wz -= wz * airW * DT;
          th += w * DT; ph += wz * DT;
        }
      }
      // у листа есть обратная сторона: когда он перевернулся, видна чистая белая бумага
      const flip = el('div', 'rc rc--back');
      flip.style.left = c.style.left;
      flip.style.top = c.style.top;
      flip.style.transform = c.style.transform;
      flip.style.opacity = '0';
      ring.append(flip);

      const delay = rnd(0, 70);
      const dur = T * 1000;
      finishes.push(c.animate(frames, { duration: dur, delay, fill: 'both' }).finished);
      finishes.push(flip.animate(back, { duration: dur, delay, fill: 'both' }).finished);
    });

    Promise.all(finishes).then(destroy, destroy);
  };

  return { burst, destroy };
}
