/**
 * Кольцо документов на стартовом экране.
 * Карточки стоят на цилиндре, камера в его центре: 3D-перспектива, а не плоская карусель.
 * При burst() карточки по дуге втягиваются в поле поиска и гаснут.
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

export interface RingOptions {
  /** Элемент, в который всасываются карточки (поле поиска). */
  target?: () => Element | null;
  /** Вызывается, когда очередная карточка дошла до цели. */
  onArrive?: () => void;
  mode?: 'funnel' | 'spiral';
}

export function createRing(host: HTMLElement, items: RingItem[], opts: RingOptions = {}): DocRing {
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

    // куда всасываются карточки: центр поля поиска в координатах кольца
    const hr = host.getBoundingClientRect();
    const tEl = opts.target?.();
    const tr = tEl?.getBoundingClientRect();
    const tx = (tr ? tr.left + tr.width / 2 - hr.left : W / 2) - W / 2;
    const ty = (tr ? tr.top + tr.height / 2 - hr.top : H + 260) - cardY;
    const mode = opts.mode ?? 'funnel';
    host.style.zIndex = '6'; // на время полёта карточки поверх плашки: путь к полю должен быть виден
    const finishes: Promise<unknown>[] = [];

    cards.forEach((c) => {
      if (c.style.visibility === 'hidden') return;
      const op = parseFloat(c.style.opacity || '1');
      if (op < 0.05) return;
      const m = /translate3d\(([-\d.]+)px,\s*0(?:px)?,\s*([-\d.]+)px\)\s*rotateY\(([-\d.]+)deg\)/.exec(c.style.transform);
      if (!m) return;
      const x0 = parseFloat(m[1]), z0 = parseFloat(m[2]), a0 = parseFloat(m[3]);
      const edge = Math.min(1, Math.abs(a0) / CULL);

      const dx = x0 - tx, dy = 0 - ty; // вектор от цели к карточке
      const r0 = Math.hypot(dx, dy);
      const th0 = Math.atan2(dy, dx);
      const dir = x0 >= 0 ? 1 : -1; // закрутка в сторону своего края
      const N = mode === 'spiral' ? 14 : 8;
      const frames: Keyframe[] = [];
      for (let i = 0; i <= N; i++) {
        const o = i / N;
        const u = Math.pow(o, 1.8); // разгон к цели
        let px: number, py: number;
        if (mode === 'spiral') {
          const r = r0 * Math.pow(1 - u, 1.25);
          const th = th0 + dir * u * Math.PI * 1.7;
          px = tx + r * Math.cos(th);
          py = ty + r * Math.sin(th) * 0.55 + (r0 * 0.12) * Math.sin(Math.PI * u);
        } else {
          // квадратичная дуга: центр управления выше прямой, как будто карточку подхватывает
          const cxp = (x0 + tx) / 2, cyp = Math.min(0, ty) - 70 * k;
          px = (1 - u) * (1 - u) * x0 + 2 * (1 - u) * u * cxp + u * u * tx;
          py = (1 - u) * (1 - u) * 0 + 2 * (1 - u) * u * cyp + u * u * ty;
        }
        const sc = k + (0.05 - k) * Math.pow(o, 2.6); // уменьшаются ближе к концу пути
        const rot = a0 * (1 - Math.min(1, u * 1.6));
        const z = z0 * (1 - u);
        frames.push({
          transform: `translate3d(${px.toFixed(1)}px,${py.toFixed(1)}px,${z.toFixed(1)}px) rotateY(${rot.toFixed(1)}deg) scale(${sc.toFixed(3)})`,
          opacity: o < 0.62 ? op : op * Math.max(0, 1 - (o - 0.62) / 0.38),
          offset: o,
        });
      }
      const delay = 100 + (1 - edge) * 420 + Math.random() * 50; // от краёв к центру
      const a = c.animate(frames, { duration: 1250 + Math.random() * 200, delay, fill: 'both', easing: 'linear' });
      finishes.push(a.finished.then(() => opts.onArrive?.()));
    });

    Promise.all(finishes).then(destroy, destroy);
  };

  return { burst, destroy };
}
