const NAV_EVENT = 'dev-console:navigate';

export function emitNavigation(targetKey) {
  if (!targetKey || typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(NAV_EVENT, { detail: { key: targetKey } }));
}

export function subscribeNavigation(handler) {
  if (typeof window === 'undefined') return () => {};
  const wrapped = (event) => {
    if (event?.detail?.key) {
      handler(event.detail.key);
    }
  };
  window.addEventListener(NAV_EVENT, wrapped);
  return () => window.removeEventListener(NAV_EVENT, wrapped);
}
