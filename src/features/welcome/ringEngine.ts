/**
 * Кольцо документов на стартовом экране.
 * Карточки стоят на цилиндре, камера в его центре: 3D-перспектива, а не плоская карусель.
 * При burst() карточки съезжаются в стопку, приседают, подпрыгивают, зависают и падают за плашку к полю поиска.
 * Листы гнутся (поделены на горизонтальные полосы с шарнирами), стопка пружинит и вытягивается.
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

/** Такты анимации в миллисекундах от начала (для эффектов плашки и поля). */
export interface Timeline {
  total: number;
  /** Стопка собрана, начинает приседать. */
  stack: number;
  /** Присела, начинает прыжок. */
  squat: number;
  /** Верхняя точка: зависание. */
  apex: number;
  /** Зависание кончилось, начинается падение. */
  fall: number;
}

export interface RingOptions {
  /** Элемент, в который падает стопка (поле поиска). */
  target?: () => Element | null;
  /** Вызывается в момент старта анимации: по тактам можно синхронизировать эффекты вокруг. */
  onStart?: (t: Timeline) => void;
}

const ROWS = 8; // на сколько полос режется лист, пока он летит

/** Лист из вложенных полос: каждая полоса — шарнир, поэтому лист можно изгибать. */
function makeBendable(card: HTMLElement): { root: HTMLElement; hinges: HTMLElement[] } {
  const root = el('div', 'rb');
  const hinges: HTMLElement[] = [];
  const page = card.querySelector('.rc__in') as HTMLElement;
  const rh = CARD_H / ROWS;
  let parent: HTMLElement = root;
  for (let j = 0; j < ROWS; j++) {
    const seg = el('div', 'rs');
    seg.style.top = j === 0 ? '0' : `${rh}px`;
    seg.style.height = `${rh + 1}px`; // на пиксель внахлёст: на стыках не видно щелей
    const face = el('div', 'rf');
    if (j === 0) face.style.borderRadius = '8px 8px 0 0';
    if (j === ROWS - 1) face.style.borderRadius = '0 0 8px 8px';
    const clone = page.cloneNode(true) as HTMLElement;
    clone.style.inset = 'auto';
    clone.style.left = '0';
    clone.style.top = `${-j * rh}px`;
    clone.style.width = `${CARD_W}px`;
    clone.style.height = `${CARD_H}px`;
    face.append(clone);
    seg.append(face);
    parent.append(seg);
    if (j > 0) hinges.push(seg);
    parent = seg;
  }
  return { root, hinges };
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

    // куда падает стопка: центр поля поиска в координатах кольца
    const hr = host.getBoundingClientRect();
    const tr = opts.target?.()?.getBoundingClientRect();
    const tx = (tr ? tr.left + tr.width / 2 - hr.left : W / 2) - W / 2;
    const ty = (tr ? tr.top + tr.height / 2 - hr.top : H + 260) - cardY;
    const finishes: Promise<unknown>[] = [];

    // карточки в кадре, слева направо: из них складывается веер стопки
    const live = cards
      .map((c) => ({ c, m: /translate3d\(([-\d.]+)px,\s*0(?:px)?,\s*([-\d.]+)px\)\s*rotateY\(([-\d.]+)deg\)/.exec(c.style.transform), op: parseFloat(c.style.opacity || '1') }))
      .filter((o) => o.c.style.visibility !== 'hidden' && o.op >= 0.05 && o.m)
      .sort((p, q) => parseFloat(p.m![1]) - parseFloat(q.m![1]));
    const mid = (live.length - 1) / 2;

    // три такта с короткими паузами: съезд, прыжок, падение
    const T1 = 640, T2 = T1 + 140, T3 = T2 + 300, T4 = T3 + 140, TOTAL = T4 + 620;
    const tl: Timeline = { total: TOTAL, stack: T1, squat: T2, apex: T3, fall: T4 };

    const tf = (x: number, y: number, z: number, rx: number, ry: number, rz: number, sx: number, sy: number) =>
      `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,${z.toFixed(1)}px) rotateX(${rx.toFixed(1)}deg) rotateY(${ry.toFixed(1)}deg) rotateZ(${rz.toFixed(2)}deg) scale(${sx.toFixed(3)},${sy.toFixed(3)})`;
    const rnd = (a: number, b: number) => a + Math.random() * (b - a);

    interface Pose { t: number; x: number; y: number; z: number; rx: number; ry: number; rz: number; sx: number; sy: number; op: number; bend: number; ease: string }

    live.forEach(({ c, m, op }, rank) => {
      const x0 = parseFloat(m![1]), z0 = parseFloat(m![2]), a0 = parseFloat(m![3]);
      const edge = Math.min(1, Math.abs(a0) / CULL);
      // стопка: лёгкий веер, центральные карточки сверху; у каждого листа свой остаточный наклон и ритм
      const sx = (rank - mid) * 3 * k;
      const sy = (rank - mid) * -1.2 * k;
      const sr = (rank - mid) * 1.1 + rnd(-1.4, 1.4);
      const sz = 30 * (1 - edge);
      const dir = Math.random() < 0.5 ? -1 : 1;
      const jit = () => rnd(-0.014, 0.014); // сдвиг такта: листы не двигаются синхронно
      const sc = (s: number) => k * s;

      const poses: Pose[] = [
        { t: 0, x: x0, y: 0, z: z0, rx: 0, ry: a0, rz: 0, sx: k, sy: k, op, bend: 0, ease: 'cubic-bezier(.45,0,.2,1)' },
        // собрались в стопку
        { t: T1, x: sx, y: sy, z: sz, rx: 0, ry: 0, rz: sr, sx: k, sy: k, op: 1, bend: -0.6, ease: 'cubic-bezier(.3,.7,.4,1)' },
        // присела: сплющилась и чуть выгнулась
        { t: T2, x: sx, y: sy + 9 * k, z: sz, rx: 0, ry: 0, rz: sr, sx: sc(1.05), sy: sc(0.93), op: 1, bend: -1.8, ease: 'cubic-bezier(.15,.6,.3,1)' },
        // подпрыгнула: вытянулась, края отстали
        { t: T3, x: sx, y: sy - 34 * k, z: sz, rx: dir * 3, ry: 0, rz: sr * 0.4, sx: sc(0.97), sy: sc(1.06), op: 1, bend: 3.6, ease: 'cubic-bezier(.37,0,.63,1)' },
        // зависла в верхней точке: чуть поплыла вверх и повернулась
        { t: T4, x: sx, y: sy - 39 * k, z: sz, rx: -dir * 2, ry: dir * 6, rz: sr * 0.25 + dir * 3, sx: k, sy: sc(1.01), op: 1, bend: 0.6, ease: 'linear' },
      ];
      // падение: ускоряется, у плашки сжимается в точку, листы трепещут
      const apex = poses[poses.length - 1];
      const fallU = [0.2, 0.4, 0.6, 0.8, 1];
      const flutter = [6, -7, 5, -3, 0];
      const bends = [4.5, 8, 9, 6, 3];
      const opac = [1, 1, 0.92, 0.8, 0];
      fallU.forEach((u, n) => {
        const py = Math.pow(u, 2.2), px = Math.pow(u, 3), ps = Math.pow(u, 2.4);
        const last = n === fallU.length - 1;
        poses.push({
          t: T4 + u * (TOTAL - T4),
          x: apex.x + (tx - apex.x) * px,
          y: apex.y + (ty - apex.y) * py,
          z: apex.z * (1 - u),
          rx: dir * flutter[n],
          ry: apex.ry * (1 - u),
          rz: apex.rz * (1 - u) + dir * 4 * Math.sin(u * Math.PI),
          sx: last ? 0.06 : (k + (0.06 - k) * ps) * 0.97,
          sy: last ? 0.06 : (k + (0.06 - k) * ps) * 1.05,
          op: opac[n],
          bend: bends[n],
          ease: 'linear',
        });
      });

      // сдвигаем внутренние такты, края (0 и 1) остаются на месте
      const off = poses.map((p, n) => {
        const base = p.t / TOTAL;
        return n === 0 || n >= poses.length - 1 ? base : Math.min(0.999, Math.max(0.001, base + (n <= 4 ? jit() : 0)));
      });
      for (let n = 1; n < off.length; n++) off[n] = Math.max(off[n], off[n - 1] + 0.001);

      const frames: Keyframe[] = poses.map((p, n) => ({
        offset: off[n], transform: tf(p.x, p.y, p.z, p.rx, p.ry, p.rz, p.sx, p.sy), opacity: p.op, easing: p.ease,
      }));

      // лист из полос, чтобы мог гнуться; если не вышло — летит как есть
      const bendable = makeBendable(c);
      bendable.root.style.left = c.style.left;
      bendable.root.style.top = c.style.top;
      bendable.root.style.transform = c.style.transform;
      bendable.root.style.opacity = c.style.opacity;
      ring.append(bendable.root);
      c.style.visibility = 'hidden';

      finishes.push(bendable.root.animate(frames, { duration: TOTAL, fill: 'both', easing: 'linear' }).finished);
      bendable.hinges.forEach((h, j) => {
        const bf: Keyframe[] = poses.map((p, n) => ({
          offset: off[n], transform: `rotateX(${p.bend.toFixed(2)}deg)`, easing: 'ease-in-out',
        }));
        // волна: нижние полосы запаздывают, лист трепещет
        finishes.push(h.animate(bf, { duration: TOTAL, delay: j * 9, fill: 'both', easing: 'linear' }).finished);
      });
    });
    opts.onStart?.(tl);

    Promise.all(finishes).then(destroy, destroy);
  };

  return { burst, destroy };
}
