import { useEffect, useRef } from 'react';

const EVENTS: (keyof DocumentEventMap)[] = [
  'mousedown',
  'keydown',
  'touchstart',
  'scroll',
  'mousemove',
];

export function useInactivity(
  timeoutMs: number,
  onTimeout: () => void,
  enabled = true,
): void {
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const callbackRef = useRef(onTimeout);
  callbackRef.current = onTimeout;

  useEffect(() => {
    if (!enabled) return;

    const resetTimer = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => callbackRef.current(), timeoutMs);
    };

    // Start the timer immediately
    resetTimer();

    // Reset on user interaction
    for (const event of EVENTS) {
      document.addEventListener(event, resetTimer, { passive: true });
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      for (const event of EVENTS) {
        document.removeEventListener(event, resetTimer);
      }
    };
  }, [timeoutMs, enabled]);
}
