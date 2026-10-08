import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

export type WelcomeBackgroundHandle = {
  /** Волна от поля ввода. strong — при отправке запроса. */
  pulse: (strong?: boolean) => void;
};

const NS = 'http://www.w3.org/2000/svg';
const DURATION = 3400;

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Фон стартового экрана: мягкий белый купол, вокруг него бледное синее
 * зернистое свечение. Дышит, зерно мерцает, на ввод от поля уходит волна.
 */
const WelcomeBackground = forwardRef<WelcomeBackgroundHandle>(function WelcomeBackground(_, ref) {
  const root = useRef<HTMLDivElement>(null);
  const layer = useRef<HTMLDivElement>(null);
  const grain = useRef<HTMLElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const group = useRef<SVGGElement>(null);
  const pulses = useRef<{ el: SVGPathElement; t0: number; a: number }[]>([]);
  const boost = useRef(0);
  const size = useRef({ w: 1, h: 1 });

  useImperativeHandle(ref, () => ({
    pulse(strong = false) {
      if (reduced() || !group.current) return;
      const add = (a: number) => {
        const el = document.createElementNS(NS, 'path');
        el.setAttribute('fill', 'none');
        el.setAttribute('stroke', '#245DDF');
        group.current!.appendChild(el);
        pulses.current.push({ el, t0: performance.now(), a });
      };
      boost.current = strong ? 1 : Math.max(boost.current, 0.5);
      add(strong ? 1 : 0.55);
      if (strong) [1, 2, 3, 4].forEach((i) => window.setTimeout(() => add(0.75), i * 900));
    },
  }));

  useEffect(() => {
    const el = root.current!;
    const measure = () => {
      const r = el.getBoundingClientRect();
      size.current = { w: r.width || 1, h: r.height || 1 };
      svg.current?.setAttribute('viewBox', `0 0 ${size.current.w} ${size.current.h}`);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);

    if (reduced()) { layer.current!.style.opacity = '.46'; return () => ro.disconnect(); }

    let raf = 0;
    const start = performance.now();
    let lastGrain = 0;
    const tick = (now: number) => {
      const b = Math.sin(((now - start) / 1000) * (Math.PI * 2) / 9);
      boost.current *= 0.985;
      const l = layer.current!;
      l.style.setProperty('--rx', `${64 + b * 9}%`);
      l.style.setProperty('--ry', `${98 + b * 10}%`);
      l.style.opacity = String(0.46 + b * 0.11 + boost.current * 0.12);

      if (now - lastGrain > 85) {
        lastGrain = now;
        const p = `${Math.floor(Math.random() * 220)}px ${Math.floor(Math.random() * 220)}px`;
        const g = grain.current!;
        g.style.maskPosition = p;
        g.style.webkitMaskPosition = p;
      }

      const { w, h } = size.current;
      pulses.current = pulses.current.filter((p) => {
        const t = (now - p.t0) / DURATION;
        if (t >= 1) { p.el.remove(); return false; }
        const e = 1 - Math.pow(1 - t, 2.2);
        const R = w * (0.26 + e * 0.85);
        p.el.setAttribute('d', `M ${w / 2 - R} ${h} A ${R} ${R} 0 0 1 ${w / 2 + R} ${h}`);
        p.el.setAttribute('stroke-width', String(78 - 26 * t));
        p.el.setAttribute('stroke-opacity', String(Math.pow(Math.sin(Math.PI * t), 0.9) * p.a * 0.3));
        return true;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, []);

  return (
    <div className="wbg" ref={root} aria-hidden="true">
      <div className="wbg__layer" ref={layer}>
        <i className="wbg__color" />
        <i className="wbg__grain" ref={grain} />
      </div>
      <div className="wbg__layer wbg__layer--pulse">
        <svg ref={svg} preserveAspectRatio="none">
          <defs>
            <filter id="wbg-blur" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="22" />
            </filter>
          </defs>
          <g ref={group} filter="url(#wbg-blur)" />
        </svg>
      </div>
    </div>
  );
});

export default WelcomeBackground;
