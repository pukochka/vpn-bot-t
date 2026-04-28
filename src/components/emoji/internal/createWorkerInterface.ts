import type {
  ApiUpdate,
  CancellableCallback,
  OriginMessageData,
  WorkerPayload,
} from './PostMessageConnector';

import { createCallbackManager } from './callbacks';
import { throttleWithTickEnd } from './schedulers';

const callbackState = new Map<string, CancellableCallback>();

type ApiConfig =
  | ((name: string, ...args: any[]) => any | [any, ArrayBuffer[]])
  | Record<string, (...args: any[]) => any>;
type SendToOrigin = (data: WorkerPayload, transferables?: Transferable[]) => void;

const messageHandlers = createCallbackManager();

export function createWorkerInterface(api: ApiConfig, channel?: string) {
  let pendingPayloads: WorkerPayload[] = [];
  let pendingTransferables: Transferable[] = [];

  const sendToOriginOnTickEnd = throttleWithTickEnd(() => {
    const data = { channel, payloads: pendingPayloads };
    const transferables = pendingTransferables;
    pendingPayloads = [];
    pendingTransferables = [];
    if (transferables.length) {
      self.postMessage(data, transferables);
    } else {
      self.postMessage(data);
    }
  });

  function sendToOrigin(payload: WorkerPayload, transferables?: Transferable[]) {
    pendingPayloads.push(payload);
    if (transferables) {
      pendingTransferables.push(...transferables);
    }
    sendToOriginOnTickEnd();
  }

  handleErrors(sendToOrigin);

  messageHandlers.addCallback((ev: MessageEvent) => {
    const data = ev.data as OriginMessageData & { channel?: string };
    if (data?.channel === channel) {
      onMessage(api, data, sendToOrigin);
    }
  });

  self.onmessage = (ev: MessageEvent) => {
    messageHandlers.runCallbacks(ev);
  };
}

function onMessage(
  api: ApiConfig,
  data: OriginMessageData,
  sendToOrigin: SendToOrigin,
  onUpdate?: (update: ApiUpdate) => void,
) {
  if (!onUpdate) {
    onUpdate = (update: ApiUpdate) => {
      sendToOrigin({
        type: 'update',
        update,
      });
    };
  }

  data.payloads.forEach(async (payload) => {
    switch (payload.type) {
      case 'init': {
        const { args } = payload;
        if (typeof api === 'function') {
          await api('init', onUpdate, ...args);
        } else {
          await api.init?.(onUpdate, ...args);
        }
        break;
      }

      case 'callMethod': {
        const { messageId, name, args, withCallback } = payload;
        try {
          if (typeof api !== 'function' && !api[name]) return;

          if (messageId && withCallback) {
            const callback = (...callbackArgs: any[]) => {
              const lastArg = callbackArgs[callbackArgs.length - 1];
              sendToOrigin(
                {
                  type: 'methodCallback',
                  messageId,
                  callbackArgs,
                },
                isTransferable(lastArg) ? [lastArg] : undefined,
              );
            };
            callbackState.set(messageId, callback);
            args.push(callback as never);
          }

          const response =
            typeof api === 'function' ? await api(name, ...args) : await api[name](...args);
          const { arrayBuffer } =
            (typeof response === 'object' && response && 'arrayBuffer' in response && response) || {};
          if (messageId) {
            sendToOrigin(
              {
                type: 'methodResponse',
                messageId,
                response,
              },
              arrayBuffer ? [arrayBuffer as ArrayBuffer] : undefined,
            );
          }
        } catch (error: unknown) {
          const err = error as Error;
          if (messageId) {
            sendToOrigin({
              type: 'methodResponse',
              messageId,
              error: { message: err.message },
            });
          }
        }

        if (messageId) {
          callbackState.delete(messageId);
        }
        break;
      }

      case 'cancelProgress': {
        const callback = callbackState.get(payload.messageId);
        if (callback) {
          callback.isCanceled = true;
        }
        break;
      }
    }
  });
}

function isTransferable(obj: unknown) {
  return obj instanceof ArrayBuffer || obj instanceof ImageBitmap;
}

function handleErrors(sendToOrigin: SendToOrigin) {
  self.onerror = (e) => {
    console.error(e);
    sendToOrigin({
      type: 'unhandledError',
      error: { message: e.error?.message || 'Uncaught exception in worker' },
    });
  };

  self.addEventListener('unhandledrejection', (e) => {
    console.error(e);
    const reason = e.reason as Error | undefined;
    sendToOrigin({
      type: 'unhandledError',
      error: { message: reason?.message || 'Uncaught rejection in worker' },
    });
  });
}
