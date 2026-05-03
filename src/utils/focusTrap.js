import { useEffect, useRef } from 'react';

const FOCUSABLE_SELECTOR = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function useDialogFocus({ isOpen, containerRef, initialFocusRef }) {
  const triggerRef = useRef(null);

  useEffect(() => {
    if (!isOpen || !containerRef.current) return undefined;
    if (document.activeElement instanceof HTMLElement) triggerRef.current = document.activeElement;

    const container = containerRef.current;
    const focusables = Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR));
    const first = initialFocusRef?.current || focusables[0] || container;
    const last = focusables[focusables.length - 1] || first;

    first?.focus?.();

    const onKeyDown = (event) => {
      if (event.key === 'Escape') return;
      if (event.key !== 'Tab' || !first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    container.addEventListener('keydown', onKeyDown);
    return () => container.removeEventListener('keydown', onKeyDown);
  }, [isOpen, containerRef, initialFocusRef]);

  useEffect(() => {
    if (isOpen) return;
    if (triggerRef.current?.focus) {
      window.requestAnimationFrame(() => triggerRef.current?.focus());
    }
  }, [isOpen]);
}
