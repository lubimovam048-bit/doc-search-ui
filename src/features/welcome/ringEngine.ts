/**
 * Кольцо документов на стартовом экране.
 * Карточки стоят на цилиндре, камера в его центре: 3D-перспектива, а не плоская карусель.
 * При burst() каждая видимая карточка разлетается осколками и растворяется.
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

/** Разбивает прямоугольник на неровные осколки: общие вершины, чтобы края сходились. */
function shardPolygons(): string[][] {
  const cols = 3, rows = 4;
  const xs = [0, 100 / 3, 200 / 3, 100];
  const ys = [0, 25, 50, 75, 100];
  const jx = 9, jy = 8;
  const v: { x: number; y: number }[][] = ys.map((y, r) => xs.map((x, c) => {
    const edgeX = c === 0 || c === cols;
    const edgeY = r === 0 || r === rows;
    return {
      x: edgeX ? x : x + (Math.random() - 0.5) * 2 * jx,
      y: edgeY ? y : y + (Math.random() - 0.5) * 2 * jy,
    };
  }));
  const pt = (p: { x: number; y: number }) => `${p.x.toFixed(1)}% ${p.y.toFixed(1)}%`;
  const out: string[][] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const a = v[r][c], b = v[r][c + 1], d = v[r + 1][c + 1], e = v[r + 1][c];
      if (Math.random() < 0.55) {
        // делим ячейку по диагонали на два треугольника
        out.push(Math.random() < 0.5 ? [pt(a), pt(b), pt(d)] : [pt(a), pt(b), pt(e)]);
        out.push(Math.random() < 0.5 ? [pt(a), pt(d), pt(e)] : [pt(b), pt(d), pt(e)]);
      } else {
        out.push([pt(a), pt(b), pt(d), pt(e)]);
      }
    }
  }
  return out;
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
      c.style.filter = sm > 0.02 ? `blur(${(2.2 * sm).toFixed(2)}px)` : '';
    });
    const appear = ease(Math.min(1, t / 0.9));
    ring.style.opacity = String(appear);
    ring.style.translate = `0 ${22 * (1 - appear)}px`;
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

    // центр разлёта: чуть ниже центра колец, у верха плашки
    const ox = W / 2;
    const oy = cardY + 150 * k;
    const finishes: Promise<unknown>[] = [];

    cards.forEach((c) => {
      if (c.style.visibility === 'hidden') return;
      const op = parseFloat(c.style.opacity || '1');
      if (op < 0.03) return;

      const group = el('div', 'rc rc--burst');
      group.style.left = c.style.left;
      group.style.top = c.style.top;
      group.style.transform = c.style.transform;
      group.style.opacity = c.style.opacity;
      group.style.filter = c.style.filter;
      group.style.visibility = 'visible';
      const inner = c.firstElementChild as HTMLElement;

      // положение карточки на экране, чтобы осколки летели от центра
      const m = /translate3d\(([-\d.]+)px/.exec(c.style.transform);
      const cx = W / 2 + (m ? parseFloat(m[1]) : 0);
      const cy = cardY;

      shardPolygons().forEach((poly) => {
        const s = el('div', 'rc__shard');
        s.style.clipPath = `polygon(${poly.join(',')})`;
        s.append(inner.cloneNode(true));
        group.append(s);

        // середина осколка в координатах карточки
        const nums = poly.map((p) => p.split(' ').map((v) => parseFloat(v)));
        const mx = nums.reduce((a, n) => a + n[0], 0) / nums.length / 100;
        const my = nums.reduce((a, n) => a + n[1], 0) / nums.length / 100;
        const sx = cx + (mx - 0.5) * CARD_W * k;
        const sy = cy + (my - 0.5) * CARD_H * k;
        let vx = sx - ox, vy = sy - oy;
        const len = Math.hypot(vx, vy) || 1;
        vx /= len; vy /= len;

        // резкий толчок наружу, затем осколки падают вниз и гаснут
        const push = (50 + Math.random() * 90) * k;
        const px = vx * push + (Math.random() - 0.5) * 30 * k;
        const py = vy * push * 0.6 - (10 + Math.random() * 40) * k;
        const fx = px + (Math.random() - 0.5) * 140 * k;
        const fy = (420 + Math.random() * 380) * k;
        const dz = (40 + Math.random() * 240) * k;
        const ax = Math.random() - 0.5, ay = Math.random() - 0.5, az = Math.random() - 0.5;
        const deg = (Math.random() < 0.5 ? -1 : 1) * (60 + Math.random() * 200);
        const delay = clamp(len / (W * 0.6), 0, 1) * 70 + Math.random() * 30;
        const dur = 620 + Math.random() * 300;
        const a = s.animate(
          [
            { transform: 'translate3d(0,0,0)', opacity: 1, easing: 'cubic-bezier(.1,.7,.2,1)' },
            { transform: `translate3d(${px}px,${py}px,${dz * 0.4}px) rotate3d(${ax},${ay},${az},${deg * 0.35}deg)`, opacity: 1, offset: 0.2, easing: 'cubic-bezier(.45,0,.9,.6)' },
            { opacity: 1, offset: 0.55 },
            { transform: `translate3d(${fx}px,${fy}px,${dz}px) rotate3d(${ax},${ay},${az},${deg}deg)`, opacity: 0 },
          ],
          { duration: dur, delay, fill: 'both' },
        );
        finishes.push(a.finished);
      });

      ring.append(group);
      c.remove();
    });

    Promise.all(finishes).then(destroy, destroy);
  };

  return { burst, destroy };
}
