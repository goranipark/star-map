/** 프로덕션 빌드에서만 서비스 워커를 등록하고 업데이트를 알린다. */
export function registerServiceWorker({ onUpdate } = {}) {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return () => {};
  if (!import.meta.env?.PROD) return () => {};

  let disposed = false;
  const hadController = Boolean(navigator.serviceWorker.controller);
  const swUrl = `${import.meta.env.BASE_URL}sw.js`;

  const handleControllerChange = () => {
    // 첫 설치 때는 수업 화면을 새로고침하지 않는다. 기존 버전을 새 버전으로
    // 교체한 경우에만 새 자산을 일관되게 읽도록 한 번 새로고침한다.
    if (hadController) window.location.reload();
  };
  navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

  navigator.serviceWorker.register(swUrl).then((registration) => {
    if (disposed) return;
    if (registration.waiting) onUpdate?.(registration);

    registration.addEventListener('updatefound', () => {
      const worker = registration.installing;
      worker?.addEventListener('statechange', () => {
        if (worker.state === 'installed' && navigator.serviceWorker.controller) {
          onUpdate?.(registration);
        }
      });
    });
  }).catch(() => {
    // 오프라인 기능 등록 실패가 게임 실행을 막아서는 안 된다.
  });

  return () => {
    disposed = true;
    navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
  };
}

export function activateWaitingWorker(registration) {
  registration?.waiting?.postMessage({ type: 'SKIP_WAITING' });
}

