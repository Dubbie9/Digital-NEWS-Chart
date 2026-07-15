import { useEffect, useRef } from 'react';

// Events that indicate deliberate interaction. High-frequency events like
// mousemove/scroll are intentionally excluded — pointerdown/keydown/wheel/
// touchstart cover every real interaction without firing per frame.
const ACTIVITY_EVENTS: (keyof DocumentEventMap)[] = [
  'pointerdown',
  'keydown',
  'wheel',
  'touchstart',
];

const CHECK_INTERVAL_MS = 15_000;

/**
 * Calls `onTimeout` once `timeoutMs` elapses without user interaction.
 *
 * Activity listeners only stamp a timestamp (no clearTimeout/setTimeout
 * churn on every scroll frame — a major source of main-thread jank on
 * touch devices). A low-frequency interval performs the actual check.
 *
 * The check also runs when the tab becomes visible again: mobile Safari
 * suspends timers in the background, so a device left unattended past the
 * deadline locks the moment it is picked back up.
 */
export function useInactivity(
  timeoutMs: number,
  onTimeout: () => void,
  enabled = true,
): void {
  const callbackRef = useRef(onTimeout);
  callbackRef.current = onTimeout;

  useEffect(() => {
    if (!enabled) return;

    let lastActivity = Date.now();
    const markActivity = () => {
      lastActivity = Date.now();
    };

    const checkElapsed = () => {
      if (Date.now() - lastActivity >= timeoutMs) {
        callbackRef.current();
      }
    };

    const interval = setInterval(checkElapsed, CHECK_INTERVAL_MS);
    const onVisibilityChange = () => {
      if (!document.hidden) checkElapsed();
    };

    for (const event of ACTIVITY_EVENTS) {
      document.addEventListener(event, markActivity, { passive: true });
    }
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      clearInterval(interval);
      for (const event of ACTIVITY_EVENTS) {
        document.removeEventListener(event, markActivity);
      }
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [timeoutMs, enabled]);
}
