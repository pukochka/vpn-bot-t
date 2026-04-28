export function createCallbackManager() {
  const callbacks = new Set<(event: MessageEvent) => void>();

  function addCallback(cb: (event: MessageEvent) => void) {
    callbacks.add(cb);
    return () => {
      callbacks.delete(cb);
    };
  }

  function runCallbacks(event: MessageEvent) {
    callbacks.forEach((callback) => {
      callback(event);
    });
  }

  return { runCallbacks, addCallback };
}
