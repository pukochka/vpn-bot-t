export type Scheduler = typeof requestAnimationFrame | typeof queueMicrotask;

export function onTickEnd(callback: () => void) {
  let queue: (() => void)[] | undefined;
  if (!queue) {
    queue = [callback];
    Promise.resolve().then(() => {
      const current = queue!;
      queue = undefined;
      current.forEach((cb) => cb());
    });
  } else {
    queue.push(callback);
  }
}

export function throttleWith<F extends (...args: any[]) => void>(schedulerFn: Scheduler, fn: F) {
  let waiting = false;
  let args: Parameters<F>;

  return (..._args: Parameters<F>) => {
    args = _args;
    if (!waiting) {
      waiting = true;
      schedulerFn(() => {
        waiting = false;
        fn(...args);
      });
    }
  };
}

export function throttleWithTickEnd<F extends (...args: any[]) => void>(fn: F) {
  return throttleWith(onTickEnd, fn);
}
