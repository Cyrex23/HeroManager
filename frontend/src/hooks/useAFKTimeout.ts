import { useEffect, useRef } from 'react';

const AFK_MS = 30 * 60 * 1000; // 30 minutes

const ACTIVITY_EVENTS: (keyof WindowEventMap)[] = [
  'click', 'keydown', 'mousemove', 'scroll', 'touchstart', 'pointerdown',
];

/**
 * Logs the user out after AFK_MS of inactivity (no mouse/keyboard/touch input).
 * Must be called inside a component that is only mounted when authenticated.
 * Completely independent of the arena "online" system.
 */
export const SESSION_EXPIRED_KEY = 'session_expired';

export function useAFKTimeout(onExpire: () => void) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function reset() {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        localStorage.setItem(SESSION_EXPIRED_KEY, '1');
        onExpire();
      }, AFK_MS);
    }

    // Start the timer immediately and reset it on any activity
    reset();
    ACTIVITY_EVENTS.forEach(ev => window.addEventListener(ev, reset, { passive: true }));

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      ACTIVITY_EVENTS.forEach(ev => window.removeEventListener(ev, reset));
    };
  }, [onExpire]);
}
