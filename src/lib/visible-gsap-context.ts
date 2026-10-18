import type gsapCore from 'gsap';

type Animation =
  | ReturnType<typeof gsapCore.to>
  | NonNullable<ReturnType<typeof gsapCore.to>['parent']>;

/** Keep decorative loops alive only while their component can be seen. */
export function visibleGsapContext(gsap: typeof gsapCore, setup: () => void, root?: Element) {
  const context = gsap.context(setup, root);
  const loops = new Set<Animation>();
  for (const tween of context.getTweens()) {
    let current: Animation | null = tween;
    let loop: Animation | undefined;
    while (current && current !== gsap.globalTimeline) {
      if (current.repeat() === -1) loop = current;
      current = current.parent;
    }
    if (loop) loops.add(loop);
  }
  if (!loops.size || !root) return context;

  context.add(() => {
    const pausedHere = new Set<Animation>();
    let intersecting = false;
    const update = () => {
      const visible = intersecting && !document.hidden;
      for (const animation of loops) {
        if (!visible && !animation.paused()) {
          pausedHere.add(animation);
          animation.pause();
        } else if (visible && pausedHere.delete(animation)) {
          animation.resume();
        }
      }
    };
    const observer = new IntersectionObserver(
      ([entry]) => {
        intersecting = entry.isIntersecting;
        update();
      },
      { rootMargin: '160px 0px' }
    );
    observer.observe(root);
    document.addEventListener('visibilitychange', update);
    update();
    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', update);
      pausedHere.clear();
    };
  });
  return context;
}
