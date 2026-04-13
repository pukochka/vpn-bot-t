if ('serviceWorker' in navigator) {
  window.addEventListener('DOMContentLoaded', () => {
    navigator.serviceWorker.register('/service-worker.js').catch((error: unknown) => {
      console.error('Service worker registration failed:', error);
    });
  });
}
