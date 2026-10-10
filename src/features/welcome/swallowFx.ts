import type { Timeline } from './ringEngine';

/**
 * Эффекты вокруг падающей стопки: тень на стекле, голубой след под плашкой,
 * свечение кромки плашки и подсветка поля, которое «принимает» документы.
 * Все анимации идут по тем же тактам, что и стопка.
 */
export function playSwallowFx(tl: Timeline, panel: Element | null, field: Element | null) {
  if (!panel) return;
  const { total, stack, squat, apex, fall } = tl;
  const at = (ms: number) => ms / total;

  const pr = panel.getBoundingClientRect();
  const fr = field?.getBoundingClientRect();
  // куда уходит след: центр поля относительно верхней середины плашки
  const dx = fr ? fr.left + fr.width / 2 - (pr.left + pr.width / 2) : 0;
  const dy = fr ? fr.top + fr.height / 2 - pr.top : 220;

  const box = document.createElement('div');
  box.className = 'swfx';
  const shadow = document.createElement('div');
  shadow.className = 'swfx__shadow';
  const trail = document.createElement('div');
  trail.className = 'swfx__trail';
  box.append(shadow, trail);
  panel.prepend(box);

  const done: Promise<unknown>[] = [];
  const run = (target: Element, frames: Keyframe[], opts: KeyframeAnimationOptions) => {
    try { done.push(target.animate(frames, opts).finished); } catch { /* без эффекта */ }
  };

  // тень стопки на стекле: бледнеет и сжимается в прыжке, темнеет и растёт при падении
  run(shadow, [
    { offset: 0, opacity: 0, transform: 'scaleX(1.3)' },
    { offset: at(stack), opacity: 0.4, transform: 'scaleX(1)' },
    { offset: at(squat), opacity: 0.62, transform: 'scaleX(1.12)' },
    { offset: at(apex), opacity: 0.14, transform: 'scaleX(.66)' },
    { offset: at(fall), opacity: 0.12, transform: 'scaleX(.62)' },
    { offset: at(fall + (total - fall) * 0.45), opacity: 0.55, transform: 'scaleX(1.05)' },
    { offset: at(fall + (total - fall) * 0.8), opacity: 0.35, transform: 'scaleX(.8)' },
    { offset: 1, opacity: 0, transform: 'scaleX(.4)' },
  ], { duration: total, easing: 'ease-in-out', fill: 'both' });

  // голубой след под стеклом: стопка уходит вглубь и тает у поля
  const fallLen = total - fall;
  run(trail, [
    { offset: 0, opacity: 0, transform: 'translate(0,0) scale(1)' },
    { offset: 0.2, opacity: 0.55 },
    { offset: 0.6, opacity: 0.7 },
    { offset: 1, opacity: 0, transform: `translate(${dx}px,${dy}px) scale(.35)` },
  ], { delay: fall, duration: fallLen + 180, easing: 'cubic-bezier(.55,0,.9,.5)', fill: 'both' });

  // кромка плашки «принимает» стопку: свет ложится вдоль верхнего края
  const rimDur = fallLen + 520;
  run(panel, [
    { boxShadow: 'inset 0 0 0 0 rgba(255,255,255,0), inset 0 0 0 0 rgba(70,120,240,0)' },
    { boxShadow: 'inset 0 2px 0 0 rgba(255,255,255,1), inset 0 24px 36px -18px rgba(70,120,240,.42)', offset: 0.4 },
    { boxShadow: 'inset 0 0 0 0 rgba(255,255,255,0), inset 0 0 0 0 rgba(70,120,240,0)' },
  ], { delay: fall + fallLen * 0.15, duration: rimDur, easing: 'ease-out', composite: 'add' });
  // стекло на мгновение размывается сильнее
  run(panel, [
    { backdropFilter: 'blur(12px)' },
    { backdropFilter: 'blur(20px)', offset: 0.4 },
    { backdropFilter: 'blur(12px)' },
  ], { delay: fall + fallLen * 0.1, duration: rimDur, easing: 'ease-in-out' });

  // поле «готово принять»: слабый свет при зависании, яркая вспышка при приходе
  if (field) {
    const arrive = total * 0.9;
    const len = arrive - apex + 700;
    const off = (ms: number) => Math.min(0.99, Math.max(0.01, (ms - apex) / len));
    run(field, [
      { boxShadow: '0 0 0 0 rgba(36,93,223,0), 0 0 0 0 rgba(36,93,223,0)' },
      { boxShadow: '0 0 0 2px rgba(36,93,223,.10), 0 0 14px rgba(36,93,223,.14)', offset: off(fall + 60) },
      { boxShadow: '0 0 0 4px rgba(36,93,223,.16), 0 0 26px rgba(36,93,223,.34)', offset: off(arrive) },
      { boxShadow: '0 0 0 0 rgba(36,93,223,0), 0 0 0 0 rgba(36,93,223,0)' },
    ], { delay: apex, duration: len, easing: 'ease-out', composite: 'add' });
  }

  Promise.allSettled(done).then(() => box.remove());
}
