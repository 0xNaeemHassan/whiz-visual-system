import { useEffect, useMemo } from 'react';

export const MOTION_PREFERENCE = {
  SYSTEM: 'system',
  REDUCE: 'reduce',
  FULL: 'full',
};

export function useMotionPreference(preference) {
  const prefersReduced = useMemo(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  const shouldReduceMotion = preference === MOTION_PREFERENCE.REDUCE
    || (preference !== MOTION_PREFERENCE.FULL && prefersReduced);

  useEffect(() => {
    document.documentElement.dataset.motion = shouldReduceMotion ? 'reduce' : 'full';
    return () => {
      delete document.documentElement.dataset.motion;
    };
  }, [shouldReduceMotion]);

  return { shouldReduceMotion };
}
