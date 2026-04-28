import type { Scheduler } from './schedulers';

type TickFunction = () => boolean | undefined;

/** Как в telegram-tt `util/animation.ts` — `animate`. */
export function animate(tick: TickFunction, schedulerFn: Scheduler) {
  schedulerFn(() => {
    if (tick()) {
      animate(tick, schedulerFn);
    }
  });
}
