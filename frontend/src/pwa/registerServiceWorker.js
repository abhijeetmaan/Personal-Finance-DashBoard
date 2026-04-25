/** Disable PWA service worker so `/api/*` is never intercepted on the SPA origin. */
export const registerServiceWorker = () => {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  navigator.serviceWorker
    .getRegistrations()
    .then((regs) => {
      regs.forEach((r) => r.unregister());
    })
    .catch(() => {});
};
