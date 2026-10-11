import type { Timeline } from './ringEngine';

/**
 * Эффект вокруг падающей стопки: тень на стекле под ней.
 * Идёт по тем же тактам, что и стопка.
 */
export function playSwallowFx(tl: Timeline, panel: Element | null) {
  if (!panel) return;
  const { total, stack, squat, apex, fall } = tl;
  const at = (ms: number) => ms / total;

  const box = document.createElement('div');
  box.className = 'swfx';
  const shadow = document.createElement('div');
  shadow.className = 'swfx__shadow';
  box.append(shadow);
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

  Promise.allSettled(done).then(() => box.remove());
}
