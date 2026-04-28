import EmojiRlottieWorker from './emojiRlottie.worker.ts?worker';

import { createConnector, type Connector } from './internal/PostMessageConnector';

/** Тип сообщений rlottie-воркера (имена методов). */
export type EmojiRlottieWorkerRequests = Record<string, (...args: any[]) => any>;

export const MAX_WORKERS = Math.min(navigator.hardwareConcurrency || 4, 4);

let instances: { worker: Worker; connector: Connector<EmojiRlottieWorkerRequests> }[] | undefined;

export default function launchEmojiWorkers() {
  if (!instances) {
    instances = Array.from({ length: MAX_WORKERS }, () => {
      const worker = new EmojiRlottieWorker();
      const connector = createConnector<EmojiRlottieWorkerRequests>(worker, undefined, 'media');
      return { worker, connector };
    });
  }
  return instances;
}
